
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Card from '../components/Card';

const FaqItem: React.FC<{ question: string; children: React.ReactNode }> = ({ question, children }) => {
    return (
        <details className="p-4 border rounded-lg">
            <summary className="font-semibold cursor-pointer">{question}</summary>
            <div className="mt-2 text-gray-600">
                {children}
            </div>
        </details>
    )
}

const SupportPage: React.FC = () => {
    return (
        <div className="bg-gray-50 min-h-screen">
            <Header />
            <main className="py-20">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800">Central de Ajuda</h1>
                        <p className="mt-4 text-lg text-gray-600">Encontre respostas para suas dúvidas ou entre em contato conosco.</p>
                    </div>

                    <Card>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Perguntas Frequentes (FAQ)</h2>
                        <div className="space-y-4">
                            <FaqItem question="Como conectar meu número de WhatsApp?">
                                <p>Durante o onboarding, nosso assistente irá guiá-lo para escanear um QR Code. Você também pode reconectar seu número a qualquer momento na página de 'Configurações'.</p>
                            </FaqItem>
                            <FaqItem question="Posso personalizar as mensagens do meu assistente?">
                                <p>Sim! Na página de 'Configurações', você pode editar a mensagem de saudação, a mensagem de fallback (quando o robô não entende), e adicionar perguntas e respostas frequentes.</p>
                            </FaqItem>
                             <FaqItem question="Como funciona o agendamento?">
                                <p>O assistente de IA identifica a intenção de agendamento na conversa, verifica os horários disponíveis na sua agenda (configurada no app) e confirma o melhor horário com o cliente. Tudo automático.</p>
                            </FaqItem>
                             <FaqItem question="O que acontece quando o trial de 3 dias acaba?">
                                <p>Após o período de teste, você será convidado a escolher um de nossos planos para continuar usando o serviço. Seus dados e configurações serão mantidos.</p>
                            </FaqItem>
                        </div>
                    </Card>

                     <Card className="mt-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Ainda precisa de ajuda?</h2>
                        <p className="text-gray-600">Se não encontrou o que procurava, entre em contato com nosso time de suporte através do e-mail: <a href="mailto:suporte@mordomozap.com" className="text-primary font-semibold">suporte@mordomozap.com</a>.</p>
                        <p className="text-gray-600 mt-2">Nosso horário de atendimento é de Segunda a Sexta, das 9h às 18h.</p>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default SupportPage;
