import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import WhatsAppConnection from '../../components/WhatsAppConnection';
import TestWhatsappButton from '../../components/TestWhatsappButton';

const IntegrationTab = () => {
    const { user } = useAuth();
    const [testNumber, setTestNumber] = useState('');

    useEffect(() => {
        if (user?.phone) {
            setTestNumber(user.phone);
        }
    }, [user]);

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Status da Conexão</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Gerencie a conexão do seu número de WhatsApp com a plataforma. Clique em "Conectar" para gerar um QR Code.
                </p>
                <WhatsAppConnection />
            </div>

            <div className="border-t pt-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Testar Envio</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Envie uma mensagem para um número de WhatsApp para verificar se a integração está funcionando.
                </p>
                <div className="flex items-center space-x-2 max-w-lg">
                    <input
                        type="tel"
                        placeholder="Número com DDD (ex: 47999998888)"
                        value={testNumber}
                        onChange={(e) => setTestNumber(e.target.value)}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                    <TestWhatsappButton
                        to={testNumber}
                        message={`Olá! 👋 Esta é uma mensagem de teste do MordomoZAP enviada para ${testNumber}.`}
                    />
                </div>
            </div>
        </div>
    );
};

export default IntegrationTab;