import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Package, Hash, AlertTriangle, Save } from 'lucide-react';
import { inventoryService } from '../services/inventory';

export const InventoryModal = ({ isOpen, onClose, roomId, onRefresh }) => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [minQuantity, setMinQuantity] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await inventoryService.addItem({
                room_id: roomId,
                name,
                quantity: parseFloat(quantity) || 0,
                min_quantity: parseFloat(minQuantity) || 0
            });

            onRefresh();
            onClose();
            setName('');
            setQuantity('');
            setMinQuantity('');
        } catch (err) {
            setError('Failed to add item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Item">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-semibold text-text-muted mb-2 ml-1">Item Name</label>
                    <div className="relative">
                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" size={18} />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="premium-input !pl-12"
                            placeholder="e.g. Milk, Eggs, Toilet Paper"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 ml-1">Quantity</label>
                        <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" size={18} />
                            <input
                                type="number"
                                step="0.1"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="premium-input !pl-12"
                                placeholder="0"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2 ml-1">Min Quantity</label>
                        <div className="relative">
                            <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" size={18} />
                            <input
                                type="number"
                                step="0.1"
                                value={minQuantity}
                                onChange={(e) => setMinQuantity(e.target.value)}
                                className="premium-input !pl-12"
                                placeholder="Alert below..."
                                required
                            />
                        </div>
                    </div>
                </div>

                <p className="text-xs text-text-muted px-1">
                    You'll receive an alert when the quantity falls below the minimum level.
                </p>

                {error && (
                    <div className="flex items-center gap-2 text-red-500 font-medium text-sm ml-1">
                        <AlertTriangle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <Button type="submit" variant="primary" className="w-full !py-3.5" icon={Save} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Item'}
                </Button>
            </form>
        </Modal>
    );
};
