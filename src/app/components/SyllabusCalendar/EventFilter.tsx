// src/app/components/SyllabusCalendar/EventFilter.tsx
import React, { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { ScheduleEvent, EventType } from '../../types';
import { EVENT_CATEGORIES } from '../../types';

interface EventFilterProps {
    events: ScheduleEvent[];
    onFilterChange: (filteredEvents: ScheduleEvent[]) => void;
}

const EventFilter: React.FC<EventFilterProps> = ({ events, onFilterChange }) => {
    const [selectedCategories, setSelectedCategories] = useState<Set<EventType>>(new Set());
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Підрахунок кількості подій по категоріях
    const categoryCounts = React.useMemo(() => {
        const counts: Record<EventType, number> = {
            meeting: 0,
            deadline: 0,
            event: 0,
            appointment: 0,
            task: 0,
            legal: 0,
            other: 0
        };

        events.forEach(event => {
            counts[event.type]++;
        });

        return counts;
    }, [events]);

    // Кольори для категорій (відповідають вашій темі)
    const categoryColors: Record<EventType, string> = {
        meeting: '#3B82F6',    // синій
        deadline: '#EF4444',   // червоний
        event: '#10B981',      // зелений
        appointment: '#8B5CF6', // фіолетовий
        task: '#F59E0B',       // жовтий/помаранчевий
        legal: '#6B7280',      // сірий
        other: '#9CA3AF'       // світло-сірий
    };

    // Фільтрація подій
    useEffect(() => {
        let filtered = events;

        // Фільтр по категоріях
        if (selectedCategories.size > 0) {
            filtered = filtered.filter(event => selectedCategories.has(event.type));
        }

        // Фільтр по пошуку
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(event =>
                event.title.toLowerCase().includes(search) ||
                event.description?.toLowerCase().includes(search) ||
                event.date.includes(search)
            );
        }

        onFilterChange(filtered);
    }, [selectedCategories, searchTerm, events, onFilterChange]);

    const toggleCategory = (category: EventType) => {
        const newSelected = new Set(selectedCategories);
        if (newSelected.has(category)) {
            newSelected.delete(category);
        } else {
            newSelected.add(category);
        }
        setSelectedCategories(newSelected);
    };

    const clearAllFilters = () => {
        setSelectedCategories(new Set());
        setSearchTerm('');
    };

    const selectAllCategories = () => {
        const availableCategories = Object.keys(categoryCounts).filter(
            key => categoryCounts[key as EventType] > 0
        ) as EventType[];
        setSelectedCategories(new Set(availableCategories));
    };

    const hasActiveFilters = selectedCategories.size > 0 || searchTerm.trim() !== '';
    const filteredCount = React.useMemo(() => {
        let filtered = events;
        if (selectedCategories.size > 0) {
            filtered = filtered.filter(event => selectedCategories.has(event.type));
        }
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(event =>
                event.title.toLowerCase().includes(search) ||
                event.description?.toLowerCase().includes(search) ||
                event.date.includes(search)
            );
        }
        return filtered.length;
    }, [events, selectedCategories, searchTerm]);

    return (
        <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg mb-6">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                        <Filter className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">Filter Events</h3>
                        <p className="text-sm text-gray-500">
                            {hasActiveFilters ? (
                                `Showing ${filteredCount} of ${events.length} events`
                            ) : (
                                `${events.length} total events`
                            )}
                        </p>
                    </div>
                    {hasActiveFilters && (
                        <div className="flex gap-1">
                            {selectedCategories.size > 0 && (
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                  {selectedCategories.size} categories
                </span>
                            )}
                            {searchTerm && (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                  search
                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <button
                            onClick={clearAllFilters}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="h-3 w-3" />
                            Clear
                        </button>
                    )}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="h-4 w-4" />
                                Hide
                            </>
                        ) : (
                            <>
                                <ChevronDown className="h-4 w-4" />
                                Filter
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Filter Content */}
            {isExpanded && (
                <div className="p-4 space-y-4">
                    {/* Search Bar */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search events
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by title, description, or date..."
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>
                    </div>

                    {/* Category Filters */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Filter by category
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={selectAllCategories}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Select all
                                </button>
                                <button
                                    onClick={() => setSelectedCategories(new Set())}
                                    className="text-xs text-gray-600 hover:text-gray-800"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            {Object.entries(EVENT_CATEGORIES).map(([key, category]) => {
                                const count = categoryCounts[key as EventType];
                                const isSelected = selectedCategories.has(key as EventType);

                                return (
                                    <button
                                        key={key}
                                        onClick={() => toggleCategory(key as EventType)}
                                        disabled={count === 0}
                                        className={`
                      flex items-center justify-between p-3 rounded-lg border text-left transition-all
                      ${count === 0
                                            ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                                            : isSelected
                                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                        }
                    `}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: categoryColors[key as EventType] }}
                                            />
                                            <div className="min-w-0">
                                                <div className="font-medium text-sm text-gray-900 truncate">
                                                    {category.label}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">
                                                    {category.description}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`
                      text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ml-2
                      ${isSelected
                                            ? 'bg-blue-200 text-blue-800'
                                            : 'bg-gray-100 text-gray-600'
                                        }
                    `}>
                      {count}
                    </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventFilter;