
// This is a placeholder for the actual Gemini API service.
// In a real application, you would import and use '@google/genai'.
// Since we cannot use environment variables in this context, we will mock the response.

// import { GoogleGenAI } from "@google/genai";
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface OnboardingStep {
    id: string;
    text: string;
    completed: boolean;
}

export interface GeminiOnboardingResponse {
    responseText: string;
    nextStep?: string;
    requiresConfirmation?: boolean;
    actionToConfirm?: string;
    updatedSteps?: OnboardingStep[];
}

const onboardingSteps: OnboardingStep[] = [
    { id: 'start', text: 'Conectar WhatsApp', completed: false },
    { id: 'greeting', text: 'Definir saudação', completed: false },
    { id: 'working_hours', text: 'Configurar horário', completed: false },
    { id: 'faqs', text: 'Adicionar FAQs', completed: false },
    { id: 'test', text: 'Testar assistente', completed: false },
    { id: 'done', text: 'Finalizar', completed: false },
];

let currentStepIndex = 0;

export const geminiService = {
  getOnboardingResponse: async (userInput: string, confirmedAction?: string): Promise<GeminiOnboardingResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (confirmedAction) {
        onboardingSteps[currentStepIndex].completed = true;
        currentStepIndex++;
    }
    
    const currentStep = onboardingSteps[currentStepIndex];

    let responseText = '';
    let requiresConfirmation = false;
    let actionToConfirm = '';

    switch(currentStep.id) {
        case 'start':
            responseText = "Olá! Sou o Consultor IA do MordomoZAP. Vamos começar conectando sua conta do WhatsApp. Para isso, você precisará escanear um QR Code. Você está pronto?";
            requiresConfirmation = true;
            actionToConfirm = 'connect_whatsapp';
            break;
        case 'greeting':
            responseText = "Ótimo, WhatsApp conectado! Agora, vamos criar uma mensagem de saudação. Por exemplo: 'Olá! Bem-vindo à [Nome da Empresa]. Como posso te ajudar hoje?'. O que você acha?";
            requiresConfirmation = true;
            actionToConfirm = 'set_greeting';
            break;
        case 'working_hours':
            responseText = "Saudação definida! Agora, vamos configurar seu horário de atendimento. Por padrão, é de Segunda a Sexta, das 9h às 18h. Podemos manter assim?";
            requiresConfirmation = true;
            actionToConfirm = 'set_hours';
            break;
        case 'faqs':
             responseText = "Horários configurados. O assistente pode responder perguntas frequentes. Que tal adicionarmos uma? Exemplo: Pergunta 'Qual o endereço?' Resposta: 'Ficamos na Rua das Flores, 123'. Concorda em adicionar este exemplo?";
            requiresConfirmation = true;
            actionToConfirm = 'add_faq';
            break;
        case 'test':
            responseText = "FAQ adicionada! Estamos quase no fim. Gostaria de fazer um teste enviando uma mensagem para o seu número e recebendo a resposta automática que configuramos?";
            requiresConfirmation = true;
            actionToConfirm = 'run_test';
            break;
        case 'done':
            responseText = "Tudo pronto! Seu MordomoZAP está configurado e pronto para atender seus clientes. Você pode ajustar todas essas configurações a qualquer momento na página de 'Configurações'.";
            break;
    }
    
    return {
        responseText,
        nextStep: currentStep.id,
        requiresConfirmation,
        actionToConfirm,
        updatedSteps: [...onboardingSteps]
    };
  }
};
