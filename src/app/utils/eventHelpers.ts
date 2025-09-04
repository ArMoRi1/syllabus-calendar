// utils/eventHelpers.ts

import { EventType, EventStyle, SyllabusEvent } from '../types'

export const getEventStyle = (type: EventType): EventStyle => {
    const styles: Record<EventType, EventStyle> = {
        exam: {
            color: 'border-red-500 bg-red-50',
            badge: 'bg-red-500',
            icon: '📝'
        },
        assignment: {
            color: 'border-yellow-500 bg-yellow-50',
            badge: 'bg-yellow-500',
            icon: '✍️'
        },
        reading: {
            color: 'border-green-500 bg-green-50',
            badge: 'bg-green-500',
            icon: '📚'
        },
        class: {
            color: 'border-blue-500 bg-blue-50',
            badge: 'bg-blue-500',
            icon: '🏛️'
        },
        other: {
            color: 'border-gray-500 bg-gray-50',
            badge: 'bg-gray-500',
            icon: '📅'
        }
    }

    return styles[type.toLowerCase() as EventType] || styles.other
}

export const formatDateForGoogle = (date: string): string => {
    const d = new Date(date)
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export const createGoogleCalendarUrl = (event: SyllabusEvent): string => {
    const dateStr = formatDateForGoogle(event.date)

    return `https://calendar.google.com/calendar/render?action=TEMPLATE` +
        `&text=${encodeURIComponent(event.title)}` +
        `&dates=${dateStr}/${dateStr}` +
        `&details=${encodeURIComponent(event.description || '')}` +
        `&location=`
}

export const exportEventsToGoogle = (events: SyllabusEvent[]): void => {
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