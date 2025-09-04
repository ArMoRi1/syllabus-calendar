import React from 'react'
import { Upload } from 'lucide-react'

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
        <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <h2 className="text-xl font-semibold mb-4">Upload your syllabus</h2>

            <input
                type="file"
                accept=".pdf"
                onChange={onFileChange}
                className="hidden"
                id="file-upload"
            />

            <label
                htmlFor="file-upload"
                className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
            >
                Choose PDF file
            </label>

            <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-semibold mb-3">Or paste syllabus text:</h3>
                <textarea
                    className="w-full h-40 p-3 border rounded-lg resize-none"
                    placeholder="Copy and paste your syllabus text here..."
                    value={manualText}
                    onChange={(e) => onManualTextChange(e.target.value)}
                />
                {manualText.length > 10 && (
                    <button
                        onClick={onProcessText}
                        disabled={isProcessing}
                        className="mt-3 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400"
                    >
                        {isProcessing ? '🔄 Processing...' : 'Process Text'}
                    </button>
                )}
            </div>

            {file && (
                <div className="mt-4">
                    <p className="text-green-600 mb-4">✅ File uploaded: {file.name}</p>
                    <button
                        onClick={onProcessFile}
                        disabled={isProcessing}
                        className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                    >
                        {isProcessing ? '🔄 Processing...' : '🚀 Create Calendar'}
                    </button>
                </div>
            )}
        </div>
    </div>
)