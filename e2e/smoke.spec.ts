import { expect, test, type Page } from "@playwright/test";

async function open(page: Page) {
  await page.goto("./#architecture");
  await expect(page.getByTestId("block-sales")).toBeVisible({ timeout: 20_000 });
}

test("hover a block shows role/task counts and lights up correlated departments", async ({ page }) => {
  await open(page);
  await page.getByTestId("block-sales").hover();
  const card = page.getByTestId("hover-card-sales");
  await expect(card).toBeVisible();
  await expect(card.getByTestId("hover-stats")).toContainText("3 roles");
  await expect(card.getByTestId("hover-stats")).toContainText("7 tasks");
  await expect(card).toContainText("Flows with");
  // The card lives in the bottom-left corner, not over the map.
  const box = await card.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.x).toBeLessThan(40);
  expect(box!.y + box!.height).toBeGreaterThan(viewport.height - 40);
  // Correlation: Quotation / Operations / Finance / Procurement exchange data with Sales; Plant does not.
  await expect(page.getByTestId("block-sales")).toHaveAttribute("data-emphasis", "active");
  await expect(page.getByTestId("block-quotation")).toHaveAttribute("data-emphasis", "related");
  await expect(page.getByTestId("block-operations")).toHaveAttribute("data-emphasis", "related");
  await expect(page.getByTestId("block-finance")).toHaveAttribute("data-emphasis", "related");
  await expect(page.getByTestId("block-plant")).toHaveAttribute("data-emphasis", "dimmed");
});

test("click a block opens the department panel with role pills; a pill opens the role popover", async ({ page }) => {
  await open(page);
  await page.getByTestId("block-quotation").click();
  const panel = page.getByTestId("dept-panel");
  await expect(panel).toBeVisible();
  await expect(panel.getByTestId("dept-panel-title")).toHaveText("Quotation");
  await expect(panel.getByTestId("role-pill-quotation_assistant")).toBeVisible();
  await expect(panel.getByTestId("role-pill-quotation_manager")).toBeVisible();
  await expect(panel.getByTestId("role-pill-ops_manager")).toHaveAttribute("data-maturity", "target");
  await expect(panel.getByTestId("approval-ladder")).toContainText("Three approval layers");
  await expect(panel).not.toContainText("Schema only");

  await panel.getByTestId("role-pill-quotation_manager").click();
  const pop = panel.getByTestId("role-popover-quotation_manager");
  await expect(pop).toBeVisible();
  await expect(pop).toContainText("How they handle their work");
  await expect(pop.getByTestId("perm-quotations.approve")).toBeVisible();
  await expect(pop).toContainText("Quinn Manager");

  // Clicking an outgoing flow highlights that edge + its target block.
  await panel.getByTestId("flow-quotation-operations-hc").click();
  await expect(panel.getByTestId("flow-quotation-operations-hc")).toHaveAttribute("aria-pressed", "true");
  await expect(panel.getByTestId("flow-quotation-operations-hc")).toContainText("schedule-hiring-contract.ts");
  await expect(page.getByTestId("block-operations")).toHaveAttribute("data-emphasis", "active");
  await expect(page.getByTestId("block-finance")).toHaveAttribute("data-emphasis", "dimmed");
});

test("every block stays on screen while the panel is open", async ({ page }) => {
  await open(page);
  await page.getByTestId("block-operations").click();
  await expect(page.getByTestId("dept-panel")).toBeVisible();
  await expect(page.getByTestId("hover-card-operations")).toHaveCount(0); // panel replaces the card
  await page.waitForTimeout(1200); // camera re-fit eases in
  const panelBox = (await page.getByTestId("dept-panel").boundingBox())!;
  for (const id of ["sales", "quotation", "operations", "driver", "finance", "plant", "procurement", "store"]) {
    const box = (await page.getByTestId(`block-${id}`).boundingBox())!;
    expect(box.x + box.width, `${id} hidden behind the panel`).toBeLessThan(panelBox.x);
    expect(box.x).toBeGreaterThan(0);
  }
});

test("glossary is searchable and Esc closes overlays", async ({ page }) => {
  await open(page);
  await page.getByTestId("glossary-btn").click();
  await expect(page.getByTestId("glossary")).toBeVisible();
  await page.getByTestId("glossary-search").fill("IVN");
  const terms = page.getByTestId("glossary").getByTestId("term");
  await expect(terms.first()).toContainText("IVN");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("glossary")).toHaveCount(0);
  await page.getByTestId("block-finance").click();
  await expect(page.getByTestId("dept-panel")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("dept-panel")).toHaveCount(0);
});

test("no mode toggle and no 'Schema only' text anywhere", async ({ page }) => {
  await open(page);
  await expect(page.getByTestId("mode-toggle")).toHaveCount(0);
  for (const id of ["plant", "procurement", "store"]) {
    await page.getByTestId(`block-${id}`).click();
    await expect(page.getByTestId("dept-panel")).toBeVisible();
    await expect(page.getByTestId("dept-panel")).not.toContainText("Schema only");
    await page.keyboard.press("Escape");
  }
});

test("switching to the Problem map tab and back keeps the 3D map's selection", async ({ page }) => {
  await open(page);
  await page.getByTestId("block-finance").click();
  await expect(page.getByTestId("dept-panel")).toBeVisible();

  await page.getByTestId("tab-problems").click();
  await expect(page).not.toHaveURL(/#/);
  await expect(page.getByTestId("tab-problems")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("block-sales")).toBeHidden();
  const frame = page.frameLocator('[data-testid="problem-map-frame"]');
  await expect(frame.locator("#ovTitle")).toContainText("Every order crosses eight teams");
  await frame.locator("#exploreBtn").click();
  await expect(frame.locator("#lensBar")).toContainText("Fragmented data");

  // Closing the overview goes straight to the map: no welcome bubble, no grey-out.
  await expect(frame.locator("#welcome")).toHaveCount(0);
  await expect(frame.locator("body")).not.toHaveClass(/lens-on/);
  await expect(frame.locator("#lensIntro")).toBeHidden();

  // The 3D tab is hidden from the tab bar for now; its direct link still opens it with state intact.
  await page.evaluate(() => (window.location.hash = "#architecture"));
  await expect(page).toHaveURL(/#architecture$/);
  await expect(page.getByTestId("dept-panel")).toBeVisible();
  await expect(page.getByTestId("dept-panel-title")).toHaveText("Finance");
});

test("the site opens on the Problem map; old #problems links still land there", async ({ page }) => {
  for (const url of ["./", "./#problems"]) {
    await page.goto(url);
    await expect(page.getByTestId("tab-problems")).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("block-sales")).toBeHidden();
    await expect(page.frameLocator('[data-testid="problem-map-frame"]').locator("#ovTitle")).toBeVisible({ timeout: 20_000 });
  }
});

test("Solutions map and Digital Brain architecture are hidden from the tab bar but open by direct link", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("tab")).toHaveText(["Problem map"]);
  await page.goto("./#solutions");
  await expect(page.frameLocator('[data-testid="solutions-map-frame"]').locator("#ovTitle")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("problem-map-frame")).toBeHidden();
});
