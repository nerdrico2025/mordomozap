
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/mockApi';
import { AgentConfig } from '../types';
import Button from '../components/Button';
import Card from '../components/Card';

const SettingsPage: React.FC = () => {
    const [config, setConfig] = useState<AgentConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const fetchConfig = async () => {
            if (user) {
                const data = await api.getAgentConfig(user.company_id);
                setConfig(data);
            }
            setLoading(false);
        };
        fetchConfig();
    }, [user]);

    const handleSave = async () => {
        if (user && config) {
            setSaving(true);
            // This would trigger an n8n endpoint to update config in Supabase
            await api.saveAgentConfig(user.company_id, config);
            setSaving(false);
            alert('Configurações salvas!');
        }
    };

    const handleInputChange = <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => {
        setConfig(prev => prev ? { ...prev, [key]: value } : null);
    };

    if (loading) return <div>Carregando configurações...</div>;
    if (!config) return <div>Não foi possível carregar as configurações.</div>;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800">Configurações do Agente</h1>
            
            <Card>
                <h2 className="text-xl font-bold mb-4">Mensagens</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mensagem de Saudação</label>
                        <textarea 
                            value={config.greetingMessage} 
                            onChange={e => handleInputChange('greetingMessage', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md" rows={3}></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mensagem de Fallback</label>
                         <textarea 
                            value={config.fallbackMessage} 
                            onChange={e => handleInputChange('fallbackMessage', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md" rows={3}></textarea>
                    </div>
                </div>
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-4">Perguntas Frequentes (FAQs)</h2>
                 {config.faqs.map((faq, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 mb-4">
                        <input type="text" placeholder="Pergunta" value={faq.question} className="px-3 py-2 border border-gray-300 rounded-md"/>
                        <input type="text" placeholder="Resposta" value={faq.answer} className="px-3 py-2 border border-gray-300 rounded-md"/>
                    </div>
                 ))}
                 <Button variant="secondary">Adicionar FAQ</Button>
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-4">Integração WhatsApp (UAZAPI)</h2>
                <p className="text-gray-600 mb-4">Status: <span className="text-green-600 font-semibold">Conectado</span></p>
                <div className="space-x-4">
                    <Button variant="secondary">Reconectar</Button>
                     <button onClick={() => window.confirm('Atenção: Esta é uma ação sensível. Desconectar seu número irá interromper o atendimento. Deseja continuar?')} className="px-6 py-3 font-semibold rounded-lg shadow-md focus:outline-none transition-transform transform hover:scale-105 bg-red-600 text-white hover:bg-red-700">
                        Desconectar
                    </button>
                </div>
            </Card>

            <div className="text-right">
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
        </div>
    );
};

export default SettingsPage;
