import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
})

export async function POST(request: NextRequest) {
    console.log('🚀 API called - processing syllabus with AI...')

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const manualText = formData.get('manualText') as string

        if (!file && !manualText) {
            return NextResponse.json({ error: 'No file or text provided' }, { status: 400 })
        }

        let textToProcess = ''

        // Handle manual text input
        if (manualText && manualText.trim().length > 10) {
            console.log('📝 Using manual text input, length:', manualText.length)
            textToProcess = manualText.trim()
        } else if (file) {
            console.log('📄 File received:', file.name, file.size, 'bytes')

            // Try to extract text from PDF
            try {
                const bytes = await file.arrayBuffer()
                const buffer = Buffer.from(bytes)

                // Try dynamic import for pdf-parse
                const pdfParse = (await import('pdf-parse')).default
                const pdfData = await pdfParse(buffer)
                textToProcess = pdfData.text
                console.log('✅ PDF text extracted, length:', textToProcess.length)

                console.log('📝 First 500 chars of extracted text:', textToProcess.substring(0, 500))
                console.log('📝 Contains "Spring 2025"?', textToProcess.includes('Spring 2025'))
            } catch (pdfError) {
                console.log('⚠️ PDF extraction failed:', pdfError.message)
                // Fallback to sample text for demo
                textToProcess = ``
            }
        }

        // Check if we have OpenAI key
        if (!process.env.OPENAI_API_KEY) {
            console.log('❌ No OpenAI API key found')
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
        }

        if (textToProcess.length < 10) {
            console.log('❌ Text too short for processing, length:', textToProcess.length)
            return NextResponse.json({
                error: 'Text too short for processing. Please try copying text manually.',
                textLength: textToProcess.length
            }, { status: 400 })
        }

        console.log('🤖 Sending to OpenAI...')
        console.log('📝 Text preview:', textToProcess.substring(0, 300))

        // Enhanced prompt for better parsing
        const prompt = `
You are an expert at analyzing academic syllabi and extracting important dates and events.

Analyze the following syllabus text and extract ALL dates, assignments, exams, readings, and class sessions.

IMPORTANT: Return ONLY a valid JSON object in this exact format:

{
  "events": [
    {
      "date": "YYYY-MM-DD",
      "title": "Clear, descriptive title",
      "type": "class|assignment|exam|reading|other",
      "description": "Additional details or requirements"
    }
  ]
}

RULES:
1. Convert ALL dates to YYYY-MM-DD format
2. If no year is specified, assume 2024
3. Categorize each event accurately:
   - "class" for lectures, discussions, class sessions
   - "assignment" for homework, papers, projects due
   - "exam" for tests, midterms, finals
   - "reading" for required readings, chapters
   - "other" for anything else
4. Make titles descriptive but concise
5. Include relevant details in description
6. Only include events with specific dates
7. Return ONLY the JSON object, no other text

SYLLABUS TEXT:
${textToProcess}
`

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that extracts structured data from academic syllabi. Always return valid JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.1,
            max_tokens: 2000
        })

        const aiResponse = completion.choices[0]?.message?.content || ''
        console.log('🤖 OpenAI response length:', aiResponse.length)
        console.log('🤖 AI response preview:', aiResponse.substring(0, 500))
        console.log('🤖 Full AI response:', aiResponse)
        // Parse the JSON response with better error handling
        let events = []
        try {
            // Try to parse the full response
            const parsed = JSON.parse(aiResponse)
            events = parsed.events || []
            console.log('✅ Successfully parsed', events.length, 'events')
        } catch (parseError) {
            console.log('⚠️ Initial parsing failed, trying to extract JSON...', parseError.message)

            // Try to extract JSON from response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[0])
                    events = parsed.events || []
                    console.log('✅ Extracted JSON successfully:', events.length, 'events')
                } catch (extractError) {
                    console.log('❌ JSON extraction failed:', extractError.message)
                }
            }

            // Final fallback - try to parse array directly
            if (events.length === 0) {
                const arrayMatch = aiResponse.match(/\[[\s\S]*\]/);
                if (arrayMatch) {
                    try {
                        events = JSON.parse(arrayMatch[0])
                        console.log('✅ Parsed array directly:', events.length, 'events')
                    } catch (arrayError) {
                        console.log('❌ Array parsing failed:', arrayError.message)
                    }
                }
            }
        }

        // Validate and clean events
        const validEvents = events.filter(event => {
            return event &&
                event.date &&
                event.title &&
                event.type &&
                event.date.match(/\d{4}-\d{2}-\d{2}/)
        }).map((event, index) => ({
            id: index + 1,
            date: event.date,
            title: event.title.substring(0, 100), // Limit title length
            type: event.type.toLowerCase(),
            description: event.description || ''
        }))

        console.log('📅 Final valid events:', validEvents.length)

        if (validEvents.length === 0) {
            console.log('⚠️ No valid events found, providing fallback')
            // Provide meaningful fallback
            validEvents.push({
                id: 1,
                date: "2024-09-05",
                title: "Unable to parse syllabus automatically",
                type: "other",
                description: "AI parsing failed. Please try copying and pasting the text directly or check the PDF format."
            })
        }

        return NextResponse.json({
            success: true,
            events: validEvents,
            method: 'ai_parsing',
            aiResponse: aiResponse.substring(0, 1000),
            originalTextLength: textToProcess.length
        })

    } catch (error) {
        console.error('❌ Processing error:', error)

        // Provide helpful error messages
        let errorMessage = 'Error processing syllabus'
        if (error.message?.includes('429')) {
            errorMessage = 'OpenAI rate limit exceeded. Please wait a moment and try again.'
        } else if (error.message?.includes('401')) {
            errorMessage = 'OpenAI API key invalid. Please check your configuration.'
        } else if (error.message?.includes('insufficient_quota')) {
            errorMessage = 'OpenAI quota exceeded. Please check your billing.'
        }

        return NextResponse.json(
            { error: errorMessage, details: error.message },
            { status: 500 }
        )
    }
}