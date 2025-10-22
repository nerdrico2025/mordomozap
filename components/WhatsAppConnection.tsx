import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { whatsappService } from '../services/whatsappService';
// FIX: Changed import path for WhatsAppIntegration type from supabaseClient to the centralized types file.
import type { WhatsAppIntegration } from '../types';
import Button from './Button';
import { useFeedback } from '../hooks/useFeedback';

const StatusIndicator: React.FC<{ status: WhatsAppIntegration['status'] }> = ({ status }) => {
    const statusConfig = {
        connected: { text: 'Conectado', color: 'bg-green-500' },
        pending: { text: 'Pendente', color: 'bg-yellow-500' },
        disconnected: { text: 'Desconectado', color: 'bg-gray-500' },
        error: { text: 'Erro', color: 'bg-red-500' },
    };
    const config = statusConfig[status] || statusConfig.disconnected;

    return (
        <div className="flex items-center space-x-2" aria-live="polite" role="status">
            <span className={`w-3 h-3 rounded-full ${config.color}`}></span>
            <span className="font-semibold text-gray-700">{config.text}</span>
        </div>
    );
};

const WhatsAppConnection: React.FC = () => {
    const { user } = useAuth();
    const { error } = useFeedback();
    const [integration, setIntegration] = useState<WhatsAppIntegration | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const pollingIntervalRef = useRef<number | null>(null);

    const fetchStatus = async (companyId: string) => {
        try {
            const status = await whatsappService.getIntegrationStatus(companyId);
            setIntegration(status);
            return status;
        } catch (e) {
            console.error("Failed to fetch status", e);
            error("Não foi possível verificar o status da conexão.");
            return null;
        }
    };
    
    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    useEffect(() => {
        if (!user?.company_id) return;
        
        setLoading(true);
        fetchStatus(user.company_id).finally(() => setLoading(false));

        return () => stopPolling();
    }, [user?.company_id]);
    
    useEffect(() => {
        if (integration?.status === 'pending' && user?.company_id) {
            if (!pollingIntervalRef.current) {
                pollingIntervalRef.current = window.setInterval(async () => {
                    const latestStatus = await fetchStatus(user!.company_id);
                    if (latestStatus?.status !== 'pending') {
                        stopPolling();
                    }
                }, 5000); // Poll every 5 seconds
            }
        } else {
            stopPolling();
        }
    }, [integration?.status, user?.company_id]);

    const handleConnect = async () => {
        if (!user?.company_id || !(user.companies as any)?.name) {
            error('Informações da empresa não encontradas. A conexão não pode ser iniciada.');
            return;
        }
        setActionLoading(true);
        try {
            // FIX: Removed the second argument as `startConnection` only expects `companyId`.
            const pendingIntegration = await whatsappService.startConnection(user.company_id);
            setIntegration(pendingIntegration);
        } catch (err: any) {
            error(err.message || 'Falha ao iniciar conexão com a UAZAPI.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!user?.company_id) return;
        setActionLoading(true);
        stopPolling();
        try {
            await whatsappService.disconnect(user.company_id);
            setIntegration(prev => prev ? {...prev, status: 'disconnected', qr_code_base64: null } : null);
        } catch (err) {
             error('Falha ao desconectar.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <p className="text-gray-500 text-center">Verificando status da conexão...</p>;
    }

    if (integration?.status === 'connected') {
        return (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <StatusIndicator status="connected" />
                <p className="my-4 text-gray-700">Seu assistente está ativo e pronto para atender!</p>
                <Button variant="secondary" onClick={handleDisconnect} loading={actionLoading}>
                    Desconectar
                </Button>
            </div>
        );
    }
    
    if (integration?.status === 'pending') {
        return (
            <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-4">
                 <div>
                     <StatusIndicator status="pending" />
                     <p className="mt-2 text-gray-700">
                        {integration.qr_code_base64 
                            ? "Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e escaneie o QR Code abaixo."
                            : "Gerando QR Code, por favor aguarde..."}
                    </p>
                 </div>
                 
                {integration.qr_code_base64 ? (
                     <img 
                        src={`data:image/png;base64,${integration.qr_code_base64}`} 
                        alt="WhatsApp QR Code" 
                        className="mx-auto border-4 border-primary p-2 rounded-lg bg-white"
                     />
                ) : (
                    <div className="h-48 flex items-center justify-center">
                         <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
                 <p className="text-xs text-gray-500">A página irá atualizar automaticamente assim que a conexão for estabelecida.</p>
            </div>
        );
    }

    // Default view: Disconnected or Error
    return (
        <div className="p-4 bg-gray-100 border rounded-lg text-center">
            <StatusIndicator status={integration?.status || 'disconnected'} />
            {integration?.status === 'error' && (
                <p className="my-2 text-sm text-red-600">Ocorreu um erro na conexão. Tente novamente.</p>
            )}
            <p className="my-4 text-gray-700">Conecte seu número de WhatsApp para ativar o assistente de IA.</p>
            <Button variant="primary" onClick={handleConnect} loading={actionLoading}>
                {integration?.status === 'error' ? 'Tentar Novamente' : 'Conectar WhatsApp'}
            </Button>
        </div>
    );
};

export default WhatsAppConnection;