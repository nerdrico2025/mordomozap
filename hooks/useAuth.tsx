import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
// FIX: Changed import path for UserProfile type from supabaseClient to the centralized types file.
import type { User as UserProfile } from '../types';
import type { User as AuthUser, Session } from '@supabase/supabase-js';

// The user object in our auth context can be the full profile,
// or a partial object if the profile is not yet available.
export type AuthStateUser = UserProfile | (Partial<UserProfile> & { id: string; email?: string; name?: string });


interface SignUpData {
    name: string;
    email: string;
    phone: string;
    companyName: string;
    password: string;
}

interface AuthContextType {
  user: AuthStateUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
  signup: (data: SignUpData) => Promise<any>;
  updateUser: (updates: Partial<AuthStateUser>) => void; // Função adicionada
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<AuthStateUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Setar o usuário inicial com base na sessão existente
    const checkCurrentUser = async () => {
      console.log('🔍 [useAuth] Verificando usuário atual...');
      const userProfile = await authService.getCurrentUser();
      
      if (userProfile) {
        console.log('👤 [useAuth] Usuário e perfil encontrados na sessão.');
        setUser(userProfile);
      } else {
        console.log('👤 [useAuth] Nenhum usuário autenticado');
      }
      
      setLoading(false);
    };

    checkCurrentUser();

    // Listener é a única fonte da verdade para carregar o perfil após eventos de auth.
    const subscription = authService.onAuthStateChange(async (event: string, session: Session | null) => {
      console.log('🔔 [useAuth] Evento de auth:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ [useAuth] Evento SIGNED_IN, carregando perfil...');
        setLoading(true);

        // Tenta buscar o perfil com retentativas, pois pode haver um delay
        // após o signup para o perfil ser criado no banco.
        let profile = null;
        for (let attempt = 0; attempt < 5; attempt++) {
            profile = await authService.getUserProfile(session.user.id);
            if (profile) {
                console.log(`✅ [useAuth] Perfil encontrado na tentativa ${attempt + 1}.`);
                break;
            }
            console.log(`⏳ [useAuth] Perfil não encontrado, tentando novamente... (${attempt + 1}/5)`);
            await new Promise(res => setTimeout(res, 1000));
        }
        
        if (profile) {
          setUser(profile);
        } else {
          console.error('❌ [useAuth] Perfil não encontrado via listener após várias tentativas. Forçando logout para prevenir estado inconsistente.');
          authService.signOut(); // Dispara um evento SIGNED_OUT
        }
        
        setLoading(false);

      } else if (event === 'SIGNED_OUT') {
        console.log('👋 [useAuth] Evento SIGNED_OUT');
        setUser(null);
        setLoading(false); // Garante que o loading para se um sign out acontecer
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    console.log('🔐 [useAuth] Executando login...');
    await authService.signIn(email, pass);
    // O listener onAuthStateChange irá lidar com o carregamento do perfil e atualização do estado.
  };

  const logout = async () => {
    console.log('👋 [useAuth] Executando logout...');
    await authService.signOut();
    setUser(null);
  };
  
  const signup = async (data: SignUpData) => {
    console.log('📝 [useAuth] Executando signup...');
    await authService.signUp(data.email, data.password, data.name, data.phone, data.companyName);
     // O listener onAuthStateChange irá lidar com o carregamento do perfil e atualização do estado.
  };

  const updateUser = (updates: Partial<AuthStateUser>) => {
    setUser(prevUser => prevUser ? { ...prevUser, ...updates } : null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
