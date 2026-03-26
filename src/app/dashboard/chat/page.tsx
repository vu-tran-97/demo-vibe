'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface ChatRoom {
  id: string;
  name: string;
  type: 'DM' | 'GROUP';
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  members: string[];
  avatar: string;
}

interface Message {
  id: string;
  sender: string;
  senderNickname: string;
  content: string;
  time: string;
  isOwn: boolean;
}

const MOCK_ROOMS: ChatRoom[] = [
  {
    id: 'room-1',
    name: 'Minji\'s Ceramics',
    type: 'DM',
    lastMessage: 'Thank you! The vase is beautiful.',
    lastMessageTime: '2m ago',
    unread: 2,
    members: ['Minji K.'],
    avatar: 'M',
  },
  {
    id: 'room-2',
    name: 'Seonwoo Textiles',
    type: 'DM',
    lastMessage: 'When will my order ship?',
    lastMessageTime: '15m ago',
    unread: 1,
    members: ['Seonwoo P.'],
    avatar: 'S',
  },
  {
    id: 'room-3',
    name: 'Yuna Art Studio',
    type: 'DM',
    lastMessage: 'Do you have this in a larger size?',
    lastMessageTime: '1h ago',
    unread: 0,
    members: ['Yuna L.'],
    avatar: 'Y',
  },
  {
    id: 'room-4',
    name: 'Artisan Community',
    type: 'GROUP',
    lastMessage: 'Great quality, will order again!',
    lastMessageTime: '3h ago',
    unread: 0,
    members: ['Minji K.', 'Seonwoo P.', 'Yuna L.', 'Jihoon C.'],
    avatar: 'A',
  },
  {
    id: 'room-5',
    name: 'Jihoon C.',
    type: 'DM',
    lastMessage: 'The botanical print looks amazing on my wall!',
    lastMessageTime: '5h ago',
    unread: 0,
    members: ['Jihoon C.'],
    avatar: 'J',
  },
  {
    id: 'room-6',
    name: 'Seller Support',
    type: 'GROUP',
    lastMessage: 'New shipping guidelines are up',
    lastMessageTime: '1d ago',
    unread: 0,
    members: ['Admin', 'Minji K.', 'Seonwoo P.'],
    avatar: 'S',
  },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  'room-1': [
    { id: 'm1', sender: 'Minji K.', senderNickname: 'minji_ceramics', content: 'Hi! Thanks for your order. Your ceramic vase is being carefully packed.', time: '10:30 AM', isOwn: false },
    { id: 'm2', sender: 'You', senderNickname: 'you', content: 'That\'s great to hear! Can\'t wait to receive it.', time: '10:32 AM', isOwn: true },
    { id: 'm3', sender: 'Minji K.', senderNickname: 'minji_ceramics', content: 'It\'ll be shipped within 24 hours. I\'ll send you the tracking number.', time: '10:35 AM', isOwn: false },
    { id: 'm4', sender: 'You', senderNickname: 'you', content: 'Perfect, thank you so much!', time: '10:36 AM', isOwn: true },
    { id: 'm5', sender: 'Minji K.', senderNickname: 'minji_ceramics', content: 'Here\'s the tracking: KR-2026-0316-4821', time: '2:15 PM', isOwn: false },
    { id: 'm6', sender: 'You', senderNickname: 'you', content: 'Got it! The package just arrived.', time: '3:45 PM', isOwn: true },
    { id: 'm7', sender: 'Minji K.', senderNickname: 'minji_ceramics', content: 'Thank you! The vase is beautiful.', time: '3:47 PM', isOwn: false },
  ],
  'room-2': [
    { id: 'm1', sender: 'Seonwoo P.', senderNickname: 'seonwoo_textiles', content: 'Hello! I saw you ordered the linen runner. Great choice!', time: '9:00 AM', isOwn: false },
    { id: 'm2', sender: 'You', senderNickname: 'you', content: 'Yes! When will my order ship?', time: '9:15 AM', isOwn: true },
    { id: 'm3', sender: 'Seonwoo P.', senderNickname: 'seonwoo_textiles', content: 'It should ship by tomorrow morning. I\'ll update you!', time: '9:20 AM', isOwn: false },
  ],
  'room-4': [
    { id: 'm1', sender: 'Jihoon C.', senderNickname: 'jihoon_c', content: 'Has anyone tried the new coffee set?', time: '11:00 AM', isOwn: false },
    { id: 'm2', sender: 'Yuna L.', senderNickname: 'yuna_art', content: 'Yes! The glaze is stunning in person.', time: '11:05 AM', isOwn: false },
    { id: 'm3', sender: 'You', senderNickname: 'you', content: 'I\'ve been eyeing it! The earth tones are gorgeous.', time: '11:10 AM', isOwn: true },
    { id: 'm4', sender: 'Minji K.', senderNickname: 'minji_ceramics', content: 'Great quality, will order again!', time: '11:15 AM', isOwn: false },
  ],
};

