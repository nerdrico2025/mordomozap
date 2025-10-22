import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AgentConfig } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import { agentService } from '../services/agentService';
import { useFeedback } from '../hooks/useFeedback';

// Import tab components
import IntegrationTab from './Settings/IntegrationTab';
import GeneralTab from './Settings/GeneralTab';
import HoursTab from './Settings/HoursTab';
import FaqsTab from './Settings/FaqsTab';
import SchedulingTab from './Settings/SchedulingTab';
import ProductsTab from './Settings/ProductsTab';
import ProfessionalsTab from './Settings/ProfessionalsTab';

const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const { success, error: showError } = useFeedback();
    const [config, setConfig] = useState<AgentConfig | null>(null);
    const [initialConfig, setInitialConfig] = useState<AgentConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('integration');

    useEffect(() => {
        const fetchConfig = async () => {
            if (user?.company_id) {
                try {
                    setLoading(true);
                    const data = await agentService.getAgentConfig(user.company_id);
                    setConfig(data);
                    setInitialConfig(JSON.parse(JSON.stringify(data))); // Deep copy for comparison
                } catch (err) {
                    showError("Falha ao carregar configurações do agente.");
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchConfig();
    }, [user, showError]);

    const handleSave = async () => {
        if (user?.company_id && config) {
            try {
                setSaving(true);
                await agentService.updateAgentConfig(user.company_id, config);
                setInitialConfig(JSON.parse(JSON.stringify(config))); // Update baseline
                success('Configurações salvas com sucesso!');
            } catch (err) {
                showError('Erro ao salvar configurações.');
            } finally {
                setSaving(false);
            }
        }
    };
    
    const isDirty = JSON.stringify(config) !== JSON.stringify(initialConfig);

    const TabButton: React.FC<{tabId: string, label: string}> = ({tabId, label}) => (
        <button 
            onClick={() => setActiveTab(tabId)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === tabId ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
        >
            {label}
        </button>
    )

    const renderTabContent = () => {
        if (!config) return null;
        
        const tabProps = { config, setConfig };

        switch (activeTab) {
            case 'integration': return <IntegrationTab />;
            case 'general': return <GeneralTab {...tabProps} />;
            case 'products': return <ProductsTab {...tabProps} />;
            case 'professionals': return <ProfessionalsTab {...tabProps} />;
            case 'hours': return <HoursTab {...tabProps} />;
            case 'scheduling': return <SchedulingTab {...tabProps} />;
            case 'faqs': return <FaqsTab {...tabProps} />;
            default: return null;
        }
    };

    if (loading) return <div>Carregando configurações...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Configurações</h1>
                <Button onClick={handleSave} loading={saving} disabled={!isDirty || saving}>
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
            
            <Card>
                <div className="border-b border-gray-200 mb-6">
                    <nav className="flex space-x-2 overflow-x-auto pb-2">
                        <TabButton tabId="integration" label="Integração WhatsApp" />
                        <TabButton tabId="general" label="Geral" />
                        <TabButton tabId="products" label="Produtos/Serviços" />
                        <TabButton tabId="professionals" label="Profissionais" />
                        <TabButton tabId="hours" label="Horários de Atendimento" />
                        <TabButton tabId="scheduling" label="Regras de Agendamento" />
                        <TabButton tabId="faqs" label="FAQs" />
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
