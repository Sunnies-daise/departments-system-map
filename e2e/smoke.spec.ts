import { expect, test, type Page } from "@playwright/test";

async function open(page: Page) {
  await page.goto("./");
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
  // Correlation: Quotation / Operations / Finance exchange data with Sales; Plant does not.
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

test("As-built mode ghosts target-only roles, flows and unbuilt departments", async ({ page }) => {
  await open(page);
  await page.getByTestId("block-quotation").click();
  await expect(page.getByTestId("role-pill-ops_manager")).toBeVisible();
  await page.getByTestId("mode-asBuilt").click();
  await expect(page.getByTestId("role-pill-ops_manager")).toHaveCount(0);
  await expect(page.getByTestId("approval-ladder")).toContainText("One gated transition");
  await expect(page.getByTestId("outputs").getByTestId("flow-quotation-operations-final-approval")).toHaveCount(0);
  await expect(page.getByTestId("block-plant")).toHaveAttribute("data-ghost", "true");
  await expect(page.getByTestId("block-procurement")).toHaveAttribute("data-ghost", "true");
  await expect(page.getByTestId("block-store")).toHaveAttribute("data-ghost", "false");
  await page.getByTestId("mode-target").click();
  await expect(page.getByTestId("block-plant")).toHaveAttribute("data-ghost", "false");
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

test("data fidelity: every department block renders and the map exposes the store", async ({ page }) => {
  await open(page);
  for (const id of ["sales", "quotation", "operations", "driver", "finance", "plant", "procurement", "store"]) {
    await expect(page.getByTestId(`block-${id}`)).toBeVisible();
  }
  const mode = await page.evaluate(() => window.__mapDebug?.getState().mode);
  expect(mode).toBe("target");
});
