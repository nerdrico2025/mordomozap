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


export const analyticsService = {
  // Obter insights de intenções
  async getIntentInsights(companyId: string, days: number = 7): Promise<IntentInsight[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('intents_insights')
        .select('*')
        .eq('company_id', companyId)
        .gte('last_seen', startDate.toISOString())
        .order('count', { ascending: false })

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

      const { data, error } = await supabase
        .from('conversations')
        .select('started_at, status')
        .eq('company_id', companyId)
        .gte('started_at', startDate.toISOString())

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
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('company_id', companyId)

      if (convError) throw convError

      const conversationIds = conversations?.map(c => c.id) || []

      if (conversationIds.length === 0) {
        return { total: 0, inbound: 0, outbound: 0 }
      }

      // Buscar mensagens dessas conversas
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('direction')
        .in('conversation_id', conversationIds)
        .gte('timestamp', startDate.toISOString())

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
