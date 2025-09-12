import React from 'react';
import { FileText, ArrowRight, CheckCircle } from 'lucide-react';
import { InputMethod } from '../types';

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
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile?.type === 'application/pdf') {
            setFile(selectedFile);
        } else {
            showModal(
                'warning',
                'Invalid File Type',
                'Please upload a PDF file.',
                [
                    'Only PDF files are supported',
                    'Convert your document to PDF first',
                    'Or use manual text input'
                ]
            );
            // Reset file input
            e.target.value = '';
        }
    };

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
                {inputMethod === 'file' ? (
                    /* PDF Upload */
                    <div className="h-[300px] overflow-hidden">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100/50">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">Upload PDF Document</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Upload any document with dates and events for automatic extraction
                                </p>
                            </div>
                        </div>

                        <div>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                            />

                            {!file ? (
                                <label
                                    htmlFor="file-upload"
                                    className="group relative block w-full p-10 border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50/50 cursor-pointer transition-all duration-300"
                                >
                                    <div className="text-center">
                                        <FileText className="mx-auto h-8 w-8 text-gray-400 group-hover:text-gray-500 mb-3 transition-colors" />
                                        <span className="block text-base font-medium text-gray-900 mb-1.5">
                                          Choose PDF file
                                        </span>
                                                            <span className="block text-base text-gray-500">
                                          Up to 50MB • Works with schedules, contracts, timelines
                                        </span>
                                    </div>
                                </label>
                            ) : (
                                <div className="group relative block w-full p-7 border-2 bg-emerald-50/80 border-emerald-200/50 rounded-lg transition-all box-border">
                                    <div className="text-center">
                                        <CheckCircle className="mx-auto h-6 w-6 text-emerald-600 mb-2" />
                                        <span className="block text-sm font-medium text-emerald-900 mb-1 truncate">
                                          {file.name}
                                        </span>
                                                            <span className="block text-s text-emerald-700 mb-3">
                                          {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to process
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => {
                                                setFile(null);
                                                // Reset file input
                                                const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                                                if (fileInput) fileInput.value = '';
                                            }}
                                            className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-lg transition-all duration-200 font-medium border border-gray-300"
                                        >
                                            Remove
                                        </button>

                                        <button
                                            onClick={processFile}
                                            disabled={isProcessing}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all duration-200"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    Parse PDF
                                                    <ArrowRight className="h-3 w-3" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Manual Text */
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
                                <span className={`text-sm transition-opacity duration-200 ${manualText.length > 20 ? 'text-gray-600 opacity-100' : 'text-transparent opacity-0'}`}>
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
                )}

                {/* Tips and Demo */}
                <div className="mt-8 border-t border-gray-100">
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
