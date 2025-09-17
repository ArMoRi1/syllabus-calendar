// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { ScheduleEvent, ViewMode, InputMethod, ProcessingResult, ModalState } from '../types';
import { getEventStyle, sampleEvents } from '../app/utils/eventHelpers';
import { exportSingleEvent, exportSelectedToGoogle } from '../app/utils/exportUtils';
import NotificationModal from '../app/components/SyllabusCalendar/NotificationModal';
import NoEventsModal from '../app/components/SyllabusCalendar/NoEventsModal';
import FileUpload from '../app/components/SyllabusCalendar/FileUpload';
import EventList from '../app/components/SyllabusCalendar/EventList';

export default function HomePage() {
    // State
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [isClient, setIsClient] = useState(false);
    const [manualText, setManualText] = useState('');
    const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [inputMethod, setInputMethod] = useState<InputMethod>('file');
    const [showNoEventsModal, setShowNoEventsModal] = useState(false);
    const [lastProcessedFile, setLastProcessedFile] = useState<string>('');
    const [editingEventId, setEditingEventId] = useState<number | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [modalState, setModalState] = useState<ModalState>({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
        details: undefined,
        onConfirm: undefined,
        confirmText: 'OK'
    });

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Helper function to check if there are any unsaved changes
    const checkHasUnsavedChanges = (eventsList: ScheduleEvent[]) => {
        return eventsList.some(event =>
            (event.originalDate && event.originalDate !== event.date) ||
            (event.originalTitle && event.originalTitle !== event.title) ||
            (event.originalType && event.originalType !== event.type) ||
            (event.originalDescription && event.originalDescription !== event.description)
        );
    };

    // Update the hasUnsavedChanges whenever events change
    useEffect(() => {
        setHasUnsavedChanges(checkHasUnsavedChanges(events));
    }, [events]);

    // Event management functions
    const saveEventDate = (eventId: number, newDate: string) => {
        setEvents(prevEvents =>
            prevEvents.map(event => {
                if (event.id === eventId) {
                    const originalDate = event.originalDate || event.date;
                   return { ...event, date: newDate, originalDate };
                }
                return event;
            })
        );
        setEditingEventId(null);
        // hasUnsavedChanges будет обновлен автоматически через useEffect
    };

    const restoreAllDates = () => {
        setEvents(prevEvents => {
            const restored = prevEvents.map(event => ({
                ...event,
                date: event.originalDate || event.date,
                title: event.originalTitle || event.title,
                type: event.originalType || event.type,
                description: event.originalDescription || event.description,
                // Clear all original values after restoring
                originalDate: undefined,
                originalTitle: undefined,
                originalType: undefined,
                originalDescription: undefined
            }));
            return restored;
        });
        // hasUnsavedChanges будет обновлен автоматически через useEffect
    };

    const restoreEventDate = (eventId: number) => {
        setEvents(prevEvents => {
            const updatedEvents = prevEvents.map(event => {
                if (event.id === eventId) {
                    return {
                        ...event,
                        date: event.originalDate || event.date,
                        title: event.originalTitle || event.title,
                        type: event.originalType || event.type,
                        description: event.originalDescription || event.description,
                        // Clear original values for this event
                        originalDate: undefined,
                        originalTitle: undefined,
                        originalType: undefined,
                        originalDescription: undefined
                    };
                }
                return event;
            });
            return updatedEvents;
        });
        // hasUnsavedChanges будет обновлен автоматически через useEffect
    };

    // Modal functions
    const showModal = (type: any, title: string, message: string, details?: string[], onConfirm?: () => void, confirmText?: string) => {
        setModalState({
            isOpen: true,
            type,
            title,
            message,
            details,
            onConfirm,
            confirmText: confirmText || 'OK'
        });
    };

    const closeModal = () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
    };

    // Processing functions
    const processData = async (formData: FormData) => {
        setIsProcessing(true);

        const fileFromForm = formData.get('file') as File;
        if (fileFromForm) {
            setLastProcessedFile(fileFromForm.name);
        } else {
            setLastProcessedFile('Manual text input');
        }

        try {
            const response = await fetch('/api/process-syllabus', {
                method: 'POST',
                body: formData,
            });

            const result: ProcessingResult = await response.json();

            if (result.success && result.events) {
                if (result.events.length === 0) {
                    setShowNoEventsModal(true);
                } else {
                    const processedEvents = result.events.map((event, index) => ({
                        ...event,
                        id: index + 1
                    }));
                    setEvents(processedEvents);
                    setSelectedEvents([]);
                    setSelectAll(false);
                    setIsSelectionMode(false);
                    // hasUnsavedChanges будет установлен в false автоматически

                    showModal(
                        'success',
                        'Processing Complete',
                        `Successfully extracted ${processedEvents.length} events from the document.`,
                        [`${processedEvents.length} events found and parsed`, 'You can now export them to your calendar']
                    );
                }
            } else {
                showModal(
                    'error',
                    'Processing Error',
                    result.error || 'Unknown error occurred.',
                    [
                        'Check if the document contains dates',
                        'Try manual text input instead',
                        'Ensure PDF is not password protected'
                    ]
                );
            }
        } catch (error) {
            showModal(
                'error',
                'Connection Error',
                'Failed to connect to the processing server.',
                [
                    'Check your internet connection',
                    'Try again in a few moments',
                    'Contact support if problem persists'
                ]
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const processFile = () => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        processData(formData);
    };

    const processManualText = () => {
        const formData = new FormData();
        formData.append('manualText', manualText);
        processData(formData);
    };

    // Selection functions
    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        if (!isSelectionMode) {
            setSelectedEvents([]);
            setSelectAll(false);
        }
    };

    const toggleEventSelection = (eventId: number) => {
        setSelectedEvents(prev => {
            const newSelection = prev.includes(eventId)
                ? prev.filter(id => id !== eventId)
                : [...prev, eventId];

            setSelectAll(newSelection.length === events.length);
            return newSelection;
        });
    };

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedEvents([]);
            setSelectAll(false);
        } else {
            setSelectedEvents(events.map(e => e.id));
            setSelectAll(true);
        }
    };

    const resetForm = () => {
        setFile(null);
        setManualText('');
        setEvents([]);
        setSelectedEvents([]);
        setSelectAll(false);
        setIsSelectionMode(false);
        setIsProcessing(false);
        setShowNoEventsModal(false);
        setLastProcessedFile('');
        setEditingEventId(null);
        // hasUnsavedChanges будет установлен в false автоматически

        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const loadSampleData = () => {
        setEvents(sampleEvents);
        setSelectedEvents([]);
        setSelectAll(false);
        setIsSelectionMode(false);
        // hasUnsavedChanges будет установлен в false автоматически

        showModal(
            'info',
            'Demo Data Loaded',
            'Sample events have been loaded for demonstration.',
            ['3 sample events loaded', 'You can export them to test the functionality']
        );
    };

    const handleExportSelectedToGoogle = () => {
        exportSelectedToGoogle(events, selectedEvents, showModal);
    };

    const handleExportSingleEvent = (event: ScheduleEvent) => {
        exportSingleEvent(event);
    };

    // Event update and delete functions - Enhanced to store original values
    const updateEvent = (updatedEvent: ScheduleEvent) => {
        setEvents(prevEvents => {
            const updated = prevEvents.map(event => {
                if (event.id === updatedEvent.id) {
                    // Store original values on first change
                    const originalDate = event.originalDate || event.date;
                    const originalTitle = event.originalTitle || event.title;
                    const originalType = event.originalType || event.type;
                    const originalDescription = event.originalDescription || event.description;

                    return {
                        ...updatedEvent,
                        originalDate: updatedEvent.date !== originalDate ? originalDate : undefined,
                        originalTitle: updatedEvent.title !== originalTitle ? originalTitle : undefined,
                        originalType: updatedEvent.type !== originalType ? originalType : undefined,
                        originalDescription: updatedEvent.description !== originalDescription ? originalDescription : undefined
                    };
                }
                return event;
            });
            return updated;
        });
        // hasUnsavedChanges будет обновлен автоматически через useEffect
    };

    const deleteEvent = (eventId: number) => {
        setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
        setSelectedEvents(prevSelected => prevSelected.filter(id => id !== eventId));
        // hasUnsavedChanges будет обновлен автоматически через useEffect
    };

    return (
        <div className="h-screen text-white relative overflow-hidden" style={{ backgroundColor: '#161513' }}>
            {/* Background patterns */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(120,119,198,0.1)_0%,transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.05)_0%,transparent_50%)]"></div>

            {/* Notification Modal */}
            <NotificationModal {...modalState} onClose={closeModal} />

            {/* No Events Modal */}
            <NoEventsModal
                isOpen={showNoEventsModal}
                onClose={() => setShowNoEventsModal(false)}
                fileName={lastProcessedFile}
                suggestions={[
                    'The document was processed successfully',
                    'Text extraction completed',
                    'No dates or events were detected in the content'
                ]}
            />

            <div className="relative h-full flex flex-col max-w-6xl mx-auto px-6">
                {/* Compact Header */}
                <div className="text-center py-6 flex-shrink-0">
                    <div className="inline-flex items-center gap-3 mb-2">
                        <div className="p-1.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                            <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-light tracking-tight text-white">Schedule Parser</h1>
                    </div>
                    <p className="text-sm text-gray-300 max-w-xl mx-auto leading-relaxed font-light">
                        AI-powered parsing for meetings, deadlines, and important dates.
                    </p>
                </div>

                {/* Main Content - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    {!events.length ? (
                        /* Upload Section */
                        <FileUpload
                            file={file}
                            setFile={setFile}
                            isProcessing={isProcessing}
                            inputMethod={inputMethod}
                            setInputMethod={setInputMethod}
                            manualText={manualText}
                            setManualText={setManualText}
                            processFile={processFile}
                            processManualText={processManualText}
                            showModal={showModal}
                            loadSampleData={loadSampleData}
                        />
                    ) : (
                        /* Results Section - EventList з вбудованим фільтром */
                        <EventList
                            events={events}
                            selectedEvents={selectedEvents}
                            selectAll={selectAll}
                            isSelectionMode={isSelectionMode}
                            editingEventId={editingEventId}
                            hasUnsavedChanges={hasUnsavedChanges}
                            isClient={isClient}
                            toggleEventSelection={toggleEventSelection}
                            toggleSelectAll={toggleSelectAll}
                            toggleSelectionMode={toggleSelectionMode}
                            exportSelectedToGoogle={handleExportSelectedToGoogle}
                            exportSingleEvent={handleExportSingleEvent}
                            saveEventDate={saveEventDate}
                            restoreEventDate={restoreEventDate}
                            restoreAllDates={restoreAllDates}
                            setEditingEventId={setEditingEventId}
                            resetForm={resetForm}
                            updateEvent={updateEvent}
                            deleteEvent={deleteEvent}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}