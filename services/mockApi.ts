
import { User, UserRole, Company, DashboardData, SuperAdminData, Conversation, Appointment, AgentConfig } from '../types';

// --- MOCK DATABASE ---

const mockUsers: User[] = [
  { id: 'user-1', name: 'Usuário Teste', email: 'user@test.com', phone: '11999998888', role: UserRole.USER, company_id: 'company-1', created_at: new Date().toISOString() },
  { id: 'user-2', name: 'Super Admin', email: 'admin@test.com', phone: '11988887777', role: UserRole.SUPER_ADMIN, company_id: 'company-2', created_at: new Date().toISOString() },
];

const mockCompanies: Company[] = [
  { id: 'company-1', name: 'Empresa Teste', timezone: 'America/Sao_Paulo', plan: 'trial', trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'trialing', created_at: new Date().toISOString() },
  { id: 'company-2', name: 'Admin Corp', timezone: 'America/Sao_Paulo', plan: 'pro', trial_ends_at: null, status: 'active', created_at: new Date().toISOString() },
];

const mockConversations: Conversation[] = [
    { id: 'conv-1', customer_name: 'Ana Silva', customer_phone: '11912345678', started_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), ended_at: null, status: 'open' },
    { id: 'conv-2', customer_name: 'Bruno Costa', customer_phone: '11923456789', started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), ended_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), status: 'closed' },
    { id: 'conv-3', customer_name: 'Carlos Dias', customer_phone: '11934567890', started_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), ended_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), status: 'closed' },
    { id: 'conv-4', customer_name: 'Daniela Souza', customer_phone: '11945678901', started_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), ended_at: null, status: 'agent_needed' },
    { id: 'conv-5', customer_name: 'Eduardo Lima', customer_phone: '11956789012', started_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), ended_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), status: 'closed' },
];

const mockAppointments: Appointment[] = [
    { id: 'appt-1', company_id: 'company-1', customer_name: 'Fernanda Alves', phone: '11967890123', datetime_start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), datetime_end: new Date(Date.now() + (2 * 24 * 60 * 60 * 1000) + (30 * 60 * 1000)).toISOString(), status: 'confirmed', notes: 'Agendamento de demonstração.', conversation_id: 'conv-1' },
    { id: 'appt-2', company_id: 'company-1', customer_name: 'Gustavo Borges', phone: '11978901234', datetime_start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), datetime_end: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000) + (60 * 60 * 1000)).toISOString(), status: 'confirmed', notes: 'Consulta inicial.', conversation_id: 'conv-3' },
    { id: 'appt-3', company_id: 'company-1', customer_name: 'Helena Correa', phone: '11989012345', datetime_start: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), datetime_end: new Date(Date.now() + (10 * 24 * 60 * 60 * 1000) + (30 * 60 * 1000)).toISOString(), status: 'confirmed', notes: 'Reunião de acompanhamento.', conversation_id: 'conv-5' },
];

let mockAgentConfig: AgentConfig = {
    greetingMessage: 'Olá! Bem-vindo à Empresa Teste. Como posso ajudar?',
    fallbackMessage: 'Desculpe, não entendi. Um de nossos atendentes entrará em contato em breve.',
    workingHours: [
        { day: 'Segunda', start: '09:00', end: '18:00', enabled: true },
        // ... other days
    ],
    faqs: [
        { question: 'Qual o preço?', answer: 'Nossos planos começam em R$99/mês.' }
    ],
    schedulingRules: {
        slotDuration: 30, // in minutes
        allowBookingUpTo: 14 // in days
    }
};

// --- API SIMULATION ---

const simulateDelay = <T,>(data: T): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(data), 500));

export const api = {
  login: async (email: string, pass: string): Promise<User | null> => {
    console.log(`Attempting login for ${email}`); // pass is unused in mock
    const user = mockUsers.find(u => u.email === email);
    return simulateDelay(user || null);
  },

  signup: async (name: string, email: string, phone: string, companyName: string): Promise<User | null> => {
      console.log(`Signing up ${name} for ${companyName}`);
      const newCompanyId = `company-${Date.now()}`;
      const newUserId = `user-${Date.now()}`;
      
      const newCompany: Company = { id: newCompanyId, name: companyName, timezone: 'America/Sao_Paulo', plan: 'trial', trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'trialing', created_at: new Date().toISOString() };
      const newUser: User = { id: newUserId, name, email, phone, role: UserRole.USER, company_id: newCompanyId, created_at: new Date().toISOString() };

      mockCompanies.push(newCompany);
      mockUsers.push(newUser);
      
      return simulateDelay(newUser);
  },

  getDashboardData: async (companyId: string): Promise<DashboardData> => {
    console.log(`Fetching dashboard data for company ${companyId}`);
    const data: DashboardData = {
        kpis: {
            conversations: 178,
            avgResponseTime: '32s',
            topObjections: [{name: 'preço', count: 23}, {name: 'sem estoque', count: 15}, {name: 'prazo', count: 11}],
            topArguments: [{name: 'desconto', count: 45}, {name: 'frete grátis', count: 31}, {name: 'garantia', count: 19}],
        },
        recentConversations: mockConversations.slice(0, 5),
    };
    return simulateDelay(data);
  },

  getConversations: async (companyId: string, period: string): Promise<Conversation[]> => {
    console.log(`Fetching conversations for company ${companyId} for period ${period}`);
    return simulateDelay(mockConversations);
  },
  
  getAppointments: async (companyId: string): Promise<Appointment[]> => {
    console.log(`Fetching appointments for company ${companyId}`);
    return simulateDelay(mockAppointments);
  },

  getAgentConfig: async (companyId: string): Promise<AgentConfig> => {
    console.log(`Fetching agent config for company ${companyId}`);
    return simulateDelay(mockAgentConfig);
  },
  
  saveAgentConfig: async (companyId: string, config: AgentConfig): Promise<AgentConfig> => {
    console.log(`Saving agent config for company ${companyId}`, config);
    mockAgentConfig = config;
    return simulateDelay(mockAgentConfig);
  },
  
  getSuperAdminData: async (): Promise<SuperAdminData> => {
    console.log("Fetching super admin data");
    const data: SuperAdminData = {
        accounts: mockCompanies.map(c => ({
            ...c,
            user_email: mockUsers.find(u => u.company_id === c.id)?.email || 'N/A'
        }))
    };
    return simulateDelay(data);
  },

  resetTrial: async (companyId: string): Promise<{success: boolean}> => {
    console.log(`Resetting trial for company ${companyId}`);
    const company = mockCompanies.find(c => c.id === companyId);
    if(company) {
        company.trial_ends_at = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        company.status = 'trialing';
    }
    return simulateDelay({success: !!company});
  }
};
