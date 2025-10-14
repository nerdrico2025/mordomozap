import { supabase } from './supabaseClient'
import type { WhatsAppIntegration } from './supabaseClient'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Usando a mesma URL fixa do n8n que está no authService para este ambiente.
const N8N_WEBHOOK_BASE = 'https://ferramentas-n8n.u7pe19.easypanel.host/webhook-test/cc912118-8afe-4a22-a78e-11425216d2d1';

export const whatsappService = {
  // Iniciar processo de onboarding (gerar QR Code)
  async startOnboarding(companyId: string) {
    try {
      const response = await fetch(`${N8N_WEBHOOK_BASE}/onboarding/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyId }),
      })

      if (!response.ok) {
        throw new Error('Erro ao iniciar onboarding')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro no onboarding:', error)
      throw error
    }
  },

  // Obter status atual da integração WhatsApp
  async getIntegrationStatus(companyId: string): Promise<WhatsAppIntegration | null> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_integrations')
        .select('*')
        .eq('company_id', companyId)
        .single()

      if (error) {
        // Se não existir integração, retornar null
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }
    
      return data
    } catch (error) {
      console.error('Erro ao obter status:', error)
      return null
    }
  },

  // Escutar atualizações do QR Code em tempo real
  subscribeToQRCode(companyId: string, callback: (data: WhatsAppIntegration) => void) {
    const channel = supabase
      .channel(`whatsapp-integration-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT e UPDATE
          schema: 'public',
          table: 'whatsapp_integrations',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          console.log('Mudança na Integração WhatsApp:', payload)
          callback(payload.new as WhatsAppIntegration)
        }
      )
      .subscribe()

    return channel
  },

  // Desconectar WhatsApp
  async disconnect(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('whatsapp_integrations')
        .update({ 
          status: 'disconnected',
          qr_code_base64: null,
          connected_at: null
        })
        .eq('company_id', companyId)
        .select()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao desconectar:', error)
      throw error
    }
  },

  // Reconectar WhatsApp (gerar novo QR Code)
  async reconnect(companyId: string) {
    try {
      // Primeiro desconectar
      await this.disconnect(companyId)
    
      // Depois iniciar novo onboarding
      return await this.startOnboarding(companyId)
    } catch (error) {
      console.error('Erro ao reconectar:', error)
      throw error
    }
  },

  // Verificar se WhatsApp está conectado
  async isConnected(companyId: string): Promise<boolean> {
    try {
      const integration = await this.getIntegrationStatus(companyId)
      return integration?.status === 'connected'
    } catch (error) {
      console.error('Erro ao verificar conexão:', error)
      return false
    }
  },

  // Cancelar subscrição (cleanup)
  unsubscribe(subscription: RealtimeChannel | null) {
    if (subscription) {
      supabase.removeChannel(subscription)
    }
  }
}