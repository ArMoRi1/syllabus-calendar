// src/app/lib/pdfExtractor.ts

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Налаштування PDF.js для роботи в Node.js середовищі
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface PDFExtractionResult {
    text: string;
    pages: number;
    method: string;
}

// Метод 1: Використання PDF.js (найкращий для більшості PDF)
async function extractWithPDFJS(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
        console.log('🔄 Trying PDF.js extraction...');

        const uint8Array = new Uint8Array(buffer);
        const loadingTask = pdfjsLib.getDocument({
            data: uint8Array,
            verbosity: 0, // Відключаємо verbose логування
        });

        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;

        console.log(`📄 PDF has ${numPages} pages`);

        const textParts: string[] = [];

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            try {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();

                const pageText = textContent.items
                    .filter((item: any) => item.str)
                    .map((item: any) => item.str)
                    .join(' ');

                if (pageText.trim()) {
                    textParts.push(pageText);
                }

                console.log(`✅ Page ${pageNum} extracted: ${pageText.length} chars`);
            } catch (pageError) {
                console.warn(`⚠️ Failed to extract page ${pageNum}:`, pageError);
            }
        }

        const fullText = textParts.join('\n\n').trim();

        return {
            text: fullText,
            pages: numPages,
            method: 'PDF.js'
        };

    } catch (error) {
        console.error('❌ PDF.js extraction failed:', error);
        throw error;
    }
}

// Метод 2: Використання pdf-parse з правильним налаштуванням
async function extractWithPdfParse(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
        console.log('🔄 Trying pdf-parse extraction...');

        // Динамічний імпорт pdf-parse
        const pdfParse = await import('pdf-parse');

        const options = {
            // Налаштування для кращого витягування тексту
            normalizeWhitespace: false,
            disableCombineTextItems: false,
        };

        const data = await pdfParse.default(buffer, options);

        console.log(`📄 pdf-parse: ${data.numpages} pages, ${data.text.length} chars`);

        return {
            text: data.text,
            pages: data.numpages,
            method: 'pdf-parse'
        };

    } catch (error) {
        console.error('❌ pdf-parse extraction failed:', error);
        throw error;
    }
}

// Метод 3: Простий regex парсер (fallback)
function extractRawText(buffer: Buffer): PDFExtractionResult {
    console.log('🔄 Using raw text extraction...');

    try {
        const content = buffer.toString('latin1');
        const textParts: string[] = [];

        // Метод 1: BT...ET блоки (найточніший)
        const btEtRegex = /BT\s+([\s\S]*?)\s+ET/gi;
        let match;

        while ((match = btEtRegex.exec(content)) !== null) {
            const block = match[1];

            // Витягуємо текст з різних PDF операторів
            const textOperators = [
                /\(([^)]+)\)\s*Tj/g,           // Простий текст
                /\(([^)]+)\)\s*TJ/g,           // Текст з масивом
                /<([0-9A-Fa-f]+)>\s*Tj/g,     // Hex-encoded текст
            ];

            textOperators.forEach(regex => {
                let textMatch;
                while ((textMatch = regex.exec(block)) !== null) {
                    let text = textMatch[1];

                    // Декодуємо hex якщо потрібно
                    if (regex.source.includes('A-Fa-f')) {
                        try {
                            text = Buffer.from(text, 'hex').toString('utf8');
                        } catch {
                            continue;
                        }
                    }

                    // Очищаємо escape sequences
                    text = text
                        .replace(/\\n/g, '\n')
                        .replace(/\\r/g, '\r')
                        .replace(/\\t/g, '\t')
                        .replace(/\\\(/g, '(')
                        .replace(/\\\)/g, ')')
                        .replace(/\\\\/g, '\\')
                        .trim();

                    if (text.length > 2 && /[a-zA-Z]/.test(text)) {
                        textParts.push(text);
                    }
                }
            });
        }

        // Метод 2: Stream objects з більш агресивним підходом
        if (textParts.length < 10) {
            console.log('⚠️ Few text blocks found, trying stream extraction...');

            const streamRegex = /stream\s*([\s\S]*?)\s*endstream/gi;
            while ((match = streamRegex.exec(content)) !== null) {
                const streamData = match[1];

                // Витягуємо читабельний текст зі stream
                const readableText = streamData
                    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                // Перевіряємо чи це текстовий контент
                const words = (readableText.match(/[a-zA-Z]{2,}/g) || []).length;
                const numbers = (readableText.match(/\d+/g) || []).length;

                if (words > 5 && readableText.length > 30 && words > numbers) {
                    textParts.push(readableText);
                }
            }
        }

        const result = textParts
            .filter(text => text.length > 1)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

        console.log(`📏 Raw extraction: ${result.length} characters`);

        return {
            text: result,
            pages: 1,
            method: 'Raw extraction'
        };

    } catch (error) {
        console.error('❌ Raw extraction failed:', error);
        throw error;
    }
}

