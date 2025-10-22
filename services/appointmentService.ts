import { supabase } from './supabaseClient'
// FIX: Changed import path for Appointment type from supabaseClient to the centralized types file.
import type { Appointment } from '../types'
import { agentService } from './agentService';

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

  // Verificar disponibilidade de horário específico
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
  },

  // Nova função para encontrar horários disponíveis em um dia
  async findAvailableSlots(companyId: string, date: string): Promise<string[]> {
    try {
      console.log(`Buscando horários para ${companyId} na data ${date}`);
      // Assegura que a data seja interpretada em UTC para consistência
      const targetDate = new Date(`${date}T00:00:00Z`);
      const dayOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][targetDate.getUTCDay()];

      const config = await agentService.getAgentConfig(companyId);
      const company = (await supabase.from('companies').select('name').eq('id', companyId).single()).data;
      const workingHours = config.workingHours.find(wh => wh.day === dayOfWeek);

      if (!workingHours || !workingHours.enabled) {
        return []; // Dia não trabalhado
      }

      const dayStartISO = targetDate.toISOString();
      const dayEndISO = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
      const appointments = await this.getAppointments(companyId, dayStartISO, dayEndISO);
      
      const bookedSlots = new Set(appointments
        .filter(a => a.status === 'confirmed')
        .map(a => new Date(a.datetime_start).toISOString()));

      const availableSlots: string[] = [];
      const { slotDuration } = config.schedulingRules;

      const [startHour, startMinute] = workingHours.start.split(':').map(Number);
      const [endHour, endMinute] = workingHours.end.split(':').map(Number);

      const slot = new Date(targetDate);
      slot.setUTCHours(startHour, startMinute, 0, 0);

      const endSlot = new Date(targetDate);
      endSlot.setUTCHours(endHour, endMinute, 0, 0);

      while (slot.getTime() < endSlot.getTime()) {
        const slotISO = slot.toISOString();
        if (!bookedSlots.has(slotISO)) {
            // Retorna a hora no formato HH:MM
            availableSlots.push(slot.toISOString().substr(11, 5));
        }
        slot.setUTCMinutes(slot.getUTCMinutes() + slotDuration);
      }
      
      return availableSlots;
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      return [];
    }
  },
}
