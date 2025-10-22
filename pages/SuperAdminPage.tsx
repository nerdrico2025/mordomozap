
import React, { useState, useEffect } from 'react';
import { api } from '../services/mockApi';
import { SuperAdminData, Company } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';

const SuperAdminPage: React.FC = () => {
    const [data, setData] = useState<SuperAdminData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        const result = await api.getSuperAdminData();
        setData(result);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleResetTrial = async (companyId: string) => {
        const confirmed = window.confirm('Atenção: Esta é uma ação sensível. Tem certeza que deseja resetar o trial para esta conta?');
        if(confirmed) {
            await api.resetTrial(companyId);
            fetchData(); // Refresh data
        }
    }

    if (loading) return <div>Carregando dados de admin...</div>;
    if (!data) return <div>Não foi possível carregar os dados.</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Painel Super Admin</h1>
            <Card>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Gerenciamento de Contas</h2>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2 text-sm font-semibold text-gray-700">Empresa</th>
                            <th className="p-2 text-sm font-semibold text-gray-700">E-mail</th>
                            <th className="p-2 text-sm font-semibold text-gray-700">Plano</th>
                            <th className="p-2 text-sm font-semibold text-gray-700">Status</th>
                            <th className="p-2 text-sm font-semibold text-gray-700">Trial Termina em</th>
                            <th className="p-2 text-sm font-semibold text-gray-700">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.accounts.map((acc: Company & { user_email: string }) => (
                            <tr key={acc.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 font-medium text-gray-800">{acc.name}</td>
                                <td className="p-2 text-gray-800">{acc.user_email}</td>
                                <td className="p-2 text-gray-800">{acc.plan}</td>
                                <td className="p-2">
                                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        acc.status === 'active' ? 'bg-green-100 text-green-800' :
                                        acc.status === 'trialing' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>{acc.status}</span>
                                </td>
                                <td className="p-2 text-sm text-gray-800">{acc.trial_ends_at ? new Date(acc.trial_ends_at).toLocaleDateString('pt-BR') : 'N/A'}</td>
                                <td className="p-2">
                                    <Button variant="accent" className="py-1 px-3 text-sm" onClick={() => handleResetTrial(acc.id)}>Resetar Trial</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default SuperAdminPage;