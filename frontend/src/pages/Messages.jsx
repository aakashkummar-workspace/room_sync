import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, ArrowDown, MessageCircle, Smile } from 'lucide-react';
import { TechCard } from '../components/TechCard';
import { useAuth } from '../hooks/useAuth';
import { messagesService } from '../services/messages';
import { dashboardService } from '../services/dashboard';

const POLL_INTERVAL = 3000;

const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return time;
    if (isYesterday) return `Yesterday ${time}`;
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
};

const ChatBubble = ({ message, isOwn, onDelete, showAvatar }) => (
    <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={`flex gap-2 sm:gap-3 group ${isOwn ? 'flex-row-reverse' : ''}`}
    >
        {/* Avatar */}
        <div className="shrink-0 mt-auto">
            {showAvatar ? (
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shadow-soft ${
                    isOwn ? 'bg-pastel-blue text-blue-600' : 'bg-pastel-peach text-orange-600'
                }`}>
                    {message.user_name?.[0]?.toUpperCase() || 'U'}
                </div>
            ) : (
                <div className="w-8" />
            )}
        </div>

        {/* Bubble */}
        <div className={`max-w-[75%] sm:max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
            {showAvatar && !isOwn && (
                <p className="text-[10px] font-semibold text-text-muted mb-1 px-1">{message.user_name}</p>
            )}
            <div className={`relative px-3.5 py-2.5 rounded-2xl ${
                isOwn
                    ? 'bg-text-primary text-white rounded-br-md'
                    : 'bg-surface-card border border-surface-border text-text-primary rounded-bl-md'
            }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                <p className={`text-[9px] mt-1 ${isOwn ? 'text-white/50' : 'text-text-muted'}`}>
                    {formatTime(message.created_at)}
                </p>

                {/* Delete button for own messages */}
                {isOwn && (
                    <button
                        onClick={() => onDelete(message.id)}
                        className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-surface-card border border-surface-border hover:bg-red-50 hover:border-red-200 transition-all"
                    >
                        <Trash2 size={12} className="text-red-400" />
                    </button>
                )}
            </div>
        </div>
    </motion.div>
);

export const Messages = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [roomId, setRoomId] = useState(null);
    const [roomName, setRoomName] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const pollRef = useRef(null);
    const latestIdRef = useRef(0);

    const scrollToBottom = useCallback((smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
    }, []);

    // Load room info
    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const summary = await dashboardService.getSummary();
                if (summary?.room_id) {
                    setRoomId(summary.room_id);
                    setRoomName(summary.room_name || 'Room Chat');
                }
            } catch (e) {
                console.error('Failed to fetch room:', e);
            }
        };
        fetchRoom();
    }, []);

    // Load messages
    useEffect(() => {
        if (!roomId) return;

        const fetchMessages = async () => {
            try {
                const msgs = await messagesService.getMessages(roomId);
                setMessages(msgs);
                if (msgs.length > 0) latestIdRef.current = msgs[msgs.length - 1].id;
                setLoading(false);
                setTimeout(() => scrollToBottom(false), 100);
            } catch (e) {
                console.error('Failed to fetch messages:', e);
                setLoading(false);
            }
        };

        fetchMessages();
    }, [roomId, scrollToBottom]);

    // Poll for new messages
    useEffect(() => {
        if (!roomId) return;

        pollRef.current = setInterval(async () => {
            try {
                const msgs = await messagesService.getMessages(roomId);
                if (msgs.length > 0) {
                    const newLatest = msgs[msgs.length - 1].id;
                    if (newLatest > latestIdRef.current) {
                        latestIdRef.current = newLatest;
                        setMessages(msgs);

                        // Auto scroll if near bottom
                        const container = chatContainerRef.current;
                        if (container) {
                            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
                            if (isNearBottom) setTimeout(() => scrollToBottom(), 100);
                        }
                    }
                }
            } catch (e) { /* silent */ }
        }, POLL_INTERVAL);

        return () => clearInterval(pollRef.current);
    }, [roomId, scrollToBottom]);

    // Scroll detection
    const handleScroll = () => {
        const container = chatContainerRef.current;
        if (container) {
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
            setShowScrollBtn(!isNearBottom);
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim() || sending || !roomId) return;
        const content = newMessage.trim();
        setNewMessage('');
        setSending(true);

        try {
            const sent = await messagesService.sendMessage(roomId, content);
            setMessages(prev => [...prev, sent]);
            latestIdRef.current = sent.id;
            setTimeout(() => scrollToBottom(), 50);
        } catch (e) {
            console.error('Failed to send:', e);
            setNewMessage(content);
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (messageId) => {
        try {
            await messagesService.deleteMessage(messageId);
            setMessages(prev => prev.filter(m => m.id !== messageId));
        } catch (e) {
            console.error('Failed to delete:', e);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-3 border-surface-muted border-t-text-primary rounded-full" />
            </div>
        );
    }

    if (!roomId) {
        return (
            <div className="text-center p-20 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-16 h-16 bg-pastel-blue rounded-2xl flex items-center justify-center mb-6">
                    <MessageCircle size={28} className="text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-text-primary mb-2">No Room Yet</h2>
                <p className="text-text-muted text-sm">Join or create a room to start chatting with your roommates.</p>
            </div>
        );
    }

    // Group messages by date
    const groupedMessages = [];
    let lastDate = '';
    messages.forEach((msg, i) => {
        const date = new Date(msg.created_at).toDateString();
        if (date !== lastDate) {
            groupedMessages.push({ type: 'date', date });
            lastDate = date;
        }
        const prevMsg = messages[i - 1];
        const showAvatar = !prevMsg || prevMsg.user_id !== msg.user_id ||
            new Date(msg.created_at) - new Date(prevMsg.created_at) > 300000;
        groupedMessages.push({ type: 'message', message: msg, showAvatar });
    });

    const formatDateLabel = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) return 'Today';
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-170px)] lg:h-[calc(100vh-110px)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-2 sm:mb-4">
                <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
                    <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-text-primary">Messages</h2>
                    <p className="text-[10px] sm:text-sm text-text-muted mt-0.5">{roomName} &bull; {messages.length} messages</p>
                </motion.div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] sm:text-xs text-text-muted">Live</span>
                </div>
            </div>

            {/* Chat Area */}
            <TechCard delay={0.1} className="!p-0 flex-1 flex flex-col overflow-hidden relative">
                {/* Messages */}
                <div
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3"
                >
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-16">
                            <div className="w-14 h-14 bg-pastel-lavender rounded-2xl flex items-center justify-center mb-4">
                                <MessageCircle size={24} className="text-purple-500" />
                            </div>
                            <h3 className="font-bold text-text-primary mb-1">Start the conversation</h3>
                            <p className="text-xs text-text-muted">Send a message to your roommates!</p>
                        </div>
                    ) : (
                        groupedMessages.map((item, idx) => {
                            if (item.type === 'date') {
                                return (
                                    <div key={`date-${idx}`} className="flex items-center gap-3 py-2">
                                        <div className="flex-1 h-px bg-surface-border" />
                                        <span className="text-[10px] font-semibold text-text-muted px-2">{formatDateLabel(item.date)}</span>
                                        <div className="flex-1 h-px bg-surface-border" />
                                    </div>
                                );
                            }
                            return (
                                <ChatBubble
                                    key={item.message.id}
                                    message={item.message}
                                    isOwn={item.message.user_id === user?.id}
                                    onDelete={handleDelete}
                                    showAvatar={item.showAvatar}
                                />
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Scroll to bottom button */}
                <AnimatePresence>
                    {showScrollBtn && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => scrollToBottom()}
                            className="absolute bottom-20 right-5 w-9 h-9 bg-text-primary text-white rounded-full flex items-center justify-center shadow-elevated hover:shadow-button transition-all"
                        >
                            <ArrowDown size={16} />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Input Area */}
                <div className="border-t border-surface-border p-2 sm:p-4">
                    <div className="flex items-end gap-1.5 sm:gap-3">
                        <div className="flex-1 relative">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                rows={1}
                                className="w-full bg-surface border border-surface-border rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 pr-9 sm:pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-light transition-all resize-none max-h-32"
                                style={{ minHeight: '40px' }}
                            />
                            <button className="absolute right-2.5 sm:right-3 bottom-2.5 sm:bottom-3 text-text-light hover:text-text-muted transition-colors">
                                <Smile size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </button>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSend}
                            disabled={!newMessage.trim() || sending}
                            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all shadow-button ${
                                newMessage.trim()
                                    ? 'bg-text-primary text-white hover:opacity-90'
                                    : 'bg-surface-muted text-text-light cursor-not-allowed'
                            }`}
                        >
                            <Send size={16} className={`sm:w-[18px] sm:h-[18px] ${sending ? 'animate-pulse' : ''}`} />
                        </motion.button>
                    </div>
                    <p className="text-[8px] sm:text-[9px] text-text-light mt-1.5 sm:mt-2 text-center hidden sm:block">Press Enter to send, Shift+Enter for new line</p>
                </div>
            </TechCard>
        </div>
    );
};
