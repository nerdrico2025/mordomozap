
import React, { useState, useEffect } from 'react';
import { api } from '../services/mockApi';
import { useAuth } from '../hooks/useAuth';
import { Appointment } from '../types';
import Card from '../components/Card';

const CalendarPage: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const { user } = useAuth();
    
    useEffect(() => {
        const fetchAppointments = async () => {
            if (user) {
                const data = await api.getAppointments(user.company_id);
                setAppointments(data);
            }
        };
        fetchAppointments();
    }, [user]);

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
            <div key={day} className="border border-gray-200 p-2 flex flex-col">
                <span className="font-bold">{day}</span>
                <div className="mt-1 space-y-1 overflow-y-auto">
                    {dayAppointments.map(app => (
                        <div key={app.id} onClick={() => setSelectedAppointment(app)} className="bg-primary text-white text-xs p-1 rounded cursor-pointer hover:bg-green-700">
                           {app.customer_name}
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
                    <button onClick={() => changeMonth(-1)} className="px-4 py-2 bg-gray-200 rounded">&lt;</button>
                    <h2 className="text-xl font-bold">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={() => changeMonth(1)} className="px-4 py-2 bg-gray-200 rounded">&gt;</button>
                </div>
                <div className="grid grid-cols-7 grid-rows-5 gap-0 h-[60vh]">
                     {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="text-center font-bold p-2 border-b-2">{day}</div>
                    ))}
                    {calendarDays}
                </div>
            </Card>

            {selectedAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center" onClick={() => setSelectedAppointment(null)}>
                    <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-4">Detalhes do Agendamento</h2>
                        <p><strong>Cliente:</strong> {selectedAppointment.customer_name}</p>
                        <p><strong>Telefone:</strong> {selectedAppointment.phone}</p>
                        <p><strong>Data e Hora:</strong> {new Date(selectedAppointment.datetime_start).toLocaleString('pt-BR')}</p>
                        <p><strong>Status:</strong> {selectedAppointment.status}</p>
                        <p><strong>Notas:</strong> {selectedAppointment.notes}</p>
                        <button onClick={() => setSelectedAppointment(null)} className="mt-6 px-4 py-2 bg-gray-200 rounded">Fechar</button>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default CalendarPage;
