// src/lib/openaiAnalyzer.ts

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
        throw new Error('OPENAI_API_KEY is not configured')
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    })

    const systemPrompt = `You are a helpful assistant that extracts dates and events from academic syllabi. 
You MUST respond with ONLY a valid JSON array, no additional text or explanation.
If the year is not specified, assume it's the current academic year (2024-2025).
If only a day and month are given, use 2024 for September-December dates, and 2025 for January-May dates.
Each event object must have: title (string), date (YYYY-MM-DD format), type (exam/assignment/reading/class/other), and optionally description (string).`

    const userPrompt = `Extract all important dates and events from this syllabus text and return ONLY a JSON array:

${text.substring(0, 8000)}

Example response format:
[
  {"title": "First Day of Class", "date": "2024-09-05", "type": "class", "description": "Introduction to course"},
  {"title": "Midterm Exam", "date": "2024-10-15", "type": "exam", "description": "Covers chapters 1-5"}
]`

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
            response_format: { type: "json_object" }
        })

        const content = response.choices[0]?.message?.content
        console.log('OpenAI raw response:', content?.substring(0, 500))

        if (!content) {
            throw new Error('Empty response from OpenAI')
        }

        let cleanedContent = content.trim()
        let parsedData;

        // Try direct parse
        try {
            parsedData = JSON.parse(cleanedContent)
        } catch (e) {
            console.log('Direct parse failed, trying to extract JSON...')

            // Try to extract array
            const arrayMatch = cleanedContent.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                try {
                    parsedData = JSON.parse(arrayMatch[0])
                } catch (e2) {
                    console.log('Array extraction failed')
                }
            }

            // Try to extract object
            if (!parsedData) {
                const objectMatch = cleanedContent.match(/\{[\s\S]*\}/);
                if (objectMatch) {
                    try {
                        const obj = JSON.parse(objectMatch[0])
                        if (obj.events && Array.isArray(obj.events)) {
                            parsedData = obj.events
                        } else if (obj.data && Array.isArray(obj.data)) {
                            parsedData = obj.data
                        } else {
                            parsedData = [obj]
                        }
                    } catch (e3) {
                        console.log('Object extraction failed')
                    }
                }
            }
        }

        // Handle object with events property
        if (parsedData && !Array.isArray(parsedData)) {
            if (parsedData.events) {
                parsedData = parsedData.events
            } else if (parsedData.data) {
                parsedData = parsedData.data
            }
        }

        if (!Array.isArray(parsedData)) {
            console.error('Parsed data is not an array:', typeof parsedData)
            throw new Error('Invalid response format from OpenAI - not an array')
        }

        console.log(`Successfully parsed ${parsedData.length} events`)
        return parsedData

    } catch (error) {
        console.error('OpenAI analysis failed:', error)

        // Fallback to regex
        console.log('Trying fallback date extraction...')
        const fallbackEvents = extractDatesWithRegex(text)
        if (fallbackEvents.length > 0) {
            console.log(`Fallback extracted ${fallbackEvents.length} events`)
            return fallbackEvents
        }

        throw error
    }
}