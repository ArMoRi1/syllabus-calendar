// types/index.ts

export interface SyllabusEvent {
    id: number
    title: string
    date: string
    type: EventType
    description?: string
}

export type EventType = 'exam' | 'assignment' | 'reading' | 'class' | 'other'

export type ViewMode = 'calendar' | 'list'

export interface EventStyle {
    color: string
    badge: string
    icon: string
}

export interface ProcessingResult {
    success: boolean
    events?: SyllabusEvent[]
    error?: string
    debug?: {
        textLength?: number
        eventsFound?: number
        fileSize?: number
        bufferSize?: number
        extractedLength?: number
    }
    details?: string[]
    stack?: string
}

export interface ExtractionMethod {
    name: string
    method: () => Promise<string>
}