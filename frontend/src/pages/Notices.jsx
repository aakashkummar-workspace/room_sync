import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Vote, Plus, MessageSquare, Calendar, User, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { TechCard } from '../components/TechCard';
import { Button } from '../components/Button';
import { dashboardService } from '../services/dashboard';

export const Notices = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('announcements');

    useEffect(() => {
        const fetchData = async () => {
            try { await dashboardService.getSummary(); } catch (error) { console.error("Failed to fetch:", error); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 sm:w-10 sm:h-10 border-3 border-surface-muted border-t-text-primary rounded-full" />
        </div>
    );

    const announcements = [
        { id: 1, title: 'Maintenance Visit', content: 'Electrician visiting tomorrow between 10 AM and 12 PM for a general checkup.', author: 'Rahul K.', date: '2h ago', important: true },
        { id: 2, title: 'Household Policy', content: 'Please ensure all kitchen waste is cleared before 11 PM every night.', author: 'System', date: '1d ago', important: false },
        { id: 3, title: 'Weekend Gathering', content: 'Planning a small get-together this Saturday evening.', author: 'Rahul K.', date: '2d ago', important: false },
    ];

    const polls = [
        { id: 1, question: 'Cleaning service preference?', options: ['Sparkle Clean', 'Green Wash', 'Quick Fix'], votes: [12, 8, 4], total: 24, active: true },
        { id: 2, question: 'WiFi bill split model?', options: ['Equal Split', 'Usage Based', 'Discuss Later'], votes: [18, 2, 4], total: 24, active: false },
    ];

    const announcementColors = ['bg-pastel-pink', 'bg-pastel-green', 'bg-pastel-lavender'];

    return (
        <div className="max-w-6xl mx-auto">
            <div className="page-header">
                <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
                    <h2 className="page-title">Notices</h2>
                    <p className="page-subtitle">Announcements and polls</p>
                </motion.div>
                <Button variant="primary" icon={Plus} className="text-xs sm:text-sm self-start sm:self-auto">New Post</Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 sm:gap-2 p-1 bg-surface-card rounded-xl sm:rounded-2xl border border-surface-border w-fit mb-5 sm:mb-8 shadow-soft">
                {[
                    { id: 'announcements', label: 'Posts', icon: Megaphone },
                    { id: 'polls', label: 'Polls', icon: Vote },
                ].map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all ${activeTab === tab.id ? 'text-white bg-text-primary shadow-button' : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'}`}>
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
                <div className="xl:col-span-8 space-y-3 sm:space-y-4">
                    <AnimatePresence mode="wait">
                        {activeTab === 'announcements' ? (
                            <motion.div key="announcements" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3 sm:space-y-4">
                                {announcements.map((ann, idx) => (
                                    <TechCard key={ann.id} delay={idx * 0.08} className={`!p-4 sm:!p-6 ${ann.important ? 'border-l-4 border-l-red-400' : ''}`}>
                                        <div className="flex gap-3 sm:gap-5 items-start">
                                            <div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl ${announcementColors[idx % announcementColors.length]} shrink-0`}>
                                                <Megaphone size={16} className="text-text-secondary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                                                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                        <h4 className="text-sm sm:text-base font-bold text-text-primary truncate">{ann.title}</h4>
                                                        {ann.important && <span className="badge bg-red-50 text-red-500 text-[9px] sm:text-[10px] shrink-0">Urgent</span>}
                                                    </div>
                                                    <span className="text-[10px] sm:text-xs text-text-muted shrink-0">{ann.date}</span>
                                                </div>
                                                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-3 sm:mb-5">{ann.content}</p>
                                                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-surface-border">
                                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-pastel-peach flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-orange-600 shrink-0">{ann.author[0]}</div>
                                                        <span className="text-[10px] sm:text-xs text-text-muted truncate">{ann.author}</span>
                                                    </div>
                                                    <button className="flex items-center gap-1 text-[10px] sm:text-xs text-text-muted hover:text-text-primary transition-all group shrink-0">
                                                        <span className="hidden sm:inline">Acknowledge</span>
                                                        <span className="sm:hidden">OK</span>
                                                        <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </TechCard>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div key="polls" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3 sm:space-y-4">
                                {polls.map((poll, idx) => (
                                    <TechCard key={poll.id} delay={idx * 0.08} className="!p-4 sm:!p-6">
                                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                            <div className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg ${poll.active ? 'bg-pastel-green' : 'bg-surface'}`}>
                                                <Vote size={14} className={poll.active ? 'text-green-600' : 'text-text-light'} />
                                            </div>
                                            <span className={`text-[10px] sm:text-xs font-semibold ${poll.active ? 'text-green-600' : 'text-text-muted'}`}>
                                                {poll.active ? 'Active' : 'Closed'}
                                            </span>
                                        </div>
                                        <h4 className="text-base sm:text-lg font-bold text-text-primary mb-4 sm:mb-6">{poll.question}</h4>
                                        <div className="space-y-2 sm:space-y-3">
                                            {poll.options.map((option, oidx) => {
                                                const pct = Math.round((poll.votes[oidx] / poll.total) * 100);
                                                return (
                                                    <div key={oidx} className="group cursor-pointer">
                                                        <div className="flex justify-between items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-surface-border hover:border-text-primary/20 bg-surface-card hover:bg-surface-hover transition-all relative overflow-hidden">
                                                            <div className="absolute inset-y-0 left-0 bg-pastel-green/40 transition-all" style={{ width: `${pct}%` }} />
                                                            <div className="flex items-center gap-2 sm:gap-3 relative z-10 min-w-0">
                                                                {poll.active ? <Circle size={14} className="text-text-light shrink-0" /> : <CheckCircle2 size={14} className="text-green-500 shrink-0" />}
                                                                <span className="font-medium text-xs sm:text-sm text-text-primary truncate">{option}</span>
                                                            </div>
                                                            <span className="text-[10px] sm:text-xs font-semibold text-text-muted relative z-10 shrink-0 ml-2">{pct}%</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {poll.active && <Button variant="primary" className="w-full mt-4 sm:mt-5 text-xs sm:text-sm">Submit Vote</Button>}
                                    </TechCard>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sidebar */}
                <div className="xl:col-span-4 space-y-4 sm:space-y-6">
                    <h3 className="font-bold text-text-primary text-sm sm:text-base">Reminders</h3>
                    <TechCard delay={0.5} className="!p-4 sm:!p-5">
                        <div className="space-y-3 sm:space-y-5">
                            {[
                                { icon: Calendar, text: 'Monthly reconciliation due', time: 'Tomorrow', color: 'bg-pastel-pink', iconColor: 'text-red-500' },
                                { icon: MessageSquare, text: '2 messages pending', time: 'Today', color: 'bg-pastel-blue', iconColor: 'text-blue-600' },
                                { icon: User, text: 'New member joined', time: '1h ago', color: 'bg-pastel-green', iconColor: 'text-green-600' },
                            ].map((notif, i) => (
                                <div key={i} className="flex gap-3 sm:gap-4 items-start group cursor-pointer">
                                    <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${notif.color} shrink-0`}>
                                        <notif.icon size={14} className={notif.iconColor} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-medium text-text-primary truncate">{notif.text}</p>
                                        <span className="text-[10px] sm:text-xs text-text-muted">{notif.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TechCard>

                    <TechCard delay={0.6} className="!p-4 sm:!p-5 bg-pastel-lavender">
                        <h4 className="text-sm sm:text-base font-bold text-text-primary mb-1 sm:mb-2">Stay updated</h4>
                        <p className="text-[10px] sm:text-xs text-text-secondary leading-relaxed mb-3 sm:mb-4">Enable notifications for instant alerts.</p>
                        <Button variant="primary" className="text-xs sm:text-sm">Enable</Button>
                    </TechCard>
                </div>
            </div>
        </div>
    );
};
