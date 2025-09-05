'use client'

import { useState, useEffect } from 'react'
import { Upload, Calendar, List, FileText, CheckCircle, ArrowRight } from 'lucide-react'

// Типи
interface SyllabusEvent {
    id: number
    title: string
    date: string
    type: 'exam' | 'assignment' | 'reading' | 'class' | 'other'
    description?: string
}

type ViewMode = 'calendar' | 'list'

interface ProcessingResult {
    success: boolean
    events?: SyllabusEvent[]
    error?: string
    debug?: {
        textLength?: number
        eventsFound?: number
    }
}

// Функція для стилізації подій (м'які кольори як у LawBandit)
const getEventStyle = (type: string) => {
    switch (type.toLowerCase()) {
        case 'exam':
            return {
                color: 'border-l-rose-400 bg-rose-50/80 border-rose-100/50',
                badge: 'bg-rose-500/90',
                icon: '📝',
                textColor: 'text-rose-700'
            }
        case 'assignment':
            return {
                color: 'border-l-amber-400 bg-amber-50/80 border-amber-100/50',
                badge: 'bg-amber-500/90',
                icon: '✍️',
                textColor: 'text-amber-700'
            }
        case 'reading':
            return {
                color: 'border-l-emerald-400 bg-emerald-50/80 border-emerald-100/50',
                badge: 'bg-emerald-500/90',
                icon: '📚',
                textColor: 'text-emerald-700'
            }
        case 'class':
            return {
                color: 'border-l-blue-400 bg-blue-50/80 border-blue-100/50',
                badge: 'bg-blue-500/90',
                icon: '🏛️',
                textColor: 'text-blue-700'
            }
        default:
            return {
                color: 'border-l-slate-400 bg-slate-50/80 border-slate-100/50',
                badge: 'bg-slate-500/90',
                icon: '📅',
                textColor: 'text-slate-700'
            }
    }
}

// Функція експорту в Google Calendar
const exportEventsToGoogle = (events: SyllabusEvent[]): void => {
    if (events.length === 0) return

    const urls = events.map(event => {
        const date = new Date(event.date)
        const dateStr = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

        return `https://calendar.google.com/calendar/render?action=TEMPLATE` +
            `&text=${encodeURIComponent(event.title)}` +
            `&dates=${dateStr}/${dateStr}` +
            `&details=${encodeURIComponent(event.description || '')}` +
            `&location=`
    })

    window.open(urls[0], '_blank')

    if (urls.length > 1) {
        alert(`Opening first event. You have ${events.length} total events to add manually.`)
    }
}

