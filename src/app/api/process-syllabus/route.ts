// src/app/api/process-syllabus/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF } from '../../lib/pdfExtractor';
import { analyzeTextWithOpenAI } from '../../lib/openaiAnalyzer';

// Інтерфейс для відповіді API
interface APIResponse {
    success: boolean;
    events?: any[];
    error?: string;
    debug?: {
        textLength: number;
        eventsFound: number;
        processingMethod?: string;
        fileSize?: number;
    };
    details?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    console.log('=== 🚀 Starting syllabus processing ===');

    try {
        const formData = await request.formData();
        let textToAnalyze = '';
        let processingMethod = '';
        let fileSize = 0;

        // Перевіряємо чи є ручний текст
        const manualText = formData.get('manualText') as string;
        if (manualText?.trim() && manualText.length > 20) {
            textToAnalyze = manualText.trim();
            processingMethod = 'manual-input';
            console.log('✅ Using manual text input');
            console.log(`📏 Manual text length: ${textToAnalyze.length} chars`);
        } else {
            // Обробляємо PDF файл
            const file = formData.get('file') as File;

            if (!file) {
                return NextResponse.json({
                    success: false,
                    error: 'Будь ласка, завантажте PDF файл або введіть текст вручну'
                } as APIResponse);
            }

            fileSize = file.size;
            processingMethod = 'pdf-extraction';

            console.log(`📁 Processing file: ${file.name}`);
            console.log(`📊 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`📄 File type: ${file.type}`);

            // Валідація файлу
            if (!file.name.toLowerCase().endsWith('.pdf')) {
                return NextResponse.json({
                    success: false,
                    error: 'Будь ласка, завантажте файл формату PDF'
                } as APIResponse);
            }

            if (fileSize > 50 * 1024 * 1024) { // 50MB limit
                return NextResponse.json({
                    success: false,
                    error: 'Файл занадто великий (більше 50MB). Спробуйте менший файл.'
                } as APIResponse);
            }

            // Конвертуємо File в Buffer
            console.log('🔄 Converting file to buffer...');
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Витягуємо текст з PDF
            try {
                console.log('🔍 Extracting text from PDF...');
                textToAnalyze = await extractTextFromPDF(buffer);

                if (!textToAnalyze || textToAnalyze.length < 50) {
                    throw new Error('PDF не містить достатньо тексту для обробки');
                }

                console.log(`✅ PDF text extraction successful!`);
                console.log(`📏 Extracted text length: ${textToAnalyze.length} chars`);

            } catch (extractError) {
                console.error('❌ PDF extraction failed:', extractError);

                const errorMessage = extractError instanceof Error
                    ? extractError.message
                    : 'Невідома помилка витягування тексту';

                return NextResponse.json({
                    success: false,
                    error: `Помилка обробки PDF: ${errorMessage}`,
                    details: 'Спробуйте скопіювати текст силабусу вручну у текстове поле.'
                } as APIResponse);
            }
        }

        // Перевіряємо довжину тексту
        if (textToAnalyze.length < 50) {
            return NextResponse.json({
                success: false,
                error: `Текст занадто короткий для аналізу (${textToAnalyze.length} символів). Потрібно мінімум 50 символів.`
            } as APIResponse);
        }

        // Обрізаємо текст якщо він занадто довгий для OpenAI
        const MAX_TEXT_LENGTH = 100000; // 100k chars should be safe
        if (textToAnalyze.length > MAX_TEXT_LENGTH) {
            console.log(`⚠️ Text too long (${textToAnalyze.length}), truncating to ${MAX_TEXT_LENGTH}`);
            textToAnalyze = textToAnalyze.substring(0, MAX_TEXT_LENGTH);
        }

        console.log('🤖 Analyzing text with AI...');
        console.log(`📝 Text preview: "${textToAnalyze.substring(0, 150)}..."`);

        // Аналізуємо текст за допомогою OpenAI
        const events = await analyzeTextWithOpenAI(textToAnalyze);

        console.log(`✅ AI analysis complete`);
        console.log(`📅 Raw events found: ${events.length}`);

        // Валідуємо та очищаємо події
        const validEvents = events
            .filter((event, index) => {
                const isValid = event.title && event.date && event.type;
                if (!isValid) {
                    console.log(`⚠️ Filtering invalid event at index ${index}:`, event);
                }
                return isValid;
            })
            .map((event, index) => ({
                id: index + 1,
                title: event.title.trim(),
                date: event.date.split('T')[0], // Ensure YYYY-MM-DD format
                type: event.type.toLowerCase(),
                description: event.description?.trim() || ''
            }))
            .filter(event => {
                // Додаткова валідація дати
                const dateObj = new Date(event.date);
                const isValidDate = !isNaN(dateObj.getTime());
                if (!isValidDate) {
                    console.log(`⚠️ Filtering event with invalid date: ${event.date}`);
                }
                return isValidDate;
            });

        console.log(`✅ Processing complete!`);
        console.log(`📊 Valid events: ${validEvents.length}`);

        // Логуємо перші кілька подій для дебагу
        if (validEvents.length > 0) {
            console.log('📅 Sample events:');
            validEvents.slice(0, 3).forEach((event, i) => {
                console.log(`   ${i + 1}. ${event.date} - ${event.type} - ${event.title.substring(0, 50)}`);
            });
        }

        return NextResponse.json({
            success: true,
            events: validEvents,
            debug: {
                textLength: textToAnalyze.length,
                eventsFound: validEvents.length,
                processingMethod,
                fileSize
            }
        } as APIResponse);

    } catch (error) {
        console.error('💥 API Error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';

        return NextResponse.json({
            success: false,
            error: `Помилка обробки: ${errorMessage}`,
            details: 'Спробуйте ще раз або введіть текст вручну.'
        } as APIResponse);
    }
}