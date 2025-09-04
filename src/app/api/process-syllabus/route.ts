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

            // Validate file type
            if (!file.name.toLowerCase().endsWith('.pdf')) {
                console.error('❌ Invalid file type:', file.name)
                return NextResponse.json({
                    success: false,
                    error: 'Please upload a PDF file'
                })
            }

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
            } catch (extractError) {
                console.error('❌ PDF extraction failed:', extractError)
                return NextResponse.json({
                    success: false,
                    error: 'Could not extract text from PDF. Please try a different file or paste text manually.',
                    details: extractError instanceof Error ? extractError.message : 'Unknown error'
                })
            }
        }

        // Validate extracted text
        if (!textToAnalyze || textToAnalyze.length < 10) {
            console.error('❌ Text too short:', textToAnalyze.length)
            return NextResponse.json({
                success: false,
                error: `Extracted text is too short (${textToAnalyze.length} characters). Please check the file or paste text manually.`
            })
        }

        // Truncate text if too long for OpenAI
        const maxTextLength = 300000
        if (textToAnalyze.length > maxTextLength) {
            console.log(`⚠️ Text too long (${textToAnalyze.length} chars), truncating to ${maxTextLength}`)
            textToAnalyze = textToAnalyze.substring(0, maxTextLength)
        }

        console.log('🤖 Sending to OpenAI for analysis...')
        console.log('📊 Text preview:', textToAnalyze.substring(0, 200) + '...')

        // Analyze text with OpenAI
        const events = await analyzeTextWithOpenAI(textToAnalyze)
        console.log('✅ OpenAI analysis complete. Events found:', events.length)

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