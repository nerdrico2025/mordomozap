import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import type { User as UserProfile } from '../services/supabaseClient';
import type { User as AuthUser } from '@supabase/supabase-js';

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

    // Escutar por mudanças no estado de autenticação (login, logout)
    const subscription = authService.onAuthStateChange(async (event, session) => {
      console.log('🔔 [useAuth] Evento de auth:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ [useAuth] Evento SIGNED_IN, carregando perfil...');
        setLoading(true);
        
        const profile = await authService.getUserProfile(session.user.id);
        
        if (profile) {
          console.log('✅ [useAuth] Perfil carregado via listener');
          setUser(profile);
        } else {
          console.warn('⚠️ [useAuth] Perfil não encontrado via listener, usando fallback');
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name,
          });
        }
        
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 [useAuth] Evento SIGNED_OUT');
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    console.log('🔐 [useAuth] Executando login...');
    const userProfile = await authService.signIn(email, pass);
    if (userProfile) {
      setUser(userProfile);
    }
    return userProfile;
  };

  const logout = async () => {
    console.log('👋 [useAuth] Executando logout...');
    await authService.signOut();
    setUser(null);
  };
  
  const signup = async (data: SignUpData) => {
    console.log('📝 [useAuth] Executando signup...');
    const userProfile = await authService.signUp(data.email, data.password, data.name, data.phone, data.companyName);
    
    if (userProfile) {
      setUser(userProfile);
    }
    
    return userProfile;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup }}>
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
