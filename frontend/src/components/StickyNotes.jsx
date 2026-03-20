import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, GripVertical, ChevronRight } from 'lucide-react';
import { notesService } from '../services/notes';

const NOTE_COLORS = [
    { bg: '#FFF9C4', border: '#FFF176', label: 'Yellow' },
    { bg: '#FFCDD2', border: '#EF9A9A', label: 'Pink' },
    { bg: '#C8E6C9', border: '#A5D6A7', label: 'Green' },
    { bg: '#BBDEFB', border: '#90CAF9', label: 'Blue' },
    { bg: '#E1BEE7', border: '#CE93D8', label: 'Purple' },
    { bg: '#FFE0B2', border: '#FFCC80', label: 'Orange' },
];

const StickyNote = ({ note, onDelete, onUpdate, constraintsRef }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(note.content);
    const colorInfo = NOTE_COLORS.find(c => c.bg === note.color) || NOTE_COLORS[0];

    const handleSave = () => {
        setIsEditing(false);
        if (content.trim() !== note.content) {
            onUpdate(note.id, { content: content.trim() });
        }
    };

    const handleDragEnd = (event, info) => {
        onUpdate(note.id, {
            pos_x: (note.pos_x || 0) + info.offset.x,
            pos_y: (note.pos_y || 0) + info.offset.y,
        });
    };

    return (
        <motion.div
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 1.05, zIndex: 50, rotate: 2, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: Math.random() * 6 - 3 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="w-[140px] sm:w-[160px] flex-shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
            style={{ zIndex: 10 }}
        >
            <div
                className="rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-md hover:shadow-lg transition-shadow relative group"
                style={{ backgroundColor: colorInfo.bg, borderBottom: `3px solid ${colorInfo.border}` }}
            >
                {/* Drag handle + delete */}
                <div className="flex items-center justify-between mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical size={12} className="text-black/20" />
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                        className="w-5 h-5 rounded-full bg-black/10 hover:bg-red-400 hover:text-white flex items-center justify-center transition-all"
                    >
                        <X size={10} />
                    </button>
                </div>

                {/* Avatar */}
                <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-6 h-6 rounded-full bg-white/70 flex items-center justify-center text-[9px] font-bold text-gray-600 shadow-sm">
                        {note.user_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-medium text-gray-600 truncate">{note.user_name || 'User'}</span>
                </div>

                {/* Content */}
                {isEditing ? (
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSave()}
                        autoFocus
                        className="w-full bg-transparent border-none outline-none resize-none text-xs sm:text-sm text-gray-800 font-medium leading-relaxed"
                        rows={3}
                        style={{ fontFamily: "'Caveat', 'Patrick Hand', cursive, sans-serif" }}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                    />
                ) : (
                    <p
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="text-xs sm:text-sm text-gray-800 font-medium leading-relaxed min-h-[48px] cursor-text"
                        style={{ fontFamily: "'Caveat', 'Patrick Hand', cursive, sans-serif" }}
                    >
                        {note.content}
                    </p>
                )}

                {/* Time */}
                <p className="text-[8px] sm:text-[9px] text-gray-500 mt-2 text-right">
                    {note.created_at ? new Date(note.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Now'}
                </p>
            </div>
        </motion.div>
    );
};

export const StickyNotes = ({ roomId, onRefresh }) => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewNote, setShowNewNote] = useState(false);
    const [newContent, setNewContent] = useState('');
    const [newColor, setNewColor] = useState(NOTE_COLORS[0].bg);
    const constraintsRef = useRef(null);

    React.useEffect(() => {
        if (roomId) fetchNotes();
    }, [roomId]);

    const fetchNotes = async () => {
        try {
            const data = await notesService.getRoomNotes(roomId);
            setNotes(data);
        } catch (err) {
            console.error('Failed to fetch notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newContent.trim()) return;
        try {
            await notesService.createNote({
                room_id: roomId,
                content: newContent.trim(),
                color: newColor,
            });
            setNewContent('');
            setShowNewNote(false);
            setNewColor(NOTE_COLORS[0].bg);
            fetchNotes();
        } catch (err) {
            console.error('Failed to create note:', err);
        }
    };

    const handleDelete = async (noteId) => {
        try {
            await notesService.deleteNote(noteId);
            setNotes(prev => prev.filter(n => n.id !== noteId));
        } catch (err) {
            console.error('Failed to delete note:', err);
        }
    };

    const handleUpdate = async (noteId, data) => {
        try {
            await notesService.updateNote(noteId, data);
        } catch (err) {
            console.error('Failed to update note:', err);
        }
    };

    return (
        <div className="mb-5 sm:mb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                    <h3 className="font-bold text-text-primary text-sm sm:text-base">Recent Notes</h3>
                    {notes.length > 0 && (
                        <span className="px-2 py-0.5 bg-pastel-pink text-pink-600 text-[9px] sm:text-[10px] font-bold rounded-full">
                            {notes.length} New
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowNewNote(!showNewNote)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-pastel-cream hover:bg-pastel-peach rounded-full text-[10px] sm:text-xs font-semibold text-orange-700 transition-all"
                    >
                        <Plus size={14} />
                        <span className="hidden sm:inline">Add Note</span>
                    </button>
                    <button className="flex items-center text-text-muted hover:text-text-primary transition-colors">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* New Note Form */}
            {showNewNote && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 bg-surface-card rounded-2xl p-4 shadow-card border border-surface-border"
                >
                    <textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="Write your note here..."
                        className="w-full bg-transparent border-none outline-none resize-none text-sm text-text-primary placeholder:text-text-muted mb-3"
                        rows={2}
                    />
                    <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                            {NOTE_COLORS.map((c) => (
                                <button
                                    key={c.bg}
                                    onClick={() => setNewColor(c.bg)}
                                    className={`w-6 h-6 rounded-full border-2 transition-all ${newColor === c.bg ? 'border-gray-600 scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: c.bg }}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowNewNote(false)}
                                className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleCreate}
                                className="px-4 py-1.5 bg-text-primary text-white text-xs font-semibold rounded-full hover:opacity-90 transition-all">
                                Stick it!
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Notes Board */}
            <div ref={constraintsRef} className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-pastel-cream/40 border border-orange-100/50 min-h-[180px] sm:min-h-[220px] p-3 sm:p-4">
                {loading ? (
                    <div className="flex items-center justify-center h-[180px]">
                        <div className="w-6 h-6 border-2 border-surface-muted border-t-text-primary rounded-full animate-spin" />
                    </div>
                ) : notes.length > 0 ? (
                    <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 items-start">
                        {notes.map((note) => (
                            <StickyNote
                                key={note.id}
                                note={note}
                                onDelete={handleDelete}
                                onUpdate={handleUpdate}
                                constraintsRef={constraintsRef}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[160px] text-center">
                        <div className="w-12 h-12 bg-pastel-cream rounded-xl flex items-center justify-center mb-3">
                            <Plus size={20} className="text-orange-400" />
                        </div>
                        <p className="text-sm text-text-muted mb-1">No sticky notes yet</p>
                        <p className="text-[10px] text-text-light">Click "Add Note" to leave a note for your roommates</p>
                    </div>
                )}
            </div>
        </div>
    );
};
