export type Maturity = "live" | "prototype" | "schema-only" | "target";
export type Mode = "asBuilt" | "target";

export interface Responsibility {
  label: string;
  maturity: Maturity;
  page?: string;
}
export interface DeptInput {
  record: string;
  fields: string[];
  maturity: Maturity;
}
export interface Page {
  title: string;
  url: string;
  section?: string;
  permission?: string | null;
}
export interface TableRef {
  name: string;
  domain: string | null;
  inSchema: boolean;
}
export interface Department {
  id: string;
  name: string;
  short: string;
  color: string;
  position: [number, number, number];
  size: number;
  maturity: Maturity;
  blurb: string;
  responsibilities: Responsibility[];
  inputs: DeptInput[];
  roles: string[];
  pages: Page[];
  tables: TableRef[];
  asBuiltNote: string | null;
  targetNote: string | null;
}
export interface Role {
  id: string;
  label: string;
  department: string | null;
  alsoIn?: string[];
  maturity: Maturity;
  blurb: string;
  howTheyWork: string[];
  permissions: string[];
  proposedPermissions: string[];
  seedUser: { name: string; email: string } | null;
}
export interface Edge {
  id: string;
  from: string;
  to: string;
  record: string;
  trigger: string;
  statusPath: string[] | null;
  maturity: Maturity;
  evidence: string[];
}
export interface Term {
  term: string;
  definition: string;
  department: string | null;
  source: string;
  section: string | null;
}
export interface PermissionDef {
  key: string;
  const: string;
  group: string;
}
export interface NotificationEvent {
  eventType: string;
  audienceScope: string;
  department: string | null;
}
export interface ApprovalStep {
  step: number;
  who: string;
  does: string;
  gate?: string;
}
export interface TargetModel {
  approvalLadder: {
    asBuilt: { summary: string; steps: ApprovalStep[]; evidence: string[] };
    target: { summary: string; steps: ApprovalStep[] };
  };
  gaps: { area: string; asBuilt: string; target: string }[];
}
export interface SystemMap {
  erpCommit: string | null;
  departments: Department[];
  roles: Role[];
  edges: Edge[];
  terms: Term[];
  permissions: PermissionDef[];
  rolePermissions: Record<string, string[]>;
  statusVocabularies: Record<string, Record<string, string[]>>;
  notifications: { departments: string[]; events: NotificationEvent[] };
  seedUsers: { email: string; name: string; role: string }[];
  targetModel: TargetModel;
  schemaTableCount: number;
}
