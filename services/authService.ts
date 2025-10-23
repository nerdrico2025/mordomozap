import { supabase } from './supabaseClient';
import { supabaseAdmin } from './supabaseAdminClient';
import type { Session } from '@supabase/supabase-js';

const translateError = (error: any): string => {
  const errorMessage = error?.message || error?.error_description || 'Erro desconhecido';
  if (errorMessage.includes('Invalid login credentials')) return 'Email ou senha incorretos';
  if (errorMessage.includes('User already registered')) return 'Este e-mail já está em uso.';
  if (errorMessage.toLowerCase().includes('timeout')) return 'Tempo esgotado ao tentar comunicar com o servidor.';
  if (errorMessage.toLowerCase().includes('fetch') || errorMessage.toLowerCase().includes('network')) return 'Falha de rede ao comunicar com o servidor.';
  if (errorMessage.includes('Invalid Refresh Token')) return 'Sessão expirada ou inválida. Faça login novamente.';
  return errorMessage;
};

// Utilitário de timeout para evitar travas indefinidas em chamadas de rede
const withTimeout = async <T>(promise: Promise<T>, ms = 15000): Promise<T> => {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
};

// Limpa qualquer sessão persistida do Supabase no localStorage para evitar uso de refresh tokens inválidos
const clearSupabaseLocalSession = () => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    }
    console.log('🧹 [authService] Sessão local do Supabase limpa.');
  } catch (_) { /* ignore */ }
};

export const authService = {
  async signUp(email: string, password: string, name: string, phone: string, companyName: string) {
    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email, password, options: { data: { name, phone, companyName } },
      }),
      15000
    );
    if (error) throw new Error(translateError(error));
    if (!data.user) throw new Error('Erro ao criar usuário');
    // Perfil será buscado pelo listener do useAuth
  },

  async signIn(email: string, password: string) {
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      15000
    );
    if (error) throw new Error(translateError(error));
    if (!data.user) throw new Error('Erro ao fazer login');
    // Perfil será buscado pelo listener do useAuth
  },

  async signOut() {
    try {
      console.log('🚪 [authService] signOut iniciado (scope=local)');
      // Usar escopo local evita chamada de rede que pode ser abortada pela navegação
      await withTimeout(supabase.auth.signOut({ scope: 'local' } as any), 8000);
      clearSupabaseLocalSession();
      console.log('✅ [authService] signOut concluído (tokens locais limpos)');
    } catch (err: any) {
      console.warn('⚠️ [authService] Falha no signOut (local). Prosseguindo com limpeza de estado.', err?.message || err);
      clearSupabaseLocalSession();
      // Fallback: mesmo que falhe, o estado do contexto será limpo e PrivateRoute redirecionará
    }
  },

  async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.warn('❗ [authService] Erro ao obter usuário atual:', error.message || error);
        const translated = translateError(error);
        // Erros de refresh token inválido: limpar sessão e forçar reautenticação
        if ((error.message || '').includes('Invalid Refresh Token')) {
          console.warn('🔒 [authService] Refresh token inválido detectado. Limpando sessão local.');
          clearSupabaseLocalSession();
          await supabase.auth.signOut({ scope: 'local' } as any);
          return null;
        }
        // Outros erros: retornar null para que o caller trate
        return null;
      }

      const authUser = data?.user;
      if (!authUser) return null;

      let profile = null as any;
      try {
        profile = await withTimeout(this.getUserProfile(authUser.id), 8000);
      } catch (e) {
        console.warn('⏱️ Timeout ou falha ao buscar perfil; usando fallback parcial.', (e as any)?.message || e);
      }
      if (profile) return profile;
      // Fallback: retornar usuário parcial quando o perfil não está disponível ainda
      return {
        id: authUser.id,
        email: authUser.email ?? undefined,
        name: (authUser.user_metadata as any)?.name ?? undefined,
      };
    } catch (e: any) {
      console.error('❌ [authService] Falha inesperada em getCurrentUser:', e?.message || e);
      return null;
    }
  },

  async getUserProfile(userId: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('id, email, name, onboarding_completed, companies (id, name)')
            .eq('id', userId)
            .single();

        if (error) throw error;
        // É possível que um perfil não exista ainda devido a um delay de replicação.
        // Retornar null permite que o chamador (o listener em useAuth) tente novamente.
        if (!data) return null;
        return { ...data, companyName: (data as any).companies?.name };
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
    return { ...data, companyName: (data as any).companies?.name };
  },
  
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  },
};
