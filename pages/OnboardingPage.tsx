import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFeedback } from '../hooks/useFeedback';
import Button from '../components/Button';
import Card from '../components/Card';
import { authService } from '../services/authService';
import WhatsAppConnection from '../components/WhatsAppConnection';

const MORDOMO_LOGO_URL = 'https://dutzohcickrbmlolcjtp.supabase.co/storage/v1/object/public/mordomo/logo-mordomo.png';
const TOTAL_STEPS = 8;

const businessTypeOptions = [
    'Academia',
    'Barbearia',
    'Centro de Estética',
    'Clínica Médica',
    'Clínica Veterinária',
    'Consultório Odontológico',
    'Nutricionista',
    'Petshop',
    'Salão de Beleza',
    'Outro'
];

const defaultWorkingHours = [
    { day: 'Segunda', start: '09:00', end: '18:00', enabled: true },
    { day: 'Terça', start: '09:00', end: '18:00', enabled: true },
    { day: 'Quarta', start: '09:00', end: '18:00', enabled: true },
    { day: 'Quinta', start: '09:00', end: '18:00', enabled: true },
    { day: 'Sexta', start: '09:00', end: '18:00', enabled: true },
    { day: 'Sábado', start: '09:00', end: '12:00', enabled: false },
    { day: 'Domingo', start: '09:00', end: '12:00', enabled: false },
];

