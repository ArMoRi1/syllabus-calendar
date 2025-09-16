// src/app/components/SyllabusCalendar/EventEditModal.tsx - Простіша версія
import React, { useState, useEffect } from 'react';
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

    // Initialize form
    useEffect(() => {
        if (event && isOpen) {
            console.log('📝 Simple Modal: Initializing with event:', event);
            setTitle(event.title);
            setDate(event.date);
            setType(event.type);
            setDescription(event.description || '');
        }
    }, [event, isOpen]);

    const handleSave = () => {
        if (!event || !title.trim() || !date) return;

        console.log('💾 Simple Modal: Saving event');

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

    const handleClose = () => {
        console.log('❌ Simple Modal: Closing');
        onClose();
    };

    // Don't render if not open
    if (!isOpen) {
        return null;
    }

    console.log('🔍 Simple Modal: Rendering, isOpen:', isOpen, 'event:', event);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div
                className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Edit Event</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Event title"
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as EventType)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {Object.entries(EVENT_CATEGORIES).map(([key, category]) => (
                                <option key={key} value={key}>
                                    {category.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Event description (optional)"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title.trim() || !date}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        <Save className="h-4 w-4" />
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventEditModal;