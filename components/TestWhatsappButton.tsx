// src/components/TestWhatsappButton.tsx
import React, { useState } from 'react';
import Button from './Button';
import { useFeedback } from '../hooks/useFeedback';
import { useAuth } from '../hooks/useAuth';
import { whatsappService } from '../services/whatsappService';

export default function TestWhatsappButton({ to, message }: { to: string; message: string }) {
  const [loading, setLoading] = useState(false);
  const fb = useFeedback();
  const { user } = useAuth();

  const handleClick = async () => {
    if (!user?.company_id) {
      fb.error('Empresa não encontrada.');
      return;
    }
    setLoading(true);
    try {
      const result = await whatsappService.sendTestMessage(user.company_id, to, message);
      if (result.success) {
        fb.success('Mensagem de teste enviada com sucesso.');
      } else {
        throw new Error(result.error || 'Falha ao enviar');
      }
    } catch (err: any) {
      console.error(err);
      fb.error(err.message || 'Erro ao enviar mensagem de teste.');
    } finally {
      setLoading(false);
    }
  };

  return <Button onClick={handleClick} loading={loading} disabled={!to || to.length < 8}>Enviar</Button>;
}
