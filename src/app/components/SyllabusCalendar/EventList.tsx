// src/app/components/SyllabusCalendar/EventList.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, Edit3, RotateCcw, Filter, X, ChevronDown, ChevronUp, Search, Download, Edit } from 'lucide-react';
import { ScheduleEvent, EventType } from '../../types';
import { getEventStyle } from '../../utils/eventHelpers';
import { EVENT_CATEGORIES } from '../../types';
import EventEditModal from './EventEditModal';

interface EventListProps {
    events: ScheduleEvent[];
    selectedEvents: number[];
    selectAll: boolean;
    isSelectionMode: boolean;
    editingEventId: number | null;
    hasUnsavedChanges: boolean;
    isClient: boolean;
    toggleEventSelection: (eventId: number) => void;
    toggleSelectAll: () => void;
    toggleSelectionMode: () => void;
    exportSelectedToGoogle: () => void;
    exportSingleEvent: (event: ScheduleEvent) => void;
    saveEventDate: (eventId: number, newDate: string) => void;
    restoreEventDate: (eventId: number) => void;
    restoreAllDates: () => void;
    setEditingEventId: (id: number | null) => void;
    resetForm: () => void;
    updateEvent: (updatedEvent: ScheduleEvent) => void;
    deleteEvent: (eventId: number) => void;
}

