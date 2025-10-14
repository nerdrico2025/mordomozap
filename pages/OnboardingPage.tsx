import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { geminiService, OnboardingStep } from '../services/geminiService';
import Button from '../components/Button';
import Card from '../components/Card';

const MORDOMO_LOGO_URL = 'https://dutzohcickrbmlolcjtp.supabase.co/storage/v1/object/public/mordomo/logo-mordomo.png';

interface Message {
    sender: 'user' | 'ai';
    text: string;
    requiresConfirmation?: boolean;
    actionToConfirm?: string;
}

const OnboardingPage: React.FC = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [steps, setSteps] = useState<OnboardingStep[]>([]);
    const [userInput, setUserInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    // Initial message from AI
    useEffect(() => {
        const startOnboarding = async () => {
            setLoading(true);
            const response = await geminiService.getOnboardingResponse('');
            setMessages([{ sender: 'ai', text: response.responseText, requiresConfirmation: response.requiresConfirmation, actionToConfirm: response.actionToConfirm }]);
            if (response.updatedSteps) {
                setSteps(response.updatedSteps);
            }
            setLoading(false);
        };
        startOnboarding();
    }, []);

    const sendMessage = async (messageText: string, confirmedAction?: string) => {
        if (!messageText && !confirmedAction) return;

        const newMessages: Message[] = [...messages];
        if (messageText) {
            newMessages.push({ sender: 'user', text: messageText });
        }
        setMessages(newMessages);
        setUserInput('');
        setLoading(true);

        try {
            const response = await geminiService.getOnboardingResponse(messageText, confirmedAction);
            setMessages(prev => [...prev, { sender: 'ai', text: response.responseText, requiresConfirmation: response.requiresConfirmation, actionToConfirm: response.actionToConfirm }]);
            if (response.updatedSteps) {
                setSteps(response.updatedSteps);
            }
            if (response.nextStep === 'done') {
                setTimeout(() => navigate('/dashboard'), 3000);
            }
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'ai', text: "Desculpe, ocorreu um erro. Tente novamente." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = (action: string | undefined) => {
        if (!action) return;
        const confirmationText = "Sim, confirmo.";
        // Optimistically update UI
        const newMessages: Message[] = [...messages];
        newMessages.push({ sender: 'user', text: confirmationText });
        setMessages(newMessages);
        
        sendMessage('', action);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(userInput);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl mx-auto">
                 <img src={MORDOMO_LOGO_URL} alt="MordomoZAP Logo" className="h-12 mx-auto mb-6"/>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Steps */}
                    <Card className="md:col-span-1">
                        <h2 className="font-bold text-lg mb-4">Seu Progresso</h2>
                        <ul className="space-y-3">
                            {steps.map(step => (
                                <li key={step.id} className={`flex items-center text-sm ${step.completed ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>
                                    <span className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center ${step.completed ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                                       {step.completed && '✓'}
                                    </span>
                                    {step.text}
                                 </li>
                            ))}
                        </ul>
                    </Card>

                    {/* Chat */}
                    <Card className="md:col-span-2 flex flex-col h-[70vh]">
                        <h2 className="font-bold text-lg mb-4 border-b pb-2">Consultor de Onboarding IA</h2>
                        <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`rounded-lg px-4 py-2 max-w-sm ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}`}>
                                        <p>{msg.text}</p>
                                        {msg.requiresConfirmation && (
                                            <div className="mt-2 space-x-2">
                                                <Button onClick={() => handleConfirm(msg.actionToConfirm)} variant="secondary" className="py-1 px-3 text-sm">Confirmar</Button>
                                                <Button variant="secondary" className="py-1 px-3 text-sm bg-gray-300">Pular</Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                             {loading && (
                                 <div className="flex justify-start">
                                    <div className="rounded-lg px-4 py-2 bg-gray-200 text-gray-800">
                                        Digitando...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={handleSubmit} className="mt-4 flex border-t pt-4">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="Digite sua resposta..."
                                className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                disabled={loading || messages[messages.length - 1]?.requiresConfirmation}
                            />
                            <Button type="submit" className="rounded-l-none" disabled={loading || messages[messages.length - 1]?.requiresConfirmation}>
                                Enviar
                            </Button>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default OnboardingPage;
