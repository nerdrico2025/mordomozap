
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Card from '../components/Card';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/mockApi';
import { DashboardData, Conversation } from '../types';

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <Card>
        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
        <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
    </Card>
);

const DashboardPage: React.FC = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                // This would be an API call to an endpoint that reads aggregated data
                // populated by the n8n flow: flow.analytics_aggregator
                const result = await api.getDashboardData(user.company_id);
                setData(result);
            }
            setLoading(false);
        };
        fetchData();
    }, [user]);

    if (loading) return <div>Carregando dashboard...</div>;
    if (!data) return <div>Não foi possível carregar os dados.</div>;
    
    const chartData = data.kpis.topObjections.map(item => ({ name: item.name, 'Contagem': item.count }));

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Conversas Atendidas" value={data.kpis.conversations} />
                <StatCard title="Tempo Médio de Resposta" value={data.kpis.avgResponseTime} />
                <StatCard title="Top Objeção" value={data.kpis.topObjections[0]?.name || 'N/A'} />
                <StatCard title="Top Argumento" value={data.kpis.topArguments[0]?.name || 'N/A'} />
            </div>

            {/* Charts and Recent conversations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Top 10 Objeções</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                             <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="Contagem" fill="#0F9D58" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
                <Card>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Últimas 50 Conversas</h2>
                    <div className="overflow-y-auto h-80">
                         <table className="w-full text-left">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-2">Cliente</th>
                                    <th className="p-2">Status</th>
                                    <th className="p-2">Início</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentConversations.map((convo: Conversation) => (
                                    <tr key={convo.id} className="border-b hover:bg-gray-50">
                                        <td className="p-2">{convo.customer_name}</td>
                                        <td className="p-2">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                convo.status === 'open' ? 'bg-blue-100 text-blue-800' :
                                                convo.status === 'closed' ? 'bg-green-100 text-green-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>{convo.status}</span>
                                        </td>
                                        <td className="p-2 text-sm text-gray-600">{new Date(convo.started_at).toLocaleString('pt-BR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;
