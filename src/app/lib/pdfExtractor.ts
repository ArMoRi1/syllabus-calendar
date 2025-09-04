// src/app/lib/pdfExtractor.ts

// Simple and reliable PDF extraction with pdf-parse only
async function extractTextWithPdfParse(buffer: Buffer) {
    try {
        console.log('🔄 Using pdf-parse for text extraction...')

        // Import pdf-parse properly
        const pdfParse = await import('pdf-parse')

        // Call pdf-parse with the buffer directly
        const data = await pdfParse.default(buffer, {
            // Options for better extraction
            normalizeWhitespace: true,
            disableCombineTextItems: false,
        })

        console.log(`✅ pdf-parse successful!`)
        console.log(`📄 Pages: ${data.numpages}`)
        console.log(`📏 Characters: ${data.text.length}`)
        console.log(`📊 Info:`, data.info)

        return data.text

    } catch (error) {
        console.error('❌ pdf-parse extraction failed:', error)
        throw error
    }
}

// Alternative simple extraction method without DOM dependencies
async function extractTextSimple(buffer: Buffer) {
    try {
        console.log('🔄 Trying simple text extraction...')

        // Convert buffer to string and try to find text content
        const bufferString = buffer.toString('binary')

        // Look for text patterns in PDF structure
        const textMatches = []

        // Simple regex patterns to find text in PDF
        const patterns = [
            /\(([^)]+)\)\s*Tj/g,  // PDF text showing operators
            /\[([^\]]+)\]\s*TJ/g, // PDF text array operators
            /BT\s+([^E]+)\s+ET/g, // Text objects
        ]

        for (const pattern of patterns) {
            let match
            while ((match = pattern.exec(bufferString)) !== null) {
                if (match[1]) {
                    textMatches.push(match[1])
                }
            }
        }

        if (textMatches.length > 0) {
            const extractedText = textMatches
                .join(' ')
                .replace(/\\[nrt]/g, ' ') // Remove escape sequences
                .replace(/[^\x20-\x7E\n]/g, ' ') // Keep only printable ASCII + newlines
                .replace(/\s+/g, ' ')
                .trim()

            console.log(`✅ Simple extraction found ${extractedText.length} characters`)
            return extractedText
        }

        throw new Error('No readable text patterns found')

    } catch (error) {
        console.error('❌ Simple extraction failed:', error)
        throw error
    }
}

// Fallback method using string search
async function extractTextFallback(buffer: Buffer) {
    try {
        console.log('🔄 Using fallback string extraction...')

        // Convert to UTF-8 and look for readable text
        const text = buffer.toString('utf8')

        // Find sequences of readable characters
        const readableText = text
            .match(/[a-zA-Z0-9\s.,;:!?()-]{10,}/g) // Find readable sequences of at least 10 chars
            ?.join(' ')
            ?.replace(/\s+/g, ' ')
            ?.trim() || ''

        if (readableText.length > 50) {
            console.log(`✅ Fallback extraction found ${readableText.length} characters`)
            return readableText
        }

        throw new Error('No readable text found in fallback method')

    } catch (error) {
        console.error('❌ Fallback extraction failed:', error)
        throw error
    }
}

// Main export function - focused on working methods only
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    console.log('📱 Starting PDF text extraction...')
    console.log(`📊 Buffer size: ${buffer.length} bytes (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`)

    // Validate buffer
    if (!buffer || buffer.length === 0) {
        throw new Error('❌ Empty or invalid PDF buffer')
    }

    // Check PDF signature
    const header = buffer.toString('ascii', 0, 8)
    console.log(`🔍 File header: "${header}"`)

    if (!header.startsWith('%PDF')) {
        throw new Error(`❌ Invalid PDF file - header is "${header}", expected "%PDF"`)
    }

    // Try extraction methods in order of reliability
    const methods = [
        {
            name: 'pdf-parse',
            description: 'Primary method using pdf-parse library',
            method: () => extractTextWithPdfParse(buffer)
        },
        {
            name: 'simple-extraction',
            description: 'Simple pattern matching in PDF structure',
            method: () => extractTextSimple(buffer)
        },
        {
            name: 'fallback',
            description: 'Basic string extraction as last resort',
            method: () => extractTextFallback(buffer)
        }
    ]

    const errors: string[] = []

    for (const { name, description, method } of methods) {
        try {
            console.log(`🎯 ${name}: ${description}`)

            let result = await method()

            // Clean up the text
            result = result
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n')
                .replace(/\s+/g, ' ')
                .replace(/\n{3,}/g, '\n\n')
                .trim()

            console.log(`📏 Cleaned text length: ${result.length}`)
            console.log(`📝 First 200 chars: "${result.substring(0, 200)}..."`)

            // Validate result quality
            if (result && result.length >= 50) {
                // Check if text contains some meaningful content
                const hasWords = /\b\w{3,}\b/.test(result) // Has words with 3+ letters
                const hasNumbers = /\d/.test(result) // Has numbers (likely dates)

                if (hasWords && (hasNumbers || result.length > 200)) {
                    console.log(`🎉 ${name} SUCCESS! Extracted meaningful text`)
                    return result
                }
            }

            console.log(`⚠️ ${name} extracted text but quality seems poor`)
            errors.push(`${name}: Poor quality text (${result.length} chars)`)

        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            console.error(`❌ ${name} failed: ${message}`)
            errors.push(`${name}: ${message}`)
        }
    }

    // All methods failed
    const errorMessage = `All PDF extraction methods failed:\n${errors.join('\n')}`
    console.error('💥 EXTRACTION FAILED:', errorMessage)

    throw new Error(errorMessage)
}