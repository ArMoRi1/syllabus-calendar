import { ScheduleEvent, ModalType } from '../types';

// Google Calendar
export const exportSingleEvent = (event: ScheduleEvent) => {
    const date = new Date(event.date + 'T00:00:00');
    const dateStr = date.toISOString().replace(/-/g, '').split('T')[0] + 'Z';

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${dateStr}/${dateStr}&details=${encodeURIComponent(event.description || '')}`;

    window.open(googleUrl, '_blank');
};

// ICS
export const createICSFile = (events: ScheduleEvent[]) => {
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Schedule Parser//EN
CALSCALE:GREGORIAN
`;

    events.forEach(event => {
        const date = new Date(event.date + 'T00:00:00');
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

        icsContent += `BEGIN:VEVENT
`;
        icsContent += `UID:${event.id}-${Date.now()}@scheduleparser.com
`;
        icsContent += `DTSTART;VALUE=DATE:${dateStr}
`;
        icsContent += `DTEND;VALUE=DATE:${dateStr}
`;
        icsContent += `SUMMARY:${event.title.replace(/,/g, '\\,')}
`;

        if (event.description) {
            icsContent += `DESCRIPTION:${event.description.replace(/,/g, '\\,')}
`;
        }

        icsContent += `CATEGORIES:${event.type.toUpperCase()}
`;
        icsContent += `STATUS:CONFIRMED
`;
        icsContent += `END:VEVENT
`;
    });

    icsContent += `END:VCALENDAR`;
    return icsContent;
};

// ICS
export const downloadICSFile = (icsContent: string, eventCount: number, showModal: (type: ModalType, title: string, message: string, details?: string[], onConfirm?: () => void, confirmText?: string) => void) => {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schedule-events.ics';
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => {
        showModal(
            'success',
            'Events Exported Successfully',
            `Downloaded ${eventCount} events as schedule-events.ics`,
            [
                'Google Calendar: Go to Settings → Import & Export → Import',
                'Outlook: File → Open & Export → Import/Export',
                'Apple Calendar: File → Import → Select the downloaded file'
            ]
        );
    }, 500);
};

export const exportSelectedToGoogle = (
    events: ScheduleEvent[],
    selectedEvents: number[],
    showModal: (type: ModalType, title: string, message: string, details?: string[], onConfirm?: () => void, confirmText?: string) => void
) => {
    const selectedEventsList = events.filter(event => selectedEvents.includes(event.id));

    if (selectedEventsList.length === 0) {
        showModal(
            'warning',
            'No Events Selected',
            'Please select at least one event to export.',
            [
                'Click checkboxes next to events',
                'Or use "Select All" button'
            ]
        );
        return;
    }

    if (selectedEventsList.length === 1) {
        exportSingleEvent(selectedEventsList[0]);
    } else {
        const icsContent = createICSFile(selectedEventsList);
        downloadICSFile(icsContent, selectedEventsList.length, showModal);
    }
};
