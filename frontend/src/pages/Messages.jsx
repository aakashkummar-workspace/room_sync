import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, ArrowDown, MessageCircle, Smile, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { TechCard } from '../components/TechCard';
import { useAuth } from '../hooks/useAuth';
import { messagesService } from '../services/messages';
import { dashboardService } from '../services/dashboard';

// No backend needed — files stored as data URLs
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
        <div className="shrink-0 mt-auto">
            {showAvatar ? (
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shadow-soft ${isOwn ? 'bg-pastel-blue text-blue-600' : 'bg-pastel-peach text-orange-600'}`}>
                    {message.user_name?.[0]?.toUpperCase() || 'U'}
                </div>
            ) : <div className="w-8" />}
        </div>
        <div className={`max-w-[75%] sm:max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
            {showAvatar && !isOwn && (
                <p className="text-[10px] font-semibold text-text-muted mb-1 px-1">{message.user_name}</p>
            )}
            <div className={`relative px-3.5 py-2.5 rounded-2xl ${isOwn ? 'bg-text-primary text-white rounded-br-md' : 'bg-surface-card border border-surface-border text-text-primary rounded-bl-md'}`}>
                {/* Attachment */}
                {message.attachment_url && (
                    <div className="mb-2">
                        {message.attachment_type === 'image' ? (
                            <a href={message.attachment_url || message.file_url} target="_blank" rel="noopener noreferrer">
                                <img src={message.attachment_url || message.file_url} alt={message.attachment_name || 'Image'}
                                    className="max-w-full max-h-48 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                            </a>
                        ) : (
                            <a href={message.attachment_url || message.file_url} target="_blank" rel="noopener noreferrer"
                                className={`flex items-center gap-2 p-2 rounded-xl ${isOwn ? 'bg-white/10 hover:bg-white/20' : 'bg-surface hover:bg-surface-hover'} transition-colors`}>
                                <FileText size={16} className={isOwn ? 'text-white/70' : 'text-text-muted'} />
                                <span className={`text-xs font-medium truncate ${isOwn ? 'text-white/90' : 'text-text-primary'}`}>
                                    {message.attachment_name || 'File'}
                                </span>
                            </a>
                        )}
                    </div>
                )}
                {message.content && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>}
                <p className={`text-[9px] mt-1 ${isOwn ? 'text-white/50' : 'text-text-muted'}`}>{formatTime(message.created_at)}</p>
                {isOwn && (
                    <button onClick={() => onDelete(message.id)}
                        className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-surface-card border border-surface-border hover:bg-red-50 hover:border-red-200 transition-all">
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
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const pollRef = useRef(null);
    const latestIdRef = useRef(0);
    const fileInputRef = useRef(null);
    const emojiRef = useRef(null);

    const scrollToBottom = useCallback((smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
    }, []);

    // Load room + messages together for instant display
    useEffect(() => {
        const init = async () => {
            try {
                const summary = await dashboardService.getSummary();
                if (summary?.room_id) {
                    setRoomId(summary.room_id);
                    setRoomName(summary.room_name || 'Room Chat');
                    const msgs = await messagesService.getMessages(summary.room_id);
                    setMessages(msgs);
                    if (msgs.length > 0) latestIdRef.current = msgs[msgs.length - 1].id;
                    setTimeout(() => scrollToBottom(false), 50);
                }
            } catch (e) {
                console.error('Failed to load:', e);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [scrollToBottom]);

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

    // Close emoji picker on outside click
    useEffect(() => {
        const handler = (e) => {
            if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmojiPicker(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleScroll = () => {
        const container = chatContainerRef.current;
        if (container) {
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
            setShowScrollBtn(!isNearBottom);
        }
    };

    const handleEmojiSelect = (emoji) => {
        setNewMessage(prev => prev + emoji.native);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => setFilePreview(ev.target.result);
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSend = async () => {
        if ((!newMessage.trim() && !selectedFile) || sending || !roomId) return;
        const content = newMessage.trim();
        const file = selectedFile;
        setNewMessage('');
        clearFile();
        setShowEmojiPicker(false);
        setSending(true);

        try {
            let sent;
            if (file) {
                sent = await messagesService.sendMessageWithFile(roomId, file, content);
            } else {
                sent = await messagesService.sendMessage(roomId, content);
            }
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
        } catch (e) { console.error('Failed to delete:', e); }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-170px)] lg:h-[calc(100vh-110px)]">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div>
                        <div className="h-7 w-32 bg-surface-muted rounded-lg animate-pulse" />
                        <div className="h-3 w-48 bg-surface-muted rounded mt-2 animate-pulse" />
                    </div>
                </div>
                <div className="flex-1 bg-surface-card rounded-2xl border border-surface-border flex items-center justify-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-3 border-surface-muted border-t-text-primary rounded-full" />
                </div>
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
                <p className="text-text-muted text-sm">Join or create a room to start chatting.</p>
            </div>
        );
    }

    // Group messages by date
    const groupedMessages = [];
    let lastDate = '';
    messages.forEach((msg, i) => {
        const date = new Date(msg.created_at).toDateString();
        if (date !== lastDate) { groupedMessages.push({ type: 'date', date }); lastDate = date; }
        const prevMsg = messages[i - 1];
        const showAvatar = !prevMsg || prevMsg.user_id !== msg.user_id || new Date(msg.created_at) - new Date(prevMsg.created_at) > 300000;
        groupedMessages.push({ type: 'message', message: msg, showAvatar });
    });

    const formatDateLabel = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) return 'Today';
        const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
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
            <TechCard delay={0} className="!p-0 flex-1 flex flex-col overflow-hidden relative">
                <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
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
                            if (item.type === 'date') return (
                                <div key={`date-${idx}`} className="flex items-center gap-3 py-2">
                                    <div className="flex-1 h-px bg-surface-border" />
                                    <span className="text-[10px] font-semibold text-text-muted px-2">{formatDateLabel(item.date)}</span>
                                    <div className="flex-1 h-px bg-surface-border" />
                                </div>
                            );
                            return <ChatBubble key={item.message.id} message={item.message} isOwn={item.message.user_id === user?.id} onDelete={handleDelete} showAvatar={item.showAvatar} />;
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Scroll to bottom */}
                <AnimatePresence>
                    {showScrollBtn && (
                        <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => scrollToBottom()}
                            className="absolute bottom-20 right-5 w-9 h-9 bg-text-primary text-white rounded-full flex items-center justify-center shadow-elevated">
                            <ArrowDown size={16} />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* File preview */}
                {selectedFile && (
                    <div className="border-t border-surface-border px-3 py-2 bg-surface flex items-center gap-3">
                        {filePreview ? (
                            <img src={filePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-pastel-lavender flex items-center justify-center">
                                <FileText size={18} className="text-purple-500" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-text-primary truncate">{selectedFile.name}</p>
                            <p className="text-[10px] text-text-muted">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button onClick={clearFile} className="p-1 rounded-lg hover:bg-surface-hover transition-colors">
                            <X size={16} className="text-text-muted" />
                        </button>
                    </div>
                )}

                {/* Input Area */}
                <div className="border-t border-surface-border p-2 sm:p-3 relative">
                    {/* Emoji Picker */}
                    <AnimatePresence>
                        {showEmojiPicker && (
                            <motion.div ref={emojiRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-full left-0 sm:left-2 mb-2 z-50">
                                <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="light" previewPosition="none" skinTonePosition="none"
                                    perLine={7} maxFrequentRows={1} navPosition="bottom" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-end gap-1.5 sm:gap-2">
                        {/* Attachment button */}
                        <button onClick={() => fileInputRef.current?.click()}
                            className="p-2 sm:p-2.5 rounded-xl bg-pastel-lavender text-purple-600 hover:bg-purple-200 transition-colors shrink-0 shadow-soft">
                            <Paperclip size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect}
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar" />

                        {/* Message input */}
                        <div className="flex-1 relative">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                rows={1}
                                className="w-full bg-surface border border-surface-border rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 pr-9 sm:pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-light transition-all resize-none max-h-32"
                                style={{ minHeight: '38px' }}
                            />
                            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className={`absolute right-2.5 sm:right-3 bottom-1.5 sm:bottom-2 p-1 rounded-lg transition-colors ${showEmojiPicker ? 'bg-pastel-peach text-orange-500' : 'text-orange-400 hover:bg-pastel-peach hover:text-orange-500'}`}>
                                <Smile size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </button>
                        </div>

                        {/* Send button */}
                        <motion.button whileTap={{ scale: 0.95 }} onClick={handleSend}
                            disabled={(!newMessage.trim() && !selectedFile) || sending}
                            className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all shadow-button shrink-0 ${(newMessage.trim() || selectedFile) ? 'bg-text-primary text-white hover:opacity-90' : 'bg-surface-muted text-text-light cursor-not-allowed'}`}>
                            <Send size={16} className={`sm:w-[18px] sm:h-[18px] ${sending ? 'animate-pulse' : ''}`} />
                        </motion.button>
                    </div>
                    <p className="text-[8px] sm:text-[9px] text-text-light mt-1 sm:mt-1.5 text-center hidden sm:block">Press Enter to send, Shift+Enter for new line</p>
                </div>
            </TechCard>
        </div>
    );
};
