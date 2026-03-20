import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { IndianRupee, Tag, Users, AlertCircle } from 'lucide-react';
import { expenseService } from '../services/expense';

export const ExpenseModal = ({ isOpen, onClose, roomId, members, onRefresh }) => {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('General');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount <= 0) {
                throw new Error('Please enter a valid amount');
            }

            const splitAmount = numAmount / members.length;
            const splits = members.map(member => ({
                user_id: member.id,
                amount_owed: splitAmount
            }));

            await expenseService.addExpense({
                room_id: roomId,
                title,
                amount: numAmount,
                category,
                splits
            });

            onRefresh();
            onClose();
            setTitle('');
            setAmount('');
            setCategory('General');
        } catch (err) {
            setError(err.message || 'Failed to add expense. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Expense">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-semibold text-text-muted mb-2 ml-1">What was it for?</label>
                    <div className="relative">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" size={18} />
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="premium-input !pl-12"
                            placeholder="e.g. Weekly Groceries"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 ml-1">Amount</label>
                        <div className="relative">
                            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" size={18} />
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="premium-input !pl-12"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 ml-1">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="premium-input"
                        >
                            <option value="General">General</option>
                            <option value="Groceries">Groceries</option>
                            <option value="Utilities">Utilities</option>
                            <option value="Rent">Rent</option>
                            <option value="Entertainment">Entertainment</option>
                        </select>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-pastel-blue/50 border border-blue-100">
                    <div className="flex items-center gap-2 mb-1 text-text-primary font-semibold text-sm">
                        <Users size={16} />
                        <span>Splitting with {members.length} people</span>
                    </div>
                    <p className="text-xs text-text-muted">This expense will be split equally among all room members.</p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-500 font-medium text-sm ml-1">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <Button type="submit" variant="primary" className="w-full !py-3.5" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Expense'}
                </Button>
            </form>
        </Modal>
    );
};
