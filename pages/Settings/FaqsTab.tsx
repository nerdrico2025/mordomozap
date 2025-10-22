import React from 'react';
import type { AgentConfig } from '../../types';
import Button from '../../components/Button';

interface FaqsTabProps {
    config: AgentConfig;
    setConfig: React.Dispatch<React.SetStateAction<AgentConfig | null>>;
}

const FaqsTab: React.FC<FaqsTabProps> = ({ config, setConfig }) => {

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

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
                Adicione perguntas e respostas que o assistente deve saber. Isso aumenta a precisão e a utilidade do seu MordomoZAP.
            </p>
            {config.faqs.map((faq, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3 bg-gray-50/50 relative">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Pergunta</label>
                        <input
                            type="text"
                            placeholder="Ex: Qual o endereço de vocês?"
                            value={faq.question}
                            onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-700">Resposta</label>
                        <textarea
                            placeholder="Ex: Ficamos na Rua das Flores, 123."
                            value={faq.answer}
                            onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                            rows={3}
                        />
                    </div>
                    <button 
                        onClick={() => removeFaq(index)} 
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                        aria-label="Remover FAQ"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            ))}
            <div className="pt-2">
                <Button onClick={addFaq} variant="secondary">Adicionar FAQ</Button>
            </div>
        </div>
    );
};

export default FaqsTab;
