'use client'

import { useState, useEffect } from 'react'
import { Upload, Calendar, List, FileText, CheckCircle, ArrowRight, AlertCircle, X, Edit3, Check, RotateCcw } from 'lucide-react'
// Типи
interface ScheduleEvent {
    id: number
    title: string
    date: string
    type: 'meeting' | 'deadline' | 'event' | 'appointment' | 'task' | 'legal' | 'other'
    description?: string
    originalDate?: string
}

type ViewMode = 'calendar' | 'list'
type InputMethod = 'file' | 'text'

interface ProcessingResult {
    success: boolean
    events?: ScheduleEvent[]
    error?: string
    debug?: {
        textLength?: number
        eventsFound?: number
    }
}

// Типи для модального вікна
type ModalType = 'error' | 'warning' | 'info' | 'success'

interface ModalState {
    isOpen: boolean
    type: ModalType
    title: string
    message: string
    details?: string[]
    onConfirm?: () => void
    confirmText?: string
}

// Універсальне модальне вікно
const NotificationModal = ({
                               isOpen,
                               type,
                               title,
                               message,
                               details,
                               onClose,
                               onConfirm,
                               confirmText = 'OK'
                           }: ModalState & { onClose: () => void }) => {
    if (!isOpen) return null

    const getIcon = () => {
        switch (type) {
            case 'error':
                return <AlertCircle className="h-5 w-5 text-red-600" />
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-yellow-600" />
            case 'success':
                return <Check className="h-5 w-5 text-green-600" />
            case 'info':
            default:
                return <Info className="h-5 w-5 text-blue-600" />
        }
    }

    const getColorScheme = () => {
        switch (type) {
            case 'error':
                return {
                    bg: 'bg-red-100',
                    border: 'border-red-200',
                    titleColor: 'text-red-900',
                    textColor: 'text-red-800',
                    detailBg: 'bg-red-50',
                    detailText: 'text-red-700',
                    button: 'bg-red-600 hover:bg-red-700'
                }
            case 'warning':
                return {
                    bg: 'bg-yellow-100',
                    border: 'border-yellow-200',
                    titleColor: 'text-yellow-900',
                    textColor: 'text-yellow-800',
                    detailBg: 'bg-yellow-50',
                    detailText: 'text-yellow-700',
                    button: 'bg-yellow-600 hover:bg-yellow-700'
                }
            case 'success':
                return {
                    bg: 'bg-green-100',
                    border: 'border-green-200',
                    titleColor: 'text-green-900',
                    textColor: 'text-green-800',
                    detailBg: 'bg-green-50',
                    detailText: 'text-green-700',
                    button: 'bg-green-600 hover:bg-green-700'
                }
            case 'info':
            default:
                return {
                    bg: 'bg-blue-100',
                    border: 'border-blue-200',
                    titleColor: 'text-blue-900',
                    textColor: 'text-blue-800',
                    detailBg: 'bg-blue-50',
                    detailText: 'text-blue-700',
                    button: 'bg-blue-600 hover:bg-blue-700'
                }
        }
    }

    const colors = getColorScheme()

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 ${colors.bg} rounded-lg`}>
                            {getIcon()}
                        </div>
                        <h3 className={`text-lg font-semibold ${colors.titleColor}`}>{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className={`${colors.textColor} mb-4`}>
                        {message}
                    </p>

                    {details && details.length > 0 && (
                        <div className={`${colors.detailBg} rounded-lg p-4 mb-4`}>
                            <ul className="space-y-2 text-sm">
                                {details.map((detail, index) => (
                                    <li key={index} className={`flex items-start gap-2 ${colors.detailText}`}>
                                        <span className="text-xs mt-0.5">•</span>
                                        {detail}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-100">
                    {onConfirm ? (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm()
                                    onClose()
                                }}
                                className={`flex-1 px-4 py-2 ${colors.button} text-white rounded-lg transition-colors font-medium`}
                            >
                                {confirmText}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                        >
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// Компонент модального вікна для "Жодних подій не знайдено"
const NoEventsModal = ({ isOpen, onClose, fileName, suggestions }: {
    isOpen: boolean
    onClose: () => void
    fileName?: string
    suggestions?: string[]
}) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">No Events Found</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-700 mb-4">
                        We couldn't find any dates or events in {fileName ? `"${fileName}"` : 'the provided document'}.
                    </p>

                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-blue-900 mb-2">💡 Suggestions:</h4>
                        <ul className="space-y-2 text-sm text-blue-800">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                Make sure the document contains specific dates (not just "Week 1", "Next Monday")
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                Check if it's a text-based PDF (not a scanned image)
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                Try copying and pasting the text manually instead
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                Look for documents with schedules, deadlines, or appointment lists
                            </li>
                        </ul>
                    </div>

                    {suggestions && suggestions.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Document contains:</h4>
                            <ul className="space-y-1 text-sm text-gray-700">
                                {suggestions.map((suggestion, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-gray-500 mt-0.5">•</span>
                                        {suggestion}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                        Try Another Document
                    </button>
                </div>
            </div>
        </div>
    )
}

// Функція для стилізації подій
const getEventStyle = (type: string) => {
    switch (type.toLowerCase()) {
        case 'meeting':
            return {
                color: 'border-l-blue-400 bg-blue-50/80 border-blue-100/50',
                badge: 'bg-blue-500/90',
                icon: '👥',
                textColor: 'text-blue-700'
            }
        case 'deadline':
            return {
                color: 'border-l-red-400 bg-red-50/80 border-red-100/50',
                badge: 'bg-red-500/90',
                icon: '⏰',
                textColor: 'text-red-700'
            }
        case 'event':
            return {
                color: 'border-l-purple-400 bg-purple-50/80 border-purple-100/50',
                badge: 'bg-purple-500/90',
                icon: '🎉',
                textColor: 'text-purple-700'
            }
        case 'appointment':
            return {
                color: 'border-l-green-400 bg-green-50/80 border-green-100/50',
                badge: 'bg-green-500/90',
                icon: '📅',
                textColor: 'text-green-700'
            }
        case 'task':
            return {
                color: 'border-l-amber-400 bg-amber-50/80 border-amber-100/50',
                badge: 'bg-amber-500/90',
                icon: '✅',
                textColor: 'text-amber-700'
            }
        case 'legal':
            return {
                color: 'border-l-indigo-400 bg-indigo-50/80 border-indigo-100/50',
                badge: 'bg-indigo-500/90',
                icon: '⚖️',
                textColor: 'text-indigo-700'
            }
        default:
            return {
                color: 'border-l-slate-400 bg-slate-50/80 border-slate-100/50',
                badge: 'bg-slate-500/90',
                icon: '📋',
                textColor: 'text-slate-700'
            }
    }
}

// Компонент для редагування дати
const DateEditor = ({ event, onSave, onCancel }: {
    event: ScheduleEvent
    onSave: (eventId: number, newDate: string) => void
    onCancel: () => void
}) => {
    const [tempDate, setTempDate] = useState(event.date)
    const [isValid, setIsValid] = useState(true)

    useEffect(() => {
        // Перевіряємо валідність дати
        const date = new Date(tempDate)
        setIsValid(!isNaN(date.getTime()) && tempDate.length === 10)
    }, [tempDate])

    const handleSave = () => {
        if (isValid && tempDate !== event.date) {
            onSave(event.id, tempDate)
        } else {
            onCancel()
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && isValid) {
            handleSave()
        } else if (e.key === 'Escape') {
            onCancel()
        }
    }

    return (
        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border-2 border-blue-200 shadow-sm">
            <input
                type="date"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                onKeyDown={handleKeyPress}
                className={`px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isValid ? 'border-gray-300' : 'border-red-300 bg-red-50'
                }`}
                autoFocus
            />
            <button
                onClick={handleSave}
                disabled={!isValid}
                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                title="Save date"
            >
                <Check className="h-4 w-4" />
            </button>
            <button
                onClick={onCancel}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Cancel editing"
            >
                <X className="h-4 w-4" />
            </button>
            {event.originalDate && event.originalDate !== tempDate && (
                <button
                    onClick={() => setTempDate(event.originalDate!)}
                    className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                    title="Restore original date"
                >
                    <RotateCcw className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}

export default function HomePage() {
    const [file, setFile] = useState<File | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [events, setEvents] = useState<ScheduleEvent[]>([])
    const [viewMode, setViewMode] = useState<ViewMode>('list')
    const [isClient, setIsClient] = useState(false)
    const [manualText, setManualText] = useState('')
    const [selectedEvents, setSelectedEvents] = useState<number[]>([])
    const [selectAll, setSelectAll] = useState(false)
    const [isSelectionMode, setIsSelectionMode] = useState(false)
    const [inputMethod, setInputMethod] = useState<InputMethod>('file')
    const [showNoEventsModal, setShowNoEventsModal] = useState(false)
    const [lastProcessedFile, setLastProcessedFile] = useState<string>('')
    const [editingEventId, setEditingEventId] = useState<number | null>(null)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    // Стан для модального вікна повідомлень
    const [modalState, setModalState] = useState<ModalState>({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
        details: undefined,
        onConfirm: undefined,
        confirmText: 'OK'
    })

    useEffect(() => {
        setIsClient(true)
    }, [])

    // Функція для збереження нової дати події
    const saveEventDate = (eventId: number, newDate: string) => {
        setEvents(prevEvents =>
            prevEvents.map(event => {
                if (event.id === eventId) {
                    // Зберігаємо оригінальну дату при першому редагуванні
                    const originalDate = event.originalDate || event.date
                    return {
                        ...event,
                        date: newDate,
                        originalDate
                    }
                }
                return event
            })
        )
        setEditingEventId(null)
        setHasUnsavedChanges(true)
    }

    // Функція для відновлення всіх дат до оригінальних
        const restoreAllDates = () => {
            setEvents(prevEvents =>
                prevEvents.map(event => ({
                    ...event,
                    date: event.originalDate || event.date
                }))
            )
            setHasUnsavedChanges(false)
        }

    // Функція для відновлення однієї дати до оригінальної
        const restoreEventDate = (eventId: number) => {
            setEvents(prevEvents =>
                prevEvents.map(event => {
                    if (event.id === eventId && event.originalDate) {
                        return {
                            ...event,
                            date: event.originalDate
                        }
                    }
                    return event
                })
            )
            setHasUnsavedChanges(false)
        }
    // Функція для показу модального вікна
    const showModal = (type: ModalType, title: string, message: string, details?: string[], onConfirm?: () => void, confirmText?: string) => {
        setModalState({
            isOpen: true,
            type,
            title,
            message,
            details,
            onConfirm,
            confirmText: confirmText || 'OK'
        })
    }

    const closeModal = () => {
        setModalState(prev => ({ ...prev, isOpen: false }))
    }

    // Функція для експорту однієї події в Google Calendar
    const exportSingleEvent = (event: ScheduleEvent) => {
        const date = new Date(event.date)
        const dateStr = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

        const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
            `&text=${encodeURIComponent(event.title)}` +
            `&dates=${dateStr}/${dateStr}` +
            `&details=${encodeURIComponent(event.description || '')}` +
            `&location=`

        window.open(googleUrl, '_blank')
    }

    // Функція для створення ICS файлу
    const createICSFile = (events: ScheduleEvent[]) => {
        let icsContent = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Schedule Parser//EN\r\nCALSCALE:GREGORIAN\r\n'

        events.forEach(event => {
            const date = new Date(event.date)
            const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')

            icsContent += 'BEGIN:VEVENT\r\n'
            icsContent += `UID:${event.id}-${Date.now()}@scheduleparser.com\r\n`
            icsContent += `DTSTART;VALUE=DATE:${dateStr}\r\n`
            icsContent += `DTEND;VALUE=DATE:${dateStr}\r\n`
            icsContent += `SUMMARY:${event.title.replace(/[,;\\]/g, '\\$&')}\r\n`
            if (event.description) {
                icsContent += `DESCRIPTION:${event.description.replace(/[,;\\]/g, '\\$&')}\r\n`
            }
            icsContent += `CATEGORIES:${event.type.toUpperCase()}\r\n`
            icsContent += 'STATUS:CONFIRMED\r\n'
            icsContent += 'END:VEVENT\r\n'
        })

        icsContent += 'END:VCALENDAR\r\n'
        return icsContent
    }

    // Функція завантаження ICS файлу
    const downloadICSFile = (icsContent: string, eventCount: number) => {
        const blob = new Blob([icsContent], {type: 'text/calendar;charset=utf-8'})
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = 'schedule-events.ics'
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        setTimeout(() => {
            showModal(
                'success',
                'Events Exported Successfully',
                `Downloaded ${eventCount} events as "schedule-events.ics"`,
                [
                    'Google Calendar: Go to Settings > Import & Export > Import',
                    'Outlook: File > Open & Export > Import/Export',
                    'Apple Calendar: File > Import > Select the downloaded file'
                ]
            )
        }, 500)
    }

    // Функція експорту вибраних подій
    const exportSelectedToGoogle = () => {
        const selectedEventsList = events.filter(event => selectedEvents.includes(event.id))

        if (selectedEventsList.length === 0) {
            showModal(
                'warning',
                'No Events Selected',
                'Please select at least one event to export',
                ['Click checkboxes next to events', 'Or use "Select All" button']
            )
            return
        }

        if (selectedEventsList.length === 1) {
            exportSingleEvent(selectedEventsList[0])
        } else {
            const icsContent = createICSFile(selectedEventsList)
            downloadICSFile(icsContent, selectedEventsList.length)
        }
    }

    const processData = async (formData: FormData) => {
        setIsProcessing(true)

        // Зберігаємо назву файлу для модального вікна
        const fileFromForm = formData.get('file') as File
        if (fileFromForm) {
            setLastProcessedFile(fileFromForm.name)
        } else {
            setLastProcessedFile('Manual text input')
        }

        try {
            const response = await fetch('/api/process-syllabus', {
                method: 'POST',
                body: formData,
            })

            const result: ProcessingResult = await response.json()

            if (result.success && result.events) {
                if (result.events.length === 0) {
                    // Показуємо модальне вікно, якщо подій не знайдено
                    setShowNoEventsModal(true)
                } else {
                    const processedEvents = result.events.map((event, index) => ({
                        ...event,
                        id: index + 1
                    }))
                    setEvents(processedEvents)
                    setSelectedEvents([])
                    setSelectAll(false)
                    setIsSelectionMode(false)
                    setHasUnsavedChanges(false)

                    // Показуємо успішне повідомлення
                    showModal(
                        'success',
                        'Processing Complete',
                        `Successfully extracted ${processedEvents.length} events from the document`,
                        [`${processedEvents.length} events found and parsed`, 'You can now export them to your calendar']
                    )
                }
            } else {
                showModal(
                    'error',
                    'Processing Error',
                    result.error || 'Unknown error occurred',
                    ['Check if the document contains dates', 'Try manual text input instead', 'Ensure PDF is not password protected']
                )
            }
        } catch (error) {
            showModal(
                'error',
                'Connection Error',
                'Failed to connect to the processing server',
                ['Check your internet connection', 'Try again in a few moments', 'Contact support if problem persists']
            )
        } finally {
            setIsProcessing(false)
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile?.type === 'application/pdf') {
            setFile(selectedFile)
        } else {
            showModal(
                'warning',
                'Invalid File Type',
                'Please upload a PDF file',
                ['Only PDF files are supported', 'Convert your document to PDF first', 'Or use manual text input']
            )
            // Reset file input
            e.target.value = ''
        }
    }

    const processFile = () => {
        if (!file) return
        const formData = new FormData()
        formData.append('file', file)
        processData(formData)
    }

    const processManualText = () => {
        const formData = new FormData()
        formData.append('manualText', manualText)
        processData(formData)
    }

    const resetForm = () => {
        setFile(null)
        setManualText('')
        setEvents([])
        setSelectedEvents([])
        setSelectAll(false)
        setIsSelectionMode(false)
        setIsProcessing(false)
        setShowNoEventsModal(false)
        setLastProcessedFile('')
        setEditingEventId(null)
        setHasUnsavedChanges(false)

        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement
        if (fileInput) {
            fileInput.value = ''
        }
    }

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode)
        if (!isSelectionMode) {
            setSelectedEvents([])
            setSelectAll(false)
        }
    }

    const toggleEventSelection = (eventId: number) => {
        setSelectedEvents(prev => {
            const newSelection = prev.includes(eventId)
                ? prev.filter(id => id !== eventId)
                : [...prev, eventId]

            setSelectAll(newSelection.length === events.length)
            return newSelection
        })
    }

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedEvents([])
            setSelectAll(false)
        } else {
            setSelectedEvents(events.map(e => e.id))
            setSelectAll(true)
        }
    }

    // Демонстраційні події для тестування
    const sampleEvents: ScheduleEvent[] = [
        {
            id: 1,
            title: "Team Meeting",
            date: "2025-09-10",
            type: "meeting",
            description: "Weekly team sync to discuss project progress and upcoming deliverables"
        },
        {
            id: 2,
            title: "Project Deadline",
            date: "2025-09-15",
            type: "deadline",
            description: "Final submission for the Q3 marketing campaign"
        },
        {
            id: 3,
            title: "Client Presentation",
            date: "2025-09-20",
            type: "appointment",
            description: "Presenting the new product features to key stakeholders"
        }
    ]

    const loadSampleData = () => {
        setEvents(sampleEvents)
        setSelectedEvents([])
        setSelectAll(false)
        setIsSelectionMode(false)
        setIsSelectionMode(false)
        setHasUnsavedChanges(false)

        showModal(
            'info',
            'Demo Data Loaded',
            'Sample events have been loaded for demonstration',
            ['3 sample events loaded', 'You can export them to test the functionality']
        )
    }

    return (
        <div className="h-screen text-white relative overflow-hidden" style={{backgroundColor: '#161513'}}>
            {/* Background patterns */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_rgba(120,119,198,0.1)_0%,_transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(255,255,255,0.05)_0%,_transparent_50%)]"></div>

            {/* Notification Modal */}
            <NotificationModal
                {...modalState}
                onClose={closeModal}
            />

            {/* No Events Modal */}
            <NoEventsModal
                isOpen={showNoEventsModal}
                onClose={() => setShowNoEventsModal(false)}
                fileName={lastProcessedFile}
                suggestions={[
                    "The document was processed successfully",
                    "Text extraction completed",
                    "No dates or events were detected in the content"
                ]}
            />

            <div className="relative h-full flex flex-col max-w-6xl mx-auto px-6">
                {/* Compact Header */}
                <div className="text-center py-6 flex-shrink-0">
                    <div className="inline-flex items-center gap-3 mb-2">
                        <div className="p-1.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                            <Calendar className="h-5 w-5 text-white"/>
                        </div>
                        <h1 className="text-2xl font-light tracking-tight text-white">
                            Schedule Parser
                        </h1>
                    </div>
                    <p className="text-sm text-gray-300 max-w-xl mx-auto leading-relaxed font-light">
                        AI-powered parsing for meetings, deadlines, and important dates.
                    </p>
                </div>

                {/* Main Content - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    {!events.length ? (
                        /* Upload Section */
                        <div className="bg-white/95 backdrop-blur-xl text-gray-900 rounded-2xl shadow-2xl border border-white/20 ring-1 ring-white/20 overflow-hidden max-w-4xl mx-auto">
                            {/* Compact Header with Toggle */}
                            <div className="px-6 py-4 bg-gradient-to-r from-gray-50/80 to-white/90 border-b border-gray-100/50">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h2 className="text-xl font-light text-gray-900 mb-1">Upload Document</h2>
                                        <p className="text-sm text-gray-600">Extract events from any schedule or document</p>
                                    </div>

                                    {/* Method Toggle */}
                                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                        <button
                                            onClick={() => setInputMethod('file')}
                                            className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                                                inputMethod === 'file'
                                                    ? 'bg-white shadow text-gray-900'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            <FileText className="h-3 w-3 inline mr-1"/>
                                            PDF File
                                        </button>
                                        <button
                                            onClick={() => setInputMethod('text')}
                                            className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                                                inputMethod === 'text'
                                                    ? 'bg-white shadow text-gray-900'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            <FileText className="h-3 w-3 inline mr-1"/>
                                            Manual Text
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                {inputMethod === 'file' ? (
                                    /* PDF Upload */
                                    <div className="max-h-fit overflow-hidden">
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100/50">
                                                <FileText className="h-5 w-5 text-blue-600"/>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900 mb-1">Upload PDF Document</h3>
                                                <p className="text-gray-600 text-sm leading-relaxed">
                                                    Upload any document with dates and events for automatic extraction
                                                </p>
                                            </div>
                                        </div>

                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            id="file-upload"
                                        />

                                        {!file && (
                                            <label
                                                htmlFor="file-upload"
                                                className="group relative block w-full p-15 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50/50 cursor-pointer transition-all duration-300"
                                            >
                                                <div className="text-center">
                                                    <Upload className="mx-auto h-8 w-8 text-gray-400 group-hover:text-gray-500 mb-3 transition-colors"/>
                                                    <span className="block text-base font-medium text-gray-900 mb-1.5">
                                                        Choose PDF file
                                                    </span>
                                                    <span className="block text-base text-gray-500">
                                                        Up to 50MB • Works with schedules, contracts, timelines
                                                    </span>
                                                </div>
                                            </label>
                                        )}

                                        {file && (
                                            <div className="group relative block w-full p-12 border-2 bg-emerald-50/80 border-emerald-200/50 rounded-xl transition-all duration-300 box-border">
                                                <div className="text-center">
                                                    <CheckCircle className="mx-auto h-6 w-6 text-emerald-600 mb-2"/>
                                                    <span className="block text-sm font-medium text-emerald-900 mb-1 truncate">
                                                        {file.name}
                                                    </span>
                                                    <span className="block text-s text-emerald-700 mb-3">
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to process
                                                    </span>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setFile(null)
                                                                // Очищаємо input елемент
                                                                const fileInput = document.getElementById('file-upload') as HTMLInputElement
                                                                if (fileInput) {
                                                                    fileInput.value = ''
                                                                }
                                                            }}
                                                            className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-lg transition-all duration-200 font-medium border border-gray-300"
                                                        >
                                                            Remove
                                                        </button>
                                                        <button
                                                            onClick={processFile}
                                                            disabled={isProcessing}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all duration-200"
                                                        >
                                                            {isProcessing ? (
                                                                <>
                                                                    <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                                                                    Processing...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    Parse PDF
                                                                    <ArrowRight className="h-3 w-3"/>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Manual Text */
                                    <div>
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="flex-shrink-0 w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100/50">
                                                <FileText className="h-5 w-5 text-gray-600"/>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900 mb-1">Paste Text Content</h3>
                                                <p className="text-gray-600 text-sm leading-relaxed">
                                                    Copy and paste any text with dates and events for processing
                                                </p>
                                            </div>
                                        </div>

                                        <textarea
                                            className="w-full h-54 p-3 border-2 border-gray-200 rounded-lg resize-none text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 bg-gray-50/50"
                                            placeholder="Paste any document text with dates and events here..."
                                            value={manualText}
                                            onChange={(e) => setManualText(e.target.value)}
                                        />

                                        {manualText.length > 20 && (
                                            <div className="mt-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600">
                                                        {manualText.length} characters ready
                                                    </span>
                                                    <button
                                                        onClick={processManualText}
                                                        disabled={isProcessing}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all duration-200"
                                                    >
                                                        {isProcessing ? (
                                                            <>
                                                                <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                                                                Processing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                Parse Text
                                                                <ArrowRight className="h-3 w-3"/>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Tips and Demo */}
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <div className="flex items-start justify-between gap-6">
                                        {/* Tips */}
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 mb-3 text-sm">Tips for best results</h4>
                                            <ul className="space-y-2 text-sm text-gray-700">
                                                <li className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                                    Use text-based documents (not scanned images)
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                                    Works with schedules, contracts, timelines, agendas
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                                    Files under 10MB process faster and more reliably
                                                </li>
                                            </ul>
                                        </div>

                                        {/* Demo Button */}
                                        <div className="flex-shrink-0">
                                            <button
                                                onClick={loadSampleData}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-all duration-200"
                                            >
                                                Try Demo
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Results Section */
                        <div className="bg-white/95 backdrop-blur-xl text-gray-900 rounded-2xl shadow-2xl border border-white/20 ring-1 ring-white/20 overflow-hidden mb-6">
                            {/* Header */}
                            <div className="px-6 py-4 bg-gradient-to-r from-gray-50/80 to-gray-100/50 border-b border-gray-100/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-light text-gray-900 mb-1">Parsed Events</h2>
                                        <p className="text-sm text-gray-600 mb-1">
                                            Found {events.length} events
                                            {isSelectionMode && ` • ${selectedEvents.length} selected`}
                                            {hasUnsavedChanges && " • ⚠️ Modified dates"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {isSelectionMode
                                                ? "Select events for batch export or individual Google Calendar links"
                                                : "\"Click 'Add to Google' for individual events or 'Select Multiple' for batch export\" You can edit dates with the pencil icon"
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
                                                    title={selectedEvents.length === 1 ? "Open in Google Calendar" : "Download ICS file for import"}
                                                >
                                                    <Calendar className="h-4 w-4"/>
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
                                            <button
                                                onClick={toggleSelectionMode}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all duration-200"
                                            >
                                                Select Multiple
                                            </button>
                                        )}
                                        <button
                                            onClick={resetForm}
                                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                                        >
                                            Parse Another
                                        </button>
                                    </div>

                                    {hasUnsavedChanges && (
                                        <button
                                            onClick={restoreAllDates}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-sm font-medium rounded-lg transition-all duration-200 border border-orange-200"
                                        >
                                            <RotateCcw className="h-4 w-4"/>
                                            Restore All Dates
                                        </button>
                                    )}
                                </div>

                                {/* Select All Controls */}
                                {isSelectionMode && (
                                    <div className="mt-3 flex items-center gap-3 pt-3 border-t border-gray-100">
                                        <button
                                            onClick={toggleSelectAll}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <div className={`w-4 h-4 border-2 rounded ${selectAll ? 'bg-gray-900 border-gray-900' : 'border-gray-300'} flex items-center justify-center`}>
                                                {selectAll && (
                                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
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
                                    {events.map(event => {
                                        const style = getEventStyle(event.type)
                                        const isSelected = selectedEvents.includes(event.id)
                                        const isEditing = editingEventId === event.id
                                        const isModified = event.originalDate && event.originalDate !== event.date

                                        return (
                                            <div
                                                key={event.id}
                                                className={`border-l-4 ${style.color} p-4 rounded-r-xl transition-all duration-300 hover:shadow-md hover:shadow-gray-200/50 hover:-translate-y-0.5 ${
                                                    isSelectionMode && isSelected ? 'ring-2 ring-gray-400 bg-gray-50/50' : ''
                                                } ${isModified ? 'bg-yellow-50/30' : ''}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* Checkbox - тільки в режимі вибору */}
                                                    {isSelectionMode && (
                                                        <button
                                                            onClick={() => toggleEventSelection(event.id)}
                                                            className="flex-shrink-0 mt-0.5"
                                                        >
                                                            <div className={`w-5 h-5 border-2 rounded ${isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300 hover:border-gray-500'} flex items-center justify-center transition-colors`}>
                                                                {isSelected && (
                                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
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
                                                                    <p className={`text-sm font-medium ${style.textColor}`}
                                                                       suppressHydrationWarning>
                                                                        {isClient && new Date(event.date + "T00:00:00").toLocaleDateString('en-US', {
                                                                            weekday: 'long',
                                                                            year: 'numeric',
                                                                            month: 'long',
                                                                            day: 'numeric',
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
                                                        {/* Add to Google кнопка тільки НЕ в режимі вибору */}
                                                        {!isSelectionMode && (
                                                            <button
                                                                onClick={() => exportSingleEvent(event)}
                                                                className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5"
                                                                title="Add this event to Google Calendar"
                                                            >
                                                                <Calendar className="h-3 w-3"/>
                                                                Add to Google
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}