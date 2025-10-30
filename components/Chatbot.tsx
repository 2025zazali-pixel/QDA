import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types.ts';
import { XIcon, SendIcon } from './icons.tsx';

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-6 w-full max-w-md h-[70vh] max-h-[600px] z-50 animate-fade-in-fast">
        <div className="bg-white rounded-lg shadow-2xl flex flex-col h-full border border-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                <h2 className="text-lg font-semibold text-slate-800">AI Research Assistant</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                    <XIcon className="h-6 w-6 text-slate-500" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-lg px-4 py-2 max-w-xs lg:max-w-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                            {/* Simple markdown parsing for newlines */}
                            {msg.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="rounded-lg px-4 py-2 bg-slate-100 text-slate-500">
                           <span className="animate-pulse">Thinking...</span>
                        </div>
                    </div>
                )}
                 <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 flex-shrink-0">
                <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your data..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={isLoading}
                    />
                    <button type="submit" className="p-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300" disabled={isLoading || !input.trim()}>
                       <SendIcon className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};

export default Chatbot;