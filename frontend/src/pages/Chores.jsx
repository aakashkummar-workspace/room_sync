import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckCircle2, Circle, Clock, Calendar, User as UserIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { ChoreModal } from '../components/ChoreModal';
import { choreService } from '../services/chore';
import { dashboardService } from '../services/dashboard';
import { DetailPopup, DetailRow } from '../components/DetailPopup';

export const Chores = () => {
    const [chores, setChores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [selectedChore, setSelectedChore] = useState(null);

    const fetchData = async () => {
        try {
            const summary = await dashboardService.getSummary();
            setDashboardData(summary);
            if (summary.room_id) { const data = await choreService.getRoomChores(summary.room_id); setChores(data); }
        } catch (error) { console.error("Failed:", error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 sm:w-10 sm:h-10 border-3 border-surface-muted border-t-text-primary rounded-full" />
        </div>
    );

    const pendingChores = chores.filter(c => c.status === 'pending');
    const completedChores = chores.filter(c => c.status === 'completed');
    const choreCardColors = ['bg-pastel-pink', 'bg-pastel-green', 'bg-pastel-lavender', 'bg-pastel-peach', 'bg-pastel-blue', 'bg-pastel-mint'];

    const getAssigneeName = (id) => dashboardData?.room_members?.find(m => m.id === id)?.name || 'Unassigned';

    return (
        <div className="max-w-6xl mx-auto">
            <div className="page-header">
                <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
                    <h2 className="page-title">Chores</h2>
                    <p className="page-subtitle">Manage household tasks</p>
                </motion.div>
                <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)} className="text-xs sm:text-sm self-start sm:self-auto">New Task</Button>
            </div>

            {/* Colorful Stat Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5 sm:mb-8">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-pastel-peach rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center shadow-soft">
                    <p className="text-[10px] sm:text-xs text-orange-700/60 font-medium mb-1">Pending</p>
                    <h3 className="text-3xl sm:text-4xl font-bold text-orange-800">{pendingChores.length}</h3>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="bg-pastel-green rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center shadow-soft">
                    <p className="text-[10px] sm:text-xs text-green-700/60 font-medium mb-1">Done</p>
                    <h3 className="text-3xl sm:text-4xl font-bold text-green-700">{completedChores.length}</h3>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-pastel-lavender rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center shadow-soft">
                    <p className="text-[10px] sm:text-xs text-purple-700/60 font-medium mb-1">Score</p>
                    <h3 className="text-3xl sm:text-4xl font-bold text-purple-800">85%</h3>
                </motion.div>
            </div>

            {/* Pending — click opens detail */}
            <section className="mb-6 sm:mb-10">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <Clock size={16} className="text-text-muted" />
                    <h3 className="font-bold text-text-primary text-sm sm:text-base">Active Tasks</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {pendingChores.length > 0 ? pendingChores.map((chore, idx) => (
                        <motion.div key={chore.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + (idx * 0.08) }}
                            onClick={() => setSelectedChore(chore)}
                            className={`${choreCardColors[idx % choreCardColors.length]} rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-soft hover:shadow-card transition-all cursor-pointer`}>
                            <div className="flex items-start gap-3 sm:gap-4">
                                <div className="mt-0.5 text-text-secondary/40 shrink-0">
                                    <Circle size={22} strokeWidth={2} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm sm:text-base text-text-primary">{chore.title}</h4>
                                    <div className="flex flex-wrap gap-3 sm:gap-4 mt-2 sm:mt-3">
                                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-text-secondary/70">
                                            <Calendar size={12} />
                                            <span>{new Date(chore.due_date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-text-secondary/70">
                                            <UserIcon size={12} />
                                            <span className="truncate max-w-[100px]">{getAssigneeName(chore.assigned_to)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-10 h-10 bg-white/50 rounded-xl flex items-center justify-center shrink-0">
                                    <span className="text-[10px] font-bold text-text-secondary">#{idx + 1}</span>
                                </div>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="sm:col-span-2 p-10 sm:p-16 text-center bg-pastel-green/30 rounded-2xl sm:rounded-3xl">
                            <CheckCircle2 size={36} className="text-green-400 mx-auto mb-2 sm:mb-3" />
                            <p className="text-green-700 text-sm font-medium">All tasks completed!</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Completed — click opens detail */}
            {completedChores.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <CheckCircle2 size={16} className="text-green-500" />
                        <h3 className="font-bold text-text-primary text-sm sm:text-base">Completed</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {completedChores.map((chore) => (
                            <div key={chore.id} onClick={() => setSelectedChore(chore)}
                                className="bg-pastel-green/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 opacity-70 cursor-pointer hover:opacity-90 transition-all">
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <CheckCircle2 size={22} className="text-green-500 mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                        <h4 className="font-semibold text-xs sm:text-sm text-text-secondary line-through truncate">{chore.title}</h4>
                                        <p className="text-[10px] sm:text-xs text-text-muted mt-1">Completed</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Chore Detail Popup */}
            <DetailPopup isOpen={!!selectedChore} onClose={() => setSelectedChore(null)} title="Task Details">
                {selectedChore && (
                    <div>
                        <div className={`${selectedChore.status === 'completed' ? 'bg-pastel-green' : 'bg-pastel-peach'} rounded-2xl p-5 mb-4`}>
                            <h3 className="text-lg font-bold text-text-primary mb-2">{selectedChore.title}</h3>
                            <span className={`badge ${selectedChore.status === 'completed' ? 'bg-green-200 text-green-700' : 'bg-orange-200 text-orange-700'}`}>
                                {selectedChore.status === 'completed' ? 'Completed' : 'Pending'}
                            </span>
                        </div>
                        <DetailRow label="Assigned to" value={getAssigneeName(selectedChore.assigned_to)} icon={UserIcon} color="bg-pastel-blue" />
                        <DetailRow label="Due date" value={new Date(selectedChore.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} icon={Calendar} color="bg-pastel-lavender" />
                        <DetailRow label="Status" value={selectedChore.status} icon={Clock} color="bg-pastel-peach" />
                        <DetailRow label="Created" value={selectedChore.created_at ? new Date(selectedChore.created_at).toLocaleDateString() : 'N/A'} icon={Calendar} color="bg-pastel-pink" />
                    </div>
                )}
            </DetailPopup>

            {dashboardData && (
                <ChoreModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} roomId={dashboardData.room_id} members={dashboardData.room_members} onRefresh={fetchData} />
            )}
        </div>
    );
};
