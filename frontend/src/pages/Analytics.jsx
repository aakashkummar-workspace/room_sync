import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Download, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { Button } from '../components/Button';
import { dashboardService } from '../services/dashboard';
import { expenseService } from '../services/expense';

export const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState([]);

    const fetchData = async () => {
        try {
            const summary = await dashboardService.getSummary();
            if (summary.room_id) { const data = await expenseService.getRoomExpenses(summary.room_id); setExpenses(data); }
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

    const categories = ['Utilities', 'Rent', 'Groceries', 'Entertainment', 'Others'];
    const categoryData = categories.map(cat => ({
        label: cat, value: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
    })).filter(d => d.value > 0);
    const totalSpent = categoryData.reduce((sum, d) => sum + d.value, 0);

    const statCards = [
        { label: 'Monthly avg', value: `₹${(totalSpent || 12000).toLocaleString()}`, trend: '+12.5%', isUp: false, bg: 'bg-pastel-blue', trendBg: 'bg-orange-100 text-orange-600', textColor: 'text-blue-900' },
        { label: 'Top category', value: categoryData[0]?.label || 'Groceries', trend: 'Stable', isUp: true, bg: 'bg-pastel-green', trendBg: 'bg-green-200/60 text-green-700', textColor: 'text-green-900' },
        { label: 'Savings', value: '₹2,400', trend: '+8%', isUp: true, bg: 'bg-pastel-lavender', trendBg: 'bg-purple-200/60 text-purple-700', textColor: 'text-purple-900' },
        { label: 'Compliance', value: '94%', trend: '+2%', isUp: true, bg: 'bg-pastel-peach', trendBg: 'bg-green-200/60 text-green-700', textColor: 'text-orange-900' },
    ];

    const barColors = ['bg-pink-400', 'bg-blue-400', 'bg-purple-400', 'bg-orange-400', 'bg-green-400'];
    const barBgColors = ['bg-pastel-pink', 'bg-pastel-blue', 'bg-pastel-lavender', 'bg-pastel-peach', 'bg-pastel-green'];
    const chartBarColors = ['bg-pastel-pink', 'bg-pastel-blue', 'bg-pastel-lavender', 'bg-pastel-peach', 'bg-pastel-green', 'bg-pastel-mint', 'bg-pastel-cream', 'bg-pastel-pink', 'bg-pastel-blue', 'bg-pastel-lavender', 'bg-pastel-peach', 'bg-pastel-green'];

    return (
        <div className="max-w-6xl mx-auto">
            <div className="page-header">
                <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
                    <h2 className="page-title">Analytics</h2>
                    <p className="page-subtitle">Insights and spending patterns</p>
                </motion.div>
                <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
                    <Button variant="secondary" icon={Download} className="text-[10px] sm:text-xs !px-3 sm:!px-4">Export</Button>
                    <Button variant="primary" icon={Calendar} className="text-[10px] sm:text-xs !px-3 sm:!px-4">This Month</Button>
                </div>
            </div>

            {/* Colorful Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-5 sm:mb-8">
                {statCards.map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                        className={`${stat.bg} rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-soft`}>
                        <p className="text-[10px] sm:text-xs text-text-secondary/60 font-medium mb-1">{stat.label}</p>
                        <h3 className={`text-lg sm:text-2xl font-bold ${stat.textColor} mb-2 sm:mb-3 truncate`}>{stat.value}</h3>
                        <div className={`inline-flex items-center gap-1 text-[9px] sm:text-xs font-semibold py-0.5 px-2 rounded-full ${stat.trendBg}`}>
                            {stat.isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                            {stat.trend}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
                <div className="xl:col-span-8">
                    <h3 className="font-bold text-text-primary text-sm sm:text-base mb-3 sm:mb-4">Spending by Category</h3>
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="bg-surface-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card min-h-[280px] sm:min-h-[380px]">
                        <div className="space-y-5 sm:space-y-6 mt-1 sm:mt-2">
                            {categoryData.length > 0 ? categoryData.map((data, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${barColors[i % barColors.length]}`} />
                                            <span className="text-xs sm:text-sm font-medium text-text-secondary">{data.label}</span>
                                        </div>
                                        <span className="text-sm sm:text-base font-bold text-text-primary">₹{data.value.toLocaleString()}</span>
                                    </div>
                                    <div className={`h-3 sm:h-4 ${barBgColors[i % barBgColors.length]} rounded-full overflow-hidden`}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${(data.value / totalSpent) * 100}%` }}
                                            transition={{ duration: 1.2, delay: i * 0.1 }}
                                            className={`h-full rounded-full ${barColors[i % barColors.length]}`} />
                                    </div>
                                </div>
                            )) : (
                                <div className="py-16 sm:py-20 text-center">
                                    <Activity size={28} className="text-text-light mx-auto mb-3" />
                                    <p className="text-text-muted text-xs sm:text-sm">No spending data yet</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                <div className="xl:col-span-4 space-y-4 sm:space-y-6">
                    {/* Efficiency */}
                    <div>
                        <h3 className="font-bold text-text-primary text-sm sm:text-base mb-3 sm:mb-4">Efficiency Score</h3>
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                            className="bg-pastel-mint rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-soft">
                            <div className="flex flex-col items-center">
                                <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center mb-3 sm:mb-4">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="50%" cy="50%" r="40%" className="stroke-white/60 fill-none" strokeWidth="10" />
                                        <motion.circle cx="50%" cy="50%" r="40%" className="stroke-teal-500 fill-none" strokeWidth="10"
                                            strokeDasharray="352" strokeLinecap="round"
                                            initial={{ strokeDashoffset: 352 }} animate={{ strokeDashoffset: 352 * (1 - 0.85) }}
                                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.8 }} />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl sm:text-4xl font-bold text-teal-800">85</span>
                                        <span className="text-[10px] sm:text-xs text-teal-600 font-medium">Great</span>
                                    </div>
                                </div>
                                <p className="text-[10px] sm:text-xs text-teal-700/60 text-center font-medium">Top 5th percentile efficiency</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Spending Pattern */}
                    <div>
                        <h3 className="font-bold text-text-primary text-sm sm:text-base mb-3 sm:mb-4">Spending Pattern</h3>
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                            className="bg-surface-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-card">
                            <div className="flex items-end justify-between gap-1.5 h-28 sm:h-32 px-1">
                                {[40, 60, 30, 80, 50, 90, 70, 45, 30, 40, 60, 50].map((h, i) => (
                                    <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }}
                                        transition={{ duration: 1, delay: 1 + (i * 0.04) }}
                                        className={`w-full rounded-t-md ${chartBarColors[i]} hover:opacity-70 transition-all cursor-pointer`} />
                                ))}
                            </div>
                            <div className="flex justify-between mt-3 px-1 text-[8px] sm:text-[10px] text-text-muted">
                                <span>6am</span><span>12pm</span><span>6pm</span><span>12am</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};
