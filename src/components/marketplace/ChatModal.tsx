import React, { useState, useEffect, useRef } from 'react';
import { ServiceListing, ChatMessage } from '../../types/marketplace';
import { X, Send, Phone, Video } from 'lucide-react';

interface ChatModalProps {
  service: ServiceListing;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  service,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mock chat messages
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        bookingId: 'booking-1',
        senderId: service.providerId,
        senderName: service.providerName,
        receiverId: 'current-user',
        message: 'Hello! Thank you for your interest in my tractor rental service. How can I help you?',
        timestamp: '2025-01-10T10:00:00Z',
        isRead: true,
      },
      {
        id: '2',
        bookingId: 'booking-1',
        senderId: 'current-user',
        senderName: 'You',
        receiverId: service.providerId,
        message: 'Hi! I need a tractor for land preparation. Is it available next week?',
        timestamp: '2025-01-10T10:05:00Z',
        isRead: true,
      },
      {
        id: '3',
        bookingId: 'booking-1',
        senderId: service.providerId,
        senderName: service.providerName,
        receiverId: 'current-user',
        message: 'Yes, it\'s available! The tractor comes with plow and cultivator attachments. What size is your farm?',
        timestamp: '2025-01-10T10:07:00Z',
        isRead: true,
      },
    ];

    setMessages(mockMessages);
  }, [service]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      bookingId: 'booking-1',
      senderId: 'current-user',
      senderName: 'You',
      receiverId: service.providerId,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate provider response
    setTimeout(() => {
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        bookingId: 'booking-1',
        senderId: service.providerId,
        senderName: service.providerName,
        receiverId: 'current-user',
        message: 'Thanks for your message! I\'ll get back to you shortly.',
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      setMessages(prev => [...prev, response]);
      setLoading(false);
    }, 1000);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-semibold">
                {service.providerName.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{service.providerName}</h3>
              <p className="text-sm text-gray-600">{service.title}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Video className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === 'current-user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === 'current-user'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.message}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.senderId === 'current-user'
                      ? 'text-green-100'
                      : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};