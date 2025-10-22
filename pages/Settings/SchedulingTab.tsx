import React from 'react';
import type { AgentConfig } from '../../types';

interface SchedulingTabProps {
    config: AgentConfig;
    setConfig: React.Dispatch<React.SetStateAction<AgentConfig | null>>;
}

const SchedulingTab: React.FC<SchedulingTabProps> = ({ config, setConfig }) => {

    const handleChange = (field: 'slotDuration' | 'allowBookingUpTo', value: string) => {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) return;
        
        setConfig(prev => {
            if (!prev) return null;
            return {
                ...prev,
                schedulingRules: {
                    ...prev.schedulingRules,
                    [field]: numValue
                }
            };
        });
    };

    return (
        <div className="space-y-6 max-w-lg">
             <div>
                <label htmlFor="slotDuration" className="block text-sm font-medium text-gray-700">
                    Duração Padrão do Atendimento (em minutos)
                </label>
                <input
                    id="slotDuration"
                    type="number"
                    value={config.schedulingRules.slotDuration}
                    onChange={(e) => handleChange('slotDuration', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
                <p className="mt-2 text-sm text-gray-500">
                    Tempo base que o sistema usará para calcular horários disponíveis. Os serviços podem ter durações diferentes, mas isso define o intervalo padrão.
                </p>
            </div>
            <div>
                <label htmlFor="allowBookingUpTo" className="block text-sm font-medium text-gray-700">
                    Permitir agendamento com até (dias de antecedência)
                </label>
                <input
                    id="allowBookingUpTo"
                    type="number"
                    value={config.schedulingRules.allowBookingUpTo}
                    onChange={(e) => handleChange('allowBookingUpTo', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
                <p className="mt-2 text-sm text-gray-500">
                    Limite máximo de dias no futuro que um cliente pode marcar um horário.
                </p>
            </div>
        </div>
    );
};

export default SchedulingTab;
