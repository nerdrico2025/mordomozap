import { supabase } from './supabaseClient'
import type { AgentConfig } from '../types'

export const agentService = {
  /**
   * Fetches the agent configuration for a given company.
   * If no config exists, it returns a default configuration object.
   */
  async getAgentConfig(companyId: string): Promise<AgentConfig> {
    try {
      const { data, error } = await supabase
        .from('agent_configs')
        .select('config_json')
        .eq('company_id', companyId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
        throw error
      }

      if (data) {
        return data.config_json as AgentConfig;
      }

      // Return default config if none found
      return {
        greetingMessage: 'Olá! Bem-vindo. Como posso ajudar?',
        fallbackMessage: 'Desculpe, não entendi. Um de nossos atendentes entrará em contato.',
        workingHours: [
          { day: 'Segunda', start: '09:00', end: '18:00', enabled: true },
          { day: 'Terça', start: '09:00', end: '18:00', enabled: true },
          { day: 'Quarta', start: '09:00', end: '18:00', enabled: true },
          { day: 'Quinta', start: '09:00', end: '18:00', enabled: true },
          { day: 'Sexta', start: '09:00', end: '18:00', enabled: true },
          { day: 'Sábado', start: '09:00', end: '12:00', enabled: false },
          { day: 'Domingo', start: '09:00', end: '12:00', enabled: false },
        ],
        faqs: [],
        schedulingRules: {
          slotDuration: 30,
          allowBookingUpTo: 14,
        },
      };

    } catch (error) {
      console.error('Erro ao buscar configuração do agente:', error)
      throw error
    }
  },

  /**
   * Updates or creates (upserts) the agent configuration for a company.
   */
  async updateAgentConfig(companyId: string, config: AgentConfig): Promise<AgentConfig> {
    try {
      const { data, error } = await supabase
        .from('agent_configs')
        .upsert({ 
            company_id: companyId, 
            config_json: config,
            updated_at: new Date().toISOString(),
         }, { onConflict: 'company_id' })
        .select()
        .single()

      if (error) throw error

      return (data as any).config_json as AgentConfig;
    } catch (error) {
      console.error('Erro ao salvar configuração do agente:', error)
      throw error
    }
  }
}
