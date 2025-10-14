import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

// Função auxiliar para aguardar com retry
const waitForUserProfile = async (userId: string, maxAttempts = 10): Promise<any> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🔄 Tentativa ${attempt}/${maxAttempts} de buscar perfil...`);
    
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        companies (
          id,
          name
        )
      `)
      .eq('id', userId)
      .single();

    if (data && !error) {
      console.log('✅ Perfil encontrado!');
      return {
        ...data,
        companyName: data.companies?.name,
      };
    }

    // Aguardar 500ms antes de tentar novamente
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Se não encontrou após todas as tentativas, retornar dados básicos
  console.warn('⚠️ Perfil não encontrado após várias tentativas');
  return null;
};

const translateError = (error: any): string => {
  const errorMessage = error?.message || error?.error_description || 'Erro desconhecido';

  if (errorMessage.includes('Invalid login credentials')) return 'Email ou senha incorretos';
  if (errorMessage.includes('Email not confirmed')) return 'Email não confirmado';
  if (errorMessage.includes('User already registered')) return 'Usuário já cadastrado';
  if (errorMessage.includes('Password should be at least 6 characters')) return 'A senha deve ter pelo menos 6 caracteres';
  if (errorMessage.includes('Unable to validate email address: invalid format')) return 'Formato de email inválido';
  if (errorMessage.includes('Email rate limit exceeded')) return 'Muitas tentativas. Aguarde alguns minutos.';
  if (errorMessage.includes('Signup requires a valid password')) return 'É necessário fornecer uma senha válida';
  
  return errorMessage;
};

export const authService = {
  async signUp(email: string, password: string, name: string, phone: string, companyName: string) {
    try {
      console.log('📝 Iniciando cadastro no Supabase...');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            companyName,
          },
        },
      });

      if (error) {
        console.error('❌ Erro no signup:', error);
        throw new Error(translateError(error));
      }

      if (!data.user) {
        throw new Error('Erro ao criar usuário');
      }

      console.log('✅ Usuário criado no auth, aguardando trigger...');

      // Aguardar o trigger criar o perfil completo
      const userProfile = await waitForUserProfile(data.user.id);

      if (userProfile) {
        console.log('✅ Cadastro completo!');
        return userProfile;
      }

      // Fallback: retornar dados básicos se o perfil não foi criado
      console.warn('⚠️ Usando dados básicos do auth');
      return {
        id: data.user.id,
        email: data.user.email!,
        name,
        phone,
        role: 'user', // Default role
        companyName,
      };
    } catch (error: any) {
      console.error('❌ Erro no signUp:', error);
      throw new Error(translateError(error));
    }
  },

  async signIn(email: string, password: string) {
    try {
      console.log('🔐 Iniciando login...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erro no login:', error);
        throw new Error(translateError(error));
      }

      if (!data.user) {
        throw new Error('Erro ao fazer login');
      }

      console.log('✅ Login realizado, buscando perfil...');

      // Buscar perfil completo
      const userProfile = await this.getUserProfile(data.user.id);
      
      if (userProfile) {
        console.log('✅ Login completo!');
        return userProfile;
      }

      // Fallback
      console.warn('⚠️ Usando dados básicos do auth');
      return {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name || 'Usuário',
        phone: data.user.user_metadata?.phone || '',
        role: 'user',
      };
    } catch (error: any) {
      console.error('❌ Erro no signIn:', error);
      throw new Error(translateError(error));
    }
  },

  async signOut() {
    try {
      console.log('👋 Fazendo logout...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('✅ Logout realizado');
    } catch (error: any) {
      console.error('❌ Erro no logout:', error);
      throw new Error(translateError(error));
    }
  },

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      if (!user) return null;

      // Buscar dados completos do usuário
      const userData = await this.getUserProfile(user.id);

      if (userData) {
        return userData;
      }

      // Fallback
      console.warn('⚠️ Perfil não encontrado, usando dados básicos');
      return {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || 'Usuário',
        phone: user.user_metadata?.phone || '',
        role: 'user',
      };
    } catch (error: any) {
      console.error('❌ Erro ao obter usuário:', error);
      return null;
    }
  },

  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          companies (
            id,
            name
          )
        `)
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Don't log "not found" as an error
           console.error('❌ Erro ao buscar perfil:', error);
        }
        return null;
      }

      return {
        ...data,
        companyName: data.companies?.name,
      };
    } catch (error) {
      console.error('❌ Erro ao buscar perfil:', error);
      return null;
    }
  },

  async updateProfile(userId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar perfil:', error);
      throw new Error(translateError(error));
    }
  },
  
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  },
};
