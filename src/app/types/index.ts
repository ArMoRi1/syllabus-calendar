// types/index.ts

export interface ScheduleEvent {
    id: number
    title: string
    date: string
    type: EventType
    description?: string
}

export type EventType = 'meeting' | 'deadline' | 'event' | 'appointment' | 'task' | 'legal' | 'other'

export interface EventStyle {
    color: string
    badge: string
    icon: string
    textColor: string
}

export interface ProcessingResult {
    success: boolean
    events?: ScheduleEvent[]
    error?: string
    debug?: {
        textLength?: number;
        eventsFound?: number;
        fileSize?: number;
        bufferSize?: number;
        extractedLength?: number;
        processingMethod?: string;
    }
    details?: string[]
    stack?: string
}

export interface ExtractionMethod {
    name: string
    method: () => Promise<string>
}

// Категории событий с описаниями
export const EVENT_CATEGORIES = {
    meeting: {
        label: 'Meeting',
        description: 'Meetings, calls, conferences, discussions',
        keywords: ['meeting', 'call', 'conference', 'discussion', 'interview', 'consultation', 'sync', 'standup']
    },
    deadline: {
        label: 'Deadline',
        description: 'Due dates, submission deadlines, expiration dates',
        keywords: ['deadline', 'due', 'submit', 'submission', 'final', 'expires', 'last day', 'cutoff']
    },
    event: {
        label: 'Event',
        description: 'Workshops, seminars, presentations, celebrations',
        keywords: ['event', 'workshop', 'seminar', 'presentation', 'webinar', 'training', 'launch', 'party']
    },
    appointment: {
        label: 'Appointment',
        description: 'Scheduled visits, bookings, reservations',
        keywords: ['appointment', 'visit', 'checkup', 'scheduled', 'booking', 'reservation', 'slot']
    },
    task: {
        label: 'Task',
        description: 'Work tasks, projects, milestones, action items',
        keywords: ['task', 'action', 'todo', 'work', 'project', 'milestone', 'job', 'activity']
    },
    legal: {
        label: 'Legal',
        description: 'Court dates, hearings, filings, legal deadlines',
        keywords: ['hearing', 'court', 'trial', 'deposition', 'filing', 'motion', 'brief', 'case', 'contract']
    },
    other: {
        label: 'Other',
        description: 'General reminders and miscellaneous events',
        keywords: ['reminder', 'note', 'follow-up', 'check', 'update', 'report', 'analysis']
    }
} as const;


export interface ScheduleEvent {
    id: number;
    title: string;
    date: string;
    type: 'meeting' | 'deadline' | 'event' | 'appointment' | 'task' | 'legal' | 'other';
    description?: string;
    originalDate?: string;
}

export type ViewMode = 'calendar' | 'list';

export type InputMethod = 'file' | 'text';


export type ModalType = 'error' | 'warning' | 'info' | 'success';

export interface ModalState {
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
    details?: string[];
    onConfirm?: () => void;
    confirmText?: string;
}
