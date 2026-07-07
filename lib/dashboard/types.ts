export type DashboardStats = {
  emailCount: number;
  connectedGmailAccounts: number;
  automations: number;
  activeWorkflows: number;
  meetings: number;
  crmContacts: number;
};

export type DashboardMeetingPreview = {
  id: string;
  title: string;
  startsAt: string;
  status: string;
};

export type DashboardAutomationPreview = {
  id: string;
  name: string;
  status: string;
  runsToday: number;
};

export type DashboardContactPreview = {
  id: string;
  name: string;
  companyName: string | null;
  aiLeadScore: number;
  status: string;
};

export type DashboardData = {
  stats: DashboardStats;
  todaysMeetings: DashboardMeetingPreview[];
  automations: DashboardAutomationPreview[];
  topContacts: DashboardContactPreview[];
};

export const EMPTY_DASHBOARD_STATS: DashboardStats = {
  emailCount: 0,
  connectedGmailAccounts: 0,
  automations: 0,
  activeWorkflows: 0,
  meetings: 0,
  crmContacts: 0,
};

export const EMPTY_DASHBOARD_DATA: DashboardData = {
  stats: EMPTY_DASHBOARD_STATS,
  todaysMeetings: [],
  automations: [],
  topContacts: [],
};
