
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
    return (
        <div className="bg-gray-50">
            <Header />

            <main>
                {/* Hero Section */}
                <section className="bg-white py-20 md:py-32">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 leading-tight">
                            Atendimento Inteligente e Agendamentos no seu WhatsApp.
                        </h1>
                        <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
                            Com o MordomoZAP, você transforma seu WhatsApp em uma máquina de vendas e agendamentos, 24 horas por dia, 7 dias por semana.
                        </p>
                        <div className="mt-10">
                            <Link to="/signup">
                                <Button variant="primary" className="text-lg">Comece o trial de 3 dias</Button>
                            </Link>
                        </div>
                        <p className="mt-4 text-sm text-gray-500">Sem cartão de crédito. Cancele quando quiser.</p>
                    </div>
                </section>
                
                {/* Features Section */}
                <section className="py-20">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Tudo que você precisa em um só lugar</h2>
                            <p className="mt-4 text-gray-600">Funcionalidades pensadas para pequenos negócios que não têm tempo a perder.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                                <h3 className="text-2xl font-bold text-gray-800">Atendente IA 24/7</h3>
                                <p className="mt-4 text-gray-600">Seu assistente virtual responde clientes, tira dúvidas e qualifica leads instantaneamente, a qualquer hora do dia.</p>
                            </div>
                            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                                <h3 className="text-2xl font-bold text-gray-800">Agendamento Automático</h3>
                                <p className="mt-4 text-gray-600">Deixe que a IA encontre o melhor horário e marque reuniões, consultas ou serviços direto na sua agenda.</p>
                            </div>
                            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                                <h3 className="text-2xl font-bold text-gray-800">Gestão Simplificada</h3>
                                <p className="mt-4 text-gray-600">Visualize todas as conversas, agendamentos e métricas em um dashboard simples e intuitivo.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonial Section */}
                 <section className="bg-primary text-white py-20">
                    <div className="container mx-auto px-4 text-center">
                        <p className="text-2xl md:text-3xl font-medium max-w-3xl mx-auto">
                            "Desde que implementamos o MordomoZAP, nosso tempo de resposta caiu 90% e os agendamentos aumentaram 40%. É revolucionário!"
                        </p>
                        <p className="mt-6 font-bold text-lg">Joana Mendes</p>
                        <p className="text-gray-200">Dona de Salão de Beleza</p>
                    </div>
                </section>
                
                {/* CTA Section */}
                <section className="py-20">
                    <div className="container mx-auto px-4 text-center">
                         <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Pronto para automatizar seu negócio?</h2>
                        <p className="mt-4 text-lg text-gray-600">Comece seu teste gratuito de 3 dias agora mesmo.</p>
                        <div className="mt-8">
                            <Link to="/signup">
                                <Button variant="primary" className="text-lg">Começar Agora</Button>
                            </Link>
                        </div>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
};

export default HomePage;
