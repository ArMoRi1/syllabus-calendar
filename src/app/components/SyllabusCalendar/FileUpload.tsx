import React from 'react'
import { Upload, FileText } from 'lucide-react'

interface FileUploadProps {
    file: File | null
    manualText: string
    isProcessing: boolean
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onManualTextChange: (text: string) => void
    onProcessFile: () => void
    onProcessText: () => void
}

export const FileUpload: React.FC<FileUploadProps> = ({
                                                          file,
                                                          manualText,
                                                          isProcessing,
                                                          onFileChange,
                                                          onManualTextChange,
                                                          onProcessFile,
                                                          onProcessText,
                                                      }) => (
    <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        {/* Primary PDF Upload Section */}
        <div className="text-center mb-8">
            <FileText className="mx-auto h-16 w-16 text-blue-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-gray-800">📄 Upload your PDF syllabus</h2>
            <p className="text-gray-600 mb-6">Primary method - Best results with PDF files</p>

            <input
                type="file"
                accept=".pdf"
                onChange={onFileChange}
                className="hidden"
                id="file-upload"
            />

            <label
                htmlFor="file-upload"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-lg font-semibold shadow-lg"
            >
                <Upload className="h-5 w-5" />
                Choose PDF File
            </label>

            {file && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-700 font-semibold mb-3">
                        ✅ PDF Ready: {file.name}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                        File size: {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                        onClick={onProcessFile}
                        disabled={isProcessing}
                        className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-semibold shadow-lg text-lg"
                    >
                        {isProcessing ? '🔄 Processing PDF...' : '🚀 Extract from PDF'}
                    </button>
                </div>
            )}
        </div>

        {/* Divider */}
        <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Alternative method</span>
            </div>
        </div>

        {/* Secondary Manual Text Section */}
        <div className="text-center">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">📝 Or paste syllabus text manually</h3>
            <p className="text-sm text-gray-500 mb-4">If PDF extraction doesn't work</p>

            <textarea
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none text-sm"
                placeholder="Copy and paste your syllabus text here as backup option..."
                value={manualText}
                onChange={(e) => onManualTextChange(e.target.value)}
            />

            {manualText.length > 20 && (
                <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">
                        Text length: {manualText.length} characters
                    </p>
                    <button
                        onClick={onProcessText}
                        disabled={isProcessing}
                        className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 transition-colors"
                    >
                        {isProcessing ? '🔄 Processing...' : 'Process Manual Text'}
                    </button>
                </div>
            )}
        </div>

        {/* Processing Status */}
        {isProcessing && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="text-blue-700 font-medium">
                        {file ? 'Extracting text from PDF and analyzing...' : 'Analyzing text with AI...'}
                    </span>
                </div>
            </div>
        )}

        {/* Tips */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">💡 Tips for best results:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use text-based PDFs (not scanned images)</li>
                <li>• Files under 10MB work best</li>
                <li>• Make sure PDF contains dates and assignment information</li>
                <li>• If PDF fails, try copy-pasting text manually</li>
            </ul>
        </div>
    </div>
)