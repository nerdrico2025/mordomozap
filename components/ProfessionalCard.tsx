import React, { useState } from 'react';
import type { Professional, Product } from '../types';
import Card from './Card';
import Button from './Button';

interface ProfessionalCardProps {
  professional: Professional;
  allServices: Product[];
  onUpdate: (updatedProfessional: Professional) => void;
  onRemove: () => void;
}

const ProfessionalCard: React.FC<ProfessionalCardProps> = ({ professional, allServices, onUpdate, onRemove }) => {
  const [selectedService, setSelectedService] = useState('');

  const handleInputChange = (field: 'name' | 'phone', value: string) => {
    onUpdate({ ...professional, [field]: value });
  };

  const handleAddService = () => {
    if (selectedService && !professional.services.includes(selectedService)) {
      onUpdate({
        ...professional,
        services: [...professional.services, selectedService],
      });
      setSelectedService(''); // Reset dropdown
    }
  };

  const handleRemoveService = (serviceToRemove: string) => {
    onUpdate({
      ...professional,
      services: professional.services.filter(s => s !== serviceToRemove),
    });
  };

  // Filter out services that are already associated with the professional
  const availableServices = allServices.filter(
    service => service.name && !professional.services.includes(service.name)
  );

  return (
    <Card className="flex flex-col space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex-grow space-y-2">
            <div>
                <label className="text-sm font-medium text-gray-600">Nome do Profissional</label>
                <input
                    type="text"
                    placeholder="Ex: João da Silva"
                    value={professional.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
            </div>
            <div>
                <label className="text-sm font-medium text-gray-600">Telefone (Opcional)</label>
                <input
                    type="tel"
                    placeholder="(11) 99999-8888"
                    value={professional.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
            </div>
        </div>
         <Button 
            onClick={onRemove} 
            variant="secondary"
            className="ml-4 text-red-500 hover:bg-red-100 !p-2"
            aria-label="Remover Profissional"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </Button>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-600">Serviços Associados</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {professional.services.length > 0 ? (
            professional.services.map(service => (
              <span key={service} className="flex items-center bg-gray-200 text-gray-800 text-sm font-medium px-3 py-1 rounded-full">
                {service}
                <button
                  onClick={() => handleRemoveService(service)}
                  className="ml-2 text-gray-500 hover:text-gray-800"
                  aria-label={`Remover ${service}`}
                >
                  &times;
                </button>
              </span>
            ))
          ) : (
            <p className="text-sm text-gray-500">Nenhum serviço associado.</p>
          )}
        </div>
      </div>

      <div className="flex items-end space-x-2 border-t pt-4">
        <div className="flex-grow">
            <label htmlFor={`service-select-${professional.name}`} className="text-sm font-medium text-gray-600">Adicionar Serviço</label>
            <select
                id={`service-select-${professional.name}`}
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100"
                disabled={availableServices.length === 0}
            >
                <option value="" disabled>
                    {availableServices.length === 0 ? 'Nenhum serviço disponível' : 'Selecione um serviço'}
                </option>
                {availableServices.map(service => (
                    <option key={service.name} value={service.name}>
                    {service.name}
                    </option>
                ))}
            </select>
        </div>
        <Button onClick={handleAddService} disabled={!selectedService} variant="secondary">
            Associar
        </Button>
      </div>
    </Card>
  );
};

export default ProfessionalCard;