import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Mail, User, AlertCircle, Copy, Check, Key } from 'lucide-react';
import { getDB, saveDB, getCurrentUser } from '../services/mockData';

// Generate a random password
const generatePassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pass = '';
    for (let i = 0; i < 8; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    return pass;
};

export const InviteMemberModal = ({ isOpen, onClose, roomId, onRefresh }) => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setResult(null);

        try {
            const db = getDB();
            if (db.users.find(u => u.email === email)) {
                throw new Error('This email is already registered.');
            }
            const password = generatePassword();
            const newUser = {
                id: db.users.length ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
                name: name || email.split('@')[0],
                email,
                password,
                phone: '',
                avatar_url: '',
                role: 'member',
                room_id: roomId,
                created_at: new Date().toISOString(),
            };
            db.users.push(newUser);
            saveDB(db);
            setResult({ email, password, message: `${newUser.name} has been added to the room.` });
            onRefresh();
        } catch (err) {
            setError(err.message || 'Failed to invite member. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!result) return;
        const text = `CasaSync Login Credentials\n\nEmail: ${result.email}\nPassword: ${result.password}\n\nLogin at: ${window.location.origin}/login`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        setEmail('');
        setName('');
        setError('');
        setResult(null);
        setCopied(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Add Roommate">
            {!result ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <p className="text-xs sm:text-sm text-text-muted">
                        Enter your roommate's email. An account will be created automatically and you'll get login credentials to share.
                    </p>

                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 ml-1">Email Address *</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="premium-input !pl-12"
                                placeholder="roommate@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 ml-1">Name (optional)</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" size={18} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="premium-input !pl-12"
                                placeholder="Their name"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-500 font-medium text-sm ml-1">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <Button type="submit" variant="primary" className="w-full !py-3.5" disabled={loading}>
                        {loading ? 'Adding...' : 'Add to Room'}
                    </Button>
                </form>
            ) : (
                <div className="space-y-5">
                    {/* Success */}
                    <div className="bg-pastel-green rounded-2xl p-5 text-center">
                        <div className="w-14 h-14 bg-white/60 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Check size={28} className="text-green-600" />
                        </div>
                        <h3 className="font-bold text-text-primary text-base mb-1">Member Added!</h3>
                        <p className="text-xs text-green-800/60">{result.message}</p>
                    </div>

                    {/* Credentials Card */}
                    <div className="bg-pastel-cream rounded-2xl p-5 space-y-3">
                        <h4 className="text-xs font-bold text-orange-800/70 mb-3 flex items-center gap-2">
                            <Key size={14} />
                            Login Credentials
                        </h4>
                        <div className="flex items-center justify-between bg-white/60 rounded-xl px-4 py-3">
                            <div>
                                <p className="text-[10px] text-text-muted">Email</p>
                                <p className="text-sm font-semibold text-text-primary">{result.email}</p>
                            </div>
                            <Mail size={16} className="text-text-light" />
                        </div>
                        <div className="flex items-center justify-between bg-white/60 rounded-xl px-4 py-3">
                            <div>
                                <p className="text-[10px] text-text-muted">Password</p>
                                <p className="text-sm font-mono font-semibold text-text-primary">{result.password}</p>
                            </div>
                            <Key size={16} className="text-text-light" />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={handleCopy}
                            variant="secondary"
                            className="flex-1 !py-3"
                            icon={copied ? Check : Copy}
                        >
                            {copied ? 'Copied!' : 'Copy Credentials'}
                        </Button>
                        <Button onClick={handleClose} variant="primary" className="flex-1 !py-3">
                            Done
                        </Button>
                    </div>

                    <p className="text-[10px] text-text-muted text-center">
                        Share these credentials with your roommate so they can log in.
                    </p>
                </div>
            )}
        </Modal>
    );
};