const EventList: React.FC<EventListProps> = ({
                                                 events,
                                                 selectedEvents,
                                                 selectAll,
                                                 isSelectionMode,
                                                 editingEventId,
                                                 hasUnsavedChanges,
                                                 isClient,
                                                 toggleEventSelection,
                                                 toggleSelectAll,
                                                 toggleSelectionMode,
                                                 exportSelectedToGoogle,
                                                 exportSingleEvent,
                                                 saveEventDate,
                                                 restoreEventDate,
                                                 restoreAllDates,
                                                 setEditingEventId,
                                                 resetForm,
                                                 updateEvent,
                                                 deleteEvent,
                                             }) => {
    // Filter state
    const [filteredEvents, setFilteredEvents] = useState<ScheduleEvent[]>(events);
    const [selectedCategories, setSelectedCategories] = useState<Set<EventType>>(new Set());
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

    // Update filtered events when events prop changes
    useEffect(() => {
        setFilteredEvents(events);
    }, [events]);

    // Category counts
    const categoryCounts = React.useMemo(() => {
        const counts: Record<EventType, number> = {
            meeting: 0,
            deadline: 0,
            event: 0,
            appointment: 0,
            task: 0,
            legal: 0,
            other: 0
        };

        events.forEach(event => {
            counts[event.type]++;
        });

        return counts;
    }, [events]);

    // Category colors - синхронізовані з getEventStyle
    const categoryColors: Record<EventType, string> = {
        meeting: '#60A5FA',     // blue-400
        deadline: '#F87171',    // red-400
        event: '#A78BFA',       // purple-400
        appointment: '#4ADE80', // green-400
        task: '#FBBF24',        // amber-400
        legal: '#818CF8',       // indigo-400
        other: '#94A3B8'        // slate-400
    };

    // Filter events
    useEffect(() => {
        let filtered = events;

        // Filter by categories
        if (selectedCategories.size > 0) {
            filtered = filtered.filter(event => selectedCategories.has(event.type));
        }

        // Filter by search
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(event =>
                event.title.toLowerCase().includes(search) ||
                event.description?.toLowerCase().includes(search) ||
                event.date.includes(search)
            );
        }

        setFilteredEvents(filtered);
    }, [selectedCategories, searchTerm, events]);

    const toggleCategory = (category: EventType) => {
        const newSelected = new Set(selectedCategories);
        if (newSelected.has(category)) {
            newSelected.delete(category);
        } else {
            newSelected.add(category);
        }
        setSelectedCategories(newSelected);
    };

    const clearAllFilters = () => {
        setSelectedCategories(new Set());
        setSearchTerm('');
    };

    const selectAllCategories = () => {
        const availableCategories = Object.keys(categoryCounts).filter(
            key => categoryCounts[key as EventType] > 0
        ) as EventType[];
        setSelectedCategories(new Set(availableCategories));
    };

    const hasActiveFilters = selectedCategories.size > 0 || searchTerm.trim() !== '';

    const formatDateDisplay = (date: string): string => {
        if (!isClient) return date;
        return new Date(date + "T00:00:00").toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Edit modal handlers
    const openEditModal = (event: ScheduleEvent) => {
        console.log('🔧 EventList: Opening edit modal for event:', event);
        setEditingEvent(event);
        setEditModalOpen(true);
    };

    const closeEditModal = () => {
        setEditModalOpen(false);
        setEditingEvent(null);
    };

    const handleUpdateEvent = (updatedEvent: ScheduleEvent) => {
        updateEvent(updatedEvent);
        closeEditModal();
    };

    return (
        <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl shadow-xl">
            {/* Header with controls */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Parsed Events
                        <span className="ml-2 text-sm font-normal text-gray-500">
                            ({hasActiveFilters ? `${filteredEvents.length} of ${events.length}` : events.length})
                        </span>
                    </h2>

                    {hasActiveFilters && (
                        <div className="flex gap-1">
                            {selectedCategories.size > 0 && (
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                                    {selectedCategories.size} categories
                                </span>
                            )}
                            {searchTerm && (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                    search
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Selection mode toggle */}
                    <button
                        onClick={toggleSelectionMode}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                            isSelectionMode
                                ? 'border-2 border-gray-900 bg-gray-900 text-white hover:bg-white hover:text-black'
                                : 'border-2 border-gray-900 bg-gray-900 text-white hover:bg-white hover:text-black'
                        }`}
                    >
                        {isSelectionMode ? 'Cancel Multiple' : 'Select Multiple'}
                    </button>

                    {/* Clear filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearAllFilters}
                            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="h-4 w-4" />
                            Clear
                        </button>
                    )}

                    {/* Parse Another Button */}
                    <button
                        onClick={resetForm}
                        className="px-3 py-2 text-sm font-medium rounded-lg transition-all border-2 border-gray-900 bg-gray-900 text-white hover:bg-red-400 hover:text-black"
                    >
                        Parse Another
                    </button>

                    {/* Filter toggle */}
                    <button
                        onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                        className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                            ${hasActiveFilters
                            ? 'border-2 border-gray-900 bg-gray-900 text-white hover:bg-white hover:text-black'
                            : 'border-2 border-gray-900 bg-gray-900 text-white hover:bg-white hover:text-black'
                        }
                        `}
                    >
                        <Filter className="h-4 w-4" />
                        Filter
                        {isFilterExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            {isFilterExpanded && (
                <div className="border-b border-gray-100 p-4 bg-gray-50/50">
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Search events
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by title, description, or date..."
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                            </div>
                        </div>

                        {/* Category Filters */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Filter by category
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={selectAllCategories}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Select all
                                    </button>
                                    <button
                                        onClick={() => setSelectedCategories(new Set())}
                                        className="text-xs text-gray-600 hover:text-gray-800"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                {Object.entries(EVENT_CATEGORIES).map(([key, category]) => {
                                    const count = categoryCounts[key as EventType];
                                    const isSelected = selectedCategories.has(key as EventType);

                                    return (
                                        <button
                                            key={key}
                                            onClick={() => toggleCategory(key as EventType)}
                                            disabled={count === 0}
                                            className={`
                                                flex items-center justify-between p-3 rounded-lg border text-left transition-all
                                                ${count === 0
                                                ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                                                : isSelected
                                                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                            }
                                            `}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: categoryColors[key as EventType] }}
                                                />
                                                <div className="min-w-0">
                                                    <div className="font-medium text-sm text-gray-900 truncate">
                                                        {category.label}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate">
                                                        {category.description}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`
                                                text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ml-2
                                                ${isSelected
                                                ? 'bg-blue-200 text-blue-800'
                                                : 'bg-gray-100 text-gray-600'
                                            }
                                            `}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls Bar - Now only shows when needed and without Parse Another */}
            {(isSelectionMode || hasUnsavedChanges) && (
                <div className="flex items-center justify-between p-4 bg-gray-50/50 border-b border-gray-100">
                    {/* Selection controls */}
                    {isSelectionMode && (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleSelectAll}
                                className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                            >
                                <div className={`w-4 h-4 border-2 rounded ${
                                    selectAll ? 'bg-gray-900 border-gray-900' : 'border-gray-300'
                                } flex items-center justify-center`}>
                                    {selectAll && (
                                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                                {selectAll ? 'Deselect All' : 'Select All'}
                            </button>
                            <span className="text-xs text-gray-500">
                                {selectedEvents.length === 1 ? '1 event selected' : `${selectedEvents.length} events selected`}
                            </span>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        {hasUnsavedChanges && (
                            <button
                                onClick={restoreAllDates}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                            >
                                <RotateCcw className="h-3 w-3" />
                                Restore All Dates
                            </button>
                        )}

                        {isSelectionMode && selectedEvents.length > 0 && (
                            <button
                                onClick={exportSelectedToGoogle}
                                className="flex items-center gap-1 px-3 py-1.5 border-2 border-gray-900 bg-gray-900 text-white hover:bg-white hover:text-black text-sm font-medium rounded-lg transition-colors"
                            >
                                <Download className="h-3 w-3" />
                                Export Selected
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Events List */}
            <div className="p-6">
                {filteredEvents.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-500 mb-2">
                            {hasActiveFilters ? 'No events match your filters' : 'No events found'}
                        </div>
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Clear filters to see all events
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredEvents.map((event) => {
                            const style = getEventStyle(event.type);
                            const isSelected = selectedEvents.includes(event.id);
                            const isEditing = editingEventId === event.id;
                            const isModified = event.originalDate && event.originalDate !== event.date;

                            return (
                                <div
                                    key={event.id}
                                    className={`border-l-4 ${style.color} p-4 rounded-r-xl transition-all duration-300 hover:shadow-md hover:shadow-gray-200/50 hover:-translate-y-0.5 ${
                                        isSelectionMode && isSelected ? 'ring-2 ring-gray-400 bg-gray-50/50' : ''
                                    } ${isModified ? 'bg-yellow-50/30' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Checkbox */}
                                        {isSelectionMode && (
                                            <button
                                                onClick={() => toggleEventSelection(event.id)}
                                                className="flex-shrink-0 mt-0.5"
                                            >
                                                <div className={`w-5 h-5 border-2 rounded ${
                                                    isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300 hover:border-gray-500'
                                                } flex items-center justify-center transition-colors`}>
                                                    {isSelected && (
                                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </button>
                                        )}

                                        {/* Event Content */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-lg">{style.icon}</span>
                                                <h3 className="text-base font-medium text-gray-900 leading-relaxed">
                                                    {event.title}
                                                    {isModified && (
                                                        <span className="ml-2 text-xs text-orange-600 font-normal">(date modified)</span>
                                                    )}
                                                </h3>
                                            </div>

                                            {/* Date Display/Editor */}
                                            <div className="mb-2">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm text-gray-600 font-medium">
                                                        {formatDateDisplay(event.date)}
                                                    </p>
                                                    <button
                                                        onClick={() => openEditModal(event)}
                                                        className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Edit event"
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                    </button>
                                                    {isModified && (
                                                        <button
                                                            onClick={() => restoreEventDate(event.id)}
                                                            className="p-1 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                                            title="Restore original date"
                                                        >
                                                            <RotateCcw className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Description */}
                                            {event.description && (
                                                <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                                                    {event.description}
                                                </p>
                                            )}

                                            {/* Badge */}
                                            <span className={`px-2 py-1 ${style.badge} text-white text-xs font-medium rounded-full uppercase tracking-wide flex-shrink-0`}>
                                                {event.type}
                                            </span>
                                        </div>

                                        {/* Right side - Add to Google Button */}
                                        <div className="flex items-center gap-2">
                                            {!isSelectionMode && (
                                                <button
                                                    onClick={() => exportSingleEvent(event)}
                                                    className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5"
                                                    title="Add this event to Google Calendar"
                                                >
                                                    <Calendar className="h-3 w-3" />
                                                    Add to Google
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <EventEditModal
                event={editingEvent}
                isOpen={editModalOpen}
                onClose={closeEditModal}
                onSave={handleUpdateEvent}
            />
        </div>
    );
};

export default EventList;