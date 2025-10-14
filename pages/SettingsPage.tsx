import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AgentConfig } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import { agentService } from '../services/agentService';

const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const [config, setConfig] = useState<AgentConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        const fetchConfig = async () => {
            if (user?.company_id) {
                try {
                    setLoading(true);
                    const data = await agentService.getAgentConfig(user.company_id);
                    setConfig(data);
                } catch (error) {
                    console.error("Failed to fetch agent config:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchConfig();
    }, [user]);

    const handleSave = async () => {
        if (user?.company_id && config) {
            try {
                setSaving(true);
                await agentService.updateAgentConfig(user.company_id, config);
                alert('Configurações salvas com sucesso!');
            } catch (error) {
                console.error("Failed to save agent config:", error);
                alert('Erro ao salvar configurações.');
            } finally {
                setSaving(false);
            }
        }
    };

    const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
        if (!config) return;
        const newFaqs = [...config.faqs];
        newFaqs[index] = { ...newFaqs[index], [field]: value };
        setConfig({ ...config, faqs: newFaqs });
    };

    const addFaq = () => {
        if (!config) return;
        setConfig({ ...config, faqs: [...config.faqs, { question: '', answer: '' }] });
    };

    const removeFaq = (index: number) => {
        if (!config) return;
        const newFaqs = config.faqs.filter((_, i) => i !== index);
        setConfig({ ...config, faqs: newFaqs });
    };
    
    const handleWorkingHoursChange = (index: number, field: 'start' | 'end' | 'enabled', value: string | boolean) => {
        if (!config) return;
        const newHours = [...config.workingHours];
        newHours[index] = { ...newHours[index], [field]: value };
        setConfig({ ...config, workingHours: newHours });
    };

    if (loading) return <div>Carregando configurações...</div>;
    if (!config) return <div>Não foi possível carregar as configurações do agente.</div>;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mensagem de Saudação</label>
                            <textarea
                                value={config.greetingMessage}
                                onChange={(e) => setConfig({ ...config, greetingMessage: e.target.value })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                rows={3}
                            />
                            <p className="mt-2 text-sm text-gray-500">Esta mensagem é enviada quando um cliente inicia uma conversa.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mensagem de Fallback</label>
                            <textarea
                                value={config.fallbackMessage}
                                onChange={(e) => setConfig({ ...config, fallbackMessage: e.target.value })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                rows={3}
                            />
                            <p className="mt-2 text-sm text-gray-500">Enviada quando o assistente não entende a pergunta do cliente.</p>
                        </div>
                    </div>
                );
            case 'hours':
                return (
                     <div className="space-y-4">
                        {config.workingHours.map((wh, index) => (
                            <div key={index} className="grid grid-cols-4 gap-4 items-center">
                                <span className="font-medium">{wh.day}</span>
                                <input type="time" value={wh.start} onChange={(e) => handleWorkingHoursChange(index, 'start', e.target.value)} disabled={!wh.enabled} className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100" />
                                <input type="time" value={wh.end} onChange={(e) => handleWorkingHoursChange(index, 'end', e.target.value)} disabled={!wh.enabled} className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100" />
                                <div className="flex items-center">
                                    <input type="checkbox" checked={wh.enabled} onChange={(e) => handleWorkingHoursChange(index, 'enabled', e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                                    <label className="ml-2">Ativo</label>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'faqs':
                return (
                     <div className="space-y-4">
                        {config.faqs.map((faq, index) => (
                            <div key={index} className="p-4 border rounded-md space-y-2">
                                <input
                                    type="text"
                                    placeholder="Pergunta"
                                    value={faq.question}
                                    onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                                <textarea
                                    placeholder="Resposta"
                                    value={faq.answer}
                                    onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    rows={2}
                                />
                                <Button variant="secondary" onClick={() => removeFaq(index)} className="text-red-500 text-sm py-1 px-2">Remover</Button>
                            </div>
                        ))}
                        <Button onClick={addFaq}>Adicionar FAQ</Button>
                    </div>
                );
            case 'scheduling':
                return (
                    <div className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Duração do Slot (minutos)</label>
                            <input
                                type="number"
                                value={config.schedulingRules.slotDuration}
                                onChange={(e) => setConfig({ ...config, schedulingRules: {...config.schedulingRules, slotDuration: parseInt(e.target.value, 10) }})}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Permitir agendamento até (dias no futuro)</label>
                            <input
                                type="number"
                                value={config.schedulingRules.allowBookingUpTo}
                                onChange={(e) => setConfig({ ...config, schedulingRules: {...config.schedulingRules, allowBookingUpTo: parseInt(e.target.value, 10) }})}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };
    
    const TabButton: React.FC<{tabId: string, label: string}> = ({tabId, label}) => (
        <button 
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === tabId ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
            {label}
        </button>
    )

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Configurações do Assistente</h1>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
            
            <Card>
                <div className="border-b border-gray-200 mb-6">
                    <nav className="flex space-x-2">
                        <TabButton tabId="general" label="Geral" />
                        <TabButton tabId="hours" label="Horários" />
                        <TabButton tabId="faqs" label="FAQs" />
                        <TabButton tabId="scheduling" label="Agendamento" />
                    </nav>
                </div>
                <div>
                    {renderTabContent()}
                </div>
            </Card>
        </div>
    );
};

export default SettingsPage;
