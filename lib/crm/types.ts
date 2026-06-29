export type ContactStatus = "active" | "lead" | "inactive";

export type CompanySize = "startup" | "smb" | "enterprise";

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
  status: ContactStatus;
  tags: string[];
  lastContacted: string;
};

export type Company = {
  id: string;
  name: string;
  industry: string;
  size: CompanySize;
  website: string;
  location: string;
  contactsCount: number;
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
