import React, { useState, useEffect } from 'react';
import { appointmentService } from '../services/appointmentService';
import { useAuth } from '../hooks/useAuth';
import type { Appointment } from '../services/supabaseClient';
import Card from '../components/Card';
import Button from '../components/Button';

const CalendarPage: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    
    const fetchAppointments = async () => {
        if (user) {
            setLoading(true);
            const data = await appointmentService.getAppointments(user.company_id);
            setAppointments(data);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [user, currentDate]); // Refetch when month changes

    const handleCancelAppointment = async (id: string) => {
        const confirmed = window.confirm("Tem certeza que deseja cancelar este agendamento?");
        if (confirmed) {
            await appointmentService.cancelAppointment(id);
            setSelectedAppointment(null);
            fetchAppointments(); // Refresh list
        }
    };

    const handleCompleteAppointment = async (id: string) => {
        await appointmentService.completeAppointment(id);
        setSelectedAppointment(null);
        fetchAppointments(); // Refresh list
    };

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = endOfMonth.getDate();
    const startDayOfWeek = startOfMonth.getDay(); // 0 = Sunday, 1 = Monday

    const calendarDays = [];
    for (let i = 0; i < startDayOfWeek; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="border border-gray-200"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayAppointments = appointments.filter(a => new Date(a.datetime_start).toDateString() === date.toDateString());
        
        calendarDays.push(
            <div key={day} className="border border-gray-200 p-2 flex flex-col min-h-[120px]">
                <span className="font-bold">{day}</span>
                <div className="mt-1 space-y-1 overflow-y-auto">
                    {dayAppointments.map(app => (
                        <div key={app.id} onClick={() => setSelectedAppointment(app)} className={`text-white text-xs p-1 rounded cursor-pointer hover:opacity-80 ${
                            app.status === 'confirmed' ? 'bg-primary' :
                            app.status === 'completed' ? 'bg-gray-500' : 'bg-red-500 line-through'
                        }`}>
                           {new Date(app.datetime_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {app.customer_name}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    }
    
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Calendário de Agendamentos</h1>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <Button onClick={() => changeMonth(-1)} variant="secondary">&lt; Anterior</Button>
                    <h2 className="text-xl font-bold">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
                    <Button onClick={() => changeMonth(1)} variant="secondary">Próximo &gt;</Button>
                </div>
                <div className="grid grid-cols-7">
                     {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(day => (
                        <div key={day} className="text-center font-bold p-2 border-b-2">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 grid-rows-5 gap-0">
                    {calendarDays}
                </div>
            </Card>

            {selectedAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={() => setSelectedAppointment(null)}>
                    <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-4">Detalhes do Agendamento</h2>
                        <div className="space-y-2 text-gray-700">
                            <p><strong>Cliente:</strong> {selectedAppointment.customer_name}</p>
                            <p><strong>Telefone:</strong> {selectedAppointment.phone}</p>
                            <p><strong>Data e Hora:</strong> {new Date(selectedAppointment.datetime_start).toLocaleString('pt-BR')}</p>
                            <p><strong>Status:</strong> {selectedAppointment.status}</p>
                            <p><strong>Notas:</strong> {selectedAppointment.notes || 'Nenhuma'}</p>
                        </div>
                        <div className="mt-6 flex justify-between items-center">
                            <Button variant="secondary" onClick={() => setSelectedAppointment(null)}>Fechar</Button>
                            <div className="space-x-2">
                                {selectedAppointment.status === 'confirmed' && (
                                    <>
                                        <Button variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-200" onClick={() => handleCancelAppointment(selectedAppointment.id)}>Cancelar</Button>
                                        <Button variant="primary" onClick={() => handleCompleteAppointment(selectedAppointment.id)}>Concluído</Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default CalendarPage;