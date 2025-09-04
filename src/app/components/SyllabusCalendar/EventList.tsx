import React from 'react'
import { SyllabusEvent } from '../../types'
import { getEventStyle, formatDateDisplay } from '../../utils/eventHelpers'

interface EventListProps {
    events: SyllabusEvent[]
    isClient: boolean
}

export const EventList: React.FC<EventListProps> = ({ events, isClient }) => (
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
                                <h3 className="font-semibold text-gray-800">{event.title}</h3>
                            </div>
                            <p className="text-blue-600 text-sm mb-2" suppressHydrationWarning>
                                {isClient && formatDateDisplay(event.date)}
                            </p>
                            {event.description && (
                                <p className="text-gray-600 text-sm">{event.description}</p>
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
)