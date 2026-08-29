import unittest

import extract as x


class ParserTests(unittest.TestCase):
    def test_role_permissions(self):
        src = '''export const SEED_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["a.view", "a.manage"],
  // comment with "quoted.thing"
  sales: [
    "a.view",
    // #488: inline note
    "b.view",
  ],
};
'''
        self.assertEqual(x.parse_role_permissions(src), {"admin": ["a.manage", "a.view"], "sales": ["a.view", "b.view"]})

    def test_permission_catalog_groups(self):
        src = '''export const PERMISSIONS = {
  // Core Flow
  RFQS_VIEW: "rfqs.view",
  // AR (Finance)
  AR_VIEW: "ar.view",
} as const;'''
        cat = x.parse_permission_catalog(src)
        self.assertEqual([c["group"] for c in cat], ["Core Flow", "AR (Finance)"])
        self.assertEqual(cat[1]["key"], "ar.view")

    def test_sidebar_sections(self):
        src = '''const coreFlowItems = [
  { title: "CRFQs", url: "/rfqs", icon: X },
  { title: "Quotations", url: "/quotations", icon: Y },
];
const financeItems: SidebarItem[] = [
  { title: "AR Dashboard", url: "/ar/dashboard", icon: Z },
];
'''
        s = x.parse_sidebar(src)
        self.assertEqual([i["url"] for i in s["Core Flow"]], ["/rfqs", "/quotations"])
        self.assertEqual(s["Finance"][0]["title"], "AR Dashboard")

    def test_route_permissions(self):
        src = '''{ path: "rfqs", element: lazy(), requiredPermission: PERMISSIONS.RFQS_VIEW },
{ path: "ar/billing", requiredPermission: PERMISSIONS.AR_VIEW },'''
        self.assertEqual(x.parse_route_permissions(src), {"/rfqs": "RFQS_VIEW", "/ar/billing": "AR_VIEW"})

    def test_check_constraints(self):
        src = '''check("a", sql`action_type IN ('return', 'replacement', 'breakdown')`),
check("b", sql`condition_status = ANY (ARRAY['good_condition'::text, 'compensation_required'::text])`),'''
        c = x.parse_check_constraints(src)
        self.assertEqual(c["action_type"], ["return", "replacement", "breakdown"])
        self.assertEqual(c["condition_status"], ["good_condition", "compensation_required"])

    def test_notifications(self):
        src = '''export const NOTIFICATION_DEPARTMENTS = [
  "sales",
  "ops",
] as const;
  QUOTATION_ASSIGNED: {
    eventType: "quotation.assigned",
    entity: "quotation",
    audienceScope: "personal",
    department: null,
  },
  HC_RETURNED: {
    eventType: "hc.returned",
    audienceScope: "department",
    department: "ops",
  },'''
        n = x.parse_notifications(src)
        self.assertEqual(n["departments"], ["sales", "ops"])
        self.assertEqual(n["events"][1], {"eventType": "hc.returned", "audienceScope": "department", "department": "ops"})

    def test_glossary(self):
        md = '''## The four
- **CRFQ** — Customer Request For Quotation. The captured inquiry; the first
  document. → [doc](../core-flow/crfq.md)
- **`item_type`** — what kind of thing. See [classification](x.md).
'''
        t = x.parse_glossary(md)
        self.assertEqual(t[0]["term"], "CRFQ")
        self.assertEqual(t[0]["definition"], "Customer Request For Quotation. The captured inquiry; the first document.")
        self.assertEqual(t[1]["term"], "item_type")
        self.assertEqual(t[1]["definition"], "what kind of thing. See classification.")
        self.assertEqual(t[0]["section"], "The four")

    def test_seed_users(self):
        src = '''  {
    id: "x",
    email: "sales@voltade.com",
    firstName: "Sarah",
    lastName: "Sales",
    username: "sarah.sales",
    role: "sales",
  },'''
        self.assertEqual(x.parse_seed_users(src), [{"email": "sales@voltade.com", "name": "Sarah Sales", "role": "sales"}])


if __name__ == "__main__":
    unittest.main()