// Функція очищення та валідації тексту
function cleanAndValidateText(text: string, method: string): string {
    if (!text || text.length < 10) {
        throw new Error(`${method} returned empty or too short text`);
    }

    // Базове очищення
    let cleaned = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/^\s+|\s+$/g, '');

    // Перевіряємо якість тексту
    const words = (cleaned.match(/[a-zA-Z]{2,}/g) || []).length;
    const hasDatePatterns = /\d{4}|\d{1,2}\/\d{1,2}|january|february|march|april|may|june|july|august|september|october|november|december/i.test(cleaned);

    console.log(`📊 Text quality: ${words} words, dates: ${hasDatePatterns}`);

    if (words < 20) {
        throw new Error(`Text quality too low: only ${words} words found`);
    }

    if (!hasDatePatterns) {
        console.warn('⚠️ No date patterns found in text - might be problematic for syllabus parsing');
    }

    return cleaned;
}

// ГОЛОВНА ФУНКЦІЯ
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    console.log('📱 Starting PDF text extraction...');
    console.log(`📊 Buffer: ${buffer.length} bytes (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

    // Валідація
    if (!buffer || buffer.length === 0) {
        throw new Error('Empty PDF buffer provided');
    }

    if (buffer.length > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('PDF file too large (>50MB). Please use a smaller file.');
    }

    // Перевірка PDF підпису
    const header = buffer.toString('ascii', 0, 8);
    if (!header.startsWith('%PDF')) {
        throw new Error('Invalid file format - not a PDF document');
    }

    console.log(`🔍 PDF version: ${header}`);

    // Спробуємо різні методи витягування тексту
    const methods = [
        {
            name: 'PDF.js',
            extract: () => extractWithPDFJS(buffer)
        },
        {
            name: 'pdf-parse',
            extract: () => extractWithPdfParse(buffer)
        },
        {
            name: 'Raw extraction',
            extract: () => extractRawText(buffer)
        }
    ];

    const results: Array<{ result: PDFExtractionResult; error?: Error }> = [];

    // Пробуємо кожний метод
    for (const method of methods) {
        try {
            console.log(`\n🎯 Trying ${method.name}...`);
            const result = await method.extract();

            if (result.text && result.text.length > 50) {
                results.push({ result });
                console.log(`✅ ${method.name} success: ${result.text.length} chars`);
            } else {
                console.log(`⚠️ ${method.name} returned insufficient text`);
            }

        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            results.push({ result: { text: '', pages: 0, method: method.name }, error: err });
            console.error(`❌ ${method.name} failed:`, err.message);
        }
    }

    // Вибираємо найкращий результат
    const successful = results.filter(r => r.result.text.length > 50 && !r.error);

    if (successful.length === 0) {
        const errors = results.map(r => r.error?.message || 'Unknown error').join('; ');
        throw new Error(
            `Could not extract text from PDF using any method.\n` +
            `Errors: ${errors}\n\n` +
            `Possible solutions:\n` +
            `1. Try copying and pasting text manually\n` +
            `2. Convert PDF to text using online tools\n` +
            `3. Use a different PDF file\n` +
            `4. Check if PDF is password protected or contains only images`
        );
    }

    // Сортуємо за довжиною тексту (більше = краще)
    successful.sort((a, b) => b.result.text.length - a.result.text.length);
    const best = successful[0].result;

    console.log(`🏆 Best result: ${best.method} with ${best.text.length} characters`);

    // Очищаємо та валідуємо
    const cleanedText = cleanAndValidateText(best.text, best.method);

    // Логування для дебагу
    console.log(`✅ Final text: ${cleanedText.length} characters`);
    console.log(`📝 Preview: "${cleanedText.substring(0, 200)}..."`);

    return cleanedText;
}