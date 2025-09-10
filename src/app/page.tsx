'use client'

import { useState, useEffect } from 'react'
import { Upload, Calendar, List, FileText, CheckCircle, ArrowRight } from 'lucide-react'

// Типи
interface ScheduleEvent {
    id: number
    title: string
    date: string
    type: 'meeting' | 'deadline' | 'event' | 'appointment' | 'task' | 'legal' | 'other'
    description?: string
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

    useEffect(() => {
        setIsClient(true)
    }, [])

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
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
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
            alert(
                `📅 Downloaded ${eventCount} events as "schedule-events.ics"\n\n` +
                `To add to your calendar:\n` +
                `• Google Calendar: Go to Settings > Import & Export > Import\n` +
                `• Outlook: File > Open & Export > Import/Export\n` +
                `• Apple Calendar: File > Import > Select the downloaded file`
            )
        }, 500)
    }

    // Функція експорту вибраних подій
    const exportSelectedToGoogle = () => {
        const selectedEventsList = events.filter(event => selectedEvents.includes(event.id))

        if (selectedEventsList.length === 0) {
            alert('Please select at least one event to export')
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
        try {
            const response = await fetch('/api/process-syllabus', {
                method: 'POST',
                body: formData,
            })

            const result: ProcessingResult = await response.json()

            if (result.success && result.events) {
                const processedEvents = result.events.map((event, index) => ({
                    ...event,
                    id: index + 1
                }))
                setEvents(processedEvents)
                setSelectedEvents([])
                setSelectAll(false)
                setIsSelectionMode(false)
            } else {
                alert('Error: ' + (result.error || 'Unknown error'))
            }
        } catch (error) {
            alert('Error processing data')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile?.type === 'application/pdf') {
            setFile(selectedFile)
        } else {
            alert('Please upload a PDF file')
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

    // Додаємо демонстраційні події для тестування
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
    }

    return (
        <div className="h-screen text-white relative overflow-hidden" style={{backgroundColor: '#161513'}}>
            {/* Background patterns */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_rgba(120,119,198,0.1)_0%,_transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(255,255,255,0.05)_0%,_transparent_50%)]"></div>

            <div className="relative h-full flex flex-col max-w-6xl mx-auto px-6">
                {/* Compact Header */}
                <div className="text-center py-6 flex-shrink-0">
                    <div className="inline-flex items-center gap-3 mb-2">
                        <div className="p-1.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                            <Calendar className="h-5 w-5 text-white" />
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
                                            <FileText className="h-3 w-3 inline mr-1" />
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
                                            <FileText className="h-3 w-3 inline mr-1" />
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
                                                <FileText className="h-5 w-5 text-blue-600" />
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
                                                    <Upload className="mx-auto h-8 w-8 text-gray-400 group-hover:text-gray-500 mb-3 transition-colors" />
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
                                                    <CheckCircle className="mx-auto h-6 w-6 text-emerald-600 mb-2" />
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
                                                                    <ArrowRight className="h-3 w-3" />
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
                                                <FileText className="h-5 w-5 text-gray-600" />
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
                                                                <ArrowRight className="h-3 w-3" />
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
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {isSelectionMode
                                                ? "Select events for batch export or individual Google Calendar links"
                                                : "Click 'Add to Google' for individual events or 'Select Multiple' for batch export"
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
                                    {events.map(event => {
                                        const style = getEventStyle(event.type)
                                        const isSelected = selectedEvents.includes(event.id)
                                        return (
                                            <div
                                                key={event.id}
                                                className={`border-l-4 ${style.color} p-4 rounded-r-xl transition-all duration-300 hover:shadow-md hover:shadow-gray-200/50 hover:-translate-y-0.5 ${
                                                    isSelectionMode && isSelected ? 'ring-2 ring-gray-400 bg-gray-50/50' : ''
                                                }`}
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
                                                            </h3>
                                                        </div>
                                                        <p className={`text-sm font-medium mb-2 ${style.textColor}`} suppressHydrationWarning>
                                                            {isClient && new Date(event.date + "T00:00:00").toLocaleDateString('en-US', {
                                                                weekday: 'long',
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric',
                                                            })}
                                                        </p>
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
                                                                <Calendar className="h-3 w-3" />
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
    )}
