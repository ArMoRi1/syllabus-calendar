// src/app/lib/openaiAnalyzer.ts

import { OpenAI } from 'openai'

// Функція для визначення типу події з тексту
function determineEventType(text: string): string {
    const lowerText = text.toLowerCase()

    if (lowerText.includes('exam') || lowerText.includes('test') || lowerText.includes('quiz') || lowerText.includes('midterm') || lowerText.includes('final')) {
        return 'exam'
    }
    if (lowerText.includes('assignment') || lowerText.includes('due') || lowerText.includes('submit') || lowerText.includes('complete') || lowerText.includes('writing')) {
        return 'assignment'
    }
    if (lowerText.includes('read') || lowerText.includes('chapter') || lowerText.includes('pages') || lowerText.includes('handbook') || lowerText.includes('bluebook')) {
        return 'reading'
    }
    if (lowerText.includes('presentation') || lowerText.includes('oral') || lowerText.includes('class') || lowerText.includes('lecture') || lowerText.includes('meeting')) {
        return 'class'
    }
    return 'other'
}

// Функція для очищення та підготовки тексту
function preprocessText(text: string): string {
    console.log('🧹 Preprocessing text...')

    // Видаляємо явний "шум"
    let cleaned = text
        .split('\n')
        .map(line => {
            const specialCharsCount = (line.match(/[^\x20-\x7E]/g) || []).length
            const totalChars = line.length

            if (totalChars > 0 && specialCharsCount / totalChars > 0.3) {
                return ''
            }

            return line.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        })
        .filter(line => line.trim().length > 0)
        .join('\n')

    // Шукаємо початок силабусу
    const syllabusMarkers = [
        'syllabus',
        'course outline',
        'course schedule',
        'week',
        'date',
        'assignments',
        'schedule',
        'calendar'
    ]

    let syllabusStartIndex = -1
    const lowerText = cleaned.toLowerCase()

    for (const marker of syllabusMarkers) {
        const index = lowerText.indexOf(marker)
        if (index !== -1 && (syllabusStartIndex === -1 || index < syllabusStartIndex)) {
            syllabusStartIndex = index
        }
    }

    if (syllabusStartIndex > 0 && syllabusStartIndex < 5000) {
        console.log(`✂️ Cutting first ${syllabusStartIndex} characters of noise`)
        cleaned = cleaned.substring(syllabusStartIndex)
    }

    return cleaned
}

// Основна функція аналізу
export async function analyzeTextWithOpenAI(rawText: string) {
    const text = preprocessText(rawText)

    if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY is not configured')
        return extractDatesWithRegex(text)
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    })

    // НОВИЙ ПОКРАЩЕНИЙ ПРОМПТ
    const systemPrompt = `You are an expert at extracting academic events from course syllabi, especially from tables and structured lists.

CRITICAL PARSING RULES:

1. TABLE STRUCTURE:
   - "Week" column = week number (use it for context)
   - "Date" column = the date for ALL items in that row
   - "Assignments/Readings" column = list of tasks for that date

2. BULLET POINTS = SEPARATE EVENTS:
   - EACH bullet point (•, -, *, etc.) is a SEPARATE event
   - If there are 4 bullet points for February 7, create 4 SEPARATE events all dated February 7
   - Never combine multiple bullet points into one event

3. EVENT TYPES:
   - "Read:" or "Reading:" → type: "reading"
   - "Writing Assignment Due:", "Complete:", "Submit:" → type: "assignment"  
   - "Exam:", "Test:", "Quiz:", "Midterm:", "Final:" → type: "exam"
   - "Oral arguments:", "Presentation:" → type: "class"
   - "Optional:", "Meeting:", "Office hours:" → type: "other"

4. DATE HANDLING:
   - If only month/day given: Sept-Dec = 2024, Jan-May = 2025
   - Current context: Spring 2025 semester
   - One date applies to ALL bullets/items in that section

5. TITLE EXTRACTION:
   - Remove prefixes like "Read:", "Complete:", "Due:"
   - Keep specific details (chapter numbers, page ranges, assignment names)
   - Be descriptive but concise

EXAMPLE:
If you see:
"February 7:
• Read: Handbook Chapter 39, pages 347-61
• Read: Understanding the Bluebook Chapter 8
• Writing Assignment Due: Motion
• Optional: Podcast 4"

You must create 4 SEPARATE events:
1. {"title": "Handbook Chapter 39, pages 347-61", "date": "2025-02-07", "type": "reading"}
2. {"title": "Understanding the Bluebook Chapter 8", "date": "2025-02-07", "type": "reading"}
3. {"title": "Motion", "date": "2025-02-07", "type": "assignment"}
4. {"title": "Podcast 4", "date": "2025-02-07", "type": "other"}

RESPONSE FORMAT:
{
  "events": [
    {"title": "Event Name", "date": "YYYY-MM-DD", "type": "category", "description": "optional"}
  ]
}`

    const userPrompt = `Extract ALL events from this syllabus. 
REMEMBER: Each bullet point or list item is a SEPARATE event!
If February 7 has 4 bullets, create 4 events for February 7.

SYLLABUS TEXT:
${text.substring(0, 8000)}`

    try {
        console.log('🤖 Calling OpenAI API...')

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', // або 'gpt-4' для кращої якості
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
            max_tokens: 3000, // Збільшено для більшої кількості подій
            response_format: { type: "json_object" }
        })

        const content = response.choices[0]?.message?.content
        console.log('OpenAI raw response:', content?.substring(0, 500))

        if (!content) {
            throw new Error('Empty response from OpenAI')
        }

        const parsedData = JSON.parse(content.trim())
        let events = parsedData.events || []

        // Постпроцесинг: додаткова валідація та очищення
        events = events.map((event: any) => {
            // Очищаємо назву від префіксів
            let title = event.title || ''
            title = title
                .replace(/^(Read:|Reading:|Complete:|Due:|Submit:|Optional:)\s*/i, '')
                .replace(/^•\s*/, '')
                .replace(/^-\s*/, '')
                .replace(/^\*\s*/, '')
                .replace(/^\d+\.\s*/, '')
                .trim()

            // Якщо тип не визначено правильно, спробуємо ще раз
            if (event.type === 'other' || !event.type) {
                event.type = determineEventType(event.title + ' ' + (event.description || ''))
            }

            return {
                ...event,
                title: title
            }
        })

        // Фільтруємо невалідні події
        events = events.filter((event: any) => {
            if (!event.date) return false

            const date = new Date(event.date)
            if (isNaN(date.getTime())) return false

            const year = date.getFullYear()
            if (year < 2024 || year > 2026) return false

            if (!event.title || event.title.length < 3) return false

            return true
        })

        console.log(`✅ Successfully extracted ${events.length} events`)

        // Групуємо за датою для діагностики
        const eventsByDate: {[key: string]: number} = {}
        events.forEach((event: any) => {
            eventsByDate[event.date] = (eventsByDate[event.date] || 0) + 1
        })
        console.log('📅 Events per date:', eventsByDate)

        return events

    } catch (error) {
        console.error('OpenAI analysis failed:', error)
        console.log('Trying enhanced fallback extraction...')
        return enhancedRegexExtraction(text)
    }
}

