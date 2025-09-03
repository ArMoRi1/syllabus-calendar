'use client'

import { useState, useEffect } from 'react'
import { Upload, Calendar, List } from 'lucide-react'

export default function HomePage() {
    const [file, setFile] = useState<File | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [events, setEvents] = useState<any[]>([])
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
    const [isClient, setIsClient] = useState(false)
    const [manualText, setManualText] = useState('')
    useEffect(() => {
        setIsClient(true)
    }, [])
    const processManualText = async () => {
        setIsProcessing(true)

        try {
            const formData = new FormData()
            formData.append('manualText', manualText)

            const response = await fetch('/api/process-syllabus', {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (result.success) {
                setEvents(result.events.map((event, index) => ({
                    ...event,
                    id: index + 1
                })))
            } else {
                alert('Error: ' + result.error)
            }
        } catch (error) {
            alert('Error processing text')
        } finally {
            setIsProcessing(false)
        }
    }
    // Export to Google Calendar
    const exportToGoogleCalendar = () => {
        const calendarUrl = events.map(event => {
            const date = new Date(event.date)
            const dateStr = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

            const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
                `&text=${encodeURIComponent(event.title)}` +
                `&dates=${dateStr}/${dateStr}` +
                `&details=${encodeURIComponent(event.description || '')}` +
                `&location=`

            return googleUrl
        })

        // Open first event, alert about others
        if (calendarUrl.length > 0) {
            window.open(calendarUrl[0], '_blank')
            if (calendarUrl.length > 1) {
                alert(`Opening first event. You have ${events.length} total events to add manually.`)
            }
        }
    }

    // Get color and icon for event type
    const getEventStyle = (type: string) => {
        switch (type.toLowerCase()) {
            case 'exam':
                return { color: 'border-red-500 bg-red-50', badge: 'bg-red-500', icon: '📝' }
            case 'assignment':
                return { color: 'border-yellow-500 bg-yellow-50', badge: 'bg-yellow-500', icon: '✍️' }
            case 'reading':
                return { color: 'border-green-500 bg-green-50', badge: 'bg-green-500', icon: '📚' }
            case 'class':
                return { color: 'border-blue-500 bg-blue-50', badge: 'bg-blue-500', icon: '🏛️' }
            default:
                return { color: 'border-gray-500 bg-gray-50', badge: 'bg-gray-500', icon: '📅' }
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile)
        } else {
            alert('Please upload a PDF file')
        }
    }

    const processFile = async () => {
        if (!file) return

        setIsProcessing(true)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/process-syllabus', {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (result.success) {
                setEvents(result.events.map((event: any, index: number) => ({
                    ...event,
                    id: index + 1
                })))
            } else {
                alert('Error processing file: ' + result.error)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error processing file')
        } finally {
            setIsProcessing(false)
        }
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

                {/* File Upload */}
                {!events.length && (
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                        <div className="text-center">
                            <Upload className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                            <h2 className="text-xl font-semibold mb-4">
                                Upload your syllabus
                            </h2>

                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                            />

                            <label
                                htmlFor="file-upload"
                                className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
                            >
                                Choose PDF file
                            </label>
                            <div className="mt-6 border-t pt-6">
                                <h3 className="text-lg font-semibold mb-3">Or paste syllabus text:</h3>
                                <textarea
                                    className="w-full h-40 p-3 border rounded-lg resize-none"
                                    placeholder="Copy and paste your syllabus text here..."
                                    value={manualText}
                                    onChange={(e) => setManualText(e.target.value)}
                                />
                                {manualText.length > 10 && (
                                    <button
                                        onClick={() => processManualText()}
                                        className="mt-3 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                                    >
                                        Process Text
                                    </button>
                                )}
                            </div>
                            {file && (
                                <div className="mt-4">
                                    <p className="text-green-600 mb-4">
                                        ✅ File uploaded: {file.name}
                                    </p>

                                    <button
                                        onClick={processFile}
                                        disabled={isProcessing}
                                        className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                                    >
                                        {isProcessing ? '🔄 Processing...' : '🚀 Create Calendar'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Results */}
                {events.length > 0 && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        {/* View Toggle & Export */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">
                                Your calendar is ready! 🎉
                            </h2>

                            <div className="flex gap-4">
                                <button
                                    onClick={exportToGoogleCalendar}
                                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    📅 Export to Google
                                </button>

                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('calendar')}
                                        className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                                            viewMode === 'calendar'
                                                ? 'bg-blue-500 text-white'
                                                : 'text-gray-600 hover:text-blue-500'
                                        }`}
                                    >
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Calendar
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                                            viewMode === 'list'
                                                ? 'bg-blue-500 text-white'
                                                : 'text-gray-600 hover:text-blue-500'
                                        }`}
                                    >
                                        <List className="h-4 w-4 mr-2" />
                                        List
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Event List */}
                        <div className="space-y-4">
                            {events.map(event => {
                                const style = getEventStyle(event.type)
                                return (
                                    <div
                                        key={event.id}
                                        className={`border-l-4 ${style.color} p-4 rounded-r-lg hover:shadow-md transition-shadow`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-lg">{style.icon}</span>
                                                    <h3 className="font-semibold text-gray-800">
                                                        {event.title}
                                                    </h3>
                                                </div>
                                                <p
                                                    className="text-blue-600 text-sm mb-2"
                                                    suppressHydrationWarning
                                                >
                                                    {/*{console.log("RAW EVENT DATE:", event.date)}*/}

                                                    {isClient &&
                                                    new Date(event.date + "T00:00:00").toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })
                                                    }
                                                    </p>

                                                {event.description && (
                                                    <p className="text-gray-600 text-sm">
                                                        {event.description}
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`px-3 py-1 ${style.badge} text-white text-xs rounded-full font-medium uppercase`}>
                        {event.type}
                      </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}