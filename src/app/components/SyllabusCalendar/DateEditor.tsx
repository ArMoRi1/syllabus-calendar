import React, { useState, useEffect } from 'react';
import { Check, X, RotateCcw } from 'lucide-react';
import { ScheduleEvent } from '../../types';

interface DateEditorProps {
    event: ScheduleEvent;
    onSave: (eventId: number, newDate: string) => void;
    onCancel: () => void;
}

const DateEditor: React.FC<DateEditorProps> = ({ event, onSave, onCancel }) => {
    const [tempDate, setTempDate] = useState(event.date);
    const [isValid, setIsValid] = useState(true);

    useEffect(() => {
        const date = new Date(tempDate + 'T00:00:00');
        setIsValid(!isNaN(date.getTime()) && tempDate.length === 10);
    }, [tempDate]);

    const handleSave = () => {
        if (isValid && tempDate !== event.date) {
            onSave(event.id, tempDate);
        } else {
            onCancel();
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && isValid) {
            handleSave();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border-2 border-blue-200 shadow-sm">
            <input
                type="date"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                onKeyDown={handleKeyPress}
                className={`px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isValid ? 'border-gray-300' : 'border-red-300 bg-red-50'
                }`}
                autoFocus
            />

            <button
                onClick={handleSave}
                disabled={!isValid}
                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                title="Save date"
            >
                <Check className="h-4 w-4" />
            </button>

            <button
                onClick={onCancel}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Cancel editing"
            >
                <X className="h-4 w-4" />
            </button>

            {event.originalDate && event.originalDate !== tempDate && (
                <button
                    onClick={() => setTempDate(event.originalDate!)}
                    className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                    title="Restore original date"
                >
                    <RotateCcw className="h-4 w-4" />
                </button>
            )}
        </div>
    );
};

export default DateEditor;
