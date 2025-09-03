import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'

// Function to extract text from PDF using pdf-parse
async function extractTextWithPdfParse(buffer: Buffer) {
    try {
        const pdfParse = await import('pdf-parse')
        const data = await pdfParse.default(buffer)
        return data.text
    } catch (error) {
        console.error('pdf-parse extraction failed:', error)
        throw error
    }
}

// Alternative extraction with pdfjs-dist
async function extractTextWithPdfJs(buffer: Buffer) {
    try {
        // Dynamic import of pdfjs-dist
        const pdfjsLib = await import('pdfjs-dist')

        // Set worker source properly for Next.js environment
        const pdfWorker = await import('pdfjs-dist/build/pdf.worker.entry')
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

        // Load PDF document
        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(buffer),
            useSystemFonts: true,
        })

        const pdfDoc = await loadingTask.promise

        let fullText = ''

        // Extract text from each page
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            try {
                const page = await pdfDoc.getPage(pageNum)
                const textContent = await page.getTextContent()

                const pageText = textContent.items
                    .map((item: any) => {
                        // Check if item has str property
                        if ('str' in item) {
                            return item.str
                        }
                        return ''
                    })
                    .filter(text => text.length > 0)
                    .join(' ')

                fullText += pageText + '\n'
            } catch (pageError) {
                console.error(`Error processing page ${pageNum}:`, pageError)
                continue
            }
        }

        return fullText.trim()
    } catch (error) {
        console.error('pdfjs-dist extraction failed:', error)
        throw error
    }
}

// Fallback extraction method (basic)
async function extractTextWithFallback(buffer: Buffer) {
    try {
        // Try to extract readable text from buffer
        const text = buffer.toString('utf8')
        // Filter out non-printable characters
        const cleanText = text.replace(/[^\x20-\x7E\n]/g, ' ')
        return cleanText
    } catch (error) {
        console.error('Fallback extraction failed:', error)
        throw error
    }
}

// Function to analyze text with OpenAI
async function analyzeTextWithOpenAI(text: string) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured')
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_KEY,
    })

    const systemPrompt = `You are a helpful assistant that extracts dates and events from academic syllabi. 
You MUST respond with ONLY a valid JSON array, no additional text or explanation.
If the year is not specified, assume it's the current academic year (2024-2025).
If only a day and month are given, use 2024 for September-December dates, and 2025 for January-May dates.
Each event object must have: title (string), date (YYYY-MM-DD format), type (exam/assignment/reading/class/other), and optionally description (string).`

    const userPrompt = `Extract all important dates and events from this syllabus text and return ONLY a JSON array:

${text.substring(0, 8000)} // Limit text length

Example response format:
[
  {"title": "First Day of Class", "date": "2024-09-05", "type": "class", "description": "Introduction to course"},
  {"title": "Midterm Exam", "date": "2024-10-15", "type": "exam", "description": "Covers chapters 1-5"}
]`

    try {
        console.log('Calling OpenAI API...')

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', // Use gpt-3.5-turbo as it's more reliable for structured output
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: userPrompt
                }
            ],
            temperature: 0.1,
            max_tokens: 2000,
            response_format: { type: "json_object" } // Force JSON response
        })

        const content = response.choices[0]?.message?.content
        console.log('OpenAI raw response:', content?.substring(0, 500))

        if (!content) {
            throw new Error('Empty response from OpenAI')
        }

        // Clean up the response
        let cleanedContent = content.trim()

        // Try multiple parsing strategies
        let parsedData;

        // Strategy 1: Direct parse
        try {
            parsedData = JSON.parse(cleanedContent)
        } catch (e) {
            console.log('Direct parse failed, trying to extract JSON...')

            // Strategy 2: Extract array from text
            const arrayMatch = cleanedContent.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                try {
                    parsedData = JSON.parse(arrayMatch[0])
                } catch (e2) {
                    console.log('Array extraction failed')
                }
            }

            // Strategy 3: Extract object and get events property
            if (!parsedData) {
                const objectMatch = cleanedContent.match(/\{[\s\S]*\}/);
                if (objectMatch) {
                    try {
                        const obj = JSON.parse(objectMatch[0])
                        // Check if it has an events property
                        if (obj.events && Array.isArray(obj.events)) {
                            parsedData = obj.events
                        } else if (obj.data && Array.isArray(obj.data)) {
                            parsedData = obj.data
                        } else {
                            // If it's a single event, wrap in array
                            parsedData = [obj]
                        }
                    } catch (e3) {
                        console.log('Object extraction failed')
                    }
                }
            }
        }

        // If we got an object with events property instead of array
        if (parsedData && !Array.isArray(parsedData)) {
            if (parsedData.events) {
                parsedData = parsedData.events
            } else if (parsedData.data) {
                parsedData = parsedData.data
            }
        }

        // Validate that we have an array
        if (!Array.isArray(parsedData)) {
            console.error('Parsed data is not an array:', typeof parsedData)
            throw new Error('Invalid response format from OpenAI - not an array')
        }

        console.log(`Successfully parsed ${parsedData.length} events`)
        return parsedData

    } catch (error) {
        console.error('OpenAI analysis failed:', error)

        // If OpenAI fails, try a simple regex extraction as fallback
        console.log('Trying fallback date extraction...')
        const fallbackEvents = extractDatesWithRegex(text)
        if (fallbackEvents.length > 0) {
            console.log(`Fallback extracted ${fallbackEvents.length} events`)
            return fallbackEvents
        }

        throw error
    }
}

// Fallback function to extract dates with regex
function extractDatesWithRegex(text: string): any[] {
    const events = []
    const lines = text.split('\n')

    // Common date patterns
    const datePatterns = [
        /(\w+\s+\d{1,2},?\s+\d{4})/g, // January 15, 2024
        /(\d{1,2}\/\d{1,2}\/\d{2,4})/g, // 1/15/24 or 01/15/2024
        /(\d{4}-\d{2}-\d{2})/g, // 2024-01-15
    ]

    // Keywords that indicate event types
    const eventKeywords = {
        exam: ['exam', 'test', 'quiz', 'midterm', 'final'],
        assignment: ['assignment', 'homework', 'hw', 'project', 'paper', 'essay', 'due'],
        reading: ['reading', 'read', 'chapter', 'ch.', 'pages'],
        class: ['class', 'lecture', 'session', 'meeting']
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        for (const pattern of datePatterns) {
            const matches = line.matchAll(pattern)
            for (const match of matches) {
                const dateStr = match[0]

                // Try to parse the date
                const date = new Date(dateStr)
                if (!isNaN(date.getTime())) {
                    // Determine event type
                    let eventType = 'other'
                    const lowerLine = line.toLowerCase()

                    for (const [type, keywords] of Object.entries(eventKeywords)) {
                        if (keywords.some(keyword => lowerLine.includes(keyword))) {
                            eventType = type
                            break
                        }
                    }

                    // Extract title (text before or after date)
                    const beforeDate = line.substring(0, match.index).trim()
                    const afterDate = line.substring(match.index + match[0].length).trim()
                    const title = beforeDate.length > afterDate.length ? beforeDate : afterDate

                    if (title) {
                        events.push({
                            title: title.substring(0, 100), // Limit title length
                            date: date.toISOString().split('T')[0],
                            type: eventType,
                            description: ''
                        })
                    }
                }
            }
        }
    }

    return events
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        let textToAnalyze = ''

        // Check if there's manual text
        const manualText = formData.get('manualText') as string
        if (manualText && manualText.trim()) {
            textToAnalyze = manualText.trim()
            console.log('Using manual text, length:', textToAnalyze.length)
        } else {
            // Process file
            const file = formData.get('file') as File
            if (!file) {
                return NextResponse.json({
                    success: false,
                    error: 'No file or text provided'
                })
            }

            console.log('Processing file:', file.name, 'size:', file.size)

            // Validate file type
            if (!file.name.toLowerCase().endsWith('.pdf')) {
                return NextResponse.json({
                    success: false,
                    error: 'Please upload a PDF file'
                })
            }

            // Convert File to Buffer
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            console.log('Buffer created, size:', buffer.length)

            // Try different text extraction methods
            const extractionMethods = [
                { name: 'pdf-parse', method: () => extractTextWithPdfParse(buffer) },
                { name: 'pdfjs-dist', method: () => extractTextWithPdfJs(buffer) },
                { name: 'fallback', method: () => extractTextWithFallback(buffer) },
            ]

            let extractionErrors = []

            for (const { name, method } of extractionMethods) {
                try {
                    console.log(`Trying extraction method: ${name}`)
                    textToAnalyze = await method()

                    // Clean up extracted text
                    textToAnalyze = textToAnalyze
                        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                        .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines
                        .trim()

                    if (textToAnalyze && textToAnalyze.length > 50) {
                        console.log(`${name} successful, text length:`, textToAnalyze.length)
                        console.log('Text preview:', textToAnalyze.substring(0, 500))
                        break
                    } else {
                        console.log(`${name} returned insufficient text, trying next method`)
                        extractionErrors.push(`${name}: Insufficient text extracted`)
                        textToAnalyze = ''
                    }
                } catch (methodError) {
                    const errorMsg = `${name}: ${methodError instanceof Error ? methodError.message : 'Unknown error'}`
                    console.error(errorMsg)
                    extractionErrors.push(errorMsg)
                    continue
                }
            }

            // If no method worked
            if (!textToAnalyze || textToAnalyze.length < 50) {
                return NextResponse.json({
                    success: false,
                    error: 'Could not extract text from PDF. Please try a different file or paste text manually.',
                    details: extractionErrors,
                    debug: {
                        fileSize: file.size,
                        bufferSize: buffer.length,
                        extractedLength: textToAnalyze.length
                    }
                })
            }
        }

        // Validate extracted text
        if (!textToAnalyze || textToAnalyze.length < 50) {
            return NextResponse.json({
                success: false,
                error: 'Extracted text is too short or empty. Please check the file or paste text manually.'
            })
        }

        // Truncate text if too long for OpenAI
        const maxTextLength = 10000 // Adjust based on your needs
        if (textToAnalyze.length > maxTextLength) {
            console.log(`Text too long (${textToAnalyze.length} chars), truncating to ${maxTextLength}`)
            textToAnalyze = textToAnalyze.substring(0, maxTextLength)
        }

        console.log('Sending text to OpenAI for analysis...')
        console.log('Text length:', textToAnalyze.length)

        // Analyze text with OpenAI
        const events = await analyzeTextWithOpenAI(textToAnalyze)

        console.log('OpenAI returned events count:', events.length)

        // Validate and clean up events
        const validEvents = events.filter(event => {
            return event.title && event.date && event.type
        }).map(event => ({
            ...event,
            date: event.date.split('T')[0], // Ensure date format is YYYY-MM-DD
        }))

        return NextResponse.json({
            success: true,
            events: validEvents,
            debug: {
                textLength: textToAnalyze.length,
                eventsFound: validEvents.length
            }
        })

    } catch (error) {
        console.error('API Error:', error)

        // More detailed error response
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const errorStack = error instanceof Error ? error.stack : ''

        return NextResponse.json({
            success: false,
            error: `Processing error: ${errorMessage}`,
            stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
        })
    }
}