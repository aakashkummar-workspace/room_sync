import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, IndianRupee, ArrowUpRight, ArrowDownLeft, Activity, Tag, CheckCircle2, Calendar, User, Clock } from 'lucide-react';
import { TechCard } from '../components/TechCard';
import { Button } from '../components/Button';
import { ExpenseModal } from '../components/ExpenseModal';
import { expenseService } from '../services/expense';
import { dashboardService } from '../services/dashboard';
import { useAuth } from '../hooks/useAuth';
import { DetailPopup, DetailRow } from '../components/DetailPopup';

export const Expenses = () => {
    const { user: currentUser } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [selectedExpense, setSelectedExpense] = useState(null);

    const fetchData = async () => {
        try {
            const summary = await dashboardService.getSummary();
            setDashboardData(summary);
            if (summary.room_id) { const data = await expenseService.getRoomExpenses(summary.room_id); setExpenses(data.reverse()); }
        } catch (error) { console.error("Failed:", error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const totalSharedSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    let myLiability = 0, myReceivable = 0;
    expenses.forEach(exp => {
        const mySplit = exp.splits?.find(s => s.user_id === currentUser?.id);
        if (exp.paid_by === currentUser?.id) {
            myReceivable += exp.splits?.filter(s => s.user_id !== currentUser?.id && !s.is_paid).reduce((sum, s) => sum + s.amount_owed, 0) || 0;
        } else if (mySplit && !mySplit.is_paid) { myLiability += mySplit.amount_owed; }
    });

    const handleSettle = async (splitId) => {
        try { await expenseService.settleSplit(splitId); fetchData(); } catch (error) { console.error("Failed:", error); }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 sm:w-10 sm:h-10 border-3 border-surface-muted border-t-text-primary rounded-full" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto">
            <div className="page-header">
                <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
                    <h2 className="page-title">Expenses</h2>
                    <p className="page-subtitle">Track and manage shared spending</p>
                </motion.div>
                <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)} className="text-xs sm:text-sm self-start sm:self-auto">Add Expense</Button>
            </div>

            {/* Pastel Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-8">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-pastel-blue rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-soft cursor-pointer hover:shadow-card transition-all"
                    onClick={() => setSelectedExpense({ _type: 'stat', label: 'Total Shared Spent', value: totalSharedSpent, color: 'blue' })}>
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/60 rounded-2xl flex items-center justify-center">
                            <IndianRupee size={22} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-blue-800/60 font-medium mb-0.5">Total Shared Spent</p>
                            <p className="text-2xl sm:text-3xl font-bold text-blue-900">&#8377;{totalSharedSpent.toLocaleString()}</p>
                        </div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-pastel-pink rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-soft cursor-pointer hover:shadow-card transition-all"
                    onClick={() => setSelectedExpense({ _type: 'stat', label: 'Your Liability', value: myLiability, color: 'red' })}>
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/60 rounded-2xl flex items-center justify-center">
                            <ArrowDownLeft size={22} className="text-red-500" />
                        </div>
                        <div>
                            <p className="text-xs text-red-800/60 font-medium mb-0.5">Your Liability</p>
                            <p className="text-2xl sm:text-3xl font-bold text-red-600">&#8377;{myLiability.toLocaleString()}</p>
                        </div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-pastel-green rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-soft cursor-pointer hover:shadow-card transition-all"
                    onClick={() => setSelectedExpense({ _type: 'stat', label: 'Your Receivable', value: myReceivable, color: 'green' })}>
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/60 rounded-2xl flex items-center justify-center">
                            <ArrowUpRight size={22} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-green-800/60 font-medium mb-0.5">Your Receivable</p>
                            <p className="text-2xl sm:text-3xl font-bold text-green-700">&#8377;{myReceivable.toLocaleString()}</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Transaction List */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
                <div className="xl:col-span-8">
                    <h3 className="font-bold text-text-primary text-sm sm:text-base mb-3 sm:mb-4">Transactions</h3>
                    <TechCard delay={0.4} className="min-h-[300px] sm:min-h-[400px] !p-2 sm:!p-4">
                        <div className="overflow-x-auto scrollbar-hide">
                            <table className="w-full text-left min-w-[500px]">
                                <thead>
                                    <tr className="text-[10px] sm:text-xs text-text-muted border-b border-surface-border">
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold">Item</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold hidden sm:table-cell">Category</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold">Status</th>
                                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-right font-semibold">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.length > 0 ? expenses.map((exp, idx) => {
                                        const isPayer = exp.paid_by === currentUser?.id;
                                        const rowColors = ['bg-pastel-pink/30', 'bg-pastel-green/30', 'bg-pastel-lavender/30', 'bg-pastel-peach/30', 'bg-pastel-blue/30'];
                                        return (
                                            <tr key={exp.id} onClick={() => setSelectedExpense(exp)}
                                                className="group hover:bg-surface-hover transition-colors border-b border-surface-border/50 last:border-0 cursor-pointer">
                                                <td className="px-3 sm:px-4 py-3 sm:py-4">
                                                    <div className="flex items-center gap-2.5 sm:gap-3">
                                                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${rowColors[idx % rowColors.length]} flex items-center justify-center shrink-0`}>
                                                            <Tag size={15} className="text-text-secondary" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-xs sm:text-sm text-text-primary truncate">{exp.title}</p>
                                                            <p className="text-[10px] sm:text-xs text-text-muted truncate">{new Date(exp.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} &bull; {isPayer ? 'You' : exp.paid_by_name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-4 py-3 sm:py-4 hidden sm:table-cell">
                                                    <span className="badge bg-pastel-cream text-orange-700">{exp.category || 'General'}</span>
                                                </td>
                                                <td className="px-3 sm:px-4 py-3 sm:py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {exp.splits?.map(split => {
                                                            const splitUserIsMe = split.user_id === currentUser?.id;
                                                            return (
                                                                <div key={split.id} className="relative group/split">
                                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold relative ${split.is_paid ? 'bg-pastel-green text-green-700' : 'bg-pastel-peach text-orange-600'}`}>
                                                                        {splitUserIsMe ? 'ME' : (split.user_id?.toString()[0] || 'U')}
                                                                        {split.is_paid && <CheckCircle2 size={9} className="absolute -top-0.5 -right-0.5 text-green-500" />}
                                                                    </div>
                                                                    {isPayer && !split.is_paid && !splitUserIsMe && (
                                                                        <button onClick={(e) => { e.stopPropagation(); handleSettle(split.id); }}
                                                                            className="absolute inset-0 bg-green-500 opacity-0 hover:opacity-100 rounded-lg flex items-center justify-center text-[8px] text-white font-bold transition-opacity">OK</button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-4 py-3 sm:py-4 text-right">
                                                    <span className="font-bold text-text-primary text-sm sm:text-base">&#8377;{exp.amount}</span>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan="4" className="px-4 py-16 sm:py-20 text-center"><p className="text-text-muted text-xs sm:text-sm">No expenses yet</p></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </TechCard>
                </div>

                {/* Sidebar */}
                <div className="xl:col-span-4 space-y-4 sm:space-y-6">
                    <h3 className="font-bold text-text-primary text-sm sm:text-base">Settlement</h3>
                    <TechCard delay={0.5} className="!p-4 sm:!p-5">
                        <div className="space-y-3 sm:space-y-4">
                            <div className="p-4 rounded-2xl bg-pastel-pink flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center"><ArrowDownLeft size={18} className="text-red-500" /></div>
                                    <span className="text-sm font-semibold text-red-800/70">Liability</span>
                                </div>
                                <span className="font-bold text-xl text-red-600">&#8377;{myLiability.toLocaleString()}</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-pastel-green flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center"><ArrowUpRight size={18} className="text-green-600" /></div>
                                    <span className="text-sm font-semibold text-green-800/70">Receivable</span>
                                </div>
                                <span className="font-bold text-xl text-green-700">&#8377;{myReceivable.toLocaleString()}</span>
                            </div>
                        </div>
                    </TechCard>

                    <div className="bg-pastel-cream rounded-2xl sm:rounded-3xl p-5 shadow-soft">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity size={15} className="text-orange-500" />
                            <p className="text-xs font-semibold text-orange-700/70">Insight</p>
                        </div>
                        <h4 className="text-base font-bold text-text-primary mb-1">Spending on track</h4>
                        <p className="text-xs text-text-muted leading-relaxed">Monthly consumption is within normal range.</p>
                    </div>
                </div>
            </div>

            {/* Expense Detail Popup */}
            <DetailPopup isOpen={!!selectedExpense} onClose={() => setSelectedExpense(null)}
                title={selectedExpense?._type === 'stat' ? selectedExpense?.label : 'Expense Details'}>
                {selectedExpense && selectedExpense._type === 'stat' ? (
                    <div>
                        <div className={`${selectedExpense.color === 'blue' ? 'bg-pastel-blue' : selectedExpense.color === 'red' ? 'bg-pastel-pink' : 'bg-pastel-green'} rounded-2xl p-6 mb-4 text-center`}>
                            <h2 className="text-4xl font-bold text-text-primary">&#8377;{selectedExpense.value.toLocaleString()}</h2>
                            <p className="text-xs text-text-secondary mt-2">{selectedExpense.label}</p>
                        </div>
                        <DetailRow label="Total Expenses" value={expenses.length} icon={Tag} color="bg-pastel-peach" />
                        <DetailRow label="Total Shared" value={`₹${totalSharedSpent.toLocaleString()}`} icon={IndianRupee} color="bg-pastel-blue" />
                        <DetailRow label="Your Liability" value={`₹${myLiability.toLocaleString()}`} icon={ArrowDownLeft} color="bg-pastel-pink" />
                        <DetailRow label="Your Receivable" value={`₹${myReceivable.toLocaleString()}`} icon={ArrowUpRight} color="bg-pastel-green" />
                    </div>
                ) : selectedExpense ? (
                    <div>
                        <div className="bg-pastel-peach rounded-2xl p-5 mb-4">
                            <h3 className="text-lg font-bold text-text-primary mb-1">{selectedExpense.title}</h3>
                            <p className="text-3xl font-bold text-orange-800">&#8377;{selectedExpense.amount}</p>
                        </div>
                        <DetailRow label="Category" value={selectedExpense.category || 'General'} icon={Tag} color="bg-pastel-cream" />
                        <DetailRow label="Paid by" value={selectedExpense.paid_by === currentUser?.id ? 'You' : (selectedExpense.paid_by_name || 'Member')} icon={User} color="bg-pastel-blue" />
                        <DetailRow label="Date" value={new Date(selectedExpense.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} icon={Calendar} color="bg-pastel-lavender" />
                        <DetailRow label="Split among" value={`${selectedExpense.splits?.length || 0} people`} icon={User} color="bg-pastel-green" />
                        {selectedExpense.splits && (
                            <div className="mt-4">
                                <p className="text-xs font-semibold text-text-muted mb-3">Split breakdown</p>
                                <div className="space-y-2">
                                    {selectedExpense.splits.map(split => (
                                        <div key={split.id} className={`flex items-center justify-between p-3 rounded-xl ${split.is_paid ? 'bg-pastel-green/50' : 'bg-pastel-peach/50'}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${split.is_paid ? 'bg-green-200 text-green-700' : 'bg-orange-200 text-orange-700'}`}>
                                                    {split.user_id === currentUser?.id ? 'ME' : (split.user_id?.toString()[0] || 'U')}
                                                </div>
                                                <span className="text-xs font-medium text-text-secondary">
                                                    {split.user_id === currentUser?.id ? 'You' : `Member #${split.user_id}`}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-text-primary">₹{split.amount_owed}</span>
                                                {split.is_paid ? (
                                                    <span className="badge bg-green-100 text-green-600 text-[9px]">Paid</span>
                                                ) : (
                                                    <span className="badge bg-orange-100 text-orange-600 text-[9px]">Pending</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}
            </DetailPopup>

            {dashboardData && (
                <ExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} roomId={dashboardData.room_id} members={dashboardData.room_members} onRefresh={fetchData} />
            )}
        </div>
    );
};
