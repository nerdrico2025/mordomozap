
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { geminiService, GeminiOnboardingResponse, OnboardingStep } from '../services/geminiService';
import Button from '../components/Button';

const MORDOMO_LOGO_URL = 'https://dutzohcickrbmlolcjtp.supabase.co/storage/v1/object/public/mordomo/logo-mordomo.png';


const OnboardingPage: React.FC = () => {
    const [steps, setSteps] = useState<OnboardingStep[]>([]);
    const [messages, setMessages] = useState<{ text: string, sender: 'user' | 'ai' }[]>([]);
    const [currentResponse, setCurrentResponse] = useState<GeminiOnboardingResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        const startOnboarding = async () => {
            setIsLoading(true);
            const response = await geminiService.getOnboardingResponse('start');
            setMessages([{ text: response.responseText, sender: 'ai' }]);
            setCurrentResponse(response);
            if (response.updatedSteps) {
                setSteps(response.updatedSteps);
            }
            setIsLoading(false);
        };
        startOnboarding();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleConfirm = async (action: string) => {
        setIsLoading(true);
        setCurrentResponse(null);
        setMessages(prev => [...prev, { text: `Confirmado: ${action}`, sender: 'user' }]);

        // This would call the n8n flow for the specific action
        // e.g., flow.onboarding_start -> connect_whatsapp
        console.log(`Action confirmed, triggering n8n flow for: ${action}`);

        const response = await geminiService.getOnboardingResponse('', action);
        
        if (response.nextStep === 'done') {
            setTimeout(() => navigate('/dashboard'), 3000);
        }
        
        setMessages(prev => [...prev, { text: response.responseText, sender: 'ai' }]);
        setCurrentResponse(response);
        if (response.updatedSteps) {
            setSteps(response.updatedSteps);
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="flex w-full max-w-6xl h-[80vh] bg-white rounded-2xl shadow-2xl">
                {/* Sidebar */}
                <div className="w-1/3 bg-gray-800 text-white p-8 rounded-l-2xl flex flex-col">
                    <img src={MORDOMO_LOGO_URL} alt="Logo" className="h-12 mb-8"/>
                    <h2 className="text-2xl font-bold mb-6">Configuração Inicial</h2>
                    <p className="text-gray-300 mb-8">Siga os passos do nosso assistente para deixar tudo pronto.</p>
                    <ul className="space-y-4">
                        {steps.map(step => (
                            <li key={step.id} className="flex items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${step.completed ? 'bg-primary' : 'border-2 border-gray-500'}`}>
                                    {step.completed && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                </div>
                                <span className={`${step.completed ? 'text-white' : 'text-gray-400'}`}>{step.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                {/* Chat */}
                <div className="w-2/3 flex flex-col p-6">
                    <div className="flex-grow overflow-y-auto mb-4 pr-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                                <div className={`max-w-md p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                    <p>{msg.text}</p>
                                </div>
                            </div>
                        ))}
                         {isLoading && <div className="flex justify-start"><div className="bg-gray-200 p-4 rounded-2xl rounded-bl-none">Digitando...</div></div>}
                        <div ref={messagesEndRef} />
                    </div>
                    {currentResponse?.requiresConfirmation && currentResponse.actionToConfirm && (
                        <div className="flex justify-end space-x-4 p-4 border-t">
                            <Button variant="secondary" onClick={() => console.log('Cancelled')}>Cancelar</Button>
                            <Button variant="primary" onClick={() => handleConfirm(currentResponse.actionToConfirm!)} disabled={isLoading}>
                                Confirmar
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingPage;
