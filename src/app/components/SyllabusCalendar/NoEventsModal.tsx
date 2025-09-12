import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface NoEventsModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileName?: string;
    suggestions?: string[];
}

const NoEventsModal: React.FC<NoEventsModalProps> = ({
                                                         isOpen,
                                                         onClose,
                                                         fileName,
                                                         suggestions
                                                     }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">No Events Found</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-700 mb-4">
                        We couldn't find any dates or events in {fileName ? fileName : 'the provided document'}.
                    </p>

                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-blue-900 mb-2">Suggestions</h4>
                        <ul className="space-y-2 text-sm text-blue-800">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                Make sure the document contains specific dates (not just "Week 1", "Next Monday")
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                Check if it's a text-based PDF (not a scanned image)
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                Try copying and pasting the text manually instead
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                Look for documents with schedules, deadlines, or appointment lists
                            </li>
                        </ul>
                    </div>

                    {suggestions && suggestions.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Document contains</h4>
                            <ul className="space-y-1 text-sm text-gray-700">
                                {suggestions.map((suggestion, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-gray-500 mt-0.5">•</span>
                                        {suggestion}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                        Try Another Document
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NoEventsModal;
