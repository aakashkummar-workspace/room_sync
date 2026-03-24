import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, ClipboardCheck, Wallet, MessageCircle, Info, X, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { notificationService } from '../services/notification';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1').replace('/api/v1', '');

const typeIcons = {
    chore: ClipboardCheck,
    expense: Wallet,
    message: MessageCircle,
    notice: Info,
};

const typeColors = {
    chore: 'bg-pastel-lavender text-purple-600',
    expense: 'bg-pastel-peach text-orange-600',
    message: 'bg-pastel-blue text-blue-600',
    notice: 'bg-pastel-green text-green-600',
};

export const MainLayout = ({ children }) => {
    const { user } = useAuth();
    const { sendNotification } = useSettings();
    const navigate = useNavigate();
    const location = useLocation();
    const isMessagesPage = location.pathname === '/messages';
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [toasts, setToasts] = useState([]);
    const dropdownRef = useRef(null);
    const prevCountRef = useRef(0);

    const avatarUrl = user?.avatar_url
        ? user.avatar_url.startsWith('http') ? user.avatar_url : `${API_BASE}${user.avatar_url}`
        : null;

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const [notifs, count] = await Promise.all([
                notificationService.getNotifications(),
                notificationService.getUnreadCount(),
            ]);
            setNotifications(notifs);

            // Show toast + browser notification for new ones
            if (count > prevCountRef.current && prevCountRef.current > 0) {
                const newNotifs = notifs.slice(0, count - prevCountRef.current);
                newNotifs.forEach((n) => {
                    // In-app toast
                    setToasts(prev => [...prev, { id: n.id, title: n.title, message: n.message, type: n.type }]);
                    // Browser notification
                    sendNotification(n.title, n.message);
                });
            }
            prevCountRef.current = count;
            setUnreadCount(count);
        } catch (err) {
            // silently fail
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 5000);
        return () => clearInterval(interval);
    }, []);

    // Auto-dismiss toasts
    useEffect(() => {
        if (toasts.length > 0) {
            const timer = setTimeout(() => {
                setToasts(prev => prev.slice(1));
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [toasts]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleBellClick = () => {
        setShowDropdown(!showDropdown);
        if (!showDropdown && unreadCount > 0) {
            notificationService.markAllRead().then(() => {
                setUnreadCount(0);
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            });
        }
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div className="flex min-h-screen bg-surface overflow-hidden">
            <Sidebar />
            <main className="flex-1 h-screen overflow-y-auto relative w-full">
                {/* Header */}
                <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-5 lg:px-8 py-2 sm:py-2.5 lg:py-4 bg-surface-card/80 backdrop-blur-xl border-b border-surface-border">
                    {/* Left: App name on mobile, quote on tablet+ */}
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 bg-text-primary rounded-lg flex items-center justify-center lg:hidden shrink-0">
                            <Home size={14} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-text-primary lg:hidden">CasaSync</p>
                            <p className="text-[8px] text-text-muted italic lg:hidden truncate">Built for the way roommates actually live.</p>
                            <p className="text-xs text-text-muted font-medium italic hidden lg:block">&#x2728; Built for the way roommates actually live.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {/* Bell with dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleBellClick}
                                className="relative p-1.5 sm:p-2.5 bg-surface border border-surface-border rounded-lg sm:rounded-xl hover:bg-surface-hover transition-colors"
                            >
                                <Bell size={14} className="sm:w-[18px] sm:h-[18px] text-text-secondary" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 sm:top-1 sm:right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </motion.button>

                            {/* Notification Dropdown */}
                            <AnimatePresence>
                                {showDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 top-full mt-2 w-[320px] sm:w-[360px] max-h-[400px] bg-surface-card rounded-2xl shadow-elevated border border-surface-border overflow-hidden z-50"
                                    >
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
                                            <h3 className="text-sm font-bold text-text-primary">Notifications</h3>
                                            {notifications.length > 0 && (
                                                <button onClick={() => { notificationService.markAllRead(); setUnreadCount(0); setNotifications(prev => prev.map(n => ({...n, is_read: true}))); }}
                                                    className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-primary transition-colors">
                                                    <CheckCheck size={12} /> Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div className="overflow-y-auto max-h-[340px]">
                                            {notifications.length > 0 ? notifications.map((notif) => {
                                                const Icon = typeIcons[notif.type] || Info;
                                                const colorClass = typeColors[notif.type] || 'bg-surface text-text-muted';
                                                return (
                                                    <div key={notif.id} className={`flex items-start gap-3 px-4 py-3 border-b border-surface-border/50 transition-colors ${!notif.is_read ? 'bg-pastel-blue/20' : 'hover:bg-surface-hover'}`}>
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                                                            <Icon size={14} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-semibold text-text-primary">{notif.title}</p>
                                                            <p className="text-[10px] text-text-muted mt-0.5 line-clamp-2">{notif.message}</p>
                                                            <p className="text-[9px] text-text-light mt-1">{timeAgo(notif.created_at)}</p>
                                                        </div>
                                                        {!notif.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />}
                                                    </div>
                                                );
                                            }) : (
                                                <div className="p-8 text-center">
                                                    <Bell size={28} className="text-text-light mx-auto mb-2" />
                                                    <p className="text-xs text-text-muted">No notifications yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <motion.div
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1.5 sm:gap-3 pl-1.5 sm:pl-3 border-l border-surface-border cursor-pointer"
                        >
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={user?.name || 'Avatar'} className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl object-cover shadow-soft" />
                            ) : (
                                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-pastel-peach flex items-center justify-center shadow-soft">
                                    <span className="text-[10px] sm:text-sm font-bold text-accent-coral">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                                </div>
                            )}
                            <div className="hidden md:block">
                                <p className="text-sm font-semibold text-text-primary">{user?.name || 'User'}</p>
                                <p className="text-[10px] text-text-muted">Member</p>
                            </div>
                        </motion.div>
                    </div>
                </header>

                {/* Toast Notifications — top right */}
                <div className="fixed top-16 right-4 z-[100] flex flex-col gap-2 max-w-[340px]">
                    <AnimatePresence>
                        {toasts.map((toast) => {
                            const Icon = typeIcons[toast.type] || Info;
                            const colorClass = typeColors[toast.type] || 'bg-surface text-text-muted';
                            return (
                                <motion.div
                                    key={toast.id}
                                    initial={{ opacity: 0, x: 50, scale: 0.9 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: 50, scale: 0.9 }}
                                    className="flex items-start gap-3 bg-surface-card border border-surface-border rounded-2xl p-3.5 shadow-elevated"
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                                        <Icon size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-text-primary">{toast.title}</p>
                                        <p className="text-[10px] text-text-muted mt-0.5 line-clamp-2">{toast.message}</p>
                                    </div>
                                    <button onClick={() => removeToast(toast.id)} className="text-text-light hover:text-text-secondary shrink-0">
                                        <X size={14} />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Content */}
                <div className="p-2 sm:p-5 lg:p-8 pb-[68px] sm:pb-20 lg:pb-8 content-safe lg:!pb-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Floating Chat Button */}
                {!isMessagesPage && (
                    <motion.button
                        onClick={() => navigate('/messages')}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        className="fixed bottom-20 lg:bottom-6 right-4 lg:right-8 z-40 w-14 h-14 bg-text-primary text-white rounded-full shadow-elevated flex items-center justify-center hover:shadow-button transition-shadow"
                    >
                        <MessageCircle size={22} />
                    </motion.button>
                )}
            </main>
        </div>
    );
};
