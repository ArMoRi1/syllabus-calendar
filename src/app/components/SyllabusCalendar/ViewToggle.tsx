import React from 'react'
import { Calendar, List } from 'lucide-react'
import { ViewMode } from '@/types'

interface ViewToggleProps {
    viewMode: ViewMode
    onViewChange: (mode: ViewMode) => void
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onViewChange }) => (
    <div className="flex bg-gray-100 rounded-lg p-1">
    <button
        onClick={() => onViewChange('calendar')}
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
onClick={() => onViewChange('list')}
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
)