// utils/eventHelpers.ts

import { EventType, EventStyle, ScheduleEvent } from '../types'

export const formatDateForGoogle = (date: string): string => {
    const d = new Date(date)
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export const createGoogleCalendarUrl = (event: ScheduleEvent): string => {
    const dateStr = formatDateForGoogle(event.date)

    return `https://calendar.google.com/calendar/render?action=TEMPLATE` +
        `&text=${encodeURIComponent(event.title)}` +
        `&dates=${dateStr}/${dateStr}` +
        `&details=${encodeURIComponent(event.description || '')}` +
        `&location=`
}

export const exportEventsToGoogle = (events: ScheduleEvent[]): void => {
    if (events.length === 0) return

    const urls = events.map(createGoogleCalendarUrl)

    // Open first event
    window.open(urls[0], '_blank')

    // Alert about remaining events
    if (urls.length > 1) {
        alert(`Opening first event. You have ${events.length} total events to add manually.`)
    }
}

export const formatDateDisplay = (date: string): string => {
    return new Date(date + "T00:00:00").toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

// Функция для создания ICS файла
export const createICSFile = (events: ScheduleEvent[]): string => {
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

// Функция для определения типа события по ключевым словам
export const detectEventType = (text: string): EventType => {
    const lowerText = text.toLowerCase()

    const typeKeywords = {
        meeting: ['meeting', 'call', 'conference', 'discussion', 'interview', 'consultation', 'sync', 'standup'],
        deadline: ['deadline', 'due', 'submit', 'submission', 'final', 'expires', 'last day', 'cutoff'],
        event: ['event', 'workshop', 'seminar', 'presentation', 'webinar', 'training', 'launch', 'party'],
        appointment: ['appointment', 'visit', 'checkup', 'scheduled', 'booking', 'reservation', 'slot'],
        task: ['task', 'action', 'todo', 'work', 'project', 'milestone', 'job', 'activity'],
        legal: ['hearing', 'court', 'trial', 'deposition', 'filing', 'motion', 'brief', 'case', 'contract']
    }

    for (const [type, keywords] of Object.entries(typeKeywords)) {
        if (keywords.some(keyword => lowerText.includes(keyword))) {
            return type as EventType
        }
    }

    return 'other'
}

// Функция для валидации события
export const validateEvent = (event: Partial<ScheduleEvent>): boolean => {
    if (!event.title || !event.date || !event.type) {
        return false
    }

    // Проверяем валидность даты
    const date = new Date(event.date)
    if (isNaN(date.getTime())) {
        return false
    }

    // Проверяем валидность типа
    const validTypes: EventType[] = ['meeting', 'deadline', 'event', 'appointment', 'task', 'legal', 'other']
    if (!validTypes.includes(event.type as EventType)) {
        return false
    }

    return true
}

// Функция для сортировки событий
export const sortEventsByDate = (events: ScheduleEvent[]): ScheduleEvent[] => {
    return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}


export const getEventStyle = (type: string) => {
    switch (type.toLowerCase()) {
        case 'meeting':
            return {
                color: 'border-l-blue-400 bg-blue-50/80 border-blue-100/50',
                badge: 'bg-blue-500/90',
                icon: '👥',
                textColor: 'text-blue-700'
            };
        case 'deadline':
            return {
                color: 'border-l-red-400 bg-red-50/80 border-red-100/50',
                badge: 'bg-red-500/90',
                icon: '⏰',
                textColor: 'text-red-700'
            };
        case 'event':
            return {
                color: 'border-l-purple-400 bg-purple-50/80 border-purple-100/50',
                badge: 'bg-purple-500/90',
                icon: '🎉',
                textColor: 'text-purple-700'
            };
        case 'appointment':
            return {
                color: 'border-l-green-400 bg-green-50/80 border-green-100/50',
                badge: 'bg-green-500/90',
                icon: '📅',
                textColor: 'text-green-700'
            };
        case 'task':
            return {
                color: 'border-l-amber-400 bg-amber-50/80 border-amber-100/50',
                badge: 'bg-amber-500/90',
                icon: '✓',
                textColor: 'text-amber-700'
            };
        case 'legal':
            return {
                color: 'border-l-indigo-400 bg-indigo-50/80 border-indigo-100/50',
                badge: 'bg-indigo-500/90',
                icon: '⚖️',
                textColor: 'text-indigo-700'
            };
        default:
            return {
                color: 'border-l-slate-400 bg-slate-50/80 border-slate-100/50',
                badge: 'bg-slate-500/90',
                icon: '📋',
                textColor: 'text-slate-700'
            };
    }
};

export const sampleEvents: ScheduleEvent[] = [
    {
        id: 1,
        title: 'Team Meeting',
        date: '2025-09-10',
        type: 'meeting',
        description: 'Weekly team sync to discuss project progress and upcoming deliverables'
    },
    {
        id: 2,
        title: 'Project Deadline',
        date: '2025-09-15',
        type: 'deadline',
        description: 'Final submission for the Q3 marketing campaign'
    },
    {
        id: 3,
        title: 'Client Presentation',
        date: '2025-09-20',
        type: 'appointment',
        description: 'Presenting the new product features to key stakeholders'
    }
];
