import { supabase } from './supabaseClient'
// FIX: Changed from 'import type' to a direct import to use RealtimeChannel as a value.
import { RealtimeChannel } from '@supabase/supabase-js'

export interface IntentInsight {
    id: string;
    company_id: string;
    intent: string;
    count: number;
    last_seen: string;
    examples: any; // JSON
}

// Adiciona utilitário de timeout para evitar travas em consultas
const withTimeout = async <T>(promise: Promise<T>, ms: number = 10000, label?: string): Promise<T> => {
  let timer: any;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      console.error(`[Analytics Timeout] ${label || 'operation'} exceeded ${ms}ms`);
      reject(new Error('timeout'));
    }, ms);
  });
  try {
    const result: any = await Promise.race([promise, timeout]);
    return result as T;
  } finally {
    clearTimeout(timer);
  }
};

export const analyticsService = {
  // Obter insights de intenções
  async getIntentInsights(companyId: string, days: number = 7): Promise<IntentInsight[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      console.time('analytics:getIntentInsights');
      const p1 = (async () => {
        return await supabase
          .from('intents_insights')
          .select('*')
          .eq('company_id', companyId)
          .gte('last_seen', startDate.toISOString())
          .order('count', { ascending: false });
      })();
      const { data, error } = await withTimeout(p1, 10000, 'getIntentInsights');
      console.timeEnd('analytics:getIntentInsights');

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao obter insights:', error)
      return []
    }
  },

  /**
   * MOCK: Calculates the average response time for AI replies.
   * In a real application, this would involve a more complex query or a dedicated table.
   */
  async getAvgResponseTime(companyId: string, days: number = 30): Promise<string> {
    console.log(`Fetching avg response time for company ${companyId} over ${days} days.`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    // In a real scenario, you would calculate this. For now, we return a mock value.
    const seconds = Math.floor(Math.random() * (55 - 25 + 1)) + 25; // Random time between 25s and 55s
    return `${seconds}s`;
  },

  // Obter métricas de conversas por período
  async getConversationMetrics(companyId: string, days: number = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      console.time('analytics:getConversationMetrics');
      const p2 = (async () => {
        return await supabase
          .from('conversations')
          .select('started_at, status')
          .eq('company_id', companyId)
          .gte('started_at', startDate.toISOString());
      })();
      const { data, error } = await withTimeout(p2, 10000, 'getConversationMetrics');
      console.timeEnd('analytics:getConversationMetrics');

      if (error) throw error

      // Agrupar por dia
      const metrics: Record<string, { date: string; total: number; open: number; closed: number }> = {}
    
      data?.forEach(conversation => {
        const date = new Date(conversation.started_at).toISOString().split('T')[0]
      
        if (!metrics[date]) {
          metrics[date] = { date, total: 0, open: 0, closed: 0 }
        }
      
        metrics[date].total++
        if (conversation.status === 'open') metrics[date].open++
        if (conversation.status === 'closed') metrics[date].closed++
      })

      return Object.values(metrics).sort((a, b) => a.date.localeCompare(b.date))
    } catch (error) {
      console.error('Erro ao obter métricas:', error)
      return []
    }
  },

  // Obter métricas de mensagens
  async getMessageMetrics(companyId: string, days: number = 7) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Buscar conversas da empresa
      console.time('analytics:getMessageConvIds');
      const p3 = (async () => {
        return await supabase
          .from('conversations')
          .select('id')
          .eq('company_id', companyId);
      })();
      const { data: conversations, error: convError } = await withTimeout(p3, 10000, 'getMessageConvIds');
      console.timeEnd('analytics:getMessageConvIds');

      if (convError) throw convError

      const conversationIds = conversations?.map(c => c.id) || []

      if (conversationIds.length === 0) {
        return { total: 0, inbound: 0, outbound: 0 }
      }

      // Buscar mensagens dessas conversas
      console.time('analytics:getMessageList');
      const p4 = (async () => {
        return await supabase
          .from('messages')
          .select('direction')
          .in('conversation_id', conversationIds)
          .gte('timestamp', startDate.toISOString());
      })();
      const { data: messages, error: msgError } = await withTimeout(p4, 10000, 'getMessageMetrics');
      console.timeEnd('analytics:getMessageList');

      if (msgError) throw msgError

      const metrics = {
        total: messages?.length || 0,
        inbound: messages?.filter(m => m.direction === 'in').length || 0,
        outbound: messages?.filter(m => m.direction === 'out').length || 0
      }

      return metrics
    // FIX: Corrected malformed try-catch block by adding curly braces.
    } catch (error) {
      console.error('Erro ao obter métricas de mensagens:', error)
      return { total: 0, inbound: 0, outbound: 0 }
    }
  },

  // FIX: Moved subscribeToInsights into the exported analyticsService object.
  // Escutar atualizações em tempo real
  subscribeToInsights(companyId: string, callback: () => void) {
    const subscription = supabase
      .channel(`analytics-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'intents_insights',
          filter: `company_id=eq.${companyId}`
        },
        () => {
          console.log('Novos insights disponíveis')
          callback()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'intents_insights',
          filter: `company_id=eq.${companyId}`
        },
        () => {
          console.log('Insights atualizados')
          callback()
        }
      )
      .subscribe()

    return subscription
  },

  // FIX: Moved unsubscribe into the exported analyticsService object.
  // Cancelar subscrição
  unsubscribe(subscription: RealtimeChannel | null) {
    if (subscription) {
      supabase.removeChannel(subscription)
    }
  }
}
