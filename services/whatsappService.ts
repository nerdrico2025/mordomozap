import axios from 'axios';
import { supabaseAdmin } from './supabaseAdminClient';
import type { WhatsAppIntegration } from '../types';

// The frontend service now communicates with our OWN backend proxy, not UAZAPI.
// FIX: Construct a full, absolute URL to prevent "Invalid URL" errors in sandboxed environments.
const PROXY_BASE_URL = `${window.location.protocol}//${window.location.host}`;
const PROXY_ENDPOINT = `${PROXY_BASE_URL}/api/uaz`;


export const whatsappService = {
  async getIntegration(companyId: string): Promise<WhatsAppIntegration | null> {
    const { data, error } = await supabaseAdmin.from('whatsapp_integrations').select('*').eq('company_id', companyId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getIntegrationStatus(companyId: string): Promise<WhatsAppIntegration | null> {
    try {
      const { data: proxyResponse } = await axios.post(`${PROXY_ENDPOINT}/status`, { companyId });
      const isConnected = !!proxyResponse.connected;
      const targetStatus = isConnected ? 'connected' : 'disconnected';
      const { data: currentDbState } = await this.getIntegration(companyId);

      if (currentDbState?.status !== targetStatus) {
        const { data: updated } = await supabaseAdmin.from('whatsapp_integrations').update({ 
            status: targetStatus, 
            qr_code_base64: null,
            connected_at: isConnected ? new Date().toISOString() : null,
        }).eq('company_id', companyId).select().single();
        return updated;
      }
      return currentDbState;
    } catch (err: any) {
      console.warn('Falha na verificação de status via proxy, tratando como desconectado.', err);
      const { data: updated } = await supabaseAdmin.from('whatsapp_integrations').update({ status: 'disconnected', api_key: null, qr_code_base64: null }).eq('company_id', companyId).select().single();
      return updated;
    }
  },

  async startConnection(companyId: string): Promise<WhatsAppIntegration> {
    try {
      const { data: proxyResponse } = await axios.post(`${PROXY_ENDPOINT}/start-connection`, { companyId });
      
      const { instanceName, apiKey, qrCodeBase64 } = proxyResponse;
      if (!apiKey || !instanceName || !qrCodeBase64) {
        throw new Error('Resposta inválida do servidor de proxy.');
      }
      
      const { data: upserted, error } = await supabaseAdmin.from('whatsapp_integrations').upsert({
          company_id: companyId,
          provider: 'uazapi',
          instance_name: instanceName,
          api_key: apiKey,
          status: 'pending',
          qr_code_base64: qrCodeBase64,
      }, { onConflict: 'company_id' }).select().single();

      if (error) throw error;
      return upserted;
    } catch (err: any) {
      console.error('Error starting connection via proxy:', err.response?.data ?? err.message);
      const msg = err?.response?.data?.error;
      if (msg?.includes('timeout')) throw new Error('Tempo esgotado ao iniciar a conexão. Verifique sua rede e tente novamente.');
      if (msg?.includes('Invalid token')) throw new Error('Credenciais inválidas para conexão. Por favor, recomece a integração.');
      throw new Error('A comunicação com o servidor para iniciar a instância falhou.');
    }
  },

  async reconnect(companyId: string): Promise<WhatsAppIntegration> {
    try {
      const { data: proxyResponse } = await axios.post(`${PROXY_ENDPOINT}/reconnect`, { companyId });
      const { qrCodeBase64 } = proxyResponse;
      if (!qrCodeBase64) throw new Error('QR Code não retornado pelo servidor.');

      const { data: updated, error } = await supabaseAdmin.from('whatsapp_integrations').update({ 
        status: 'pending', 
        qr_code_base64: qrCodeBase64 
      }).eq('company_id', companyId).select().single();
      if (error) throw error;
      return updated;
    } catch (err: any) {
      console.error('Error starting connection via proxy:', err.response?.data ?? err.message);
      const msg = err?.response?.data?.error;
      if (msg?.includes('Invalid token')) {
        await supabaseAdmin.from('whatsapp_integrations').update({ status: 'disconnected', api_key: null, qr_code_base64: null }).eq('company_id', companyId);
        throw new Error('Token inválido. Foi necessário desconectar. Inicie uma nova conexão.');
      }
      if (msg?.includes('timeout')) throw new Error('Tempo esgotado ao tentar reconectar. Verifique sua rede.');
      throw new Error('Falha ao tentar reconectar.');
    }
  },

  async ensureConnected(companyId: string): Promise<WhatsAppIntegration | null> {
    const current = await this.getIntegrationStatus(companyId);
    if (!current || current.status === 'connected') return current;
    try {
      return await this.reconnect(companyId);
    } catch {
      return current;
    }
  },

  async disconnect(companyId: string): Promise<void> {
    try {
      await axios.post(`${PROXY_ENDPOINT}/disconnect`, { companyId });
    } catch (err: any) {
       console.warn('Proxy disconnect failed, but proceeding to update DB state.');
    }
    await supabaseAdmin.from('whatsapp_integrations').update({ status: 'disconnected', qr_code_base64: null, api_key: null, connected_at: null }).eq('company_id', companyId);
  },

  async sendTestMessage(companyId: string, to: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
        await axios.post(`${PROXY_ENDPOINT}/send-test`, { companyId, to, message });
        return { success: true };
    } catch (err: any) {
        console.error('Error sending message via proxy', err.response?.data);
        return { success: false, error: err.response?.data?.error || 'Falha ao enviar mensagem.' };
    }
  }
};