const OnboardingPage = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const feedback = useFeedback();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [activeProfessionalIndex, setActiveProfessionalIndex] = useState(0);

    const [formData, setFormData] = useState({
        businessName: (user?.companies as any)?.name || '',
        businessType: '',
        otherBusinessType: '',
        greetingMessage: '',
        products: [{ name: '', price: '', duration: '30' }],
        enableScheduling: true,
        professionals: [{ name: '', phone: '', services: [] as string[], workingHours: JSON.parse(JSON.stringify(defaultWorkingHours)) }],
        allowBookingUpTo: 14,
        slotDuration: 30, // Novo campo adicionado
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleWorkingHoursChange = (profIndex: number, dayIndex: number, field: 'start' | 'end' | 'enabled', value: string | boolean) => {
        const newProfessionals = [...formData.professionals];
        const professional = newProfessionals[profIndex];
        const newHours = [...professional.workingHours];
        (newHours[dayIndex] as any)[field] = value;
        professional.workingHours = newHours;
        setFormData(prev => ({ ...prev, professionals: newProfessionals }));
    };

    const handleProductChange = (index: number, field: 'name' | 'price' | 'duration', value: string) => {
        const newProducts = [...formData.products];
        (newProducts[index] as any)[field] = value;
        setFormData(prev => ({ ...prev, products: newProducts }));
    };

    const addProduct = () => {
        setFormData(prev => ({
            ...prev,
            products: [...prev.products, { name: '', price: '', duration: '30' }]
        }));
    };

    const removeProduct = (index: number) => {
        if (formData.products.length <= 1) return;
        const newProducts = formData.products.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, products: newProducts }));
    };

    const handleProfessionalChange = (index: number, field: 'name' | 'phone', value: string) => {
        const newProfessionals = [...formData.professionals];
        newProfessionals[index] = { ...newProfessionals[index], [field]: value };
        setFormData(prev => ({ ...prev, professionals: newProfessionals }));
    };
    
    const handleProfessionalServiceChange = (profIndex: number, serviceName: string) => {
        const newProfessionals = [...formData.professionals];
        const professional = newProfessionals[profIndex];
        const serviceIndex = professional.services.indexOf(serviceName);
    
        if (serviceIndex > -1) {
            professional.services.splice(serviceIndex, 1); // Desmarcar
        } else {
            professional.services.push(serviceName); // Marcar
        }
        setFormData(prev => ({ ...prev, professionals: newProfessionals }));
    };
    
    const addProfessional = () => {
        setFormData(prev => ({
            ...prev,
            professionals: [...prev.professionals, { name: '', phone: '', services: [], workingHours: JSON.parse(JSON.stringify(defaultWorkingHours)) }]
        }));
    };
    
    const removeProfessional = (index: number) => {
        if (formData.professionals.length <= 1) return;
        const newProfessionals = formData.professionals.filter((_, i) => i !== index);
        // Ajusta o índice ativo se o profissional removido era o que estava selecionado
        if (activeProfessionalIndex >= newProfessionals.length) {
            setActiveProfessionalIndex(newProfessionals.length - 1);
        }
        setFormData(prev => ({ ...prev, professionals: newProfessionals }));
    };


    const handleNext = () => {
        if (currentStep === 1 && (!formData.businessName || !formData.businessType || (formData.businessType === 'Outro' && !formData.otherBusinessType))) {
            feedback.error('Por favor, preencha o nome e o ramo do seu negócio.');
            return;
        }
        if (currentStep === 3 && !formData.greetingMessage) {
            feedback.error('Por favor, defina uma mensagem de saudação.');
            return;
        }
        if (currentStep === 4) {
            const hasEmptyProduct = formData.products.some(p => !p.name.trim() || !p.price.trim() || !p.duration.trim());
            if (hasEmptyProduct) {
                feedback.error('Por favor, preencha nome, preço e duração de todos os serviços.');
                return;
            }
        }
        if (currentStep === 6 && formData.enableScheduling) {
            const hasEmptyProfessional = formData.professionals.some(p => !p.name.trim());
            if (hasEmptyProfessional) {
                feedback.error('Por favor, preencha o nome de todos os profissionais.');
                return;
            }
        }
        // Lógica para pular etapas de agendamento
        if (currentStep === 5 && !formData.enableScheduling) {
            setCurrentStep(TOTAL_STEPS); // Pula para a etapa final
        } else {
            setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
        }
    };

    const handleBack = () => {
        // Lógica para voltar do pulo
        if (currentStep === TOTAL_STEPS && !formData.enableScheduling) {
            setCurrentStep(5); // Volta para a pergunta sobre agendamento
        } else {
            setCurrentStep(prev => Math.max(prev - 1, 1));
        }
    };

    const handleSubmit = async () => {
        if (!user) {
            feedback.error('Usuário não encontrado. Por favor, faça login novamente.');
            return;
        }
        setLoading(true);
        try {
            // IMPORTANTE: Substitua pela URL real do seu webhook do n8n/make.
            const N8N_WEBHOOK_URL = "https://hook.n8n.io/1d53205a-52f6-4f9a-9b7e-07a9a1498b3c";

            const finalProducts = formData.products.map(p => ({
                name: p.name,
                price: p.price,
                duration: parseInt(p.duration, 10) || 30,
            }));

            const finalProfessionals = formData.enableScheduling ? formData.professionals : [];
            
            const payload = {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                },
                company: {
                    id: user.company_id,
                    name: formData.businessName,
                    type: formData.businessType === 'Outro' ? formData.otherBusinessType : formData.businessType,
                },
                agentConfig: {
                    greetingMessage: formData.greetingMessage,
                    fallbackMessage: 'Desculpe, não entendi. Um de nossos atendentes entrará em contato em breve.',
                    workingHours: formData.enableScheduling && finalProfessionals.length > 0
                        ? finalProfessionals[0].workingHours
                        : defaultWorkingHours,
                    faqs: [],
                    products: finalProducts,
                    professionals: finalProfessionals,
                    schedulingRules: {
                        slotDuration: parseInt(String(formData.slotDuration), 10) || 30,
                        allowBookingUpTo: formData.allowBookingUpTo,
                    },
                }
            };

            console.log("Enviando dados de onboarding para webhook:", payload);

            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Webhook response error:', errorData);
                throw new Error('Falha ao enviar dados de configuração.');
            }

            const updatedProfile = await authService.markOnboardingAsCompleted(user.id);
            if (updatedProfile) {
                updateUser(updatedProfile);
            }

            feedback.success('Configuração concluída com sucesso!');
            setTimeout(() => navigate('/dashboard'), 1500);

        } catch (err: any) {
            console.error('Erro no onboarding:', err);
            feedback.error(err.message || 'Não foi possível salvar a configuração. Tente novamente.');
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <>
                        <h2 className="text-xl font-bold text-gray-800">Sobre seu Negócio</h2>
                        <p className="text-gray-600 mb-6">Nos ajude a entender melhor sua empresa.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome do Negócio</label>
                                <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Qual o seu ramo?</label>
                                <select name="businessType" value={formData.businessType} onChange={handleChange} className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                                    <option value="" disabled>Selecione uma opção</option>
                                    {businessTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            {formData.businessType === 'Outro' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Qual?</label>
                                    <input type="text" name="otherBusinessType" placeholder="Descreva seu ramo de negócio" value={formData.otherBusinessType} onChange={handleChange} className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                                </div>
                            )}
                        </div>
                    </>
                );
            case 2:
                return (
                    <>
                        <h2 className="text-xl font-bold text-gray-800">Conectar WhatsApp</h2>
                        <p className="text-gray-600 mb-6">Este é o passo mais importante. Conecte seu número para ativar o assistente.</p>
                        <div className="flex justify-center">
                            <WhatsAppConnection autoStart />
                        </div>
                        <p className="mt-4 text-sm text-gray-500 text-center">Você pode pular e fazer isso depois na página de Configurações, mas o robô não funcionará até que a conexão seja feita.</p>
                    </>
                );
            case 3:
                return (
                    <>
                        <h2 className="text-xl font-bold text-gray-800">Mensagem de Saudação</h2>
                        <p className="text-gray-600 mb-6">Esta será a primeira mensagem que seu cliente receberá.</p>
                        <div>
                            <textarea name="greetingMessage" value={formData.greetingMessage} onChange={handleChange} rows={4} placeholder={`Ex: Olá! Bem-vindo(a) à ${formData.businessName}. Como posso te ajudar hoje?`} className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                    </>
                );
            case 4:
                return (
                    <>
                        <h2 className="text-xl font-bold text-gray-800">Produtos ou Serviços</h2>
                        <p className="text-gray-600 mb-6">Cadastre os principais produtos ou serviços que você oferece.</p>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                            {formData.products.map((product, index) => (
                                <div key={index} className="flex items-center space-x-2 p-2 border rounded-lg">
                                    <div className="flex-grow">
                                        <label className="text-xs font-medium text-gray-600">Nome do Produto/Serviço</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Corte de Cabelo"
                                            value={product.name}
                                            onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                                            className="w-full px-3 py-1 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="text-xs font-medium text-gray-600">Preço</label>
                                        <input
                                            type="text"
                                            placeholder="R$ 50,00"
                                            value={product.price}
                                            onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                                            className="w-full px-3 py-1 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="text-xs font-medium text-gray-600">Duração (min)</label>
                                        <input
                                            type="number"
                                            placeholder="30"
                                            value={product.duration}
                                            onChange={(e) => handleProductChange(index, 'duration', e.target.value)}
                                            className="w-full px-3 py-1 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeProduct(index)}
                                        disabled={formData.products.length <= 1}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label="Remover Produto"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <Button type="button" variant="secondary" onClick={addProduct}>
                                + Adicionar mais um
                            </Button>
                        </div>
                    </>
                );
            case 5:
                return (
                    <>
                        <h2 className="text-xl font-bold text-gray-800">Agendamento de Atendimento</h2>
                        <p className="text-gray-600 mb-6">Você deseja ativar a função AGENDAMENTO de atendimento?</p>
                        <div className="flex space-x-4">
                            <button onClick={() => setFormData(prev => ({...prev, enableScheduling: true}))} className={`w-full py-3 text-lg font-semibold rounded-lg border-2 transition-colors ${formData.enableScheduling ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                                Sim, ativar
                            </button>
                            <button onClick={() => setFormData(prev => ({...prev, enableScheduling: false}))} className={`w-full py-3 text-lg font-semibold rounded-lg border-2 transition-colors ${!formData.enableScheduling ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                                Não, pular
                            </button>
                        </div>
                        <p className="mt-4 text-sm text-gray-500 text-center">
                            {formData.enableScheduling 
                                ? "Ótimo! Vamos configurar os profissionais e horários no próximo passo."
                                : "Entendido. Vamos para a finalização. Você poderá ativar o agendamento mais tarde."}
                        </p>
                    </>
                );
            case 6:
                return (
                    <>
                        <h2 className="text-xl font-bold text-gray-800">Cadastro de Profissionais</h2>
                        <p className="text-gray-600 mb-6">Adicione os profissionais que realizarão os atendimentos.</p>
                        <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                            {formData.professionals.map((prof, profIndex) => (
                                <div key={profIndex} className="p-4 border rounded-lg relative">
                                    <div className="flex space-x-4 mb-4">
                                        <div className="flex-grow">
                                            <label className="block text-sm font-medium text-gray-700">Nome do Profissional</label>
                                            <input type="text" placeholder="Ex: João da Silva" value={prof.name} onChange={e => handleProfessionalChange(profIndex, 'name', e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Telefone (Opcional)</label>
                                            <input type="tel" placeholder="(11) 99999-8888" value={prof.phone} onChange={e => handleProfessionalChange(profIndex, 'phone', e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Serviços que realiza</label>
                                        <div className="mt-2 grid grid-cols-2 gap-2">
                                            {formData.products.filter(p => p.name).map((product, serviceIndex) => (
                                                <div key={serviceIndex} className="flex items-center">
                                                    <input
                                                        id={`service-${profIndex}-${serviceIndex}`}
                                                        type="checkbox"
                                                        checked={prof.services.includes(product.name)}
                                                        onChange={() => handleProfessionalServiceChange(profIndex, product.name)}
                                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                                    />
                                                    <label htmlFor={`service-${profIndex}-${serviceIndex}`} className="ml-2 text-sm text-gray-600">{product.name}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {formData.professionals.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeProfessional(profIndex)}
                                            className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 rounded-full"
                                            aria-label="Remover Profissional"
                                        >
                                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <Button type="button" variant="secondary" onClick={addProfessional}>
                                + Adicionar Profissional
                            </Button>
                        </div>
                    </>
                );
            case 7:
                return (
                    <>
                        <h2 className="text-xl font-bold text-gray-800">Horário dos Profissionais</h2>
                        <p className="text-gray-600 mb-6">Defina a agenda de cada profissional para que o assistente possa agendar os serviços corretamente.</p>
                        
                        <div className="border-b border-gray-200 mb-4">
                            <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                                {formData.professionals.map((prof, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setActiveProfessionalIndex(index)}
                                        className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm ${
                                            activeProfessionalIndex === index
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        {prof.name || `Profissional ${index + 1}`}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="space-y-3">
                            {formData.professionals[activeProfessionalIndex]?.workingHours.map((wh, dayIndex) => (
                                <div key={dayIndex} className="grid grid-cols-4 gap-3 items-center">
                                    <span className="font-medium text-sm">{wh.day}</span>
                                    <input type="time" value={wh.start} onChange={(e) => handleWorkingHoursChange(activeProfessionalIndex, dayIndex, 'start', e.target.value)} disabled={!wh.enabled} className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md disabled:bg-gray-100" />
                                    <input type="time" value={wh.end} onChange={(e) => handleWorkingHoursChange(activeProfessionalIndex, dayIndex, 'end', e.target.value)} disabled={!wh.enabled} className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md disabled:bg-gray-100" />
                                    <div className="flex items-center justify-end">
                                        <input type="checkbox" checked={wh.enabled} onChange={(e) => handleWorkingHoursChange(activeProfessionalIndex, dayIndex, 'enabled', e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                                        <label className="ml-2 text-sm">Ativo</label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                );
            case 8:
                return (
                    <>
                        <h2 className="text-xl font-bold text-gray-800">Tudo pronto!</h2>
                        <p className="text-gray-600 mb-6">Revise as regras finais de agendamento. Você poderá alterar essas configurações a qualquer momento.</p>
                        <div className="space-y-4 p-4 border rounded-lg">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Duração Padrão do Atendimento (minutos)</label>
                                <input type="number" name="slotDuration" value={formData.slotDuration} onChange={handleChange} className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg" />
                                <p className="text-xs text-gray-500 mt-1">Tempo base que o sistema usará para calcular horários disponíveis. Os serviços podem ter durações diferentes.</p>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">Permitir agendar com até quantos dias de antecedência?</label>
                                <input type="number" name="allowBookingUpTo" value={formData.allowBookingUpTo} onChange={handleChange} className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg" />
                            </div>
                        </div>
                         <div className="text-center mt-6">
                            <p className="text-4xl">🎉</p>
                            <p className="mt-4 font-semibold">Clique em "Concluir" para ir ao seu dashboard.</p>
                        </div>
                    </>
                );
            default: return null;
        }
    };
    
    const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <img src={MORDOMO_LOGO_URL} alt="MordomoZAP Logo" className="h-12 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Configuração Inicial</h1>
            <p className="text-gray-600 mb-8">Vamos deixar tudo pronto para você em poucos passos.</p>

            <Card className="w-full max-w-2xl">
                <div className="mb-8">
                    <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-green-200">
                                    Passo {currentStep} de {TOTAL_STEPS}
                                </span>
                            </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                            <div style={{ width: `${progressPercentage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500"></div>
                        </div>
                    </div>
                </div>

                <div className="min-h-[300px]">
                    {renderStepContent()}
                </div>

                <div className="flex justify-between mt-8 border-t pt-6">
                    <Button variant="secondary" onClick={handleBack} disabled={currentStep === 1 || loading}>
                        Voltar
                    </Button>
                    {currentStep < TOTAL_STEPS ? (
                        <Button variant="primary" onClick={handleNext}>
                            Próximo
                        </Button>
                    ) : (
                        <Button variant="primary" onClick={handleSubmit} loading={loading}>
                            {loading ? 'Finalizando...' : 'Concluir e ir para o Dashboard'}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default OnboardingPage;