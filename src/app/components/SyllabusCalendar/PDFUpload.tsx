import React from 'react';
import { FileText, ArrowRight, CheckCircle } from 'lucide-react';

interface PDFUploadProps {
    file: File | null;
    setFile: (file: File | null) => void;
    isProcessing: boolean;
    processFile: () => void;
    showModal: (type: any, title: string, message: string, details?: string[]) => void;
}

const PDFUpload: React.FC<PDFUploadProps> = ({
                                                 file,
                                                 setFile,
                                                 isProcessing,
                                                 processFile,
                                                 showModal
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
    );
};

export default PDFUpload;