// Покращена regex екстракція для таблиць
function enhancedRegexExtraction(text: string): any[] {
    console.log('🔍 Using enhanced regex extraction...')

    const events: any[] = []
    const lines = text.split('\n')

    let currentDate = ''
    let currentWeek = ''
    let isNoClass = false

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Шукаємо дату (навіть якщо там є "NO CLASS")
        const dateMatch = line.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\b/i)
        if (dateMatch) {
            const month = dateMatch[1]
            const day = dateMatch[2]
            const monthNum = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
                .indexOf(month.toLowerCase()) + 1

            // Визначаємо рік
            const year = monthNum >= 9 ? 2024 : 2025
            currentDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`

            // Перевіряємо чи це "NO CLASS"
            isNoClass = line.toLowerCase().includes('no class')

            console.log(`📅 Found date: ${currentDate}${isNoClass ? ' (NO CLASS)' : ''}`)
        }

        // Якщо є поточна дата, шукаємо події (навіть для NO CLASS днів)
        if (currentDate) {
            // Шукаємо bullet points або нумеровані списки
            const bulletMatch = line.match(/^[•\-\*]\s*(.+)/) ||
                line.match(/^\d+\.\s*(.+)/) ||
                (line.includes('Read:') || line.includes('Complete:') || line.includes('Due:') ? [null, line] : null)

            if (bulletMatch) {
                const eventText = bulletMatch[1] || line

                // Очищаємо текст (видаляємо "NO CLASS" з назви)
                let title = eventText
                    .replace(/^(Read:|Reading:|Complete:|Due:|Submit:|Optional:|Writing Assignment Due:)\s*/i, '')
                    .replace(/\bNO CLASS\b/gi, '')
                    .trim()

                if (title.length > 3) {
                    const eventType = determineEventType(eventText)

                    events.push({
                        title: title.substring(0, 200),
                        date: currentDate,
                        type: eventType,
                        description: isNoClass ? 'No class meeting, but assignment due' : ''
                    })

                    console.log(`  → Added ${eventType}: ${title.substring(0, 50)}...${isNoClass ? ' (NO CLASS day)' : ''}`)
                }
            }
        }
    }

    console.log(`📊 Enhanced regex extracted ${events.length} events`)
    return events
}

// Стара regex функція (fallback)
function extractDatesWithRegex(text: string): any[] {
    const events = []
    const lines = text.split('\n')

    const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
    ]

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const lowerLine = line.toLowerCase()

        let dateMatch = null
        let dateStr = ''

        // Формат: January 15, 2025 або January 15
        const monthDayYear = new RegExp(`(${monthNames.join('|')})\\s+(\\d{1,2}),?\\s*(\\d{4})?`, 'i')
        dateMatch = line.match(monthDayYear)
        if (dateMatch) {
            const month = monthNames.indexOf(dateMatch[1].toLowerCase())
            const day = parseInt(dateMatch[2])
            let year = dateMatch[3] ? parseInt(dateMatch[3]) : (month >= 8 ? 2024 : 2025)
            dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        }

        if (dateStr) {
            // Шукаємо всі події для цієї дати в наступних рядках
            for (let j = i; j < Math.min(i + 10, lines.length); j++) {
                const eventLine = lines[j]

                if (eventLine.match(/^[•\-\*]/)) {
                    let title = eventLine.replace(/^[•\-\*]\s*/, '').trim()
                    const eventType = determineEventType(eventLine)

                    if (title.length > 3) {
                        events.push({
                            title: title.substring(0, 100),
                            date: dateStr,
                            type: eventType,
                            description: ''
                        })
                    }
                }
            }
        }
    }

    console.log(`📊 Basic regex extracted ${events.length} events`)
    return events
}