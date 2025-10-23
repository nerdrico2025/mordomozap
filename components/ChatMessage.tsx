import React from 'react';
// FIX: Changed import path for Message type from supabaseClient to the centralized types file.
import type { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isOut = message.direction === 'out';
  
  const renderMedia = () => {
    if (!message.payload_json) return null;

    const { type, url } = message.payload_json;

    if (type === 'image') {
      return <img src={url} alt="Mídia enviada" className="mt-2 rounded-lg max-w-xs" loading="lazy" decoding="async" />;
    }
    if (type === 'video') {
      return <video src={url} controls className="mt-2 rounded-lg max-w-xs" preload="metadata" />;
    }
    return null;
  };

  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${isOut ? 'bg-primary text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
        {message.text && <p>{message.text}</p>}
        {renderMedia()}
      </div>
    </div>
  );
};

export default React.memo(ChatMessage, (prev, next) => {
  const prevPayloadUrl = prev.message.payload_json?.url;
  const nextPayloadUrl = next.message.payload_json?.url;
  return (
    prev.message.id === next.message.id &&
    prev.message.text === next.message.text &&
    prevPayloadUrl === nextPayloadUrl &&
    prev.message.direction === next.message.direction
  );
});
