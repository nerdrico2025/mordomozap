import { supabase } from './supabaseClient';
// FIX: Changed import path for Conversation, Message, and MediaPayload types from supabaseClient to the centralized types file.
import type { Conversation, Message, MediaPayload } from '../types';
import { GoogleGenAI } from "@google/genai";

// Per coding guidelines, API key must come from process.env.API_KEY.
// In a typical client-side application, this would expose the key.
// We are proceeding under the assumption that the execution environment handles this securely.
const API_KEY = (process.env.API_KEY || process.env.GEMINI_API_KEY) as string | undefined;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY as string | undefined);

// Utilitário de timeout para evitar travas silenciosas nas chamadas
const withTimeout = async <T>(promise: Promise<T>, ms: number = 10000, label?: string): Promise<T> => {
  let timer: any;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      console.error(`[Chat Timeout] ${label || 'operation'} exceeded ${ms}ms`);
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
   * Fetch paged conversations for a given company, ordered by most recent.
   */
  async getConversations(companyId: string, page: number = 0, pageSize: number = 20): Promise<Conversation[]> {
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      console.time('chat:getConversations');
      const p1 = (async () => {
        return await supabase
          .from('conversations')
          .select('id, customer_name, customer_phone, started_at, ended_at, status')
          .eq('company_id', companyId)
          .order('started_at', { ascending: false })
          .range(from, to);
      })();
      const { data, error } = await withTimeout(p1, 10000, 'getConversations');
      console.timeEnd('chat:getConversations');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error; // Re-throw to be handled by the UI
    }
  },

  /**
   * Fetch paged messages for a specific conversation, ordered by timestamp.
   */
  async getMessages(conversationId: string, page: number = 0, pageSize: number = 100): Promise<Message[]> {
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      console.time('chat:getMessages');
      const p2 = (async () => {
        return await supabase
          .from('messages')
          .select('id, conversation_id, direction, text, timestamp, payload_json')
          .eq('conversation_id', conversationId)
          .order('timestamp', { ascending: true })
          .range(from, to);
      })();
      const { data, error } = await withTimeout(p2, 10000, 'getMessages');
      console.timeEnd('chat:getMessages');

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
            console.time('chat:upload');
            const pUpload = (async () => {
              return await supabase.storage
                .from('media') // Assumed bucket name
                .upload(filePath, file);
            })();
            const { error: uploadError } = await withTimeout(pUpload, 10000, 'upload');
            console.timeEnd('chat:upload');
            
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

      console.time('chat:sendMessage');
      const p3 = (async () => {
        return await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            direction: 'out', // Message from dashboard user is 'out'
            text: text || null,
            payload_json: payloadJson,
          })
          .select()
          .single();
      })();
      const { data, error } = await withTimeout(p3, 10000, 'sendMessage');
      console.timeEnd('chat:sendMessage');
      
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
            const base64EncodedDataPromise = new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve((reader.result as string));
              reader.readAsDataURL(file);
            });
            const dataUrl = await base64EncodedDataPromise;
            // For Gemini we keep inlineData; for OpenAI we will use dataUrl
            parts.push({ inlineData: { data: dataUrl.split(',')[1], mimeType: file.type } });
        }

        // Branch: OpenAI in browser when OPENAI_API_KEY is present (non-streamed fallback)
        if (OPENAI_API_KEY) {
            const content: any[] = [];
            if (text.trim()) content.push({ type: 'text', text });
            if (file) content.push({ type: 'image_url', image_url: { url: (await (async () => {
                return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve((reader.result as string));
                    reader.readAsDataURL(file);
                });
            })()) } });

            console.time('chat:openai');
            const pOpenAI = (async () => {
              return await fetch('https://api.openai.com/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                      'Authorization': `Bearer ${OPENAI_API_KEY}`,
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                      model: 'gpt-4o-mini',
                      messages: [{ role: 'user', content }],
                      stream: false,
                  }),
              });
            })();
            const response = await withTimeout(pOpenAI, 10000, 'openai');
            console.timeEnd('chat:openai');

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`OpenAI API error: ${response.status} - ${errText}`);
            }
            const data = await response.json();
            const full: string = data?.choices?.[0]?.message?.content ?? '';
            async function* once() { if (full) yield full; }
            return once();
        }

        // Fallback when Gemini client is not configured
        if (!ai) {
            async function* fallback() {
                const msg = 'Configuração de IA ausente: defina GEMINI_API_KEY ou OPENAI_API_KEY em .env.local e rode "npm run build" para habilitar respostas.';
                yield msg;
            }
            return fallback();
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
                if (chunk && (chunk as any).text) {
                    yield (chunk as any).text as string;
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
      console.time('chat:saveAIResponse');
      const p4 = (async () => {
        return await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            direction: 'in', // AI response is 'in'
            text: text,
          })
          .select()
          .single();
      })();
      const { data, error } = await withTimeout(p4, 10000, 'saveAIResponse');
      console.timeEnd('chat:saveAIResponse');

      if (error) throw error;
      if (!data) throw new Error("Failed to save AI response");
      return data as Message;
    } catch (error) {
      console.error('Error saving AI response:', error);
      throw error;
    }
  }
};
