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
        <div className="min-h-screen text-white relative" style={{backgroundColor: '#161513'}}>
            {/* Background patterns */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_rgba(120,119,198,0.1)_0%,_transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(255,255,255,0.05)_0%,_transparent_50%)]"></div>

            <div className="relative max-w-5xl mx-auto px-6 py-16">
                {/* Header */}
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-4 mb-8">
                        <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10">
                            <Calendar className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-6xl font-light tracking-tight text-white">
                            Schedule Parser
                        </h1>
                    </div>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
                        Extract events and dates from any document or schedule.
                        AI-powered parsing for meetings, deadlines, and important dates.
                    </p>
                </div>

                {/* Main Content */}
                {!events.length ? (
                    /* Upload Section */
                    <div className="bg-white/95 backdrop-blur-xl text-gray-900 rounded-3xl shadow-2xl border border-white/20 ring-1 ring-white/20 overflow-hidden">
                        {/* Header */}
                        <div className="px-8 py-8 bg-gradient-to-r from-gray-50/80 to-white/90 border-b border-gray-100/50">
                            <h2 className="text-3xl font-light text-gray-900 mb-2">Upload Document</h2>
                            <p className="text-gray-600 text-lg">Extract events from any schedule or document</p>
                        </div>

                        <div className="p-10">
                            {/* PDF Upload */}
                            <div className="mb-12">
                                <div className="flex items-start gap-6 mb-8">
                                    <div className="flex-shrink-0 w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100/50">
                                        <FileText className="h-7 w-7 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-medium text-gray-900 mb-3">PDF Upload</h3>
                                        <p className="text-gray-600 text-base leading-relaxed">
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

                                <label
                                    htmlFor="file-upload"
                                    className="group relative block w-full p-12 border-2 border-dashed border-gray-200 rounded-2xl hover:border-gray-300 hover:bg-gray-50/50 cursor-pointer transition-all duration-300"
                                >
                                    <div className="text-center">
                                        <Upload className="mx-auto h-16 w-16 text-gray-400 group-hover:text-gray-500 mb-6 transition-colors" />
                                        <span className="block text-lg font-medium text-gray-900 mb-3">
                                            Choose PDF file
                                        </span>
                                        <span className="block text-sm text-gray-500">
                                            Supports files up to 50MB • Works with schedules, contracts, timelines
                                        </span>
                                    </div>
                                </label>

                                {file && (
                                    <div className="mt-6 p-6 bg-emerald-50/80 border border-emerald-200/50 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-base font-medium text-emerald-900">
                                                    {file.name}
                                                </p>
                                                <p className="text-sm text-emerald-700 mt-1">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to process
                                                </p>
                                            </div>
                                            <button
                                                onClick={processFile}
                                                disabled={isProcessing}
                                                className="inline-flex items-center gap-3 px-6 py-3 bg-gray-900 text-white text-base font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        Parse PDF
                                                        <ArrowRight className="h-5 w-5" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="relative mb-12">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-base">
                                    <span className="px-6 bg-white text-gray-500">Alternative method</span>
                                </div>
                            </div>

                            {/* Manual Text */}
                            <div>
                                <div className="flex items-start gap-6 mb-8">
                                    <div className="flex-shrink-0 w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100/50">
                                        <FileText className="h-7 w-7 text-gray-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-medium text-gray-900 mb-3">Manual Text</h3>
                                        <p className="text-gray-600 text-base leading-relaxed">
                                            Copy and paste any text with dates and events for processing
                                        </p>
                                    </div>
                                </div>

                                <textarea
                                    className="w-full h-40 p-6 border border-gray-200 rounded-2xl resize-none text-base focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 bg-gray-50/50"
                                    placeholder="Paste any document text with dates and events here..."
                                    value={manualText}
                                    onChange={(e) => setManualText(e.target.value)}
                                />

                                {manualText.length > 20 && (
                                    <div className="mt-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">
                                                {manualText.length} characters ready to process
                                            </span>
                                            <button
                                                onClick={processManualText}
                                                disabled={isProcessing}
                                                className="inline-flex items-center gap-3 px-6 py-3 bg-gray-900 text-white text-base font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        Parse Text
                                                        <ArrowRight className="h-5 w-5" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tips section */}
                        <div className="px-10 pb-10">
                            <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/50 rounded-2xl p-8 border border-gray-100/50">
                                <h4 className="font-medium text-gray-900 mb-4 text-lg">Tips for best results</h4>
                                <ul className="space-y-3 text-base text-gray-700">
                                    <li className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        Use text-based documents (not scanned images)
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        Works with schedules, contracts, timelines, agendas
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        Files under 10MB process faster and more reliably
                                    </li>
                                </ul>
                            </div>

                            {/* Demo Button */}
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Try the demo</h4>
                                        <p className="text-sm text-gray-600">Load sample events to see how the interface works</p>
                                    </div>
                                    <button
                                        onClick={loadSampleData}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-all duration-200"
                                    >
                                        Load Sample Events
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Results Section */
                    <div className="bg-white/95 backdrop-blur-xl text-gray-900 rounded-3xl shadow-2xl border border-white/20 ring-1 ring-white/20 overflow-hidden">
                        {/* Header */}
                        <div className="px-10 py-8 bg-gradient-to-r from-gray-50/80 to-emerald-50/50 border-b border-gray-100/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-light text-gray-900 mb-2">Parsed Events</h2>
                                    <p className="text-gray-600 text-lg mb-1">
                                        Found {events.length} events
                                        {isSelectionMode && ` • ${selectedEvents.length} selected`}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {isSelectionMode
                                            ? "Select events for batch export or individual Google Calendar links"
                                            : "Click 'Add to Google' for individual events or 'Select Multiple' for batch export"
                                        }
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {isSelectionMode ? (
                                        <>
                                            <button
                                                onClick={exportSelectedToGoogle}
                                                disabled={selectedEvents.length === 0}
                                                className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-600 text-white text-base font-medium rounded-xl hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                                                title={selectedEvents.length === 1 ? "Open in Google Calendar" : "Download ICS file for import"}
                                            >
                                                <Calendar className="h-5 w-5" />
                                                {selectedEvents.length === 1
                                                    ? 'Add to Google Calendar'
                                                    : selectedEvents.length === 0
                                                        ? 'Select Events to Export'
                                                        : `Export ${selectedEvents.length} Events`
                                                }
                                            </button>
                                            <button
                                                onClick={toggleSelectionMode}
                                                className="inline-flex items-center gap-3 px-6 py-3 border border-gray-300 text-gray-700 text-base font-medium rounded-xl hover:bg-gray-50 transition-all duration-200"
                                            >
                                                Cancel Selection
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={toggleSelectionMode}
                                            className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 text-white text-base font-medium rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                        >
                                            Select Multiple
                                        </button>
                                    )}
                                    <button
                                        onClick={resetForm}
                                        className="inline-flex items-center gap-3 px-6 py-3 border border-gray-200 text-gray-700 text-base font-medium rounded-xl hover:bg-gray-50 transition-all duration-200"
                                    >
                                        Parse Another
                                    </button>
                                </div>
                            </div>

                            {/* Select All Controls */}
                            {isSelectionMode && (
                                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={toggleSelectAll}
                                        className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <div className={`w-5 h-5 border-2 rounded ${selectAll ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'} flex items-center justify-center`}>
                                            {selectAll && (
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                        {selectAll ? 'Deselect All' : 'Select All'}
                                    </button>
                                    <span className="text-sm text-gray-500">
                                        {selectedEvents.length === 1 ? '1 event selected' : `${selectedEvents.length} events selected`}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Events List */}
                        <div className="p-10">
                            <div className="space-y-6">
                                {events.map(event => {
                                    const style = getEventStyle(event.type)
                                    const isSelected = selectedEvents.includes(event.id)
                                    return (
                                        <div
                                            key={event.id}
                                            className={`border-l-4 ${style.color} p-8 rounded-r-2xl transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 ${
                                                isSelectionMode && isSelected ? 'ring-2 ring-emerald-300 bg-emerald-50/30' : ''
                                            }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Checkbox - тільки в режимі вибору */}
                                                {isSelectionMode && (
                                                    <button
                                                        onClick={() => toggleEventSelection(event.id)}
                                                        className="flex-shrink-0 mt-1"
                                                    >
                                                        <div className={`w-6 h-6 border-2 rounded ${isSelected ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300 hover:border-emerald-400'} flex items-center justify-center transition-colors`}>
                                                            {isSelected && (
                                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </button>
                                                )}

                                                {/* Event Content */}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-4 mb-3">
                                                        <span className="text-2xl">{style.icon}</span>
                                                        <h3 className="text-xl font-medium text-gray-900 leading-relaxed">
                                                            {event.title}
                                                        </h3>
                                                    </div>
                                                    <p className={`text-base font-medium mb-4 ${style.textColor}`} suppressHydrationWarning>
                                                        {isClient && new Date(event.date + "T00:00:00").toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        })}
                                                    </p>
                                                    {event.description && (
                                                        <p className="text-base text-gray-700 leading-relaxed">
                                                            {event.description}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Right side */}
                                                <div className="flex flex-col items-end gap-6">
                                                    <div>
                                                        {/* Badge */}
                                                        <span className={`px-4 py-2 ${style.badge} text-white text-sm font-medium rounded-full uppercase tracking-wide shadow-lg flex-shrink-0`}>
                                                            {event.type}
                                                        </span>
                                                    </div>

                                                    {/* Add to Google кнопка тільки НЕ в режимі вибору */}
                                                    {!isSelectionMode && (
                                                        <button
                                                            onClick={() => exportSingleEvent(event)}
                                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                                                            title="Add this event to Google Calendar"
                                                        >
                                                            <Calendar className="h-4 w-4" />
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
    )
}