import { supabase } from './supabaseClient';
import { supabaseAdmin } from './supabaseAdminClient';
import type { Session } from '@supabase/supabase-js';

const translateError = (error: any): string => {
  const errorMessage = error?.message || error?.error_description || 'Erro desconhecido';
  if (errorMessage.includes('Invalid login credentials')) return 'Email ou senha incorretos';
  if (errorMessage.includes('User already registered')) return 'Este e-mail já está em uso.';
  return errorMessage;
};

export const authService = {
  async signUp(email: string, password: string, name: string, phone: string, companyName: string) {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { name, phone, companyName } },
    });
    if (error) throw new Error(translateError(error));
    if (!data.user) throw new Error('Erro ao criar usuário');
    // Perfil será buscado pelo listener do useAuth
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(translateError(error));
    if (!data.user) throw new Error('Erro ao fazer login');
    // Perfil será buscado pelo listener do useAuth
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  async getCurrentUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;
    return await this.getUserProfile(authUser.id);
  },

  async getUserProfile(userId: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*, companies (id, name)')
            .eq('id', userId)
            .single();

        if (error) throw error;
        // É possível que um perfil não exista ainda devido a um delay de replicação.
        // Retornar null permite que o chamador (o listener em useAuth) tente novamente.
        if (!data) return null;
        return { ...data, companyName: data.companies?.name };
    } catch (error: any) {
        console.error('❌ Erro ao buscar perfil com cliente admin:', error.message);
        return null;
    }
  },

  async updateProfile(userId: string, updates: any) {
    const { data, error } = await supabaseAdmin.from('users').update(updates).eq('id', userId).select().single();
    if (error) throw new Error(translateError(error));
    return data;
  },
  
  async markOnboardingAsCompleted(userId: string) {
    const { data, error } = await supabaseAdmin.from('users').update({ onboarding_completed: true }).eq('id', userId).select('*, companies (id, name)').single();
    if (error) throw new Error(translateError(error));
    return { ...data, companyName: data.companies?.name };
  },
  
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  },
};
