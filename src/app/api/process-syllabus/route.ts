// src/app/api/process-syllabus/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromPDF } from '../../lib/pdfExtractor'
import { analyzeTextWithOpenAI } from '../../lib/openaiAnalyzer'

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
            // Process PDF file
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

            // Extract text from PDF using the separate module
            try {
                textToAnalyze = await extractTextFromPDF(buffer)
            } catch (extractError) {
                console.error('PDF extraction failed:', extractError)
                return NextResponse.json({
                    success: false,
                    error: 'Could not extract text from PDF. Please try a different file or paste text manually.',
                    details: extractError instanceof Error ? extractError.message : 'Unknown error'
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
        const maxTextLength = 10000
        if (textToAnalyze.length > maxTextLength) {
            console.log(`Text too long (${textToAnalyze.length} chars), truncating to ${maxTextLength}`)
            textToAnalyze = textToAnalyze.substring(0, maxTextLength)
        }

        console.log('Sending text to OpenAI for analysis...')
        console.log('Text length:', textToAnalyze.length)

        // Analyze text with OpenAI using the separate module
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

        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        return NextResponse.json({
            success: false,
            error: `Processing error: ${errorMessage}`,
        })
    }
}