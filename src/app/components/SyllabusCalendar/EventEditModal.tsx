// src/app/components/SyllabusCalendar/EventEditModal.tsx - Portal версія
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';
import { ScheduleEvent, EventType } from '../../types';
import { EVENT_CATEGORIES } from '../../types';

interface EventEditModalProps {
    event: ScheduleEvent | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedEvent: ScheduleEvent) => void;
}

const EventEditModal: React.FC<EventEditModalProps> = ({
                                                           event,
                                                           isOpen,
                                                           onClose,
                                                           onSave
                                                       }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [type, setType] = useState<EventType>('task');
    const [description, setDescription] = useState('');
    const [mounted, setMounted] = useState(false);

    // Ensure component is mounted (for SSR compatibility)
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Initialize form
    useEffect(() => {
        if (event && isOpen) {
            setTitle(event.title);
            setDate(event.date);
            setType(event.type);
            setDescription(event.description || '');
        }
    }, [event, isOpen]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = '15px'; // Prevent layout shift
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [isOpen]);

    const handleSave = () => {
        if (!event || !title.trim() || !date) return;

        const updatedEvent: ScheduleEvent = {
            ...event,
            title: title.trim(),
            date,
            type,
            description: description.trim() || undefined
        };

        onSave(updatedEvent);
        onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    // Add escape key listener
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen]);

    // Don't render on server or if not mounted
    if (!mounted || !isOpen) {
        return null;
    }

    const modalContent = (
        <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                zIndex: 999999,
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative"
                style={{
                    zIndex: 1000000,
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Edit Event</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Event title"
                            autoFocus
                        />
                    </div>

                    {/* Date and Category Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3 py-2 border text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as EventType)}
                                className="w-full px-3 py-2 border text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {Object.entries(EVENT_CATEGORIES).map(([key, category]) => (
                                    <option key={key} value={key}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            placeholder="Event description (optional)"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title.trim() || !date}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-gray-900 bg-gray-900 text-white hover:bg-white hover:text-black rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save className="h-4 w-4" />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );

    // Render modal in portal to document.body
    console.log('🚪 Portal: Rendering modal to document.body, isOpen:', isOpen);
    return createPortal(modalContent, document.body);
};

export default EventEditModal;