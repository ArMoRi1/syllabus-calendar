// src/app/lib/pdfExtractor.ts

// ВАЖЛИВО: Обхід багу pdf-parse з тестовим файлом
async function extractWithPdfParse(buffer: Buffer): Promise<string> {
    try {
        console.log('🔄 Using pdf-parse with workaround...')

        // Створюємо фейковий файл щоб обійти баг
        const fs = require('fs')
        const path = require('path')

        // Створюємо директорії якщо їх немає
        const testDir = path.join(process.cwd(), 'test', 'data')
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true })
        }

        // Створюємо фейковий файл який pdf-parse очікує
        const testFile = path.join(testDir, '05-versions-space.pdf')
        if (!fs.existsSync(testFile)) {
            // Записуємо мінімальний валідний PDF
            const minimalPDF = Buffer.from('%PDF-1.4\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n3 0 obj\n<</Type/Page/Parent 2 0 R/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>/MediaBox[0 0 612 792]/Contents 4 0 R>>\nendobj\n4 0 obj\n<</Length 44>>\nstream\nBT /F1 12 Tf 100 700 Td (Test) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000274 00000 n\ntrailer\n<</Size 5/Root 1 0 R>>\nstartxref\n366\n%%EOF', 'latin1')
            fs.writeFileSync(testFile, minimalPDF)
            console.log('✅ Created workaround file')
        }

        // Тепер імпортуємо pdf-parse
        const pdfParse = require('pdf-parse')

        // Парсимо наш реальний PDF
        const data = await pdfParse(buffer)

        console.log(`✅ pdf-parse successful!`)
        console.log(`📄 Pages: ${data.numpages}`)
        console.log(`📏 Text length: ${data.text.length}`)

        return data.text

    } catch (error) {
        console.error('❌ pdf-parse with workaround failed:', error)
        throw error
    }
}

// Альтернативний метод: витягування тексту безпосередньо з буфера
function extractRawText(buffer: Buffer): string {
    console.log('🔄 Extracting raw text from buffer...')

    const content = buffer.toString('binary')
    const textParts: string[] = []

    // Метод 1: Шукаємо текст між BT та ET (PDF text blocks)
    const btEtRegex = /BT([\s\S]*?)ET/g
    let match

    while ((match = btEtRegex.exec(content)) !== null) {
        const block = match[1]

        // Витягуємо текст з Tj операторів (звичайний текст)
        const tjRegex = /\(((?:[^\\()]|\\.)*)\)\s*Tj/g
        let tjMatch

        while ((tjMatch = tjRegex.exec(block)) !== null) {
            let text = tjMatch[1]

            // Декодуємо escape sequences
            text = text
                .replace(/\\n/g, ' ')
                .replace(/\\r/g, ' ')
                .replace(/\\t/g, ' ')
                .replace(/\\\(/g, '(')
                .replace(/\\\)/g, ')')
                .replace(/\\\\/g, '\\')

            // Чистимо від спеціальних символів
            text = text.replace(/[\x00-\x1F\x7F-\xFF]/g, ' ')

            if (text.trim().length > 0) {
                textParts.push(text.trim())
            }
        }

        // Витягуємо текст з TJ операторів (масиви тексту)
        const tjArrayRegex = /\[(.*?)\]\s*TJ/g
        let tjArrayMatch

        while ((tjArrayMatch = tjArrayRegex.exec(block)) !== null) {
            const arrayContent = tjArrayMatch[1]

            // Витягуємо всі рядки в дужках
            const stringRegex = /\(((?:[^\\()]|\\.)*)\)/g
            let stringMatch

            while ((stringMatch = stringRegex.exec(arrayContent)) !== null) {
                let text = stringMatch[1]

                text = text
                    .replace(/\\n/g, ' ')
                    .replace(/\\r/g, ' ')
                    .replace(/\\t/g, ' ')
                    .replace(/\\\(/g, '(')
                    .replace(/\\\)/g, ')')
                    .replace(/\\\\/g, '\\')
                    .replace(/[\x00-\x1F\x7F-\xFF]/g, ' ')

                if (text.trim().length > 0) {
                    textParts.push(text.trim())
                }
            }
        }
    }

    // Метод 2: Пошук тексту в stream об'єктах
    const streamRegex = /stream([\s\S]*?)endstream/g

    while ((match = streamRegex.exec(content)) !== null) {
        const streamContent = match[1]

        // Очищаємо і шукаємо читабельний текст
        const cleanedStream = streamContent
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ')  // Тільки друковані ASCII
            .replace(/\s+/g, ' ')
            .trim()

        // Перевіряємо чи це текст (має містити слова)
        const words = cleanedStream.match(/[a-zA-Z]{3,}/g) || []

        if (words.length > 10 && cleanedStream.length > 50) {
            // Додаємо тільки якщо схоже на реальний текст
            if (!/^[0-9\s\.\-\+]+$/.test(cleanedStream)) { // Не тільки числа
                textParts.push(cleanedStream)
            }
        }
    }

    // Об'єднуємо все знайдене
    let result = textParts.join(' ')

    // Фінальне очищення
    result = result
        .replace(/\s+/g, ' ')           // Нормалізуємо пробіли
        .replace(/([a-z])([A-Z])/g, '$1 $2')  // Розділяємо CamelCase
        .trim()

    console.log(`📏 Raw extraction found: ${result.length} characters`)

    // Якщо текст занадто короткий, робимо агресивніший пошук
    if (result.length < 500) {
        console.log('⚠️ Text too short, trying aggressive search...')

        // Шукаємо будь-які послідовності читабельного тексту
        const allText = content
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
            .replace(/\s+/g, ' ')

        // Розбиваємо на частини і фільтруємо
        const chunks = allText.split(/\s{2,}/)
        const validChunks = chunks.filter(chunk => {
            const words = chunk.match(/[a-zA-Z]{3,}/g) || []
            return words.length > 3 && chunk.length > 20
        })

        const aggressiveResult = validChunks.join(' ').substring(0, 100000)

        if (aggressiveResult.length > result.length) {
            result = aggressiveResult
            console.log(`📏 Aggressive search found: ${result.length} characters`)
        }
    }

    return result
}

