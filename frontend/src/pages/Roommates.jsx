import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Mail, Phone, Shield, Copy, Check, MessageSquare, Edit2, Save, Calendar, Star, Trash2, X, Plus, ScrollText, Pencil, Trash, Key, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/Button';
import { dashboardService } from '../services/dashboard';
import { authService } from '../services/auth';
import { roomService } from '../services/room';
import { useAuth } from '../hooks/useAuth';
import { DetailPopup, DetailRow } from '../components/DetailPopup';
import { InviteMemberModal } from '../components/InviteMemberModal';
import { houseRulesService } from '../services/houseRules';

export const Roommates = () => {
    const { user: currentUser } = useAuth();
    // force refresh
    const [members, setMembers] = useState([]);
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [editingPhone, setEditingPhone] = useState(false);
    const [newPhone, setNewPhone] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [roomId, setRoomId] = useState(null);
    const [roomName, setRoomName] = useState('');
    const [showAgreement, setShowAgreement] = useState(false);
    const [rules, setRules] = useState([]);
    const [rulesLoading, setRulesLoading] = useState(false);
    const [newRule, setNewRule] = useState('');
    const [editingRule, setEditingRule] = useState(null);
    const [editText, setEditText] = useState('');
    const [addingRule, setAddingRule] = useState(false);
    const [credentials, setCredentials] = useState([]);
    const [showPassword, setShowPassword] = useState({});
    const [copiedCred, setCopiedCred] = useState(null);

    const fetchCredentials = async (rid) => {
        try {
            const data = await roomService.getMemberCredentials(rid);
            setCredentials(data);
        } catch (e) { /* non-admin will get 403, that's fine */ }
    };

    const getCredential = (userId) => credentials.find(c => c.user_id === userId);

    const togglePasswordVisibility = (userId) => {
        setShowPassword(prev => ({ ...prev, [userId]: !prev[userId] }));
    };

    const copyCredentials = (cred) => {
        const text = `CasaSync Login\nEmail: ${cred.email}\nPassword: ${cred.password}\nLogin: ${window.location.origin}/login`;
        navigator.clipboard.writeText(text);
        setCopiedCred(cred.user_id);
        setTimeout(() => setCopiedCred(null), 2000);
    };

    const fetchRules = async (rid) => {
        setRulesLoading(true);
        try {
            const data = await houseRulesService.getRules(rid);
            setRules(data);
        } catch (e) { console.error('Failed to fetch rules:', e); }
        finally { setRulesLoading(false); }
    };

    const handleAddRule = async () => {
        if (!newRule.trim() || !roomId) return;
        try {
            await houseRulesService.addRule(roomId, newRule.trim());
            setNewRule('');
            setAddingRule(false);
            fetchRules(roomId);
        } catch (e) { console.error('Failed to add rule:', e); }
    };

    const handleUpdateRule = async (ruleId) => {
        if (!editText.trim()) return;
        try {
            await houseRulesService.updateRule(ruleId, editText.trim());
            setEditingRule(null);
            fetchRules(roomId);
        } catch (e) { console.error('Failed to update rule:', e); }
    };

    const handleDeleteRule = async (ruleId) => {
        if (!window.confirm('Delete this rule?')) return;
        try {
            await houseRulesService.deleteRule(ruleId);
            fetchRules(roomId);
        } catch (e) { console.error('Failed to delete rule:', e); }
    };

    const openAgreement = () => {
        setShowAgreement(true);
        if (roomId) fetchRules(roomId);
    };

    const fetchData = async () => {
        try {
            const summary = await dashboardService.getSummary();
            setMembers(summary.room_members || []);
            setInviteCode(summary.invite_code || 'ROOM123');
            setRoomId(summary.room_id);
            setRoomName(summary.room_name || 'Our Room');
            try { if (summary.room_id) await fetchCredentials(summary.room_id); } catch (e) { /* ignore */ }
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
                                <button onClick={(e) => { e.stopPropagation(); member.phone ? window.open(`https://wa.me/${member.phone.replace(/\D/g, '')}`, '_blank') : alert('No phone number added. Ask them to update their profile.'); }}
                                    className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all text-[10px] sm:text-xs font-medium ${member.phone ? 'bg-green-100 hover:bg-green-200 text-green-700' : 'bg-white/50 text-text-light'}`}>
                                    <MessageSquare size={14} /> <span>WhatsApp</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); member.phone ? window.open(`tel:${member.phone}`) : alert('No phone number added.'); }}
                                    className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all text-[10px] sm:text-xs font-medium ${member.phone ? 'bg-blue-100 hover:bg-blue-200 text-blue-700' : 'bg-white/50 text-text-light'}`}>
                                    <Phone size={14} /> <span>Call</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); window.open(`mailto:${member.email}`); }}
                                    className="flex-1 py-2.5 bg-purple-100 hover:bg-purple-200 rounded-xl flex items-center justify-center gap-1.5 transition-all text-[10px] sm:text-xs font-medium text-purple-700">
                                    <Mail size={14} /> <span>Email</span>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
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
                    <Button variant="primary" className="text-xs sm:text-sm" onClick={openAgreement}>View Agreement</Button>
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

                        {/* Login Credentials — Admin only */}
                        {isCurrentUserAdmin && selectedMember.id !== currentUser?.id && (() => {
                            const cred = getCredential(selectedMember.id);
                            if (!cred?.password) return null;
                            return (
                                <div className="mt-4 bg-pastel-cream rounded-2xl p-4 border border-orange-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Key size={14} className="text-orange-600" />
                                        <h4 className="text-xs font-bold text-orange-800/80">Login Credentials</h4>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between bg-white/60 rounded-xl px-3 py-2.5">
                                            <div>
                                                <p className="text-[9px] text-text-muted">Email</p>
                                                <p className="text-xs font-semibold text-text-primary">{cred.email}</p>
                                            </div>
                                            <Mail size={13} className="text-text-light" />
                                        </div>
                                        <div className="flex items-center justify-between bg-white/60 rounded-xl px-3 py-2.5">
                                            <div>
                                                <p className="text-[9px] text-text-muted">Password</p>
                                                <p className="text-xs font-mono font-semibold text-text-primary">
                                                    {showPassword[selectedMember.id] ? cred.password : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                                                </p>
                                            </div>
                                            <button onClick={() => togglePasswordVisibility(selectedMember.id)} className="p-1 hover:bg-surface-hover rounded-lg transition-colors">
                                                {showPassword[selectedMember.id]
                                                    ? <EyeOff size={13} className="text-text-light" />
                                                    : <Eye size={13} className="text-text-light" />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => copyCredentials(cred)}
                                        className="w-full mt-3 py-2 bg-white/60 hover:bg-white rounded-xl text-xs font-semibold text-orange-700 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        {copiedCred === cred.user_id ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Credentials</>}
                                    </button>
                                </div>
                            );
                        })()}

                        <div className="mt-4 flex gap-2">
                            <button onClick={() => { selectedMember.phone ? window.open(`https://wa.me/${selectedMember.phone.replace(/\D/g, '')}`, '_blank') : alert('No phone number added yet.'); }}
                                className={`flex-1 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all ${selectedMember.phone ? 'bg-green-100 hover:bg-green-200 text-green-700' : 'bg-surface text-text-light'}`}>
                                <MessageSquare size={15} /> WhatsApp
                            </button>
                            <button onClick={() => { selectedMember.phone ? window.open(`tel:${selectedMember.phone}`) : alert('No phone number added yet.'); }}
                                className={`flex-1 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all ${selectedMember.phone ? 'bg-blue-100 hover:bg-blue-200 text-blue-700' : 'bg-surface text-text-light'}`}>
                                <Phone size={15} /> Call
                            </button>
                            <button onClick={() => window.open(`mailto:${selectedMember.email}`)}
                                className="flex-1 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2">
                                <Mail size={15} /> Email
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

            {/* Room Agreement Modal */}
            <AnimatePresence>
                {showAgreement && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
                        onClick={(e) => e.target === e.currentTarget && setShowAgreement(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-surface-card border border-surface-border rounded-2xl shadow-elevated w-full max-w-xl max-h-[90vh] flex flex-col"
                        >
                            {/* Close button */}
                            <div className="flex justify-end p-3 pb-0">
                                <button onClick={() => setShowAgreement(false)} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
                                    <X size={18} className="text-text-muted" />
                                </button>
                            </div>

                            {/* Scrollable content */}
                            <div className="flex-1 overflow-y-auto px-5 sm:px-8 pb-6">
                                {rulesLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                            className="w-7 h-7 border-2 border-surface-muted border-t-text-primary rounded-full" />
                                    </div>
                                ) : rules.length === 0 && !addingRule ? (
                                    /* Empty state */
                                    <div className="text-center py-12">
                                        <div className="w-14 h-14 bg-pastel-lavender rounded-2xl flex items-center justify-center mx-auto mb-3">
                                            <ScrollText size={24} className="text-purple-400" />
                                        </div>
                                        <h4 className="font-semibold text-text-primary text-sm mb-1">No rules yet</h4>
                                        <p className="text-xs text-text-muted mb-4">
                                            {isCurrentUserAdmin ? 'Add your first house rule to set expectations.' : 'The admin hasn\'t added any rules yet.'}
                                        </p>
                                        {isCurrentUserAdmin && (
                                            <Button variant="primary" icon={Plus} className="text-xs mx-auto" onClick={() => setAddingRule(true)}>
                                                Add First Rule
                                            </Button>
                                        )}
                                    </div>
                                ) : isCurrentUserAdmin ? (
                                    /* ===== ADMIN VIEW — editable list ===== */
                                    <>
                                        <div className="text-center mb-6 pt-2">
                                            <div className="w-12 h-12 rounded-xl bg-pastel-mint flex items-center justify-center mx-auto mb-3">
                                                <ScrollText size={20} className="text-teal-600" />
                                            </div>
                                            <h3 className="text-lg font-bold text-text-primary">Manage Rules</h3>
                                            <p className="text-[10px] text-text-muted mt-0.5">Add, edit or remove rules for {roomName}</p>
                                        </div>

                                        <div className="space-y-2.5">
                                            {rules.map((rule, idx) => (
                                                <motion.div
                                                    key={rule.id}
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.04 }}
                                                    className="group"
                                                >
                                                    {editingRule === rule.id ? (
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={editText}
                                                                onChange={(e) => setEditText(e.target.value)}
                                                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateRule(rule.id)}
                                                                className="flex-1 px-3 py-2.5 rounded-xl bg-surface border border-surface-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-200"
                                                                autoFocus
                                                            />
                                                            <button onClick={() => handleUpdateRule(rule.id)} className="px-3 py-2 bg-teal-500 text-white rounded-xl text-xs font-semibold hover:bg-teal-600 transition-colors">Save</button>
                                                            <button onClick={() => setEditingRule(null)} className="px-3 py-2 bg-surface border border-surface-border rounded-xl text-xs font-semibold text-text-muted hover:bg-surface-hover transition-colors">Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-surface-border hover:border-teal-200 transition-all">
                                                            <div className="w-6 h-6 rounded-lg bg-pastel-mint flex items-center justify-center shrink-0 mt-0.5">
                                                                <span className="text-[10px] font-bold text-teal-600">{idx + 1}</span>
                                                            </div>
                                                            <p className="text-sm text-text-primary leading-relaxed flex-1">{rule.rule_text}</p>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                                <button onClick={() => { setEditingRule(rule.id); setEditText(rule.rule_text); }}
                                                                    className="p-1.5 rounded-lg hover:bg-pastel-blue transition-colors">
                                                                    <Pencil size={12} className="text-blue-500" />
                                                                </button>
                                                                <button onClick={() => handleDeleteRule(rule.id)}
                                                                    className="p-1.5 rounded-lg hover:bg-pastel-pink transition-colors">
                                                                    <Trash size={12} className="text-red-400" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}

                                            {addingRule && (
                                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={newRule}
                                                        onChange={(e) => setNewRule(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                                                        className="flex-1 px-3 py-2.5 rounded-xl bg-surface border border-surface-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-200"
                                                        placeholder="Enter a new rule..."
                                                        autoFocus
                                                    />
                                                    <button onClick={handleAddRule} className="px-3 py-2 bg-teal-500 text-white rounded-xl text-xs font-semibold hover:bg-teal-600 transition-colors">Add</button>
                                                    <button onClick={() => { setAddingRule(false); setNewRule(''); }} className="px-3 py-2 bg-surface border border-surface-border rounded-xl text-xs font-semibold text-text-muted hover:bg-surface-hover transition-colors">Cancel</button>
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* Admin footer */}
                                        <div className="mt-5 flex items-center justify-between">
                                            <p className="text-[10px] text-text-muted">{rules.length} rule{rules.length !== 1 ? 's' : ''}</p>
                                            <div className="flex gap-2">
                                                {!addingRule && (
                                                    <Button variant="secondary" icon={Plus} className="text-[10px] sm:text-xs !px-3" onClick={() => setAddingRule(true)}>
                                                        Add Rule
                                                    </Button>
                                                )}
                                                <Button variant="primary" className="text-[10px] sm:text-xs !px-4" onClick={() => setShowAgreement(false)}>
                                                    Done
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    /* ===== MEMBER VIEW — formal report ===== */
                                    <>
                                        {/* Report Header */}
                                        <div className="text-center pt-2 pb-6 border-b border-surface-border mb-6">
                                            <div className="w-14 h-14 rounded-2xl bg-text-primary flex items-center justify-center mx-auto mb-4">
                                                <ScrollText size={24} className="text-white" />
                                            </div>
                                            <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">Room Agreement</h2>
                                            <p className="text-sm text-text-muted mt-1">{roomName}</p>
                                            <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-text-muted">
                                                <span>Effective Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                <span>&bull;</span>
                                                <span>{members.length} Member{members.length !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>

                                        {/* Preamble */}
                                        <div className="mb-6">
                                            <p className="text-xs text-text-secondary leading-relaxed">
                                                This agreement outlines the rules and regulations established for <span className="font-semibold text-text-primary">{roomName}</span>. All members are expected to follow these guidelines to maintain a respectful and comfortable living environment.
                                            </p>
                                        </div>

                                        {/* Section Title */}
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="h-px flex-1 bg-surface-border" />
                                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">Rules & Regulations</span>
                                            <div className="h-px flex-1 bg-surface-border" />
                                        </div>

                                        {/* Rules as formal numbered list */}
                                        <div className="space-y-0">
                                            {rules.map((rule, idx) => (
                                                <motion.div
                                                    key={rule.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.06 }}
                                                    className="flex gap-4 py-3 border-b border-surface-border/60 last:border-0"
                                                >
                                                    <span className="text-xs font-bold text-text-muted w-8 shrink-0 text-right pt-0.5">
                                                        {String(idx + 1).padStart(2, '0')}.
                                                    </span>
                                                    <p className="text-sm text-text-primary leading-relaxed">{rule.rule_text}</p>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Members Section */}
                                        <div className="mt-8 mb-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="h-px flex-1 bg-surface-border" />
                                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">Members</span>
                                                <div className="h-px flex-1 bg-surface-border" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {members.map((member, idx) => (
                                                    <div key={member.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface border border-surface-border">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                                            idx === 0 ? 'bg-pastel-peach text-orange-600' : 'bg-pastel-blue text-blue-600'
                                                        }`}>
                                                            {member.name?.[0]?.toUpperCase() || 'U'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-text-primary truncate">{member.name}</p>
                                                            <p className="text-[9px] text-text-muted">{idx === 0 ? 'Admin' : 'Member'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Agreement Footer */}
                                        <div className="border-t border-surface-border pt-5 mt-4 text-center">
                                            <p className="text-[10px] text-text-muted leading-relaxed mb-4">
                                                By being a member of this room, you acknowledge and agree to abide by the rules stated above. Violations may result in discussion or removal by the admin.
                                            </p>
                                            <div className="flex items-center justify-center gap-2 text-[9px] text-text-light">
                                                <Shield size={10} />
                                                <span>CasaSync Room Agreement &bull; {rules.length} Rule{rules.length !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>

                                        {/* Close button */}
                                        <div className="mt-5 flex justify-center">
                                            <Button variant="primary" className="text-xs !px-8" onClick={() => setShowAgreement(false)}>
                                                I Understand
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
