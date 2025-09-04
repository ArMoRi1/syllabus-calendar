'use client'

import { useState, useEffect } from 'react'

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

// Компоненти
import { FileUpload } from './components/SyllabusCalendar/FileUpload'
import { EventList } from './components/SyllabusCalendar/EventList'
import { ViewToggle } from './components/SyllabusCalendar/ViewToggle'

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        📅 Syllabus Calendar
                    </h1>
                    <p className="text-gray-600">
                        Transform your syllabus into a smart calendar
                    </p>
                </div>

                {/* File Upload Section */}
                {!events.length && (
                    <FileUpload
                        file={file}
                        manualText={manualText}
                        isProcessing={isProcessing}
                        onFileChange={handleFileUpload}
                        onManualTextChange={setManualText}
                        onProcessFile={processFile}
                        onProcessText={processManualText}
                    />
                )}

                {/* Results Section */}
                {events.length > 0 && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        {/* Header with controls */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">
                                Your calendar is ready! 🎉
                            </h2>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => exportEventsToGoogle(events)}
                                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    📅 Export to Google
                                </button>
                                <ViewToggle
                                    viewMode={viewMode}
                                    onViewChange={setViewMode}
                                />
                            </div>
                        </div>

                        {/* Events Display */}
                        <EventList events={events} isClient={isClient} />
                    </div>
                )}
            </div>
        </div>
    )
}