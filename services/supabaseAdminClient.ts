// src/services/supabaseAdminClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wfdrirodxfcjlfopwggb.supabase.co';

// ATENÇÃO: Chave de serviço (service_role) usada no frontend.
// Esta é uma PRÁTICA INSEGURA e só deve ser usada para contornar
// um problema de RLS (Row Level Security) no ambiente de preview.
// Em produção, as operações que precisam de privilégios de admin
// DEVEM ser feitas através de um backend seguro (proxy ou serverless functions).
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZHJpcm9keGZjamxmb3B3Z2diIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM4NDA4OSwiZXhwIjoyMDc1OTYwMDg5fQ.AGhTzEd3mDY1PFxj9HDfmFye2NfG_wmimESYADoqwvI';

// Este cliente é para operações de dados que precisam bypassar o RLS.
// NÃO deve ser usado para autenticação.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
