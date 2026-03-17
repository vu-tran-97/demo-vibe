'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import styles from './chat.module.css';

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
    <div className={styles.chat}>
      {/* Room List */}
      <div className={styles.roomList}>
        <div className={styles.roomListHeader}>
          <h2 className={styles.roomListTitle}>Messages</h2>
          <button type="button" className={styles.newChatBtn} title="New chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
        </div>

        <div className={styles.roomSearch}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            className={styles.roomSearchInput}
            placeholder="Search conversations..."
            value={searchRooms}
            onChange={(e) => setSearchRooms(e.target.value)}
          />
        </div>

        <div className={styles.rooms}>
          {filteredRooms.map((room) => (
            <button
              key={room.id}
              type="button"
              className={`${styles.roomItem} ${selectedRoom === room.id ? styles.roomActive : ''}`}
              onClick={() => setSelectedRoom(room.id)}
            >
              <div className={`${styles.roomAvatar} ${room.type === 'GROUP' ? styles.groupAvatar : ''}`}>
                {room.avatar}
              </div>
              <div className={styles.roomInfo}>
                <div className={styles.roomTop}>
                  <span className={styles.roomName}>{room.name}</span>
                  <span className={styles.roomTime}>{room.lastMessageTime}</span>
                </div>
                <div className={styles.roomBottom}>
                  <span className={styles.roomLastMsg}>{room.lastMessage}</span>
                  {room.unread > 0 && (
                    <span className={styles.unreadBadge}>{room.unread}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={styles.chatArea}>
        {!activeRoom ? (
          <div className={styles.noChatSelected}>
            <div className={styles.noChatIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <h3 className={styles.noChatTitle}>Select a conversation</h3>
            <p className={styles.noChatDesc}>
              Choose a chat from the list to start messaging.
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className={styles.chatHeader}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setSelectedRoom(null)}
              >
                ←
              </button>
              <div className={`${styles.chatHeaderAvatar} ${activeRoom.type === 'GROUP' ? styles.groupAvatar : ''}`}>
                {activeRoom.avatar}
              </div>
              <div className={styles.chatHeaderInfo}>
                <h3 className={styles.chatHeaderName}>{activeRoom.name}</h3>
                <p className={styles.chatHeaderStatus}>
                  {activeRoom.type === 'GROUP'
                    ? `${activeRoom.members.length} members`
                    : 'Online'}
                </p>
              </div>
              <div className={styles.chatHeaderActions}>
                <button type="button" className={styles.headerAction} title="Search">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </button>
                <button type="button" className={styles.headerAction} title="Info">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className={styles.messages}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.message} ${msg.isOwn ? styles.messageOwn : styles.messageOther}`}
                >
                  {!msg.isOwn && (
                    <div className={styles.messageAvatar}>
                      {msg.sender.charAt(0)}
                    </div>
                  )}
                  <div className={styles.messageBubble}>
                    {!msg.isOwn && activeRoom.type === 'GROUP' && (
                      <span className={styles.messageSender}>{msg.sender}</span>
                    )}
                    <p className={styles.messageText}>{msg.content}</p>
                    <span className={styles.messageTime}>{msg.time}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={styles.chatInput}>
              <button type="button" className={styles.attachBtn} title="Attach file">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              <input
                type="text"
                className={styles.messageInput}
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                className={styles.sendBtn}
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
