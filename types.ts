
// FIX: Removed the circular import of Company.
// import { Company } from './services/supabaseClient';

// FIX: Defined and exported the Company interface here to be the single source of truth.
export interface Company {
  id: string;
  name: string;
  timezone: string;
  plan: 'trial' | 'pro' | string;
  trial_ends_at: string | null;
  status: 'trialing' | 'active' | string;
  created_at: string;
}

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
  onboarding_completed: boolean;
  created_at: string;
  companies?: Company;
}

export interface Product {
  name: string;
  price: string;
  duration: number; // in minutes
}

export interface Professional {
  name: string;
  phone: string;
  services: string[];
  workingHours: { day: string; start: string; end: string; enabled: boolean }[];
}

export interface AgentConfig {
  greetingMessage: string;
  fallbackMessage: string;
  workingHours: { day: string; start: string; end: string; enabled: boolean }[];
  faqs: { question: string; answer: string }[];
  products: Product[];
  professionals: Professional[];
  schedulingRules: {
    // FIX: Re-added slotDuration as it is used throughout the application.
    slotDuration: number; // in minutes
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
  status: 'confirmed' | 'cancelled' | 'completed';
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
// FIX: Added missing type definitions for MediaPayload, Message, and WhatsAppIntegration.
export interface MediaPayload {
  type: 'image' | 'video';
  url: string;
}

export interface Message {
  id: string | number;
  conversation_id: string;
  direction: 'in' | 'out';
  text: string | null;
  timestamp: string;
  payload_json?: MediaPayload;
  created_at?: string;
}

export interface WhatsAppIntegration {
  id: number;
  company_id: string;
  provider: string;
  instance_name: string;
  api_key: string | null;
  status: 'connected' | 'pending' | 'disconnected' | 'error';
  qr_code_base64: string | null;
  connected_at: string | null;
  created_at: string;
}
