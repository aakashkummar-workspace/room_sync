import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Package, AlertTriangle, Filter, ShoppingCart, Trash2, Edit3, Hash, Calendar } from 'lucide-react';
import { Button } from '../components/Button';
import { InventoryModal } from '../components/InventoryModal';
import { inventoryService } from '../services/inventory';
import { dashboardService } from '../services/dashboard';
import { DetailPopup, DetailRow } from '../components/DetailPopup';

export const Inventory = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    const fetchData = async () => {
        try {
            const summary = await dashboardService.getSummary();
            setDashboardData(summary);
            if (summary.room_id) { const data = await inventoryService.getInventory(summary.room_id); setItems(data); }
        } catch (error) { console.error("Failed:", error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const updateQuantity = async (itemId, newQuantity) => {
        try { await inventoryService.updateItem(itemId, { quantity: newQuantity }); fetchData(); }
        catch (error) { console.error("Failed:", error); }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 sm:w-10 sm:h-10 border-3 border-surface-muted border-t-text-primary rounded-full" />
        </div>
    );

    const outOfStock = items.filter(item => item.quantity === 0);
    const lowStock = items.filter(item => item.quantity > 0 && item.quantity <= item.min_quantity);

    return (
        <div className="max-w-6xl mx-auto">
            <div className="page-header">
                <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
                    <h2 className="page-title">Inventory</h2>
                    <p className="page-subtitle">Track household supplies</p>
                </motion.div>
                <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)} className="text-xs sm:text-sm self-start sm:self-auto">Add Item</Button>
            </div>

            {/* Colorful Stat Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5 sm:mb-8">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-pastel-blue rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-soft">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/60 rounded-xl sm:rounded-2xl flex items-center justify-center">
                            <Package size={18} className="text-blue-600" />
                        </div>
                        <div><p className="text-[10px] sm:text-xs text-blue-700/60 font-medium">Total</p><h3 className="text-2xl sm:text-3xl font-bold text-blue-800">{items.length}</h3></div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="bg-pastel-peach rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-soft">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/60 rounded-xl sm:rounded-2xl flex items-center justify-center">
                            <AlertTriangle size={18} className="text-orange-500" />
                        </div>
                        <div><p className="text-[10px] sm:text-xs text-orange-700/60 font-medium">Low</p><h3 className="text-2xl sm:text-3xl font-bold text-orange-700">{lowStock.length}</h3></div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-pastel-pink rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-soft">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/60 rounded-xl sm:rounded-2xl flex items-center justify-center">
                            <ShoppingCart size={18} className="text-red-400" />
                        </div>
                        <div><p className="text-[10px] sm:text-xs text-red-700/60 font-medium">Out</p><h3 className="text-2xl sm:text-3xl font-bold text-red-500">{outOfStock.length}</h3></div>
                    </div>
                </motion.div>
            </div>

            {/* Items Grid — click opens detail */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="font-bold text-text-primary text-sm sm:text-base">All Items</h3>
                <button className="p-2 bg-pastel-lavender rounded-lg sm:rounded-xl hover:opacity-80 transition-all"><Filter size={14} className="text-purple-600" /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {items.length > 0 ? items.map((item, idx) => {
                    const isLow = item.quantity <= item.min_quantity;
                    const isOut = item.quantity === 0;
                    const cardBg = isOut ? 'bg-pastel-pink' : isLow ? 'bg-pastel-peach' : 'bg-pastel-green';

                    return (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + (idx * 0.05) }}
                            onClick={() => setSelectedItem(item)}
                            className={`${cardBg} rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-soft hover:shadow-card transition-all cursor-pointer`}>
                            <div className="flex justify-between items-start mb-3 sm:mb-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/60 rounded-xl sm:rounded-2xl flex items-center justify-center">
                                    <Package size={18} className={isOut ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-green-600'} />
                                </div>
                                <div className="flex items-center gap-0.5">
                                    <button onClick={(e) => e.stopPropagation()} className="p-1.5 sm:p-2 text-text-secondary/40 hover:text-text-secondary transition-colors"><Edit3 size={13} /></button>
                                    <button onClick={(e) => e.stopPropagation()} className="p-1.5 sm:p-2 text-text-secondary/40 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                                </div>
                            </div>

                            <h4 className="text-sm sm:text-base font-semibold text-text-primary mb-3 sm:mb-4 truncate">{item.name}</h4>

                            <div className="flex justify-between items-center mb-2 sm:mb-3">
                                <span className="text-[10px] sm:text-xs text-text-secondary/60">Qty</span>
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, Math.max(0, item.quantity - 1)); }}
                                        className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center font-bold text-xs text-text-secondary hover:bg-white transition-all">-</button>
                                    <span className={`text-xl font-bold ${isOut ? 'text-red-500' : isLow ? 'text-orange-600' : 'text-green-700'}`}>{item.quantity}</span>
                                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity + 1); }}
                                        className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center font-bold text-xs text-text-secondary hover:bg-white transition-all">+</button>
                                </div>
                            </div>

                            <div className="relative w-full h-2 bg-white/50 rounded-full overflow-hidden mb-3">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (item.quantity / (item.min_quantity * 2 || 10)) * 100)}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`absolute inset-y-0 left-0 rounded-full ${isOut ? 'bg-red-400' : isLow ? 'bg-orange-400' : 'bg-green-500'}`} />
                            </div>

                            <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${isOut ? 'bg-red-500' : isLow ? 'bg-orange-500' : 'bg-green-500'}`} />
                                <span className="text-[10px] sm:text-xs font-semibold text-text-secondary/70">
                                    {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                                </span>
                            </div>
                        </motion.div>
                    );
                }) : (
                    <div className="sm:col-span-2 lg:col-span-3 p-10 sm:p-16 text-center bg-pastel-mint rounded-2xl sm:rounded-3xl">
                        <Package className="mx-auto text-teal-400 mb-3 sm:mb-4" size={44} strokeWidth={1.5} />
                        <h4 className="text-base sm:text-lg font-bold text-text-primary mb-2">No items yet</h4>
                        <p className="text-text-muted text-xs sm:text-sm mb-5">Add your first item to get started.</p>
                        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)} className="text-xs sm:text-sm">Add Item</Button>
                    </div>
                )}
            </div>

            {/* Item Detail Popup */}
            <DetailPopup isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="Item Details">
                {selectedItem && (() => {
                    const isLow = selectedItem.quantity <= selectedItem.min_quantity;
                    const isOut = selectedItem.quantity === 0;
                    return (
                        <div>
                            <div className={`${isOut ? 'bg-pastel-pink' : isLow ? 'bg-pastel-peach' : 'bg-pastel-green'} rounded-2xl p-5 mb-4 text-center`}>
                                <Package size={32} className={`mx-auto mb-2 ${isOut ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-green-600'}`} />
                                <h3 className="text-lg font-bold text-text-primary">{selectedItem.name}</h3>
                                <div className="mt-2">
                                    <span className={`badge ${isOut ? 'bg-red-200 text-red-700' : isLow ? 'bg-orange-200 text-orange-700' : 'bg-green-200 text-green-700'}`}>
                                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                                    </span>
                                </div>
                            </div>
                            <DetailRow label="Current Quantity" value={selectedItem.quantity} icon={Hash} color="bg-pastel-blue" />
                            <DetailRow label="Minimum Level" value={selectedItem.min_quantity} icon={AlertTriangle} color="bg-pastel-peach" />
                            <DetailRow label="Stock Health" value={`${Math.min(100, Math.round((selectedItem.quantity / (selectedItem.min_quantity * 2 || 10)) * 100))}%`} icon={Package} color="bg-pastel-green" />
                            <DetailRow label="Added" value={selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleDateString() : 'N/A'} icon={Calendar} color="bg-pastel-lavender" />

                            <div className="mt-4 flex gap-2">
                                <button onClick={() => { updateQuantity(selectedItem.id, selectedItem.quantity + 1); setSelectedItem({...selectedItem, quantity: selectedItem.quantity + 1}); }}
                                    className="flex-1 py-2.5 bg-pastel-green text-green-700 font-semibold text-sm rounded-xl hover:bg-green-200 transition-all">+ Add Stock</button>
                                <button onClick={() => { if (selectedItem.quantity > 0) { updateQuantity(selectedItem.id, selectedItem.quantity - 1); setSelectedItem({...selectedItem, quantity: selectedItem.quantity - 1}); }}}
                                    className="flex-1 py-2.5 bg-pastel-pink text-red-600 font-semibold text-sm rounded-xl hover:bg-red-200 transition-all">- Use Item</button>
                            </div>
                        </div>
                    );
                })()}
            </DetailPopup>

            {dashboardData && (
                <InventoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} roomId={dashboardData.room_id} onRefresh={fetchData} />
            )}
        </div>
    );
};
