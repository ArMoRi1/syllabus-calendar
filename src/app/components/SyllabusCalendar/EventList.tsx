import React from 'react';
import { Calendar, Edit3, RotateCcw } from 'lucide-react';
import { ScheduleEvent } from '../../types';
import { getEventStyle } from '../../utils/eventHelpers';
import DateEditor from './DateEditor';

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
                                                 resetForm
                                             }) => {
    return (
        <div className="bg-white/95 backdrop-blur-xl text-gray-900 rounded-2xl shadow-2xl border border-white/20 ring-1 ring-white/20 overflow-hidden mb-6">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50/80 to-gray-100/50 border-b border-gray-100/50">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-light text-gray-900 mb-1">Parsed Events</h2>
                        <p className="text-sm text-gray-600 mb-1">
                            Found {events.length} events
                            {isSelectionMode && ` • ${selectedEvents.length} selected`}
                            {hasUnsavedChanges && ` • Modified dates`}
                        </p>
                        <p className="text-xs text-gray-500">
                            {isSelectionMode
                                ? 'Select events for batch export or individual Google Calendar links'
                                : 'Click "Add to Google" for individual events or "Select Multiple" for batch export • You can edit dates with the pencil icon'
                            }
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {isSelectionMode ? (
                            <>
                                <button
                                    onClick={exportSelectedToGoogle}
                                    disabled={selectedEvents.length === 0}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                                    title={selectedEvents.length === 1 ? 'Open in Google Calendar' : 'Download ICS file for import'}
                                >
                                    <Calendar className="h-4 w-4" />
                                    {selectedEvents.length === 1
                                        ? 'Add to Google Calendar'
                                        : selectedEvents.length === 0
                                            ? 'Select Events to Export'
                                            : `Export ${selectedEvents.length} Events`
                                    }
                                </button>

                                <button
                                    onClick={toggleSelectionMode}
                                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                                >
                                    Cancel Selection
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={toggleSelectionMode}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all duration-200"
                                >
                                    Select Multiple
                                </button>

                                <button
                                    onClick={resetForm}
                                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                                >
                                    Parse Another
                                </button>
                            </>
                        )}

                        {hasUnsavedChanges && (
                            <button
                                onClick={restoreAllDates}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-sm font-medium rounded-lg transition-all duration-200 border border-orange-200"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Restore All Dates
                            </button>
                        )}
                    </div>
                </div>

                {/* Select All Controls */}
                {isSelectionMode && (
                    <div className="mt-3 flex items-center gap-3 pt-3 border-t border-gray-100">
                        <button
                            onClick={toggleSelectAll}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
            </div>

            {/* Events List */}
            <div className="p-6">
                <div className="space-y-4">
                    {events.map((event) => {
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
                                    {/* Checkbox - */}
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
                                            {isEditing ? (
                                                <DateEditor
                                                    event={event}
                                                    onSave={saveEventDate}
                                                    onCancel={() => setEditingEventId(null)}
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <p className={`text-sm font-medium ${style.textColor}`} suppressHydrationWarning>
                                                        {isClient && new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>

                                                    {!isSelectionMode && (
                                                        <button
                                                            onClick={() => setEditingEventId(event.id)}
                                                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                                            title="Edit date"
                                                        >
                                                            <Edit3 className="h-3 w-3" />
                                                        </button>
                                                    )}

                                                    {isModified && (
                                                        <button
                                                            onClick={() => restoreEventDate(event.id)}
                                                            className="p-1 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                                            title="Restore original date"
                                                        >
                                                            <RotateCcw className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {event.description && (
                                            <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                                                {event.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Badge */}
                                    <span className={`px-2 py-1 ${style.badge} text-white text-xs font-medium rounded-full uppercase tracking-wide flex-shrink-0`}>
                    {event.type}
                  </span>

                                    {/* Right side */}
                                    <div className="flex items-center gap-2">
                                        {/* Add to Google */}
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
            </div>
        </div>
    );
};

export default EventList;
