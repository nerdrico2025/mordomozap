import React from 'react';
import type { AgentConfig } from '../../types';

interface GeneralTabProps {
    config: AgentConfig;
    setConfig: React.Dispatch<React.SetStateAction<AgentConfig | null>>;
}

const GeneralTab: React.FC<GeneralTabProps> = ({ config, setConfig }) => {
    
    const handleChange = (field: 'greetingMessage' | 'fallbackMessage', value: string) => {
        setConfig(prev => prev ? { ...prev, [field]: value } : null);
    };

    return (
        <div className="space-y-6">
            <div>
                <label htmlFor="greetingMessage" className="block text-sm font-medium text-gray-700">
                    Mensagem de Saudação
                </label>
                <textarea
                    id="greetingMessage"
                    value={config.greetingMessage}
                    onChange={(e) => handleChange('greetingMessage', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    rows={4}
                />
                <p className="mt-2 text-sm text-gray-500">
                    Esta mensagem é enviada quando um cliente inicia uma conversa pela primeira vez.
                </p>
            </div>
            <div>
                <label htmlFor="fallbackMessage" className="block text-sm font-medium text-gray-700">
                    Mensagem de Fallback
                </label>
                <textarea
                    id="fallbackMessage"
                    value={config.fallbackMessage}
                    onChange={(e) => handleChange('fallbackMessage', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    rows={4}
                />
                <p className="mt-2 text-sm text-gray-500">
                    Enviada quando o assistente não entende a pergunta do cliente e precisa de ajuda humana.
                </p>
            </div>
        </div>
    );
};

export default GeneralTab;
