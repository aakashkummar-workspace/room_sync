import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Mail, Phone, Shield, Copy, Check, MessageSquare, Edit2, Save, Calendar, Star, Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import { dashboardService } from '../services/dashboard';
import { authService } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import { DetailPopup, DetailRow } from '../components/DetailPopup';
import { InviteMemberModal } from '../components/InviteMemberModal';

export const Roommates = () => {
    const { user: currentUser } = useAuth();
    const [members, setMembers] = useState([]);
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [editingPhone, setEditingPhone] = useState(false);
    const [newPhone, setNewPhone] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [roomId, setRoomId] = useState(null);

    const fetchData = async () => {
        try {
            const summary = await dashboardService.getSummary();
            setMembers(summary.room_members || []);
            setInviteCode(summary.invite_code || 'ROOM123');
            setRoomId(summary.room_id);
            const me = (summary.room_members || []).find(m => m.id === currentUser?.id);
            if (me) setNewPhone(me.phone || '');
        } catch (error) { console.error("Failed:", error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [currentUser]);

    const copyInviteCode = () => { navigator.clipboard.writeText(inviteCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

    const handleUpdatePhone = async () => {
        try { await authService.updateProfile({ phone: newPhone }); setEditingPhone(false); fetchData(); }
        catch (error) { console.error("Failed:", error); }
    };

    const isCurrentUserAdmin = members.length > 0 && members[0]?.id === currentUser?.id;

    const handleRemoveMember = async (userId) => {
        if (!roomId || !isCurrentUserAdmin) return;
        if (!window.confirm('Are you sure you want to remove this member from the room?')) return;
        try {
            const api = (await import('../services/api')).default;
            await api.delete(`/rooms/${roomId}/members/${userId}`);
            setSelectedMember(null);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.detail || 'Failed to remove member');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 sm:w-10 sm:h-10 border-3 border-surface-muted border-t-text-primary rounded-full" />
        </div>
    );

    const cardColors = ['bg-pastel-pink', 'bg-pastel-green', 'bg-pastel-lavender', 'bg-pastel-peach', 'bg-pastel-blue', 'bg-pastel-mint'];
    const avatarTextColors = ['text-pink-600', 'text-green-600', 'text-purple-600', 'text-orange-600', 'text-blue-600', 'text-teal-600'];

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col gap-3 sm:gap-4 mb-5 sm:mb-8">
                <div className="page-header !mb-0">
                    <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
                        <h2 className="page-title">Roommates</h2>
                        <p className="page-subtitle">Manage your household members</p>
                    </motion.div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-2 bg-pastel-cream rounded-xl sm:rounded-2xl shadow-soft self-start">
                    <div className="px-3 sm:px-4 py-1">
                        <p className="text-[9px] sm:text-[10px] text-orange-700/60 mb-0.5">Invite Code</p>
                        <p className="text-sm sm:text-base font-bold text-orange-800 tracking-wider">{inviteCode}</p>
                    </div>
                    <button onClick={copyInviteCode}
                        className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all ${copied ? 'bg-pastel-green text-green-600' : 'bg-white/60 hover:bg-white text-text-muted'}`}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                </div>
            </div>

            {/* Members Grid — click opens detail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-10">
                {members.map((member, index) => {
                    const isMe = member.id === currentUser?.id;
                    const bgColor = cardColors[index % cardColors.length];
                    return (
                        <motion.div key={member.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
                            onClick={() => setSelectedMember({ ...member, index })}
                            className={`${bgColor} rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-soft hover:shadow-card transition-all relative overflow-hidden cursor-pointer group`}>
                            {isMe ? (
                                <div className="absolute top-0 right-0 px-2 sm:px-3 py-0.5 sm:py-1 bg-white/60 rounded-bl-xl">
                                    <span className="text-[9px] sm:text-[10px] font-semibold text-text-secondary">You</span>
                                </div>
                            ) : isCurrentUserAdmin && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleRemoveMember(member.id); }}
                                    className="absolute top-2 right-2 p-1.5 sm:p-2 bg-white/60 hover:bg-red-100 rounded-lg sm:rounded-xl text-text-light hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                    title="Remove member"
                                >
                                    <Trash2 size={13} />
                                </button>
                            )}
                            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/60 flex items-center justify-center text-lg sm:text-xl font-bold ${avatarTextColors[index % avatarTextColors.length]} shrink-0`}>
                                    {member.name?.[0].toUpperCase() || 'U'}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-base sm:text-lg font-semibold text-text-primary truncate">{member.name}</h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        {index === 0 ? <Star size={11} className="text-orange-500" fill="currentColor" /> : <Shield size={11} className="text-text-secondary/40" />}
                                        <p className={`text-[10px] sm:text-xs ${index === 0 ? 'text-orange-600 font-semibold' : 'text-text-secondary/60'}`}>{index === 0 ? 'Admin' : 'Teammate'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 sm:space-y-3 pb-3 sm:pb-5 border-b border-black/5">
                                <div className="flex items-center gap-2 sm:gap-3 text-text-secondary/70">
                                    <Mail size={14} className="shrink-0" />
                                    <span className="text-[10px] sm:text-xs truncate">{member.email}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 sm:gap-3 text-text-secondary/70 min-w-0">
                                        <Phone size={14} className="shrink-0" />
                                        {isMe && editingPhone ? (
                                            <input type="text" value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="bg-white/60 border-0 rounded-lg px-2 py-1 text-[10px] sm:text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-black/10 w-full min-w-0"
                                                placeholder="Phone" autoFocus />
                                        ) : (
                                            <span className="text-[10px] sm:text-xs truncate">{member.phone || 'Not added'}</span>
                                        )}
                                    </div>
                                    {isMe && (
                                        <button onClick={(e) => { e.stopPropagation(); editingPhone ? handleUpdatePhone() : setEditingPhone(true); }}
                                            className="p-1.5 rounded-lg hover:bg-white/40 text-text-secondary/40 hover:text-text-primary transition-all shrink-0">
                                            {editingPhone ? <Save size={13} /> : <Edit2 size={13} />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="pt-3 sm:pt-4 flex gap-2 sm:gap-3">
                                <button onClick={(e) => { e.stopPropagation(); member.phone && window.open(`https://wa.me/${member.phone.replace(/\D/g, '')}`, '_blank'); }}
                                    disabled={!member.phone}
                                    className="flex-1 py-2.5 bg-white/50 hover:bg-white/80 rounded-xl flex items-center justify-center transition-all disabled:opacity-30">
                                    <MessageSquare size={16} className="text-text-secondary" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); member.phone && (window.location.href = `tel:${member.phone}`); }}
                                    disabled={!member.phone}
                                    className="flex-1 py-2.5 bg-white/50 hover:bg-white/80 rounded-xl flex items-center justify-center transition-all disabled:opacity-30">
                                    <Phone size={16} className="text-text-secondary" />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: members.length * 0.08 }}
                    onClick={() => setIsInviteModalOpen(true)}
                    className="border-2 border-dashed border-surface-muted rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center py-8 sm:py-12 gap-3 sm:gap-4 cursor-pointer hover:bg-pastel-mint/30 hover:border-teal-300 group transition-all">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-surface border border-surface-border flex items-center justify-center text-text-light group-hover:text-teal-500 group-hover:bg-pastel-mint transition-all">
                        <UserPlus size={22} />
                    </div>
                    <div className="text-center">
                        <h4 className="font-semibold text-sm text-text-secondary group-hover:text-text-primary transition-all">Add Roommate</h4>
                        <p className="text-[10px] sm:text-xs text-text-muted mt-0.5">Invite by email</p>
                    </div>
                </motion.div>
            </div>

            {/* Contribution */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="bg-surface-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card">
                    <div className="flex items-center gap-2 mb-4 sm:mb-6">
                        <Users size={16} className="text-text-muted" />
                        <h3 className="font-bold text-text-primary text-sm sm:text-base">Contribution</h3>
                    </div>
                    <div className="space-y-4 sm:space-y-5">
                        {members.map((member, index) => {
                            const barColor = ['bg-pink-300', 'bg-green-400', 'bg-purple-300', 'bg-orange-300', 'bg-blue-300'][index % 5];
                            const barBg = cardColors[index % cardColors.length];
                            return (
                                <div key={member.id} className="space-y-1.5 sm:space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs sm:text-sm font-medium text-text-secondary truncate mr-2">{member.name}</span>
                                        <span className="text-[10px] sm:text-xs font-semibold text-text-muted shrink-0">{92 - (index * 12)}%</span>
                                    </div>
                                    <div className={`h-2.5 sm:h-3 ${barBg} rounded-full overflow-hidden`}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${92 - (index * 12)}%` }}
                                            transition={{ duration: 1.5, delay: 0.5 }} className={`h-full rounded-full ${barColor}`} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                    className="bg-pastel-mint rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-soft relative overflow-hidden">
                    <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-2 sm:mb-3">All synced!</h3>
                    <p className="text-xs sm:text-sm text-teal-800/60 leading-relaxed mb-4 sm:mb-6">All members are active and contributing.</p>
                    <Button variant="primary" className="text-xs sm:text-sm">View Agreement</Button>
                    <Users className="absolute -bottom-6 -right-6 sm:-bottom-8 sm:-right-8 text-teal-300/40 w-28 h-28 sm:w-40 sm:h-40 rotate-12" />
                </motion.div>
            </div>

            {/* Member Detail Popup */}
            <DetailPopup isOpen={!!selectedMember} onClose={() => setSelectedMember(null)} title="Member Details">
                {selectedMember && (
                    <div>
                        <div className={`${cardColors[selectedMember.index % cardColors.length]} rounded-2xl p-5 mb-4 flex items-center gap-4`}>
                            <div className={`w-16 h-16 rounded-2xl bg-white/60 flex items-center justify-center text-2xl font-bold ${avatarTextColors[selectedMember.index % avatarTextColors.length]}`}>
                                {selectedMember.name?.[0].toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-primary">{selectedMember.name}</h3>
                                <span className="badge bg-white/60 text-text-secondary mt-1">
                                    {selectedMember.index === 0 ? 'Admin' : 'Teammate'}
                                </span>
                            </div>
                        </div>
                        <DetailRow label="Email" value={selectedMember.email} icon={Mail} color="bg-pastel-blue" />
                        <DetailRow label="Phone" value={selectedMember.phone || 'Not added'} icon={Phone} color="bg-pastel-green" />
                        <DetailRow label="Role" value={selectedMember.index === 0 ? 'Admin' : 'Teammate'} icon={Shield} color="bg-pastel-lavender" />
                        <DetailRow label="Contribution" value={`${92 - (selectedMember.index * 12)}%`} icon={Users} color="bg-pastel-peach" />
                        <DetailRow label="Joined" value={selectedMember.created_at ? new Date(selectedMember.created_at).toLocaleDateString() : 'N/A'} icon={Calendar} color="bg-pastel-pink" />

                        <div className="mt-4 flex gap-2">
                            <button onClick={() => { selectedMember.phone && window.open(`https://wa.me/${selectedMember.phone.replace(/\D/g, '')}`, '_blank'); }}
                                disabled={!selectedMember.phone}
                                className="flex-1 py-2.5 bg-pastel-green text-green-700 font-semibold text-sm rounded-xl hover:bg-green-200 transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                                <MessageSquare size={16} /> WhatsApp
                            </button>
                            <button onClick={() => { selectedMember.phone && (window.location.href = `tel:${selectedMember.phone}`); }}
                                disabled={!selectedMember.phone}
                                className="flex-1 py-2.5 bg-pastel-blue text-blue-700 font-semibold text-sm rounded-xl hover:bg-blue-200 transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                                <Phone size={16} /> Call
                            </button>
                        </div>

                        {/* Admin remove button — only for non-admin members */}
                        {isCurrentUserAdmin && selectedMember.id !== currentUser?.id && selectedMember.index !== 0 && (
                            <button
                                onClick={() => handleRemoveMember(selectedMember.id)}
                                className="w-full mt-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-500 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 border border-red-100"
                            >
                                <Trash2 size={15} /> Remove from Room
                            </button>
                        )}
                    </div>
                )}
            </DetailPopup>

            {/* Invite Member Modal */}
            {roomId && (
                <InviteMemberModal
                    isOpen={isInviteModalOpen}
                    onClose={() => setIsInviteModalOpen(false)}
                    roomId={roomId}
                    onRefresh={fetchData}
                />
            )}
        </div>
    );
};
