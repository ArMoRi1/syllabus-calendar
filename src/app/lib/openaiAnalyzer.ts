// src/app/lib/openaiAnalyzer.ts

import { OpenAI } from 'openai'

// Покращений fallback regex екстрактор
function extractDatesWithRegex(text: string): any[] {
    console.log('🔍 Using regex fallback extraction...');
    const events = [];
    const lines = text.split(/[\n\r]+/);

    // Більш широкі паттерни для дат
    const datePatterns = [
        // Повні дати з роками
        /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}/gi,
        /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}/gi,
        // Дати без року (припускаємо 2024-2025 навчальний рік)
        /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?/gi,
        /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2}(?:st|nd|rd|th)?/gi,
        // Числові формати
        /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
        /\d{4}-\d{2}-\d{2}/g,
        /\d{1,2}\/\d{1,2}/g, // MM/DD без року
    ];

    const eventKeywords = {
        exam: ['exam', 'test', 'quiz', 'midterm', 'final', 'assessment', 'evaluation'],
        assignment: ['assignment', 'homework', 'hw', 'project', 'paper', 'essay', 'due', 'submit', 'submission', 'report'],
        reading: ['reading', 'read', 'chapter', 'ch.', 'ch', 'pages', 'pp.', 'book', 'article'],
        class: ['class', 'lecture', 'session', 'meeting', 'seminar', 'workshop', 'discussion'],
        other: ['deadline', 'event', 'activity', 'presentation', 'conference', 'break', 'holiday', 'no class']
    };

    function parseDate(dateStr: string): Date | null {
        const currentYear = new Date().getFullYear();

        // Спробуємо стандартний парсінг
        let date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date;
        }

        // Якщо немає року, додаємо його
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'];

        const lowerDateStr = dateStr.toLowerCase();

        for (let i = 0; i < monthNames.length; i++) {
            if (lowerDateStr.includes(monthNames[i])) {
                const dayMatch = dateStr.match(/\d{1,2}/);
                if (dayMatch) {
                    const month = i;
                    const day = parseInt(dayMatch[0]);

                    // Визначаємо рік: вересень-грудень = поточний рік, січень-травень = наступний рік
                    let year = currentYear;
                    if (month >= 0 && month <= 4) { // січень-травень
                        year = currentYear + 1;
                    }

                    date = new Date(year, month, day);
                    if (!isNaN(date.getTime())) {
                        return date;
                    }
                }
                break;
            }
        }

        return null;
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length < 5) continue; // Пропускаємо короткі рядки

        for (const pattern of datePatterns) {
            const matches = Array.from(line.matchAll(pattern));

            for (const match of matches) {
                const dateStr = match[0];
                const date = parseDate(dateStr);

                if (date && !isNaN(date.getTime())) {
                    // Визначаємо тип події
                    let eventType = 'other';
                    const lowerLine = line.toLowerCase();

                    for (const [type, keywords] of Object.entries(eventKeywords)) {
                        if (keywords.some(keyword => lowerLine.includes(keyword.toLowerCase()))) {
                            eventType = type;
                            break;
                        }
                    }

                    // Витягуємо назву події
                    const beforeDate = line.substring(0, match.index).trim();
                    const afterDate = line.substring(match.index! + match[0].length).trim();

                    let title = '';
                    if (beforeDate.length > 10) {
                        title = beforeDate;
                    } else if (afterDate.length > 10) {
                        title = afterDate;
                    } else {
                        title = `${beforeDate} ${afterDate}`.trim();
                    }

                    // Очищаємо назву
                    title = title
                        .replace(/^\W+|\W+$/g, '') // Прибираємо спеціальні символи з початку/кінця
                        .replace(/\s+/g, ' ')
                        .substring(0, 150); // Обмежуємо довжину

                    if (title.length > 3) {
                        events.push({
                            title,
                            date: date.toISOString().split('T')[0],
                            type: eventType,
                            description: line.length > 50 ? line.substring(0, 200) : ''
                        });
                    }
                }
            }
        }
    }

    console.log(`📅 Regex extraction found ${events.length} events`);
    return events;
}

