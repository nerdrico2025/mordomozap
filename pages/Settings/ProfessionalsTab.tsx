import React from 'react';
import type { AgentConfig, Professional } from '../../types';
import Button from '../../components/Button';
import ProfessionalCard from '../../components/ProfessionalCard';

interface ProfessionalsTabProps {
    config: AgentConfig;
    setConfig: React.Dispatch<React.SetStateAction<AgentConfig | null>>;
}

const ProfessionalsTab: React.FC<ProfessionalsTabProps> = ({ config, setConfig }) => {

    const updateProfessional = (index: number, updatedProfessional: Professional) => {
        if (!config) return;
        const newProfessionals = [...config.professionals];
        newProfessionals[index] = updatedProfessional;
        setConfig({ ...config, professionals: newProfessionals });
    };

    const addProfessional = () => {
        if (!config) return;
        const newProfessional: Professional = {
            name: '',
            phone: '',
            services: [],
            // Using a default structure for working hours
            workingHours: [
                { day: 'Segunda', start: '09:00', end: '18:00', enabled: true },
                { day: 'Terça', start: '09:00', end: '18:00', enabled: true },
                { day: 'Quarta', start: '09:00', end: '18:00', enabled: true },
                { day: 'Quinta', start: '09:00', end: '18:00', enabled: true },
                { day: 'Sexta', start: '09:00', end: '18:00', enabled: true },
                { day: 'Sábado', start: '09:00', end: '12:00', enabled: false },
                { day: 'Domingo', start: '09:00', end: '12:00', enabled: false },
            ],
        };
        setConfig({ ...config, professionals: [...config.professionals, newProfessional] });
    };

    const removeProfessional = (index: number) => {
        if (!config) return;
        const newProfessionals = config.professionals.filter((_, i) => i !== index);
        setConfig({ ...config, professionals: newProfessionals });
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
                Adicione os profissionais que realizarão os serviços. Você pode associar cada serviço a um ou mais profissionais.
            </p>
            {config.professionals.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {config.professionals.map((prof, index) => (
                        <ProfessionalCard
                            key={index}
                            professional={prof}
                            allServices={config.products}
                            onUpdate={(updated) => updateProfessional(index, updated)}
                            onRemove={() => removeProfessional(index)}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-10 border-2 border-dashed rounded-lg text-gray-500">
                    <svg className="mx-auto h-12 w-12" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <p className="mt-2 font-semibold">Nenhum profissional cadastrado</p>
                    <p className="text-sm">Clique no botão abaixo para adicionar o primeiro.</p>
                </div>
            )}
            <div className="pt-4">
                <Button onClick={addProfessional} variant="secondary">Adicionar Profissional</Button>
            </div>
        </div>
    );
};

export default ProfessionalsTab;
