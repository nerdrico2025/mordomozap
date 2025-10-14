import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { chatService } from '../services/chatService';
import { analyticsService, IntentInsight } from '../services/analyticsService';
import type { Conversation } from '../services/supabaseClient';
import Card from '../components/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const KpiCard: React.FC<{ title: string; value: string | number; children?: React.ReactNode }> = ({ title, value, children }) => (
    <Card>
        <h3 className="text-lg font-semibold text-gray-500">{title}</h3>
        <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        {children}
    </Card>
);

const DashboardPage: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [stats, setStats] = useState({ total: 0, open: 0, closed: 0 });
    const [insights, setInsights] = useState<IntentInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [avgResponseTime, setAvgResponseTime] = useState('');
    const [dailyMetrics, setDailyMetrics] = useState<{ date: string; total: number }[]>([]);

    const fetchData = async () => {
        if (user?.company_id) {
            try {
                // Fetch all data in parallel
                const [convData, metricsData, insightsData, avgTimeData] = await Promise.all([
                    chatService.getConversations(user.company_id),
                    analyticsService.getConversationMetrics(user.company_id, 30),
                    analyticsService.getIntentInsights(user.company_id, 7),
                    analyticsService.getAvgResponseTime(user.company_id, 30)
                ]);

                setConversations(convData);
                setInsights(insightsData);
                setAvgResponseTime(avgTimeData);

                // Format data for chart
                const chartData = metricsData.map(day => ({
                  date: new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                  total: day.total
                }));
                setDailyMetrics(chartData);

                // Process metrics for KPI cards
                const totalStats = metricsData.reduce((acc, day) => {
                    acc.total += day.total;
                    acc.open += day.open;
                    acc.closed += day.closed;
                    return acc;
                }, { total: 0, open: 0, closed: 0 });
                setStats(totalStats);

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchData();

        // Setup realtime subscription
        let subscription: any = null;
        if (user?.company_id) {
            subscription = analyticsService.subscribeToInsights(user.company_id, () => {
                console.log("Realtime update received, refetching insights...");
                fetchData(); // Refetch all data on update
            });
        }

        // Cleanup subscription on component unmount
        return () => {
            if (subscription) {
                analyticsService.unsubscribe(subscription);
            }
        };
    }, [user]);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><p>Carregando dashboard...</p></div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <KpiCard title="Conversas (30d)" value={stats.total} />
                <KpiCard title="Conversas Abertas" value={stats.open} />
                <KpiCard title="Conversas Fechadas" value={stats.closed} />
                <KpiCard title="Média de Tempo de Resposta" value={avgResponseTime} />
                <KpiCard title="Principais Intenções (7d)">
                     <ul className="text-sm mt-2 space-y-1 text-gray-600">
                        {insights.slice(0, 3).map(item => <li key={item.id}>{item.intent} ({item.count})</li>)}
                        {insights.length === 0 && <li>Nenhum dado</li>}
                    </ul>
                </KpiCard>
            </div>

            {/* Conversations Chart */}
            <Card>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Conversas por Dia (Últimos 30 dias)</h2>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={dailyMetrics} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="total" stroke="#0F9D58" strokeWidth={2} name="Conversas" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Recent Conversations */}
            <Card>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Conversas Recentes</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2">Cliente</th>
                                <th className="p-2">Telefone</th>
                                <th className="p-2">Início</th>
                                <th className="p-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {conversations.slice(0, 10).map((conv) => (
                                <tr key={conv.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2 font-medium">{conv.customer_name || 'N/A'}</td>
                                    <td className="p-2">{conv.customer_phone}</td>
                                    <td className="p-2 text-sm text-gray-600">{new Date(conv.started_at).toLocaleString('pt-BR')}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            conv.status === 'open' ? 'bg-blue-100 text-blue-800' :
                                            conv.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>{conv.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default DashboardPage;