import { supabase } from './supabaseClient'
import type { Appointment } from './supabaseClient'

export const appointmentService = {
  // Obter todos os agendamentos da empresa
  async getAppointments(companyId: string, startDate?: string, endDate?: string): Promise<Appointment[]> {
    try {
      let query = supabase
        .from('appointments')
        .select('*')
        .eq('company_id', companyId)
        .order('datetime_start', { ascending: true })

      if (startDate) {
        query = query.gte('datetime_start', startDate)
      }

      if (endDate) {
        query = query.lte('datetime_start', endDate)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao obter agendamentos:', error)
      return []
    }
  },

  // Criar novo agendamento
  async createAppointment(appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment | null> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          ...appointment,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
      return null
    }
  },

  // Atualizar agendamento
  async updateAppointment(appointmentId: string, updates: Partial<Appointment>): Promise<Appointment | null> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', appointmentId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error)
      return null
    }
  },

  // Cancelar agendamento
  async cancelAppointment(appointmentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error)
      return false
    }
  },

  // Completar agendamento
  async completeAppointment(appointmentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao completar agendamento:', error)
      return false
    }
  },

  // Obter agendamentos por telefone
  async getAppointmentsByPhone(companyId: string, phone: string): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('company_id', companyId)
        .eq('phone', phone)
        .order('datetime_start', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error)
      return []
    }
  },

  // Verificar disponibilidade de horário
  async checkAvailability(companyId: string, datetime: string, duration: number = 30): Promise<boolean> {
    try {
      const startTime = new Date(datetime)
      const endTime = new Date(startTime.getTime() + duration * 60000)

      const { data, error } = await supabase
        .from('appointments')
        .select('id')
        .eq('company_id', companyId)
        .eq('status', 'confirmed')
        .gte('datetime_start', startTime.toISOString())
        .lte('datetime_start', endTime.toISOString())

      if (error) throw error
      return !data || data.length === 0
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error)
      return false
    }
  }
}