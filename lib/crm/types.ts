export type ContactStatus = "active" | "lead" | "inactive";

export type CompanySize = "startup" | "smb" | "enterprise";

export type CompanyStatus = "active" | "prospect" | "churned";

export type DealStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  companyId: string;
  companyName: string;
  owner: string;
  status: ContactStatus;
  tags: string[];
  lastContacted: string;
  linkedin: string;
  notes: string;
  aiLeadScore: number;
};

export type Company = {
  id: string;
  name: string;
  industry: string;
  size: CompanySize;
  status: CompanyStatus;
  website: string;
  address: string;
  notes: string;
  revenue: number;
  employeeCount: number;
  owner: string;
  aiScore: number;
  openDeals: number;
  totalPipeline: number;
};

export type Deal = {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  contactId: string;
  contactName: string;
  stage: DealStage;
  value: number;
  probability: number;
  closeDate: string;
  owner: string;
};

export type CompanySort =
  | "name-asc"
  | "name-desc"
  | "revenue-desc"
  | "revenue-asc"
  | "employees-desc"
  | "ai-score-desc"
  | "pipeline-desc";

export type ContactSort =
  | "name-asc"
  | "name-desc"
  | "last-contacted"
  | "ai-score-desc";
