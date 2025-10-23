import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { chatService } from '../services/chatService';
// FIX: Changed import path for Conversation type from supabaseClient to the centralized types file.
import type { Conversation } from '../types';
import Card from '../components/Card';
import { useFeedback } from '../hooks/useFeedback';

const ConversationsPage: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const pageSize = 20;
    const { user } = useAuth();
    const { error: showError } = useFeedback();

    const loadConversations = async (nextPage: number = 0) => {
        if (!user?.company_id) return;
        try {
            setLoading(true);
            const data = await chatService.getConversations(user.company_id, nextPage, pageSize);
            setConversations(prev => nextPage === 0 ? data : [...prev, ...data]);
            setHasMore(data.length === pageSize);
            setPage(nextPage);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
            showError('Falha ao carregar conversas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConversations(0);
    }, [user]);

    if (loading && page === 0) {
        return <div className="text-center p-8">Carregando conversas...</div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Conversas</h1>
            <Card>
                {conversations.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-3">Cliente</th>
                                    <th className="p-3">Telefone</th>
                                    <th className="p-3">Início</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {conversations.map((conv) => (
                                    <tr key={conv.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium">{conv.customer_name || 'N/A'}</td>
                                        <td className="p-3">{conv.customer_phone}</td>
                                        <td className="p-3 text-sm text-gray-600">{new Date(conv.started_at).toLocaleString('pt-BR')}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                conv.status === 'open' ? 'bg-blue-100 text-blue-800' :
                                                conv.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>{conv.status}</span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <Link to={`/chat/${conv.id}`} className="text-primary font-semibold hover:underline">
                                                Abrir
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {hasMore && (
                            <div className="mt-4 text-center">
                                <button onClick={() => loadConversations(page + 1)} disabled={loading} className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50">
                                    {loading ? 'Carregando...' : 'Carregar mais'}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">Nenhuma conversa encontrada.</p>
                )}
            </Card>
        </div>
    );
};

export default ConversationsPage;
