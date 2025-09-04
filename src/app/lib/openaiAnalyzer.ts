// lib/openaiAnalyzer.ts

import { OpenAI } from 'openai'
import { SyllabusEvent, EventType } from '@/types'

const MAX_TEXT_LENGTH = 8000

export async function analyzeTextWithOpenAI(text: string): Promise<SyllabusEvent[]> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured')
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    })

    const truncatedText = text.substring(0, MAX_TEXT_LENGTH)

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: getSystemPrompt()
                },
                {
                    role: 'user',
                    content: getUserPrompt(truncatedText)
                }
            ],
            temperature: 0.1,
            max_tokens: 2000,
            response_format: { type: "json_object" }
        })

        const content = response.choices[0]?.message?.content
        if (!content) throw new Error('Empty response from OpenAI')

        const parsedData = parseOpenAIResponse(content)
        console.log(`Successfully parsed ${parsedData.length} events`)

        return parsedData
    } catch (error) {
        console.error('OpenAI analysis failed:', error)

        // Fallback to regex extraction
        const fallbackEvents = extractDatesWithRegex(text)
        if (fallbackEvents.length > 0) {
            console.log(`Fallback extracted ${fallbackEvents.length} events`)
            return fallbackEvents
        }

        throw error
    }
}

function getSystemPrompt(): string {
    return `You are a helpful assistant that extracts dates and events from academic syllabi. 
You MUST respond with ONLY a valid JSON array, no additional text or explanation.
If the year is not specified, assume it's the current academic year (2024-2025).
If only a day and month are given, use 2024 for September-December dates, and 2025 for January-May dates.
Each event object must have: title (string), date (YYYY-MM-DD format), type (exam/assignment/reading/class/other), and optionally description (string).`
}

function getUserPrompt(text: string): string {
    return `Extract all important dates and events from this syllabus text and return ONLY a JSON array:

${text}

Example response format:
[
  {"title": "First Day of Class", "date": "2024-09-05", "type": "class", "description": "Introduction to course"},
  {"title": "Midterm Exam", "date": "2024-10-15", "type": "exam", "description": "Covers chapters 1-5"}
]`
}

function parseOpenAIResponse(content: string): SyllabusEvent[] {
    let cleanedContent = content.trim()
    let parsedData: any

    // Try direct parse
    try {
        parsedData = JSON.parse(cleanedContent)
    } catch {
        // Try extracting array
        const arrayMatch = cleanedContent.match(/\[[\s\S]*\]/)
        if (arrayMatch) {
            try {
                parsedData = JSON.parse(arrayMatch[0])
            } catch {
                // Try extracting object
                const objectMatch = cleanedContent.match(/\{[\s\S]*\}/)
                if (objectMatch) {
                    const obj = JSON.parse(objectMatch[0])
                    parsedData = obj.events || obj.data || [obj]
                }
            }
        }
    }

    // Ensure we have an array
    if (parsedData && !Array.isArray(parsedData)) {
        parsedData = parsedData.events || parsedData.data || []
    }

    if (!Array.isArray(parsedData)) {
        throw new Error('Invalid response format from OpenAI')
    }

    return parsedData
}

function extractDatesWithRegex(text: string): SyllabusEvent[] {
    const events: SyllabusEvent[] = []
    const lines = text.split('\n')

    const datePatterns = [
        /(\w+\s+\d{1,2},?\s+\d{4})/g,
        /(\d{1,2}\/\d{1,2}\/\d{2,4})/g,
        /(\d{4}-\d{2}-\d{2})/g,
    ]

    const eventKeywords: Record<EventType, string[]> = {
        exam: ['exam', 'test', 'quiz', 'midterm', 'final'],
        assignment: ['assignment', 'homework', 'hw', 'project', 'paper', 'essay', 'due'],
        reading: ['reading', 'read', 'chapter', 'ch.', 'pages'],
        class: ['class', 'lecture', 'session', 'meeting'],
        other: []
    }

    for (const line of lines) {
        for (const pattern of datePatterns) {
            const matches = line.matchAll(pattern)

            for (const match of matches) {
                const date = new Date(match[0])
                if (isNaN(date.getTime())) continue

                const lowerLine = line.toLowerCase()
                let eventType: EventType = 'other'

                for (const [type, keywords] of Object.entries(eventKeywords)) {
                    if (keywords.some(keyword => lowerLine.includes(keyword))) {
                        eventType = type as EventType
                        break
                    }
                }

                const beforeDate = line.substring(0, match.index).trim()
                const afterDate = line.substring((match.index || 0) + match[0].length).trim()
                const title = beforeDate.length > afterDate.length ? beforeDate : afterDate

                if (title) {
                    events.push({
                        id: 0, // Will be assigned later
                        title: title.substring(0, 100),
                        date: date.toISOString().split('T')[0],
                        type: eventType,
                        description: ''
                    })
                }
            }
        }
    }

    return events
}