import React from 'react';
import { FileText } from 'lucide-react';
import { InputMethod } from '../../types';
import PDFUpload from './PDFUpload';
import TextInput from './TextInput';

interface FileUploadProps {
    file: File | null;
    setFile: (file: File | null) => void;
    isProcessing: boolean;
    inputMethod: InputMethod;
    setInputMethod: (method: InputMethod) => void;
    manualText: string;
    setManualText: (text: string) => void;
    processFile: () => void;
    processManualText: () => void;
    showModal: (type: any, title: string, message: string, details?: string[]) => void;
    loadSampleData: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
                                                   file,
                                                   setFile,
                                                   isProcessing,
                                                   inputMethod,
                                                   setInputMethod,
                                                   manualText,
                                                   setManualText,
                                                   processFile,
                                                   processManualText,
                                                   showModal,
                                                   loadSampleData
                                               }) => {
    return (
        <div className="bg-white/95 backdrop-blur-xl text-gray-900 rounded-2xl shadow-2xl border border-white/20 ring-1 ring-white/20 overflow-hidden max-w-4xl mx-auto">
            {/* Compact Header with Toggle */}
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50/80 to-white/90 border-b border-gray-100/50">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-xl font-light text-gray-900 mb-1">Upload Document</h2>
                        <p className="text-sm text-gray-600">Extract events from any schedule or document</p>
                    </div>

                    {/* Method Toggle */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setInputMethod('file')}
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                                inputMethod === 'file'
                                    ? 'bg-white shadow text-gray-900'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <FileText className="h-3 w-3 inline mr-1" />
                            PDF File
                        </button>
                        <button
                            onClick={() => setInputMethod('text')}
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                                inputMethod === 'text'
                                    ? 'bg-white shadow text-gray-900'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <FileText className="h-3 w-3 inline mr-1" />
                            Manual Text
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Conditional rendering of upload components */}
                {inputMethod === 'file' ? (
                    <PDFUpload
                        file={file}
                        setFile={setFile}
                        isProcessing={isProcessing}
                        processFile={processFile}
                        showModal={showModal}
                    />
                ) : (
                    <TextInput
                        manualText={manualText}
                        setManualText={setManualText}
                        isProcessing={isProcessing}
                        processManualText={processManualText}
                    />
                )}

                {/* Tips and Demo */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="flex items-start justify-between gap-6">
                        {/* Tips */}
                        <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-3 text-sm">Tips for best results</h4>
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                    Use text-based documents (not scanned images)
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                    Works with schedules, contracts, timelines, agendas
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                    Files under 10MB process faster and more reliably
                                </li>
                            </ul>
                        </div>

                        {/* Demo Button */}
                        <div className="flex-shrink-0">
                            <button
                                onClick={loadSampleData}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-all duration-200"
                            >
                                Try Demo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FileUpload;