
export enum UserRole {
  USER = 'user',
  SUPER_ADMIN = 'super_admin'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  company_id: string;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  timezone: string;
  plan: 'trial' | 'basic' | 'pro';
  trial_ends_at: string | null;
  status: 'active' | 'inactive' | 'trialing';
  created_at: string;
}

export interface AgentConfig {
  greetingMessage: string;
  fallbackMessage: string;
  workingHours: { day: string; start: string; end: string; enabled: boolean }[];
  faqs: { question: string; answer: string }[];
  schedulingRules: {
    slotDuration: number;
    allowBookingUpTo: number; // in days
  };
}

export interface Conversation {
  id: string;
  customer_name: string;
  customer_phone: string;
  started_at: string;
  ended_at: string | null;
  status: 'open' | 'closed' | 'agent_needed';
}

export interface Appointment {
  id: string;
  company_id: string;
  customer_name: string;
  phone: string;
  datetime_start: string;
  datetime_end: string;
  status: 'confirmed' | 'cancelled';
  notes: string;
  conversation_id: string;
}

export interface DashboardData {
    kpis: {
        conversations: number;
        avgResponseTime: string;
        topObjections: { name: string; count: number }[];
        topArguments: { name: string; count: number }[];
    };
    recentConversations: Conversation[];
}

export interface SuperAdminData {
    accounts: (Company & { user_email: string })[];
}
