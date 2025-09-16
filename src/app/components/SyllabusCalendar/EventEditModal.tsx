// src/app/components/SyllabusCalendar/EventEditModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Calendar, Type, FileText, Tag } from 'lucide-react';
import { ScheduleEvent, EventType } from '../../types';
import { EVENT_CATEGORIES } from '../../types';

interface EventEditModalProps {
    event: ScheduleEvent | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedEvent: ScheduleEvent) => void;
    onDelete?: (eventId: number) => void;
}

const EventEditModal: React.FC<EventEditModalProps> = ({
                                                           event,
                                                           isOpen,
                                                           onClose,
                                                           onSave,
                                                           onDelete
                                                       }) => {
    const [formData, setFormData] = useState<ScheduleEvent>({
        id: 0,
        title: '',
        date: '',
        type: 'task',
        description: ''
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize form when event changes
    useEffect(() => {
        if (event) {
            setFormData({ ...event });
            setHasChanges(false);
            setErrors({});
        }
    }, [event]);

    // Check for changes
    useEffect(() => {
        if (event) {
            const changed =
                formData.title !== event.title ||
                formData.date !== event.date ||
                formData.type !== event.type ||
                formData.description !== event.description;
            setHasChanges(changed);
        }
    }, [formData, event]);

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.length > 200) {
            newErrors.title = 'Title must be less than 200 characters';
        }

        if (!formData.date) {
            newErrors.date = 'Date is required';
        } else {
            const date = new Date(formData.date);
            if (isNaN(date.getTime())) {
                newErrors.date = 'Invalid date format';
            }
        }

        if (formData.description && formData.description.length > 500) {
            newErrors.description = 'Description must be less than 500 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validateForm()) {
            onSave(formData);
            onClose();
        }
    };

    const handleCancel = () => {
        if (hasChanges) {
            if (confirm('You have unsaved changes. Are you sure you want to close?')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    const handleRestore = () => {
        if (event) {
            setFormData({ ...event });
        }
    };

    const handleDelete = () => {
        if (event && onDelete) {
            if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
                onDelete(event.id);
                onClose();
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleCancel();
        } else if (e.key === 'Enter' && e.metaKey) {
            handleSave();
        }
    };

    if (!isOpen || !event) return null;

    // Category colors for visual consistency
    const categoryColors: Record<EventType, string> = {
        meeting: '#60A5FA',
        deadline: '#F87171',
        event: '#A78BFA',
        appointment: '#4ADE80',
        task: '#FBBF24',
        legal: '#818CF8',
        other: '#94A3B8'
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onKeyDown={handleKeyDown}
        >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: categoryColors[formData.type] }}
                        />
                        <h2 className="text-xl font-semibold text-gray-900">Edit Event</h2>
                        {hasChanges && (
                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                                Unsaved changes
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleCancel}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Type className="h-4 w-4" />
                                Event Title
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Enter event title..."
                                maxLength={200}
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                {formData.title.length}/200 characters
                            </p>
                        </div>

                        {/* Date and Type Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Date */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="h-4 w-4" />
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    }`}
                                />
                                {errors.date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                                )}
                            </div>

                            {/* Type */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Tag className="h-4 w-4" />
                                    Category
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {Object.entries(EVENT_CATEGORIES).map(([key, category]) => (
                                        <option key={key} value={key}>
                                            {category.label} - {category.description}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <FileText className="h-4 w-4" />
                                Description
                            </label>
                            <textarea
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                                    errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Add event description (optional)..."
                                maxLength={500}
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                {(formData.description || '').length}/500 characters
                            </p>
                        </div>

                        {/* Original Data Info (if modified) */}
                        {event.originalDate && event.originalDate !== formData.date && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-yellow-800 text-sm font-medium mb-1">
                                    <RotateCcw className="h-4 w-4" />
                                    Original Date Modified
                                </div>
                                <p className="text-yellow-700 text-sm">
                                    Original date: {new Date(event.originalDate + 'T00:00:00').toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        {hasChanges && (
                            <button
                                onClick={handleRestore}
                                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Restore
                            </button>
                        )}

                        {onDelete && (
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm"
                            >
                                <X className="h-4 w-4" />
                                Delete Event
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                hasChanges
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <Save className="h-4 w-4" />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventEditModal;