import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../components/AuthContext';
import { User, Message } from '../types';
import { Send, User as UserIcon, Search, MessageSquare } from 'lucide-react';

export const Chat: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const endpoint = user?.role === 'teacher' 
      ? `/api/students?class_name=${user.class_name}&teacher_id=${user.id}` 
      : '/api/teachers';
    fetch(endpoint)
      .then(res => res.json())
      .then(setContacts);
  }, [user]);

  useEffect(() => {
    if (selectedContact) {
      const interval = setInterval(() => {
        fetch(`/api/messages?user1=${user?.id}&user2=${selectedContact.id}`)
          .then(res => res.json())
          .then(setMessages);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedContact, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_id: user?.id,
        receiver_id: selectedContact.id,
        content: newMessage
      }),
    });

    if (response.ok) {
      setNewMessage('');
      const res = await fetch(`/api/messages?user1=${user?.id}&user2=${selectedContact.id}`);
      const data = await res.json();
      setMessages(data);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-12rem)] flex bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Contacts List */}
      <div className="w-80 border-r border-slate-100 flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search contacts..."
              className="input-field pl-9 py-1.5 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                selectedContact?.id === contact.id ? 'bg-primary/5 border-r-2 border-primary' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <UserIcon className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900 text-sm">{contact.name}</p>
                <p className="text-xs text-slate-500">{contact.class_name}</p>
              </div>
            </button>
          ))}
          {filteredContacts.length === 0 && (
            <p className="text-center text-slate-400 text-sm mt-8">No contacts found.</p>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/30">
        {selectedContact ? (
          <>
            <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                {selectedContact.name.charAt(0)}
              </div>
              <h3 className="font-bold text-slate-900">{selectedContact.name}</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-2xl text-sm ${
                      msg.sender_id === user?.id
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.content}
                    <p className={`text-[10px] mt-1 ${
                      msg.sender_id === user?.id ? 'text-white/70' : 'text-slate-400'
                    }`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-3">
              <input
                type="text"
                placeholder="Type a message..."
                className="input-field"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="btn-primary p-2 rounded-xl">
                <Send className="w-6 h-6" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-medium">Select a contact to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};
