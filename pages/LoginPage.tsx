import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';
import Card from '../components/Card';

const MORDOMO_LOGO_URL = 'https://dutzohcickrbmlolcjtp.supabase.co/storage/v1/object/public/mordomo/logo-mordomo.png';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    // Validação por campo
    const [touchedEmail, setTouchedEmail] = useState(false);
    const [touchedPassword, setTouchedPassword] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    // Bloqueio por tentativas excessivas
    const [attempts, setAttempts] = useState<number>(() => parseInt(sessionStorage.getItem('login_attempts') || '0', 10));
    const [lockUntil, setLockUntil] = useState<number | null>(null);
    const [remaining, setRemaining] = useState<number>(0);
    
    const navigate = useNavigate();
    const { login, user } = useAuth();

    useEffect(() => {
        // Se o usuário for definido (login bem-sucedido), navega para o dashboard.
        if (user) {
            console.log('[LoginPage] Usuário autenticado detectado. Redirecionando para /dashboard...', { userId: (user as any)?.id });
            // Reset de tentativas após sucesso
            sessionStorage.removeItem('login_attempts');
            sessionStorage.removeItem('login_lock_until');
            setAttempts(0);
            setLockUntil(null);
            setRemaining(0);
            navigate('/dashboard');
            console.log('[LoginPage] Navegação para /dashboard acionada.');
        }
    }, [user, navigate]);

    useEffect(() => {
        // Carrega bloqueio pré-existente da sessão (se houver)
        const storedLock = sessionStorage.getItem('login_lock_until');
        if (storedLock) {
            const ts = parseInt(storedLock, 10);
            if (!Number.isNaN(ts) && Date.now() < ts) {
                setLockUntil(ts);
                setRemaining(Math.ceil((ts - Date.now()) / 1000));
            } else {
                sessionStorage.removeItem('login_lock_until');
            }
        }
    }, []);

    useEffect(() => {
        if (!lockUntil) return;
        const tick = () => {
            const ms = lockUntil - Date.now();
            if (ms > 0) {
                setRemaining(Math.ceil(ms / 1000));
            } else {
                setLockUntil(null);
                setRemaining(0);
                sessionStorage.removeItem('login_lock_until');
            }
        };
        const id = setInterval(tick, 1000);
        tick();
        return () => clearInterval(id);
    }, [lockUntil]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitAttempted(true);

        // Validação prévia de campos obrigatórios
        const missingEmail = !email.trim();
        const missingPassword = !password.trim();
        if (missingEmail || missingPassword) {
            // Mantém usuário na página e exibe mensagens específicas por campo
            return;
        }

        if (lockUntil && Date.now() < lockUntil) {
            setError(`Muitas tentativas. Aguarde ${Math.ceil((lockUntil - Date.now()) / 1000)}s e tente novamente.`);
            return;
        }

        setSubmitting(true);
        const start = Date.now();
        try {
            console.log('[LoginPage] Submissão de login iniciada.');
            await login(email, password);
            console.log('[LoginPage] Login resolvido pelo auth context; aguardando atualização do usuário.');
            // O listener onAuthStateChange irá atualizar o 'user'.
            // O useEffect acima irá então lidar com a navegação e resetes.
            sessionStorage.removeItem('login_attempts');
            sessionStorage.removeItem('login_lock_until');
            setAttempts(0);
            setLockUntil(null);
            setRemaining(0);
        } catch (err: any) {
            const msg = err?.message || 'E-mail ou senha inválidos.';
            setError(msg);
            const next = attempts + 1;
            setAttempts(next);
            sessionStorage.setItem('login_attempts', String(next));
            if (next >= 5) {
                // Bloqueio temporário após 5 tentativas falhas
                const lockMs = 30_000; // 30s
                const until = Date.now() + lockMs;
                setLockUntil(until);
                sessionStorage.setItem('login_lock_until', String(until));
            }
        } finally {
            setSubmitting(false);
            const elapsed = Date.now() - start;
            if (elapsed > 7000) {
                // Loga lentidão para diagnóstico; evita travas silenciosas
                console.warn(`Login lento: ${elapsed}ms`);
            }
        }
    };

    const isLocked = Boolean(lockUntil && Date.now() < (lockUntil as number));

    const showEmailError = (submitAttempted || touchedEmail) && !email.trim();
    const showPasswordError = (submitAttempted || touchedPassword) && !password.trim();

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <Link to="/" className="mb-8">
                <img src={MORDOMO_LOGO_URL} alt="MordomoZAP Logo" className="h-16" />
            </Link>
            <Card className="w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Acesse sua conta</h2>
                <form onSubmit={handleSubmit} className="space-y-4" aria-live="polite">
                    <input
                        type="email"
                        placeholder="Seu e-mail"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onBlur={() => setTouchedEmail(true)}
                        required
                        aria-invalid={showEmailError}
                        aria-describedby={showEmailError ? 'email-erro' : undefined}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {showEmailError && (
                        <p id="email-erro" className="text-red-500 text-sm">E-mail é obrigatório.</p>
                    )}

                    <input
                        type="password"
                        placeholder="Sua senha"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onBlur={() => setTouchedPassword(true)}
                        required
                        aria-invalid={showPasswordError}
                        aria-describedby={showPasswordError ? 'senha-erro' : undefined}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {showPasswordError && (
                        <p id="senha-erro" className="text-red-500 text-sm">Senha é obrigatória.</p>
                    )}
                    
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    {isLocked && (
                        <p className="text-amber-600 text-sm text-center">Muitas tentativas. Tente novamente em {remaining}s.</p>
                    )}
                    
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        loading={submitting}
                        disabled={submitting || isLocked || !email.trim() || !password.trim()}
                    >
                        {submitting ? 'Entrando...' : 'Entrar'}
                    </Button>
                </form>
            </Card>
            <p className="mt-6 text-center text-gray-600">
                Não tem uma conta? <Link to="/signup" className="font-medium text-primary hover:underline">Crie uma agora</Link>
            </p>
        </div>
    );
};

export default LoginPage;
