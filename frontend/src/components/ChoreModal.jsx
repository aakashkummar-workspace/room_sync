import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { ClipboardCheck, Calendar, User, AlertCircle } from 'lucide-react';
import { choreService } from '../services/chore';

export const ChoreModal = ({ isOpen, onClose, roomId, members, onRefresh }) => {
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await choreService.createChore({
                room_id: roomId,
                title,
                due_date: new Date(dueDate).toISOString(),
                assigned_to: parseInt(assignedTo) || members[0].id,
                is_recurring: false
            });

            onRefresh();
            onClose();
            setTitle('');
            setDueDate('');
            setAssignedTo('');
        } catch (err) {
            setError('Failed to create chore. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Task">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-semibold text-text-muted mb-2 ml-1">Task Name</label>
                    <div className="relative">
                        <ClipboardCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" size={18} />
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="premium-input !pl-12"
                            placeholder="e.g. Living Room Vacuuming"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-text-muted mb-2 ml-1">Due Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" size={18} />
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="premium-input !pl-12"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-text-muted mb-2 ml-1">Assign To</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" size={18} />
                        <select
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                            className="premium-input !pl-12"
                            required
                        >
                            <option value="">Select Roommate</option>
                            {members.map(member => (
                                <option key={member.id} value={member.id}>{member.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-500 font-medium text-sm ml-1">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <Button type="submit" variant="primary" className="w-full !py-3.5" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Task'}
                </Button>
            </form>
        </Modal>
    );
};
