import React from 'react';
import { Plus, TrendingDown, TrendingUp, Clock, AlertTriangle, MessageSquare, Zap, Activity, PieChart, Box, Wallet, CheckSquare, Package, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboard';
import { ExpenseModal } from '../components/ExpenseModal';
import { ChoreModal } from '../components/ChoreModal';
import { TechCard } from '../components/TechCard';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { StickyNotes } from '../components/StickyNotes';
import { DetailPopup, DetailRow } from '../components/DetailPopup';

const IconMap = { TrendingDown, TrendingUp, Clock, AlertTriangle, Zap, Activity, PieChart, Box };

const pastelColors = [
    { bg: 'bg-pastel-pink', text: 'text-pink-600' },
    { bg: 'bg-pastel-green', text: 'text-green-600' },
    { bg: 'bg-pastel-lavender', text: 'text-purple-600' },
    { bg: 'bg-pastel-peach', text: 'text-orange-600' },
];

const StatCard = ({ title, value, icon: iconName, trend, colorIndex = 0, onClick }) => {
    const Icon = IconMap[iconName] || TrendingDown;
    const color = pastelColors[colorIndex % pastelColors.length];
    return (
        <div className="p-1 sm:p-2 cursor-pointer" onClick={onClick}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`${color.bg} p-2 sm:p-2.5 rounded-lg sm:rounded-xl`}>
                    <Icon className={color.text} size={16} />
                </div>
                {trend && (
                    <div className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${trend > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </div>
                )}
            </div>
            <p className="text-[10px] sm:text-xs font-medium text-text-muted mb-0.5">{title}</p>
            <h3 className="text-lg sm:text-2xl font-bold text-text-primary">{value}</h3>
        </div>
    );
};

const ActivityItem = ({ type, title, amount, user, time, onClick }) => (
    <div onClick={onClick} className="flex items-center justify-between p-2.5 sm:p-3 hover:bg-surface-hover rounded-xl sm:rounded-2xl transition-all duration-300 group cursor-pointer">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-pastel-blue flex items-center justify-center shrink-0">
                <span className="text-blue-600 font-bold text-xs sm:text-sm">{user[0]}</span>
            </div>
            <div className="min-w-0">
                <h4 className="font-semibold text-xs sm:text-sm text-text-primary capitalize truncate">{title.toLowerCase()}</h4>
                <p className="text-[10px] sm:text-xs text-text-muted mt-0.5 truncate">{user} &bull; {time}</p>
            </div>
        </div>
        <div className="shrink-0 ml-2">
            {amount > 0 && <p className="font-bold text-text-primary text-xs sm:text-sm">&#8377;{amount}</p>}
        </div>
    </div>
);

const categoryConfig = [
    { label: 'Expenses', icon: Wallet, path: '/expenses', color: 'bg-pastel-pink', iconColor: 'text-pink-600', statKey: 'total_balance' },
    { label: 'Chores', icon: CheckSquare, path: '/chores', color: 'bg-pastel-green', iconColor: 'text-green-600', statKey: 'pending_chores' },
    { label: 'Inventory', icon: Package, path: '/inventory', color: 'bg-pastel-mint', iconColor: 'text-teal-600', statKey: 'inventory_alerts' },
    { label: 'Roommates', icon: Users, path: '/roommates', color: 'bg-pastel-lavender', iconColor: 'text-purple-600', statKey: 'room_members' },
];

export const Dashboard = () => {
    const [data, setData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = React.useState(false);
    const [isChoreModalOpen, setIsChoreModalOpen] = React.useState(false);
    const [selectedStat, setSelectedStat] = React.useState(null);
    const [selectedActivity, setSelectedActivity] = React.useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchSummary = async () => {
        try { const summary = await dashboardService.getSummary(); setData(summary); }
        catch (error) { console.error("Failed:", error); }
        finally { setLoading(false); }
    };

    React.useEffect(() => { fetchSummary(); }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 sm:w-10 sm:h-10 border-3 border-surface-muted border-t-text-primary rounded-full" />
        </div>
    );

    if (!data) return (
        <div className="text-center p-10 sm:p-20 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-pastel-pink rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <AlertTriangle size={24} className="text-red-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-2">Connection Error</h2>
            <p className="text-text-muted text-xs sm:text-sm">Unable to load dashboard data.</p>
        </div>
    );

    const firstName = data.user_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'User';
    const pendingCount = data.pending_chores_count ?? 0;

    return (
        <div className="max-w-6xl mx-auto">
            {/* Greeting */}
            <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-8 gap-2">
                <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                    <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-text-primary">Hi {firstName}</h2>
                    <p className="text-[10px] sm:text-sm text-text-muted mt-0.5">{pendingCount} tasks pending</p>
                </motion.div>
                <div className="flex gap-1.5 sm:gap-2 shrink-0">
                    <Button variant="secondary" icon={Plus} onClick={() => setIsExpenseModalOpen(true)} className="!px-2 sm:!px-4 !py-1.5 sm:!py-2.5 text-[10px] sm:text-xs">
                        <span className="hidden sm:inline">Expense</span>
                    </Button>
                    <Button variant="primary" icon={Plus} onClick={() => setIsChoreModalOpen(true)} className="!px-2 sm:!px-4 !py-1.5 sm:!py-2.5 text-[10px] sm:text-xs">
                        <span className="hidden sm:inline">Task</span>
                    </Button>
                </div>
            </div>

            {/* Categories — click navigates to page */}
            <div className="mb-4 sm:mb-8">
                <h3 className="font-bold text-text-primary text-xs sm:text-base mb-2 sm:mb-4">Categories</h3>
                <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-1.5 scrollbar-hide -mx-2.5 px-2.5 sm:mx-0 sm:px-0">
                    {categoryConfig.map((cat, idx) => (
                        <motion.div key={idx} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                            onClick={() => navigate(cat.path)}
                            className={`${cat.color} rounded-xl sm:rounded-3xl p-3 sm:p-5 cursor-pointer transition-all min-w-[100px] sm:min-w-[150px] flex-shrink-0 hover:shadow-card`}>
                            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/50 rounded-lg sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4">
                                <cat.icon size={16} className={`sm:w-[18px] sm:h-[18px] ${cat.iconColor}`} />
                            </div>
                            <h4 className="font-bold text-text-primary text-[11px] sm:text-sm">{cat.label}</h4>
                            <p className="text-[9px] sm:text-xs text-text-secondary mt-0.5">
                                {cat.statKey === 'total_balance' ? `₹${(data.total_room_expenses || 0).toLocaleString()}`
                                : cat.statKey === 'pending_chores' ? `${data.pending_chores_count || 0} Pending`
                                : cat.statKey === 'inventory_alerts' ? `${data.stats?.[3]?.value || 0} Items`
                                : `${data.room_members?.length || 0} Members`}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Sticky Notes */}
            {data.room_id && <StickyNotes roomId={data.room_id} />}

            {/* Stats Grid — click opens detail */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                {data.stats.map((stat, idx) => (
                    <TechCard key={idx} delay={idx * 0.08}>
                        <StatCard {...stat} colorIndex={idx} onClick={() => setSelectedStat(stat)} />
                    </TechCard>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6">
                {/* Activity Stream — click opens detail */}
                <div className="lg:col-span-8 space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-text-primary text-sm sm:text-base">Ongoing tasks</h3>
                        <button className="text-[10px] sm:text-xs font-semibold text-text-muted hover:text-text-primary transition-colors">See all</button>
                    </div>
                    <TechCard delay={0.3} className="min-h-[200px] sm:min-h-[400px] !p-2 sm:!p-4">
                        <div className="space-y-0.5 sm:space-y-1">
                            {data.recent_activity.length > 0 ? (
                                data.recent_activity.map((activity, idx) => (
                                    <ActivityItem key={idx} {...activity} onClick={() => setSelectedActivity(activity)} />
                                ))
                            ) : (
                                <div className="p-10 sm:p-20 text-center">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-surface rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                        <Activity size={20} className="text-text-light" />
                                    </div>
                                    <p className="text-text-muted text-xs sm:text-sm">No recent activity</p>
                                </div>
                            )}
                        </div>
                    </TechCard>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-4 space-y-4 sm:space-y-6">
                    <div>
                        <h3 className="font-bold text-text-primary text-sm sm:text-base mb-3 sm:mb-4">Quick Poll</h3>
                        <TechCard delay={0.5} className="!p-4 sm:!p-5">
                            <p className="font-semibold text-xs sm:text-sm mb-4 sm:mb-5 text-text-primary leading-relaxed">Upgrade to high-speed fiber connection?</p>
                            <div className="space-y-2 sm:space-y-3">
                                {[{ label: 'Yes, upgrade', percentage: 75 }, { label: 'No, keep current', percentage: 25 }].map((option) => (
                                    <button key={option.label} className="w-full relative p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface border border-surface-border hover:border-text-primary/20 transition-all text-left overflow-hidden group">
                                        <div className="absolute inset-y-0 left-0 bg-pastel-green/50 transition-all duration-700" style={{ width: `${option.percentage}%` }} />
                                        <div className="relative flex justify-between items-center z-10">
                                            <span className="font-semibold text-xs sm:text-sm text-text-primary">{option.label}</span>
                                            <span className="text-[10px] sm:text-xs font-semibold text-text-muted">{option.percentage}%</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <Button variant="primary" className="w-full mt-3 sm:mt-4 text-xs sm:text-sm">
                                <MessageSquare size={14} /> Vote Now
                            </Button>
                        </TechCard>
                    </div>

                    <div>
                        <h3 className="font-bold text-text-primary text-sm sm:text-base mb-3 sm:mb-4">Efficiency</h3>
                        <TechCard delay={0.6} className="text-center !py-6 sm:!py-8">
                            <div className="inline-block relative mb-3 sm:mb-4">
                                <svg className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90">
                                    <circle cx="50%" cy="50%" r="38%" stroke="#F0F0F0" strokeWidth="6" fill="transparent" />
                                    <circle cx="50%" cy="50%" r="38%" stroke="#1A1A2E" strokeWidth="6" fill="transparent" strokeDasharray="264" strokeDashoffset={264 * (1 - 0.92)} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl sm:text-3xl font-bold text-text-primary">92</span>
                                </div>
                            </div>
                            <p className="text-[10px] sm:text-xs text-text-muted">Great performance this month!</p>
                        </TechCard>
                    </div>
                </div>
            </div>

            {/* ====== POPUPS ====== */}

            {/* Stat Detail Popup */}
            <DetailPopup isOpen={!!selectedStat} onClose={() => setSelectedStat(null)} title="Stat Details">
                {selectedStat && (
                    <div>
                        <div className={`${pastelColors[(data.stats.indexOf(selectedStat)) % pastelColors.length]?.bg || 'bg-pastel-blue'} rounded-2xl p-5 mb-4 text-center`}>
                            <p className="text-xs text-text-secondary mb-1">{selectedStat.title}</p>
                            <h2 className="text-3xl font-bold text-text-primary">{selectedStat.value}</h2>
                            {selectedStat.trend && (
                                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${selectedStat.trend > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    {selectedStat.trend > 0 ? '+' : ''}{selectedStat.trend}% from last month
                                </span>
                            )}
                        </div>
                        <DetailRow label="Category" value={selectedStat.title} icon={Activity} color="bg-pastel-blue" />
                        <DetailRow label="Current Value" value={selectedStat.value} icon={TrendingUp} color="bg-pastel-green" />
                        <DetailRow label="Change" value={selectedStat.trend ? `${selectedStat.trend}%` : 'N/A'} icon={TrendingDown} color="bg-pastel-peach" />
                        <DetailRow label="Period" value="This Month" icon={Clock} color="bg-pastel-lavender" />
                    </div>
                )}
            </DetailPopup>

            {/* Activity Detail Popup */}
            <DetailPopup isOpen={!!selectedActivity} onClose={() => setSelectedActivity(null)} title="Activity Details">
                {selectedActivity && (
                    <div>
                        <div className="bg-pastel-blue rounded-2xl p-5 mb-4 flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/60 rounded-2xl flex items-center justify-center text-xl font-bold text-blue-600">
                                {selectedActivity.user?.[0]}
                            </div>
                            <div>
                                <h3 className="font-bold text-text-primary capitalize">{selectedActivity.title?.toLowerCase()}</h3>
                                <p className="text-xs text-text-secondary mt-0.5">by {selectedActivity.user}</p>
                            </div>
                        </div>
                        <DetailRow label="Type" value={selectedActivity.type || 'Activity'} icon={Activity} color="bg-pastel-green" />
                        <DetailRow label="By" value={selectedActivity.user} icon={Users} color="bg-pastel-pink" />
                        {selectedActivity.amount > 0 && (
                            <DetailRow label="Amount" value={`₹${selectedActivity.amount}`} icon={Wallet} color="bg-pastel-peach" />
                        )}
                        <DetailRow label="Time" value={selectedActivity.time} icon={Clock} color="bg-pastel-lavender" />
                    </div>
                )}
            </DetailPopup>

            {/* Modals */}
            {data.room_id && (
                <>
                    <ExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} roomId={data.room_id} members={data.room_members} onRefresh={fetchSummary} />
                    <ChoreModal isOpen={isChoreModalOpen} onClose={() => setIsChoreModalOpen(false)} roomId={data.room_id} members={data.room_members} onRefresh={fetchSummary} />
                </>
            )}
        </div>
    );
};