export default function HomePage() {
    const [file, setFile] = useState<File | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [events, setEvents] = useState<SyllabusEvent[]>([])
    const [viewMode, setViewMode] = useState<ViewMode>('list')
    const [isClient, setIsClient] = useState(false)
    const [manualText, setManualText] = useState('')

    useEffect(() => {
        setIsClient(true)
    }, [])

    const processData = async (formData: FormData) => {
        setIsProcessing(true)
        try {
            const response = await fetch('/api/process-syllabus', {
                method: 'POST',
                body: formData,
            })

            const result: ProcessingResult = await response.json()

            if (result.success && result.events) {
                setEvents(result.events.map((event, index) => ({
                    ...event,
                    id: index + 1
                })))
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
        setIsProcessing(false)
    }

    return (
        <div className="min-h-screen text-white relative" style={{backgroundColor: '#161513'}}>
            {/* Soft background pattern like LawBandit */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_rgba(120,119,198,0.1)_0%,_transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(255,255,255,0.05)_0%,_transparent_50%)]"></div>

            <div className="relative max-w-5xl mx-auto px-6 py-16">
                {/* Header with LawBandit-style spacing */}
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-4 mb-8">
                        <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10">
                            <Calendar className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-6xl font-light tracking-tight text-white">
                            Syllabus Parser
                        </h1>
                    </div>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
                        Transform your course syllabus into an organized calendar.
                        Extract all important dates with AI-powered parsing.
                    </p>
                </div>

                {/* Main Content with soft styling */}
                {!events.length ? (
                    /* Upload Section */
                    <div className="bg-white/95 backdrop-blur-xl text-gray-900 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                        {/* Header with subtle gradient */}
                        <div className="px-8 py-8 bg-gradient-to-r from-gray-50/80 to-white/90 border-b border-gray-100/50">
                            <h2 className="text-3xl font-light text-gray-900 mb-2">Upload Syllabus</h2>
                            <p className="text-gray-600 text-lg">Choose your preferred input method</p>
                        </div>

                        <div className="p-10">
                            {/* PDF Upload with soft styling */}
                            <div className="mb-12">
                                <div className="flex items-start gap-6 mb-8">
                                    <div className="flex-shrink-0 w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100/50">
                                        <FileText className="h-7 w-7 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-medium text-gray-900 mb-3">PDF Upload</h3>
                                        <p className="text-gray-600 text-base leading-relaxed">
                                            Recommended method for best accuracy and automatic text extraction
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
                                            Supports files up to 50MB • Best with text-based PDFs
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

                            {/* Elegant divider */}
                            <div className="relative mb-12">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-base">
                                    <span className="px-6 bg-white text-gray-500">Alternative method</span>
                                </div>
                            </div>

                            {/* Manual Text with improved styling */}
                            <div>
                                <div className="flex items-start gap-6 mb-8">
                                    <div className="flex-shrink-0 w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100/50">
                                        <FileText className="h-7 w-7 text-gray-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-medium text-gray-900 mb-3">Manual Text</h3>
                                        <p className="text-gray-600 text-base leading-relaxed">
                                            Copy and paste syllabus content directly as a backup option
                                        </p>
                                    </div>
                                </div>

                                <textarea
                                    className="w-full h-40 p-6 border border-gray-200 rounded-2xl resize-none text-base focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 bg-gray-50/50"
                                    placeholder="Paste your syllabus text here..."
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

                        {/* Soft tips section */}
                        <div className="px-10 pb-10">
                            <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/50 rounded-2xl p-8 border border-gray-100/50">
                                <h4 className="font-medium text-gray-900 mb-4 text-lg">Tips for best results</h4>
                                <ul className="space-y-3 text-base text-gray-700">
                                    <li className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        Use text-based PDFs (not scanned images)
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        Ensure dates and assignments are clearly visible
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        Files under 10MB process faster and more reliably
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Results Section with elegant design */
                    <div className="bg-white/95 backdrop-blur-xl text-gray-900 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                        {/* Header */}
                        <div className="px-10 py-8 bg-gradient-to-r from-gray-50/80 to-emerald-50/50 border-b border-gray-100/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-light text-gray-900 mb-2">Parsed Events</h2>
                                    <p className="text-gray-600 text-lg">
                                        Found {events.length} events in your syllabus
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => exportEventsToGoogle(events)}
                                        className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-600 text-white text-base font-medium rounded-xl hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        <Calendar className="h-5 w-5" />
                                        Export to Google
                                    </button>
                                    <button
                                        onClick={resetForm}
                                        className="inline-flex items-center gap-3 px-6 py-3 border border-gray-200 text-gray-700 text-base font-medium rounded-xl hover:bg-gray-50 transition-all duration-200"
                                    >
                                        Parse Another
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Events List with beautiful styling */}
                        <div className="p-10">
                            <div className="space-y-6">
                                {events.map(event => {
                                    const style = getEventStyle(event.type)
                                    return (
                                        <div
                                            key={event.id}
                                            className={`border-l-4 ${style.color} p-8 rounded-r-2xl transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1`}
                                        >
                                            <div className="flex items-start justify-between">
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
                                                <span className={`px-4 py-2 ${style.badge} text-white text-sm font-medium rounded-full uppercase tracking-wide shadow-lg`}>
                                                    {event.type}
                                                </span>
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