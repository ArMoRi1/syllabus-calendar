// src/app/api/process-syllabus/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromPDF } from '../../lib/pdfExtractor'
import { analyzeTextWithOpenAI } from '../../lib/openaiAnalyzer'

export async function POST(request: NextRequest) {
    console.log('=== Starting syllabus processing ===')

    try {
        const formData = await request.formData()
        let textToAnalyze = ''

        // Check if there's manual text
        const manualText = formData.get('manualText') as string
        if (manualText && manualText.trim()) {
            textToAnalyze = manualText.trim()
            console.log('✅ Using manual text, length:', textToAnalyze.length)
        } else {
            // Process PDF file
            const file = formData.get('file') as File
            if (!file) {
                console.error('❌ No file or text provided')
                return NextResponse.json({
                    success: false,
                    error: 'No file or text provided'
                })
            }

            console.log('📁 Processing file:', file.name, 'size:', file.size, 'type:', file.type)

            // Convert File to Buffer
            console.log('🔄 Converting file to buffer...')
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            console.log('✅ Buffer created, size:', buffer.length)

            // Extract text from PDF
            try {
                console.log('🔄 Extracting text from PDF...')
                textToAnalyze = await extractTextFromPDF(buffer)
                console.log('✅ PDF text extracted successfully, length:', textToAnalyze.length)

                // ВАЖЛИВО: Перевіряємо чи текст читабельний
                const readableWords = textToAnalyze.match(/[a-zA-Z]{3,}/g) || []
                const readableRatio = readableWords.length * 5 / textToAnalyze.length // Приблизно

                console.log(`📊 Text quality check: ${readableWords.length} words found, ratio: ${readableRatio.toFixed(2)}`)

                if (readableRatio < 0.1) {
                    console.warn('⚠️ Extracted text appears to be corrupted or encrypted')

                    // Спробуємо надіслати в OpenAI все одно - може він щось знайде
                    console.log('🤖 Attempting AI analysis despite poor text quality...')

                    // Додаємо інструкцію для OpenAI
                    textToAnalyze = `IMPORTANT: The following text was extracted from a PDF and may be corrupted. Please try to find any dates, assignments, exams, or academic events even if the text is partially unreadable. Focus on patterns that look like dates (numbers, months) and academic terms.\n\n${textToAnalyze}`
                }

            } catch (extractError) {
                console.error('❌ PDF extraction failed:', extractError)

                // НОВИЙ ПІДХІД: Якщо екстракція не вдалась, пропонуємо альтернативи
                return NextResponse.json({
                    success: false,
                    error: 'Could not extract text from PDF',
                    message: 'This PDF appears to be encrypted, scanned, or uses special encoding.',
                    suggestions: [
                        'Try opening the PDF in Google Docs (it will auto-convert to text)',
                        'Copy and paste the text manually from the PDF viewer',
                        'Use an online PDF to text converter first',
                        'Make sure the PDF contains actual text (not scanned images)'
                    ]
                })
            }
        }

        // Truncate text if too long for OpenAI
        const maxTextLength = 30000 // Зменшено для економії токенів
        if (textToAnalyze.length > maxTextLength) {
            console.log(`⚠️ Text too long (${textToAnalyze.length} chars), truncating to ${maxTextLength}`)

            // Намагаємось зберегти початок і кінець (часто там є важливі дати)
            const startText = textToAnalyze.substring(0, maxTextLength * 0.7)
            const endText = textToAnalyze.substring(textToAnalyze.length - maxTextLength * 0.3)
            textToAnalyze = startText + '\n...[truncated]...\n' + endText
        }

        console.log('🤖 Sending to OpenAI for analysis...')
        console.log('📊 Text preview (first 200 chars):', textToAnalyze.substring(0, 200).replace(/[^\x20-\x7E]/g, '?'))

        // Analyze text with OpenAI
        const events = await analyzeTextWithOpenAI(textToAnalyze)
        console.log('✅ OpenAI analysis complete. Events found:', events.length)

        // Якщо OpenAI не знайшов подій, але ми знаємо що текст був
        if (events.length === 0 && textToAnalyze.length > 100) {
            console.warn('⚠️ No events found despite having text')

            return NextResponse.json({
                success: false,
                error: 'Could not find any events in the PDF',
                message: 'The PDF text was extracted but no dates or events were found.',
                suggestions: [
                    'Make sure this is actually a syllabus with dates',
                    'Try copying specific sections with dates manually',
                    'Check if the PDF is in English'
                ],
                debug: {
                    textExtracted: true,
                    textLength: textToAnalyze.length,
                    sampleText: textToAnalyze.substring(0, 500).replace(/[^\x20-\x7E]/g, '?')
                }
            })
        }

        // Validate and clean up events
        const validEvents = events.filter(event => {
            const isValid = event.title && event.date && event.type
            if (!isValid) {
                console.log('⚠️ Filtering out invalid event:', event)
            }
            return isValid
        }).map(event => ({
            ...event,
            date: event.date.split('T')[0], // Ensure date format is YYYY-MM-DD
        }))

        console.log('✅ Processing complete. Valid events:', validEvents.length)

        return NextResponse.json({
            success: true,
            events: validEvents,
            debug: {
                textLength: textToAnalyze.length,
                eventsFound: validEvents.length,
                openaiApiConfigured: !!process.env.OPENAI_API_KEY
            }
        })

    } catch (error) {
        console.error('💥 API Error:', error)

        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const stack = error instanceof Error ? error.stack : undefined

        return NextResponse.json({
            success: false,
            error: `Processing error: ${errorMessage}`,
            stack: process.env.NODE_ENV === 'development' ? stack : undefined
        })
    }
}