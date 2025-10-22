import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { chatService } from '../services/chatService';
// FIX: Changed import path for Message type from supabaseClient to the centralized types file.
import type { Message } from '../types';
import ChatMessage from '../components/ChatMessage';
import Button from '../components/Button';
import Card from '../components/Card';
import { useFeedback } from '../hooks/useFeedback';

const ChatPage: React.FC = () => {
    const { id: conversationId } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { error: showError } = useFeedback();

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingMessage]);

    useEffect(() => {
        if (!conversationId) return;
        const fetchMessages = async () => {
            setLoading(true);
            try {
                const data = await chatService.getMessages(conversationId);
                setMessages(data);
            } catch (err) {
                showError('Falha ao carregar mensagens.');
            } finally {
                setLoading(false);
            }
        };
        fetchMessages();
    }, [conversationId]);
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setFilePreview(URL.createObjectURL(file));
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !conversationId || !user?.company_id) return;

        setSending(true);

        try {
            const userMessage = await chatService.sendMessage(conversationId, user.company_id, newMessage, selectedFile || undefined);
            setMessages(prev => [...prev, userMessage]);
            setNewMessage('');
            setSelectedFile(null);
            setFilePreview(null);
            if(fileInputRef.current) fileInputRef.current.value = '';

            const tempAiMessage: Message = { id: `temp-${Date.now()}`, conversation_id: conversationId, direction: 'in', text: '', timestamp: new Date().toISOString() };
            setStreamingMessage(tempAiMessage);

            let accumulatedText = '';
            const stream = await chatService.getAIReplyStream(conversationId, user.company_id, newMessage, selectedFile || undefined);
            
            for await (const chunk of stream) {
                accumulatedText += chunk;
                setStreamingMessage(prev => prev ? { ...prev, text: accumulatedText } : null);
            }
            
            const finalMessage = await chatService.saveAIResponse(conversationId, accumulatedText);
            setMessages(prev => [...prev, finalMessage]);

        } catch (err) {
            showError('Erro ao enviar mensagem.');
        } finally {
            setSending(false);
            setStreamingMessage(null);
        }
    };

    if (loading) return <div className="text-center p-8">Carregando chat...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-160px)]">
            <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Link to="/conversations" className="text-primary hover:underline mr-4">← Voltar</Link>
                Chat
            </h1>
            <Card className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
                    {streamingMessage && <ChatMessage message={streamingMessage} />}
                    <div ref={messagesEndRef} />
                </div>
                <div className="border-t p-4 bg-white">
                    {filePreview && (
                        <div className="mb-2 relative w-24 h-24">
                            <img src={filePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                            <button onClick={() => { setSelectedFile(null); setFilePreview(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 leading-none">&times;</button>
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" id="file-upload" />
                        <label htmlFor="file-upload" className="cursor-pointer p-2 rounded-full hover:bg-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        </label>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Digite uma mensagem..."
                            className="flex-1 w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={sending}
                        />
                        <Button type="submit" loading={sending} disabled={sending}>
                            Enviar
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default ChatPage;