export default function ChatPage() {
  const { user } = useAuth(true);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [searchRooms, setSearchRooms] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeRoom = MOCK_ROOMS.find((r) => r.id === selectedRoom);
  const messages = selectedRoom ? (MOCK_MESSAGES[selectedRoom] ?? []) : [];

  // Track whether a chat is active (replaces CSS :has() selector for mobile)
  const isChatActive = !!activeRoom;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedRoom]);

  const filteredRooms = searchRooms.trim()
    ? MOCK_ROOMS.filter((r) => r.name.toLowerCase().includes(searchRooms.toLowerCase()))
    : MOCK_ROOMS;

  function handleSend() {
    if (!message.trim()) return;
    setMessage('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white rounded-[16px] border border-border-light overflow-hidden max-sm:h-[calc(100vh-60px)] max-sm:rounded-none max-sm:border-none">
      {/* Room List */}
      <div className={`w-[340px] min-w-[340px] border-r border-border-light flex flex-col bg-ivory max-sm:w-full max-sm:min-w-0 ${isChatActive ? 'max-sm:hidden' : ''}`}>
        <div className="flex items-center justify-between py-[1.5rem] px-[2rem] border-b border-border-light">
          <h2 className="font-display text-[1.375rem] font-normal text-charcoal">Messages</h2>
          <button type="button" className="w-[36px] h-[36px] flex items-center justify-center bg-charcoal text-white border-none rounded-[8px] cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-charcoal-light hover:-translate-y-px hover:shadow-soft" title="New chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-[0.5rem] mx-[1.5rem] my-[1rem] py-[0.5rem] px-[0.75rem] bg-white border border-border rounded-[8px] text-muted transition-colors duration-[200ms] focus-within:border-charcoal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="flex-1 border-none bg-transparent font-body text-[0.8125rem] text-charcoal outline-none placeholder:text-muted"
            placeholder="Search conversations..."
            value={searchRooms}
            onChange={(e) => setSearchRooms(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto py-[0.5rem]">
          {filteredRooms.map((room) => (
            <button
              key={room.id}
              type="button"
              className={`flex items-center gap-[1rem] w-full py-[1rem] px-[1.5rem] bg-transparent border-none cursor-pointer text-left transition-colors duration-[200ms] hover:bg-[rgba(200,169,110,0.06)] ${selectedRoom === room.id ? 'bg-white shadow-[inset_3px_0_0_var(--color-gold)] hover:bg-white' : ''}`}
              onClick={() => setSelectedRoom(room.id)}
            >
              <div className={`w-[44px] h-[44px] rounded-full bg-[linear-gradient(135deg,var(--color-ivory-warm)_0%,var(--color-border)_100%)] flex items-center justify-center font-display text-[1rem] font-medium text-charcoal shrink-0 ${room.type === 'GROUP' ? 'rounded-[8px] bg-[linear-gradient(135deg,rgba(200,169,110,0.15)_0%,rgba(200,169,110,0.05)_100%)] text-gold-dark' : ''}`}>
                {room.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-[3px]">
                  <span className="text-[0.875rem] font-medium text-charcoal whitespace-nowrap overflow-hidden text-ellipsis">{room.name}</span>
                  <span className="text-[0.6875rem] text-muted shrink-0 ml-[0.5rem]">{room.lastMessageTime}</span>
                </div>
                <div className="flex items-center justify-between gap-[0.5rem]">
                  <span className="text-[0.75rem] text-slate whitespace-nowrap overflow-hidden text-ellipsis">{room.lastMessage}</span>
                  {room.unread > 0 && (
                    <span className="min-w-[18px] h-[18px] px-[5px] bg-gold text-white text-[0.625rem] font-semibold rounded-[9px] flex items-center justify-center shrink-0">{room.unread}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeRoom ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-[1rem] text-muted">
            <div className="opacity-30">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <h3 className="font-display text-[1.25rem] font-normal text-charcoal">Select a conversation</h3>
            <p className="text-[0.875rem] text-muted">
              Choose a chat from the list to start messaging.
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-[1rem] py-[1rem] px-[2rem] border-b border-border-light bg-white">
              <button
                type="button"
                className="hidden max-sm:flex w-[32px] h-[32px] items-center justify-center bg-ivory border-none rounded-[8px] cursor-pointer text-[1rem] text-charcoal transition-colors duration-[200ms] hover:bg-ivory-warm"
                onClick={() => setSelectedRoom(null)}
              >
                ←
              </button>
              <div className={`w-[40px] h-[40px] rounded-full bg-[linear-gradient(135deg,var(--color-ivory-warm)_0%,var(--color-border)_100%)] flex items-center justify-center font-display text-[0.9375rem] font-medium text-charcoal shrink-0 ${activeRoom.type === 'GROUP' ? 'rounded-[8px] bg-[linear-gradient(135deg,rgba(200,169,110,0.15)_0%,rgba(200,169,110,0.05)_100%)] text-gold-dark' : ''}`}>
                {activeRoom.avatar}
              </div>
              <div className="flex-1">
                <h3 className="font-body text-[0.9375rem] font-medium text-charcoal">{activeRoom.name}</h3>
                <p className="text-[0.75rem] text-success mt-[1px]">
                  {activeRoom.type === 'GROUP'
                    ? `${activeRoom.members.length} members`
                    : 'Online'}
                </p>
              </div>
              <div className="flex gap-[0.5rem]">
                <button type="button" className="w-[36px] h-[36px] flex items-center justify-center bg-transparent border-none rounded-[8px] cursor-pointer text-slate transition-all duration-[200ms] hover:bg-ivory hover:text-charcoal" title="Search">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </button>
                <button type="button" className="w-[36px] h-[36px] flex items-center justify-center bg-transparent border-none rounded-[8px] cursor-pointer text-slate transition-all duration-[200ms] hover:bg-ivory hover:text-charcoal" title="Info">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-[2rem] flex flex-col gap-[1rem] bg-ivory">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-[0.5rem] max-w-[70%] animate-fade-in max-sm:max-w-[85%] ${msg.isOwn ? 'self-end flex-row-reverse' : 'self-start'}`}
                >
                  {!msg.isOwn && (
                    <div className="w-[32px] h-[32px] rounded-full bg-ivory-warm flex items-center justify-center font-display text-[0.75rem] font-medium text-gold-dark shrink-0 mt-[2px]">
                      {msg.sender.charAt(0)}
                    </div>
                  )}
                  <div className={`py-[0.625rem] px-[0.875rem] rounded-[12px] relative ${msg.isOwn ? 'bg-charcoal text-white rounded-br-[4px]' : 'bg-white text-charcoal border border-border-light rounded-bl-[4px]'}`}>
                    {!msg.isOwn && activeRoom.type === 'GROUP' && (
                      <span className="block text-[0.6875rem] font-semibold text-gold-dark mb-[3px]">{msg.sender}</span>
                    )}
                    <p className="text-[0.8125rem] leading-[1.5] m-0">{msg.content}</p>
                    <span className={`block text-[0.625rem] mt-[4px] opacity-60 ${msg.isOwn ? 'text-right' : ''}`}>{msg.time}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-[0.5rem] py-[1rem] px-[2rem] border-t border-border-light bg-white max-sm:py-[0.5rem] max-sm:px-[1rem]">
              <button type="button" className="w-[36px] h-[36px] flex items-center justify-center bg-transparent border-none rounded-[8px] cursor-pointer text-slate transition-all duration-[200ms] hover:bg-ivory hover:text-charcoal" title="Attach file">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              <input
                type="text"
                className="flex-1 py-[0.625rem] px-[0.875rem] border border-border rounded-[8px] font-body text-[0.8125rem] text-charcoal outline-none transition-colors duration-[200ms] focus:border-charcoal placeholder:text-muted"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                className="w-[36px] h-[36px] flex items-center justify-center bg-charcoal text-white border-none rounded-[8px] cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:not-disabled:bg-charcoal-light hover:not-disabled:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={handleSend}
                disabled={!message.trim()}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
