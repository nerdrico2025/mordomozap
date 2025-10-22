import { supabase } from './supabaseClient';
// FIX: Changed import path for Conversation, Message, and MediaPayload types from supabaseClient to the centralized types file.
import type { Conversation, Message, MediaPayload } from '../types';
import { GoogleGenAI } from "@google/genai";

// Per coding guidelines, API key must come from process.env.API_KEY.
// In a typical client-side application, this would expose the key.
// We are proceeding under the assumption that the execution environment handles this securely.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Converts a File object to a GoogleGenerativeAI.Part object for use with the Gemini API.
 * This is used for multimodal input (e.g., sending images/videos to the model).
 * @param file The file to convert.
 * @returns A promise that resolves to a Part object.
 */
const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      // The result includes the Base64 prefix (e.g., "data:image/jpeg;base64,"), which we need to remove.
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

export const chatService = {
  /**
   * Fetches all conversations for a given company, ordered by most recent.
   */
  async getConversations(companyId: string): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('company_id', companyId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error; // Re-throw to be handled by the UI
    }
  },

  /**
   * Fetches all messages for a specific conversation, ordered by timestamp.
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  /**
   * Sends a user message (text and/or file) and saves it to the database.
   * Files are uploaded to Supabase Storage to get a public URL for display.
   */
  async sendMessage(conversationId: string, companyId: string, text: string, file?: File): Promise<Message> {
    try {
        let payloadJson: MediaPayload | undefined = undefined;

        if (file) {
            // NOTE: This assumes a public Supabase Storage bucket named 'media' exists.
            const filePath = `${companyId}/${conversationId}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('media') // Assumed bucket name
                .upload(filePath, file);
            
            if (uploadError) {
                console.error("Error uploading file:", uploadError);
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('media')
                .getPublicUrl(filePath);
            
            payloadJson = {
                type: file.type.startsWith('image/') ? 'image' : 'video',
                url: publicUrl,
            };
        }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          direction: 'out', // Message from dashboard user is 'out'
          text: text || null,
          payload_json: payloadJson,
        })
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error("Failed to send message");
      return data as Message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Gets a streaming AI reply from Gemini based on the user's message (text and/or file).
   */
  async getAIReplyStream(conversationId: string, companyId: string, text: string, file?: File): Promise<AsyncIterable<string>> {
    try {
        const parts: any[] = [];
        if (text.trim()) {
          parts.push({ text });
        }
        if (file) {
            const filePart = await fileToGenerativePart(file);
            parts.push(filePart);
        }

        // 'gemini-2.5-flash' is a multimodal model suitable for text and image inputs.
        const model = 'gemini-2.5-flash';

        const response = await ai.models.generateContentStream({
            model,
            contents: [{ parts }],
        });

        async function* streamGenerator() {
            for await (const chunk of response) {
                // Ensure chunk and text property exist before yielding
                if (chunk && chunk.text) {
                    yield chunk.text;
                }
            }
        }
        return streamGenerator();

    } catch (error) {
        console.error('Error getting AI reply:', error);
        throw error;
    }
  },

  /**
   * Saves the final, accumulated AI response to the database.
   */
  async saveAIResponse(conversationId: string, text: string): Promise<Message> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          direction: 'in', // AI response is 'in'
          text: text,
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("Failed to save AI response");
      return data as Message;
    } catch (error) {
      console.error('Error saving AI response:', error);
      throw error;
    }
  }
};
