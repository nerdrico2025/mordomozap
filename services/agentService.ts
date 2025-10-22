import { supabaseAdmin } from './supabaseAdminClient';
import type { AgentConfig } from '../types'

export const agentService = {
  async getAgentConfig(companyId: string): Promise<AgentConfig> {
    try {
      // FIX: Removed .single() to prevent a 406 "Not Acceptable" error when a new user
      // doesn't have a config row yet. The query now safely returns an empty array.
      const { data, error } = await supabaseAdmin
        .from('agent_configs')
        .select('config_json')
        .eq('company_id', companyId)
        .limit(1);
      
      if (error) throw error;

      // Handle the case where no config exists for the company.
      const configFromServer = data && data.length > 0 ? data[0].config_json : {};
      
      const defaultConfig = this.getDefaultConfig();
      // Deep merge defaults with server config, ensuring nested objects are also merged safely.
      return { 
        ...defaultConfig, 
        ...configFromServer, 
        schedulingRules: {
            ...defaultConfig.schedulingRules, 
            ...(configFromServer.schedulingRules || {})
        } 
      };
    } catch (error) {
      console.error('Erro ao buscar configuração do agente:', error);
      return this.getDefaultConfig();
    }
  },

  async updateAgentConfig(companyId: string, config: AgentConfig): Promise<AgentConfig> {
    try {
      const { data, error } = await supabaseAdmin
        .from('agent_configs')
        .upsert({ company_id: companyId, config_json: config }, { onConflict: 'company_id' })
        .select()
        .single();
      
      if (error) throw error;
      return (data as any).config_json as AgentConfig;
    } catch (error) {
      console.error('Erro ao salvar configuração do agente:', error);
      throw error;
    }
  },
  
  getDefaultConfig(): AgentConfig {
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
      products: [],
      professionals: [],
      schedulingRules: {
        slotDuration: 30,
        allowBookingUpTo: 14,
      },
    };
  }
}