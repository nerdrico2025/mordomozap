# **PRD MordomoZAP**

### **1\. Objetivo do Aplicativo**

O **MordomoZAP** é uma plataforma **SaaS (Software as a Service)** projetada para **pequenos e médios negócios**. Seu objetivo principal é automatizar o atendimento ao cliente e o agendamento de serviços através do WhatsApp.

A proposta de valor é clara: oferecer um "mordomo" virtual que funciona 24/7, respondendo a perguntas frequentes, qualificando leads, vendendo produtos/serviços e marcando horários na agenda, tudo isso de forma inteligente e integrada ao canal de comunicação mais popular do Brasil. O público-alvo são negócios que dependem de agendamentos, como salões de beleza, barbearias, clínicas, estúdios, etc.

### **2\. Funcionalidades Já Implementadas**

A aplicação já possui um conjunto robusto de funcionalidades que cobrem todo o ciclo de vida do cliente:

* **Gestão de Contas de Usuário:**  
  * Cadastro (SignUpPage): Coleta de dados do usuário e da empresa.  
  * Login/Logout (LoginPage, useAuth): Autenticação segura via Supabase.  
  * Fluxo de Autenticação: O sistema gerencia o estado do usuário e protege as rotas privadas.  
*   
* **Onboarding Guiado (**  
  * Um assistente de configuração multi-etapas que guia o novo usuário na configuração inicial do seu negócio e do agente de IA.  
  * Coleta de informações como: ramo do negócio, mensagem de saudação, cadastro de produtos/serviços, e configuração de agendamento (profissionais e horários).  
  * Integração com o WhatsApp através da leitura de um QR Code.  
*   
* **Dashboard Principal (**  
  * Visão geral do desempenho do agente de IA com KPIs (Indicadores Chave de Performance).  
  * Métricas como número de conversas, tempo médio de resposta e principais intenções dos clientes.  
  * Gráfico de volume de conversas ao longo do tempo.  
  * Lista de conversas recentes para acesso rápido.  
*   
* **Gestão de Conversas (**  
  * Uma caixa de entrada centralizada com a lista de todas as conversas.  
  * Tela de chat individual onde o dono do negócio pode visualizar a interação entre o cliente e a IA, e **intervir na conversa** a qualquer momento.  
  * **Suporte Multimodal:** O usuário pode enviar texto e arquivos (imagens/vídeos) no chat.  
  * **Resposta da IA em tempo real (Streaming):** A resposta do Gemini é exibida palavra por palavra, melhorando a experiência do usuário.  
*   
* **Calendário e Agendamentos (**  
  * Uma interface de calendário visual para ver todos os agendamentos confirmados, concluídos ou cancelados.  
  * O usuário pode visualizar detalhes de cada agendamento e gerenciar seu status.  
*   
* **Configurações do Agente (**  
  * Um painel completo e modular (dividido em abas) para configurar detalhadamente o comportamento do "mordomo".  
  * **Integração WhatsApp:** Gerenciar a conexão, desconectar e testar o envio de mensagens.  
  * **Geral:** Alterar mensagens de saudação e de fallback.  
  * **Produtos/Serviços:** Cadastrar os serviços oferecidos, com preço e duração.  
  * **Profissionais:** Cadastrar os profissionais e associar os serviços que cada um realiza.  
  * **Horários:** Definir os horários de funcionamento da empresa.  
  * **Regras de Agendamento:** Configurar a duração padrão dos atendimentos e a antecedência máxima para agendamentos.  
  * **FAQs:** Criar uma base de conhecimento para o agente responder perguntas frequentes.  
*   
* **Painel Super Admin (**  
  * Uma área restrita para administradores da plataforma.  
  * Permite visualizar todas as contas de clientes, seus planos, status e gerenciar seus períodos de trial.  
* 

### **3\. PRD (Documento de Requisitos de Produto) \- Inferido**

Embora não haja um arquivo PRD formal, podemos inferir seus principais pontos com base na estrutura do projeto:

* **Visão do Produto:** Tornar-se a ferramenta líder de automação de WhatsApp para pequenos negócios no Brasil, combinando facilidade de uso com o poder da IA generativa.  
* **Público-Alvo:** Prestadores de serviço e pequenos varejistas (salões de beleza, clínicas, barbearias, petshops, etc.) que usam o WhatsApp como principal canal de vendas e agendamento.  
* **Principais Épicos e Histórias de Usuário:**  
  1. **Como dono de um negócio, eu quero configurar meu assistente de forma rápida e fácil,** para que eu possa começar a automatizar meu atendimento sem precisar de conhecimento técnico. (Atendido pelo OnboardingPage).  
  2. **Como dono de um negócio, eu quero que a IA agende serviços para meus clientes automaticamente,** para que eu não perca tempo gerenciando minha agenda manualmente. (Atendido pelo agentService e appointmentService).  
  3. **Como dono de um negócio, eu quero poder intervir em uma conversa quando necessário,** para garantir que o cliente seja bem atendido em situações complexas. (Atendido pelo ChatPage).  
  4. **Como dono de um negócio, eu quero ter uma visão clara de como meu atendimento está performando,** para tomar decisões melhores sobre meu negócio. (Atendido pelo DashboardPage).  
  5. **Como administrador do MordomoZAP, eu quero gerenciar as contas dos meus clientes,** para poder oferecer suporte e controlar os acessos. (Atendido pelo SuperAdminPage).  
* 

### **4\. Questões e Arquitetura Técnica**

* **Frontend:**  
  * **Stack:** React com TypeScript, utilizando Hooks para lógica e estado.  
  * **Estilização:** Tailwind CSS, configurado diretamente no index.html para prototipagem rápida.  
  * **Roteamento:** react-router-dom para a navegação entre páginas.  
  * **Gerenciamento de Estado:** React Context API para estados globais como autenticação (useAuth) e feedback ao usuário (useFeedback com Toasts).  
  * **Arquitetura:** A estrutura é bem organizada em pages, components, services e hooks, promovendo boa modularidade.  
*   
* **Backend e Serviços (BaaS \- Backend as a Service):**  
  * **Banco de Dados e Autenticação:** **Supabase** é o núcleo da aplicação, gerenciando usuários, perfis, conversas, agendamentos e configurações.  
  * **Inteligência Artificial:** A integração com a **API do Google Gemini** (@google/genai) é feita no chatService para gerar as respostas do assistente, incluindo a funcionalidade de streaming.  
  * **Integração com WhatsApp:** Realizada através de um serviço de terceiros chamado **UAZAPI**.  
*   
* **Arquitetura de Comunicação:**  
  * **Proxy Server (** A aplicação inclui um pequeno servidor **Express.js** que atua como um proxy seguro entre o frontend e a UAZAPI. Isso é uma excelente prática de segurança, pois evita expor tokens de API sensíveis (como o admintoken da UAZAPI) no lado do cliente.  
  * **Webhooks (** O processo de onboarding envia os dados de configuração para um webhook (provavelmente de uma ferramenta de automação como n8n ou Make), que então processa e salva esses dados no Supabase.  
*   
* **Pontos Críticos de Atenção Técnica:**  
  * **Segurança (ALERTA):** O uso da **chave de serviço (** (supabaseAdminClient.ts) é uma **vulnerabilidade de segurança crítica**. Isso bypassa completamente as políticas de RLS (Row Level Security) e dá ao cliente acesso administrativo ao banco de dados. **Ação Corretiva Urgente:** Todas as operações que usam supabaseAdmin devem ser movidas para um backend seguro (como o proxy Express já existente ou funções serverless) o mais rápido possível.  
  * **Experiência do Usuário:** O projeto demonstra uma forte preocupação com a UX, com componentes de loading, feedback visual (Toasts), um onboarding detalhado e respostas de IA em streaming.  
* 

