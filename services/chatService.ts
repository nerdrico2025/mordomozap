import { supabase } from './supabaseClient'
import type { Conversation, Message } from './supabaseClient'

// A placeholder for a real AI service call.
// In a real app, this would call the Gemini API with the conversation history.
async function getAIReply(prompt: string, conversationHistory: Message[]): Promise<string> {
    console.log("Getting AI reply for:", prompt);
    console.log("History:", conversationHistory);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `Esta é uma resposta simulada para: "${prompt}"`;
}

export const chatService = {
  /**
   * Fetches all conversations for a given company.
   */
  async getConversations(companyId: string): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('company_id', companyId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      throw error;
    }
  },

  /**
   * Fetches all messages for a specific conversation.
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      throw error;
    }
  },

  /**
   * Sends a message from the user and gets a reply from the AI.
   * This is a simplified version. A real implementation would be more complex.
   */
  async sendMessage(conversationId: string, text: string): Promise<{ userMessage: Message, aiMessage: Message }> {
    try {
        // 1. Get conversation history
        const messages = await this.getMessages(conversationId);

        // 2. Save the user's message
        const { data: userMessageData, error: userMessageError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                direction: 'out', // Assuming 'out' is from the business user perspective
                text: text,
            })
            .select()
            .single();

        if (userMessageError) throw userMessageError;
        
        // Add new user message to history for AI context
        messages.push(userMessageData);

        // 3. Get AI reply
        const aiReplyText = await getAIReply(text, messages);

        // 4. Save the AI's message
        const { data: aiMessageData, error: aiMessageError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                direction: 'in', // Assuming 'in' is from the customer (AI) perspective
                text: aiReplyText,
            })
            .select()
            .single();

        if (aiMessageError) throw aiMessageError;

        return { userMessage: userMessageData, aiMessage: aiMessageData };
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  },
};
