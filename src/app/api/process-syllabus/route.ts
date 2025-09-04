// app/api/process-syllabus/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { ProcessingResult, SyllabusEvent } from '@/types'
import { extractTextFromPDF } from '@/lib/pdfExtractor'
import { analyzeTextWithOpenAI } from '@/lib/openaiAnalyzer'

const MIN_TEXT_LENGTH = 50
const MAX_TEXT_LENGTH = 10000

export async function POST(request: NextRequest): Promise<NextResponse<ProcessingResult>> {
    try {
        const formData = await request.formData()

        // Get text from either manual input or PDF file
        const text = await getTextFromFormData(formData)

        if (!text || text.length < MIN_TEXT_LENGTH) {
            return NextResponse.json({
                success: false,
                error: 'Text too short or empty. Please check your input.'
            })
        }

        // Truncate if too long
        const processedText = text.length > MAX_TEXT_LENGTH
            ? text.substring(0, MAX_TEXT_LENGTH)
            : text

        console.log(`Processing text of length: ${processedText.length}`)

        // Analyze with OpenAI
        const events = await analyzeTextWithOpenAI(processedText)

        // Validate and clean events
        const validEvents = validateEvents(events)

        return NextResponse.json({
            success: true,
            events: validEvents,
            debug: {
                textLength: processedText.length,
                eventsFound: validEvents.length
            }
        })

    } catch (error) {
        console.error('API Error:', error)

        return NextResponse.json({
            success: false,
            error: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            stack: process.env.NODE_ENV === 'development' && error instanceof Error
                ? error.stack
                : undefined
        })
    }
}

async function getTextFromFormData(formData: FormData): Promise<string> {
    // Check for manual text first
    const manualText = formData.get('manualText') as string
    if (manualText?.trim()) {
        console.log('Using manual text, length:', manualText.length)
        return manualText.trim()
    }

    // Process PDF file
    const file = formData.get('file') as File
    if (!file) {
        throw new Error('No file or text provided')
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('Please upload a PDF file')
    }

    console.log('Processing file:', file.name, 'size:', file.size)

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return await extractTextFromPDF(buffer)
}

function validateEvents(events: any[]): SyllabusEvent[] {
    return events
        .filter(event => event.title && event.date && event.type)
        .map(event => ({
            ...event,
            date: event.date.split('T')[0], // Ensure YYYY-MM-DD format
        }))
}