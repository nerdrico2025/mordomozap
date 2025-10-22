import React from 'react';
import type { AgentConfig } from '../../types';

interface HoursTabProps {
    config: AgentConfig;
    setConfig: React.Dispatch<React.SetStateAction<AgentConfig | null>>;
}

const HoursTab: React.FC<HoursTabProps> = ({ config, setConfig }) => {

    const handleWorkingHoursChange = (index: number, field: 'start' | 'end' | 'enabled', value: string | boolean) => {
        if (!config) return;
        const newHours = [...config.workingHours];
        (newHours[index] as any)[field] = value;
        setConfig({ ...config, workingHours: newHours });
    };

    return (
         <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
                Defina o horário de funcionamento geral da empresa. O assistente usará essa informação para saber quando pode agendar serviços e quando informar que a empresa está fechada.
            </p>
            {config.workingHours.map((wh, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 items-center p-2 rounded-md hover:bg-gray-50">
                    <span className="font-medium text-gray-700">{wh.day}</span>
                    <input type="time" value={wh.start} onChange={(e) => handleWorkingHoursChange(index, 'start', e.target.value)} disabled={!wh.enabled} className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100" />
                    <input type="time" value={wh.end} onChange={(e) => handleWorkingHoursChange(index, 'end', e.target.value)} disabled={!wh.enabled} className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100" />
                    <div className="flex items-center justify-end">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={wh.enabled} onChange={(e) => handleWorkingHoursChange(index, 'enabled', e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            <span className="ml-3 text-sm font-medium text-gray-900">{wh.enabled ? 'Aberto' : 'Fechado'}</span>
                        </label>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default HoursTab;