// ГОЛОВНА ФУНКЦІЯ
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    console.log('📱 Starting PDF text extraction...')
    console.log(`📊 Buffer size: ${buffer.length} bytes (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`)

    // Валідація буфера
    if (!buffer || buffer.length === 0) {
        throw new Error('Empty PDF buffer')
    }

    // Перевірка PDF підпису
    const header = buffer.toString('ascii', 0, 8)
    console.log(`🔍 PDF header: "${header}"`)

    if (!header.startsWith('%PDF')) {
        throw new Error('Invalid PDF file - not a PDF document')
    }

    let bestResult = ''
    const errors: string[] = []

    // Спробуємо різні методи
    const methods = [
        {
            name: 'pdf-parse-workaround',
            func: () => extractWithPdfParse(buffer)
        },
        {
            name: 'raw-text-extraction',
            func: () => extractRawText(buffer)
        }
    ]

    for (const method of methods) {
        try {
            console.log(`\n🎯 Trying method: ${method.name}`)

            const text = await method.func()

            // Валідація результату
            if (text && text.length > 50) {
                // Очищаємо текст
                const cleaned = text
                    .replace(/\r\n/g, '\n')
                    .replace(/\n{3,}/g, '\n\n')
                    .replace(/\s+/g, ' ')
                    .trim()

                // Зберігаємо найдовший результат
                if (cleaned.length > bestResult.length) {
                    bestResult = cleaned

                    // Перевіряємо якість тексту
                    const hasWords = (cleaned.match(/[a-zA-Z]{3,}/g) || []).length > 20
                    const hasDatePattern = /\d{4}|\d{1,2}\/\d{1,2}|January|February|March|April|May|June|July|August|September|October|November|December/i.test(cleaned)

                    // Якщо текст виглядає добре - повертаємо
                    if (cleaned.length > 200 && hasWords) {
                        console.log(`✅ Successfully extracted ${cleaned.length} characters using ${method.name}`)
                        console.log(`📝 Preview: "${cleaned.substring(0, 300)}..."`)

                        if (!hasDatePattern) {
                            console.warn('⚠️ Warning: No dates found in text')
                        }

                        return cleaned
                    }
                }
            }

        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error)
            console.error(`❌ Method ${method.name} failed: ${msg}`)
            errors.push(`${method.name}: ${msg}`)
        }
    }

    // Повертаємо найкращий результат якщо є
    if (bestResult.length > 100) {
        console.warn('⚠️ Partial extraction successful')
        console.warn('⚠️ Text quality may be poor. Consider copying text manually.')
        return bestResult
    }

    // Якщо всі методи не спрацювали
    throw new Error(
        `Could not extract readable text from PDF.\n` +
        `Tried methods: ${errors.join('; ')}\n` +
        `This PDF might be: 1) Scanned image (needs OCR), 2) Encrypted, 3) Using embedded fonts.\n` +
        `Please copy and paste the text manually into the text field.`
    )
}