// Головна функція аналізу з OpenAI
export async function analyzeTextWithOpenAI(text: string) {
    console.log(`🤖 Starting OpenAI analysis of ${text.length} characters`);

    if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️ OPENAI_API_KEY not configured, using regex fallback');
        return extractDatesWithRegex(text);
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    // ПОКРАЩЕНИЙ СИСТЕМНИЙ ПРОМПТ БЕЗ ЛІМІТІВ НА ДАТИ
    const systemPrompt = `You are an expert at extracting ALL dates and events from academic syllabi. 

CRITICAL REQUIREMENTS:
1. Extract EVERY date mentioned in the text - do not limit to specific months or ranges
2. Include ALL events from the entire semester/year, not just early months
3. If no year is specified, use these rules:
   - August-December dates: use 2024
   - January-July dates: use 2025
4. Extract ALL types of academic events: exams, assignments, readings, classes, deadlines, breaks, presentations, etc.

You MUST return ONLY a valid JSON object with this exact format:
{
  "events": [
    {
      "title": "Event description", 
      "date": "YYYY-MM-DD", 
      "type": "exam|assignment|reading|class|other",
      "description": "Additional details (optional)"
    }
  ]
}

IMPORTANT: Do not stop at March or any other arbitrary date. Extract ALL dates found in the text regardless of month.`;

    try {
        // Розбиваємо довгий текст на частини якщо потрібно
        const MAX_CHUNK_SIZE = 80000; // Більший розмір для кращого контексту
        const textChunks = [];

        if (text.length > MAX_CHUNK_SIZE) {
            console.log(`📄 Text too long (${text.length}), splitting into chunks...`);

            // Розбиваємо по параграфах/рядках, щоб зберегти контекст
            const paragraphs = text.split(/\n\s*\n/);
            let currentChunk = '';

            for (const paragraph of paragraphs) {
                if ((currentChunk + paragraph).length > MAX_CHUNK_SIZE && currentChunk) {
                    textChunks.push(currentChunk.trim());
                    currentChunk = paragraph;
                } else {
                    currentChunk += '\n\n' + paragraph;
                }
            }

            if (currentChunk.trim()) {
                textChunks.push(currentChunk.trim());
            }
        } else {
            textChunks.push(text);
        }

        console.log(`📄 Processing ${textChunks.length} text chunk(s)`);

        const allEvents = [];

        // Обробляємо кожну частину
        for (let i = 0; i < textChunks.length; i++) {
            const chunk = textChunks[i];
            console.log(`🔄 Processing chunk ${i + 1}/${textChunks.length} (${chunk.length} chars)`);

            const userPrompt = `Extract ALL dates and events from this syllabus text. Pay special attention to dates in ALL months, not just early months:

${chunk}`;

            try {
                const response = await openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.1,
                    max_tokens: 3000, // Збільшуємо для більшої кількості подій
                    response_format: { type: "json_object" }
                });

                const content = response.choices[0]?.message?.content;

                if (content) {
                    const parsedData = JSON.parse(content.trim());

                    if (parsedData.events && Array.isArray(parsedData.events)) {
                        console.log(`✅ Chunk ${i + 1} found ${parsedData.events.length} events`);
                        allEvents.push(...parsedData.events);
                    }
                }
            } catch (chunkError) {
                console.error(`❌ Error processing chunk ${i + 1}:`, chunkError);
            }

            // Невеликий delay між запитами
            if (i < textChunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // Видаляємо дублікати та сортуємо
        const uniqueEvents = [];
        const seen = new Set();

        for (const event of allEvents) {
            const key = `${event.date}-${event.title?.toLowerCase().substring(0, 50)}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueEvents.push(event);
            }
        }

        // Сортуємо по датах
        uniqueEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        console.log(`✅ OpenAI analysis complete: ${uniqueEvents.length} unique events found`);

        // Логуємо діапазон дат для перевірки
        if (uniqueEvents.length > 0) {
            const firstDate = uniqueEvents[0].date;
            const lastDate = uniqueEvents[uniqueEvents.length - 1].date;
            console.log(`📅 Date range: ${firstDate} to ${lastDate}`);
        }

        return uniqueEvents;

    } catch (error) {
        console.error('❌ OpenAI analysis failed:', error);

        // Fallback до regex
        console.log('🔄 Falling back to regex extraction...');
        const fallbackEvents = extractDatesWithRegex(text);

        if (fallbackEvents.length > 0) {
            console.log(`✅ Regex fallback found ${fallbackEvents.length} events`);
            return fallbackEvents;
        }

        console.log('❌ Both OpenAI and regex failed, returning empty array');
        return [];
    }
}