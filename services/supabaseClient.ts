import { createClient } from '@supabase/supabase-js'
import { UserRole } from '../types';
import type { Company } from '../types';


// As variáveis de ambiente foram fornecidas e estão fixas aqui para este ambiente de desenvolvimento.
const supabaseUrl = 'https://wfdrirodxfcjlfopwggb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZHJpcm9keGZjamxmb3B3Z2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzODQwODksImV4cCI6MjA3NTk2MDA4OX0.vyXvpkgpUB3m3iGZUOUxhL_ANafHJYKrPrCIJA4B_Zc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para as tabelas
export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  company_id?: string
  created_at: string
  companies?: Company // For nested results
}

export interface WhatsAppIntegration {
  id: string
  company_id: string
  provider: string
  instance_name?: string
  api_key?: string
  qr_code_base64?: string
  connected_at?: string
  status: 'pending' | 'connected' | 'disconnected' | 'error'
  created_at: string
}

export interface AgentConfig {
  company_id: string
  config_json: any
  version: number
  updated_at: string
}

export interface Conversation {
  id: string
  company_id: string
  customer_name?: string
  customer_phone: string
  started_at: string
  ended_at?: string
  status: 'open' | 'closed' | 'agent_needed'
}

export interface Message {
  id: string
  conversation_id: string
  direction: 'in' | 'out'
  text?: string
  payload_json?: any
  intent?: string
  confidence?: number
  timestamp: string
}

export interface Appointment {
  id: string
  company_id: string
  customer_name: string
  phone: string
  datetime_start: string
  datetime_end: string
  status: 'confirmed' | 'cancelled' | 'completed'
  notes?: string
  conversation_id?: string
  created_at: string
}
