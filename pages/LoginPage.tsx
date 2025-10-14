
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';
import Card from '../components/Card';

const MORDOMO_LOGO_URL = 'https://dutzohcickrbmlolcjtp.supabase.co/storage/v1/object/public/mordomo/logo-mordomo.png';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(email, password);
            if (user) {
                navigate('/dashboard');
            } else {
                setError('E-mail ou senha inválidos.');
            }
        } catch (err) {
            setError('Ocorreu um erro inesperado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <Link to="/" className="mb-8">
                <img src={MORDOMO_LOGO_URL} alt="MordomoZAP Logo" className="h-16" />
            </Link>
            <Card className="w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Acesse sua conta</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="email" placeholder="Seu e-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="password" placeholder="Sua senha" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                    
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
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
