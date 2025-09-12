import React from 'react';
import { FileText, ArrowRight } from 'lucide-react';

interface TextInputProps {
    manualText: string;
    setManualText: (text: string) => void;
    isProcessing: boolean;
    processManualText: () => void;
}

const TextInput: React.FC<TextInputProps> = ({
                                                 manualText,
                                                 setManualText,
                                                 isProcessing,
                                                 processManualText
                                             }) => {
    return (
        <div className="h-[300px] flex flex-col">
            <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100/50">
                    <FileText className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Paste Text Content</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Copy and paste any text with dates and events for processing
                    </p>
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                <textarea
                    className="flex-1 w-full p-3 border-2 border-gray-200 rounded-lg resize-none text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 bg-gray-50/50 overflow-y-auto mb-3"
                    placeholder="Paste any document text with dates and events here..."
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                />

                <div className="h-[38px] flex items-center justify-between">
                    <span className={`text-sm transition-opacity duration-200 ${
                        manualText.length > 20 ? 'text-gray-600 opacity-100' : 'text-transparent opacity-0'
                    }`}>
                        {manualText.length > 20 ? `${manualText.length} characters ready` : ''}
                    </span>

                    <button
                        onClick={processManualText}
                        disabled={isProcessing || manualText.length <= 20}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all duration-200 ${
                            manualText.length > 20 ? 'opacity-100 visible' : 'opacity-0 invisible'
                        }`}
                    >
                        {isProcessing ? (
                            <>
                                <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                                Processing...
                            </>
                        ) : (
                            <>
                                Parse Text
                                <ArrowRight className="h-3 w-3" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TextInput;