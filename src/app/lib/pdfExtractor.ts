// src/app/lib/pdfExtractor.ts

// Fixed pdf-parse method - the ENOENT error suggests it's trying to read a test file
async function extractTextWithPdfParse(buffer: Buffer) {
    try {
        console.log('🔄 Using pdf-parse for text extraction...')

        // IMPORTANT: Clear any env variables that might interfere
        const originalEnv = { ...process.env }

        // Remove any test-related environment variables
        delete process.env.PDF_JS_TEST_FILE
        delete process.env.PDF_PARSE_TEST_FILE

        const pdfParse = await import('pdf-parse')

        // Call pdf-parse with clean options
        const data = await pdfParse.default(buffer, {
            // Options for better text extraction
            normalizeWhitespace: true,
            disableCombineTextItems: false,
            // Make sure we don't use any test data
            version: 'default'
        })

        // Restore environment
        process.env = originalEnv

        console.log(`✅ pdf-parse successful!`)
        console.log(`📄 Pages: ${data.numpages}`)
        console.log(`📏 Text length: ${data.text.length}`)
        console.log(`📝 Text preview: "${data.text.substring(0, 300)}"`)

        // Validate that we got actual readable text, not PDF structure
        const hasReadableContent = data.text &&
            data.text.length > 100 &&
            !data.text.includes('endobj') &&
            !data.text.includes('FlateDecode') &&
            /[a-zA-Z]{3,}/.test(data.text)

        if (!hasReadableContent) {
            throw new Error('pdf-parse returned PDF structure instead of readable text')
        }

        return data.text

    } catch (error) {
        console.error('❌ pdf-parse extraction failed:', error)
        throw error
    }
}

// Alternative method using simple buffer reading with better text detection
async function extractTextWithBufferSearch(buffer: Buffer) {
    try {
        console.log('🔄 Searching for readable text in buffer...')

        // Convert buffer to different encodings and look for text
        const encodings = ['utf8', 'latin1', 'ascii']
        let bestText = ''

        for (const encoding of encodings) {
            try {
                const text = buffer.toString(encoding as BufferEncoding)

                // Look for readable text patterns (not PDF structure)
                const textBlocks = []

                // Split by common PDF delimiters and filter readable content
                const parts = text.split(/(?:stream|endstream|endobj|obj|\d+\s+\d+\s+R)/g)

                for (const part of parts) {
                    // Look for chunks with readable words and dates
                    const cleanPart = part
                        .replace(/[^\x20-\x7E\n]/g, ' ')  // Keep only printable ASCII
                        .replace(/\s+/g, ' ')             // Normalize spaces
                        .trim()

                    // Check if this part contains readable content
                    if (cleanPart.length > 50 &&
                        /[a-zA-Z]{3,}/.test(cleanPart) &&     // Has real words
                        !/^[\d\s()<>/\[\]{}]+$/.test(cleanPart) && // Not just numbers and symbols
                        !cleanPart.includes('FlateDecode') &&     // Not PDF structure
                        !cleanPart.includes('endobj')) {          // Not PDF structure

                        textBlocks.push(cleanPart)
                    }
                }

                const extractedText = textBlocks.join('\n').trim()

                if (extractedText.length > bestText.length) {
                    bestText = extractedText
                }

            } catch (encError) {
                console.log(`Encoding ${encoding} failed, trying next...`)
                continue
            }
        }

        if (bestText.length > 100) {
            console.log(`✅ Buffer search found ${bestText.length} characters`)
            console.log(`📝 Preview: "${bestText.substring(0, 200)}..."`)
            return bestText
        }

        throw new Error('No readable text found in buffer')

    } catch (error) {
        console.error('❌ Buffer search failed:', error)
        throw error
    }
}

// Try to reinstall pdf-parse cleanly
async function reinstallPdfParse() {
    try {
        console.log('🔄 Attempting to use fresh pdf-parse instance...')

        // Clear require cache for pdf-parse
        const moduleId = require.resolve('pdf-parse')
        delete require.cache[moduleId]

        // Import fresh instance
        const pdfParse = require('pdf-parse')

        console.log('✅ Fresh pdf-parse loaded')
        return pdfParse

    } catch (error) {
        console.error('❌ Fresh pdf-parse failed:', error)
        throw error
    }
}

// Alternative direct pdf-parse call
async function extractWithDirectPdfParse(buffer: Buffer) {
    try {
        console.log('🔄 Trying direct pdf-parse call...')

        const pdfParse = await reinstallPdfParse()

        const result = await pdfParse(buffer)

        console.log(`✅ Direct pdf-parse successful: ${result.text.length} chars`)
        console.log(`📝 Preview: "${result.text.substring(0, 300)}"`)

        return result.text

    } catch (error) {
        console.error('❌ Direct pdf-parse failed:', error)
        throw error
    }
}

// Main export function
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    console.log('📱 Starting PDF text extraction...')
    console.log(`📊 Buffer size: ${buffer.length} bytes (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`)

    // Validate buffer
    if (!buffer || buffer.length === 0) {
        throw new Error('❌ Empty PDF buffer')
    }

    // Check PDF signature
    const header = buffer.toString('ascii', 0, 8)
    console.log(`🔍 PDF header: "${header}"`)

    if (!header.startsWith('%PDF')) {
        throw new Error(`❌ Invalid PDF file - header: "${header}"`)
    }

    // Try multiple approaches to pdf-parse and fallbacks
    const methods = [
        {
            name: 'direct-pdf-parse',
            description: 'Direct pdf-parse with fresh instance',
            method: () => extractWithDirectPdfParse(buffer)
        },
        {
            name: 'clean-pdf-parse',
            description: 'Clean pdf-parse call with environment cleanup',
            method: () => extractTextWithPdfParse(buffer)
        },
        {
            name: 'buffer-search',
            description: 'Smart buffer text search',
            method: () => extractTextWithBufferSearch(buffer)
        }
    ]

    const errors: string[] = []

    for (const { name, description, method } of methods) {
        try {
            console.log(`🎯 ${name}: ${description}`)

            let result = await method()

            // Clean and validate the result
            result = result
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n')
                .replace(/\s+/g, ' ')
                .replace(/\n{3,}/g, '\n\n')
                .trim()

            console.log(`📏 Cleaned text length: ${result.length}`)

            // IMPORTANT: Validate that we got real text, not PDF structure
            const isRealText = result &&
                result.length >= 100 &&
                !result.includes('endobj') &&
                !result.includes('FlateDecode') &&
                !result.includes('endstream') &&
                /[a-zA-Z]{3,}.*[a-zA-Z]{3,}/.test(result) && // Has multiple real words
                (/\d{4}/.test(result) || /\d{1,2}\/\d{1,2}/.test(result)) // Has dates

            if (isRealText) {
                console.log(`🎉 ${name} SUCCESS! Found real readable text`)
                console.log(`📄 Sample: "${result.substring(0, 200)}..."`)
                return result
            } else {
                console.log(`⚠️ ${name} returned PDF structure, not readable text`)
                errors.push(`${name}: Returned PDF structure instead of text`)
            }

        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            console.error(`❌ ${name} failed: ${message}`)
            errors.push(`${name}: ${message}`)
        }
    }

    // All methods failed
    const errorMessage = `Could not extract readable text from PDF. All methods failed:\n${errors.join('\n')}`
    console.error('💥 EXTRACTION FAILED:', errorMessage)

    throw new Error(errorMessage)
}