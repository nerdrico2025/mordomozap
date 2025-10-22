import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { chatService } from '../services/chatService';
// FIX: Changed import path for Conversation type from supabaseClient to the centralized types file.
import type { Conversation } from '../types';
import Card from '../components/Card';

const ConversationsPage: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchConversations = async () => {
            if (user?.company_id) {
                try {
                    setLoading(true);
                    const data = await chatService.getConversations(user.company_id);
                    setConversations(data);
                } catch (error) {
                    console.error("Failed to fetch conversations:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchConversations();
    }, [user]);

    if (loading) {
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
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">Nenhuma conversa encontrada.</p>
                )}
            </Card>
        </div>
    );
};

export default ConversationsPage;
