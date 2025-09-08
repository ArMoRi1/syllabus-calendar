// src/app/lib/openaiAnalyzer.ts

import { OpenAI } from 'openai'

// Універсальний regex екстрактор для будь-яких документів
function extractDatesWithRegex(text: string): any[] {
    console.log('🔍 Using regex fallback extraction...');
    const events = [];
    const lines = text.split(/[\n\r]+/);

    // Універсальні паттерни для дат
    const datePatterns = [
        // Повні дати з роками
        /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}/gi,
        /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}/gi,
        // Дати без року
        /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?/gi,
        /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2}(?:st|nd|rd|th)?/gi,
        // Числові формати
        /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
        /\d{4}-\d{2}-\d{2}/g,
        /\d{1,2}\.\d{1,2}\.\d{2,4}/g,
        /\d{1,2}\/\d{1,2}/g,
    ];

    // Універсальні ключові слова для типів подій
    const eventKeywords = {
        meeting: ['meeting', 'call', 'conference', 'discussion', 'interview', 'consultation', 'sync', 'standup', 'session', 'gathering', 'assembly'],
        deadline: ['deadline', 'due', 'submit', 'submission', 'final', 'expires', 'last day', 'cutoff', 'close', 'ends', 'expiry', 'maturity'],
        event: ['event', 'workshop', 'seminar', 'presentation', 'webinar', 'training', 'launch', 'party', 'celebration', 'ceremony', 'show', 'exhibition'],
        appointment: ['appointment', 'visit', 'checkup', 'scheduled', 'booking', 'reservation', 'slot', 'meeting with', 'see', 'consultation'],
        task: ['task', 'action', 'todo', 'work', 'project', 'milestone', 'job', 'activity', 'assignment', 'deliverable', 'complete', 'finish'],
        legal: ['hearing', 'court', 'trial', 'deposition', 'filing', 'motion', 'brief', 'case', 'contract', 'litigation', 'judgment', 'appeal', 'settlement', 'arbitration', 'mediation'],
        other: ['note', 'reminder', 'follow-up', 'check', 'update', 'report', 'analysis', 'review', 'schedule', 'plan']
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

                    // Визначаємо рік: вересень-грудень = поточний рік, січень-серпень = наступний рік
                    let year = currentYear;
                    if (month >= 0 && month <= 7) { // січень-серпень
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
        if (line.length < 5) continue;

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
                        .replace(/^\W+|\W+$/g, '')
                        .replace(/\s+/g, ' ')
                        .substring(0, 150);

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

// Головна функція аналізу з OpenAI - тепер універсальна
export async function analyzeTextWithOpenAI(text: string) {
    console.log(`🤖 Starting OpenAI analysis of ${text.length} characters`);

    if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️ OPENAI_API_KEY not configured, using regex fallback');
        return extractDatesWithRegex(text);
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    // УНІВЕРСАЛЬНИЙ СИСТЕМНИЙ ПРОМПТ ДЛЯ БУДЬ-ЯКИХ ДОКУМЕНТІВ
    const systemPrompt = `You are an expert at extracting ALL dates and events from any type of document - legal documents, contracts, schedules, timelines, project plans, court filings, business agreements, academic syllabi, etc.

CRITICAL REQUIREMENTS:
1. Extract EVERY date mentioned in the text - do not limit to specific months or ranges
2. Include ALL events from the entire document, regardless of time period
3. PRIORITIZE GRANULAR TASKS over general events

ACADEMIC SYLLABUS SPECIFIC - VERY IMPORTANT:
- ALWAYS extract INDIVIDUAL reading assignments, not general "Week X readings"
- BREAK DOWN each week into SEPARATE tasks:
  * Each reading assignment = separate event
  * Each homework = separate event  
  * Each exam/quiz = separate event
  * Each paper/project = separate event
- Example: Instead of "Week 1 Activities", create:
  * "Read: Chapter 1-3, pages 15-45"
  * "Assignment: Motion to Dismiss analysis"
  * "Discussion: Case briefing exercise"

SMART DATE HANDLING:
- If you see "Week 1", "Week 2" etc. WITHOUT specific dates, treat it as an ACADEMIC DOCUMENT
- For academic documents with relative weeks: 
  * If current month is Aug-Dec: assume Fall semester, Week 1 = early September
  * If current month is Jan-May: assume Spring semester, Week 1 = mid January  
  * If current month is Jun-Jul: assume Summer session, Week 1 = early June
- For absolute dates without year: Sep-Dec = current year, Jan-Aug = next year
- For legal/business documents: infer from context or use current year

EXTRACTION STRATEGY:
1. First scan for all reading assignments, homework, exams, projects
2. Create SEPARATE events for each specific task
3. Assign appropriate dates based on week structure
4. Use descriptive titles that include specific content (page numbers, chapter names, case names)

For each event found, return a JSON object with:
- title: SPECIFIC, descriptive name (include page numbers, chapters, case names)
- date: YYYY-MM-DD format (calculate real dates for Week X)
- type: one of [meeting, deadline, event, appointment, task, legal, other]
- description: additional context or details about the specific assignment

Return ONLY valid JSON in this exact format:
{"events": [{"title": "Read: Handbook Chapters 25-28, pages 181-206", "date": "2025-01-17", "type": "task", "description": "Reading assignment for Legal Writing course"}]}`;

    try {
        // Розбиваємо довгий текст на частини якщо потрібно
        const MAX_CHUNK_SIZE = 80000;
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

            // Аналізуємо структуру документа для кращого контексту
            const hasLegalTerms = /court|hearing|trial|motion|brief|contract|agreement|settlement/i.test(chunk);
            const hasBusinessTerms = /meeting|deadline|milestone|deliverable|payment|invoice/i.test(chunk);
            const hasAcademicTerms = /assignment|exam|quiz|lecture|reading|chapter/i.test(chunk);

            let contextHint = '';
            if (hasLegalTerms) contextHint = 'This appears to be a legal document. ';
            else if (hasBusinessTerms) contextHint = 'This appears to be a business document. ';
            else if (hasAcademicTerms) contextHint = 'This appears to be an academic document. ';

            const userPrompt = `${contextHint}Extract ALL dates and events from this document. IMPORTANT - Focus on GRANULAR, SPECIFIC tasks:

                    PRIORITIZE:
                    - Individual reading assignments with specific pages/chapters
                    - Specific homework assignments by name
                    - Individual exams, quizzes, projects
                    - Specific case studies or legal documents to review
                    
                    AVOID:
                    - General "Week X activities" 
                    - Vague "class preparation"
                    - Generic "readings" without specifics
                    
                    Break down weekly schedules into SEPARATE events for each specific task.
                    
                    Document text:
                    ${chunk}`;

            try {
                const response = await openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.1,
                    max_tokens: 3000,
                    response_format: { type: "json_object" }
                });

                const content = response.choices[0]?.message?.content;

                if (content) {
                    const parsedData = JSON.parse(content.trim());

                    if (parsedData.events && Array.isArray(parsedData.events)) {
                        console.log(`✅ Chunk ${i + 1} found ${parsedData.events.length} events`);

                        // Додаємо події та намагаємось зберегти оригінальні назви
                        parsedData.events.forEach((event: any) => {
                            // Нормалізуємо тип події
                            const validTypes = ['meeting', 'deadline', 'event', 'appointment', 'task', 'legal', 'other'];
                            if (!validTypes.includes(event.type)) {
                                event.type = 'other';
                            }

                            allEvents.push(event);
                        });
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

        // Логуємо діапазон дат та типи подій для перевірки
        if (uniqueEvents.length > 0) {
            const firstDate = uniqueEvents[0].date;
            const lastDate = uniqueEvents[uniqueEvents.length - 1].date;
            console.log(`📅 Date range: ${firstDate} to ${lastDate}`);

            const typeCounts = uniqueEvents.reduce((acc, event) => {
                acc[event.type] = (acc[event.type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            console.log(`📊 Event types:`, typeCounts);
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