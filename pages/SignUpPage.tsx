
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';
import Card from '../components/Card';

const MORDOMO_LOGO_URL = 'https://dutzohcickrbmlolcjtp.supabase.co/storage/v1/object/public/mordomo/logo-mordomo.png';

const SignUpPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const { signup } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!termsAccepted) {
            setError('Você precisa aceitar os termos da LGPD.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            // This would trigger the n8n flow: flow.user_signup
            const user = await signup(name, email, phone, companyName);
            if (user) {
                navigate('/onboarding');
            } else {
                setError('Falha ao criar conta. Tente novamente.');
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
              <img src={MORDOMO_LOGO_URL} alt="MordomoZAP Logo" className="h-16"/>
            </Link>
            <Card className="w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">Crie sua conta</h2>
                <p className="text-center text-gray-600 mb-6">Comece seu trial gratuito de 3 dias.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="email" placeholder="Seu e-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="tel" placeholder="Seu telefone (WhatsApp)" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="text" placeholder="Nome da sua empresa" value={companyName} onChange={e => setCompanyName(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                    
                    <div className="flex items-center">
                        <input type="checkbox" id="terms" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                        <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">Eu aceito os termos da LGPD.</label>
                    </div>
                    
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                        {loading ? 'Criando conta...' : 'Começar Trial'}
                    </Button>
                </form>
            </Card>
            <p className="mt-6 text-center text-gray-600">
                Já tem uma conta? <Link to="/login" className="font-medium text-primary hover:underline">Faça login</Link>
            </p>
        </div>
    );
};

export default SignUpPage;
