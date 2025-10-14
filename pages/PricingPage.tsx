
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';
import Card from '../components/Card';

const PricingCard: React.FC<{ planName: string, price: string, features: string[], popular?: boolean }> = ({ planName, price, features, popular }) => {
    return (
        <Card className={`flex flex-col ${popular ? 'border-2 border-primary' : ''}`}>
            {popular && <span className="bg-primary text-white text-sm font-bold px-3 py-1 rounded-full self-start mb-4">MAIS POPULAR</span>}
            <h3 className="text-2xl font-bold text-gray-800">{planName}</h3>
            <p className="mt-2 text-4xl font-extrabold text-gray-900">{price}<span className="text-lg font-medium text-gray-500">/mês</span></p>
            <p className="mt-4 text-gray-600">Ideal para quem está começando.</p>
            <ul className="mt-8 space-y-4 text-gray-700 flex-grow">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                        <svg className="w-6 h-6 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        {feature}
                    </li>
                ))}
            </ul>
            <div className="mt-8">
                <Button variant={popular ? 'primary' : 'secondary'} className="w-full">Assinar (Placeholder)</Button>
            </div>
        </Card>
    );
}

const PricingPage: React.FC = () => {
    return (
        <div className="bg-gray-50">
            <Header />
            <main className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800">Planos flexíveis para o seu negócio</h1>
                        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Escolha o plano que melhor se adapta ao seu volume de conversas e necessidades.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <PricingCard 
                            planName="Básico"
                            price="R$99"
                            features={['Até 200 conversas/mês', '1 Usuário', 'Agendamento Básico', 'Suporte por E-mail']}
                        />
                         <PricingCard 
                            planName="Pro"
                            price="R$199"
                            features={['Até 1000 conversas/mês', 'Até 5 Usuários', 'Agendamento Avançado', 'Relatórios Detalhados', 'Suporte Prioritário']}
                            popular
                        />
                         <PricingCard 
                            planName="Empresarial"
                            price="Custom"
                            features={['Conversas Ilimitadas', 'Usuários Ilimitados', 'Integrações Customizadas', 'Gerente de Conta Dedicado', 'SLA Garantido']}
                        />
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PricingPage;
