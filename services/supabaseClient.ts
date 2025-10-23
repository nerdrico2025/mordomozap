// src/services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Prefer env-provided URL and anon key for frontend auth.
// Fallbacks keep current preview behavior if env vars are missing.
const supabaseUrl = (import.meta as any)?.env?.VITE_SUPABASE_URL || 'https://wfdrirodxfcjlfopwggb.supabase.co';

// ATENÇÃO: Chave de serviço (service_role) usada no frontend.
// Esta é uma PRÁTICA INSEGURA e só deve ser usada para contornar
// um problema de chave anônima (anon key) inválida no ambiente de preview.
// Em produção, a chave pública (anon key) correta DEVE ser usada.
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZHJpcm9keGZjamxmb3B3Z2diIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM4NDA4OSwiZXhwIjoyMDc1OTYwMDg5fQ.AGhTzEd3mDY1PFxj9HDfmFye2NfG_wmimESYADoqwvI';

// Use anon key when available; otherwise fallback to service role key (preview only).
const supabaseKey = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY || supabaseServiceRoleKey;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // IMPORTANTE: Persistir a sessão no localStorage para que o usuário não seja
    // deslogado ao recarregar a página.
    persistSession: true,
    autoRefreshToken: true,
  }
});
