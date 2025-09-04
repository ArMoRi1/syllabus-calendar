// src/app/lib/openaiAnalyzer.ts

import { OpenAI } from 'openai'

// Fallback function to extract dates with regex
function extractDatesWithRegex(text: string): any[] {
    const events = []
    const lines = text.split('\n')

    const datePatterns = [
        /(\w+\s+\d{1,2},?\s+\d{4})/g, // January 15, 2024
        /(\d{1,2}\/\d{1,2}\/\d{2,4})/g, // 1/15/24 or 01/15/2024
        /(\d{4}-\d{2}-\d{2})/g, // 2024-01-15
    ]

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

                const date = new Date(dateStr)
                if (!isNaN(date.getTime())) {
                    let eventType = 'other'
                    const lowerLine = line.toLowerCase()

                    for (const [type, keywords] of Object.entries(eventKeywords)) {
                        if (keywords.some(keyword => lowerLine.includes(keyword))) {
                            eventType = type
                            break
                        }
                    }

                    const beforeDate = line.substring(0, match.index).trim()
                    const afterDate = line.substring(match.index + match[0].length).trim()
                    const title = beforeDate.length > afterDate.length ? beforeDate : afterDate

                    if (title) {
                        events.push({
                            title: title.substring(0, 100),
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

// Main export function to analyze text with OpenAI
export async function analyzeTextWithOpenAI(text: string) {
    if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY is not configured')
        // Fallback to regex if no API key
        return extractDatesWithRegex(text)
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    })

    const systemPrompt = `You are a helpful assistant that extracts dates and events from academic syllabi. 
You MUST respond with ONLY a valid JSON object containing an "events" array.
If the year is not specified, assume it's the current academic year (2024-2025).
If only a day and month are given, use 2024 for September-December dates, and 2025 for January-May dates.
Each event object must have: title (string), date (YYYY-MM-DD format), type (exam/assignment/reading/class/other), and optionally description (string).

Your response must be in this exact format:
{
  "events": [
    {"title": "Event Name", "date": "YYYY-MM-DD", "type": "exam", "description": "Optional description"}
  ]
}`

    const userPrompt = `Extract all important dates and events from this syllabus text:

${text.substring(0, 8000)}`

    try {
        console.log('Calling OpenAI API...')

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
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
            response_format: { type: "json_object" } // This will work now because we expect an object
        })

        const content = response.choices[0]?.message?.content
        console.log('OpenAI raw response:', content?.substring(0, 500))

        if (!content) {
            throw new Error('Empty response from OpenAI')
        }

        let parsedData;
        try {
            parsedData = JSON.parse(content.trim())
        } catch (parseError) {
            console.error('JSON parse error:', parseError)
            throw new Error('Invalid JSON response from OpenAI')
        }

        // Extract events array from the response
        let events = []
        if (parsedData.events && Array.isArray(parsedData.events)) {
            events = parsedData.events
        } else if (Array.isArray(parsedData)) {
            events = parsedData
        } else {
            throw new Error('No events array found in response')
        }

        console.log(`Successfully parsed ${events.length} events`)
        return events

    } catch (error) {
        console.error('OpenAI analysis failed:', error)

        // Fallback to regex
        console.log('Trying fallback date extraction...')
        const fallbackEvents = extractDatesWithRegex(text)
        if (fallbackEvents.length > 0) {
            console.log(`Fallback extracted ${fallbackEvents.length} events`)
            return fallbackEvents
        }

        // If both fail, return empty array instead of throwing
        console.log('Both OpenAI and fallback failed, returning empty array')
        return []
    }
}