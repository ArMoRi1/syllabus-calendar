// src/lib/pdfExtractor.ts

// Function to extract text from PDF using pdf-parse
async function extractTextWithPdfParse(buffer: Buffer) {
    try {
        const pdfParse = await import('pdf-parse')
        const data = await pdfParse.default(buffer)
        return data.text
    } catch (error) {
        console.error('pdf-parse extraction failed:', error)
        throw error
    }
}

// Alternative extraction with pdfjs-dist
async function extractTextWithPdfJs(buffer: Buffer) {
    try {
        const pdfjsLib = await import('pdfjs-dist')
        const pdfWorker = await import('pdfjs-dist/build/pdf.worker.entry')
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(buffer),
            useSystemFonts: true,
        })

        const pdfDoc = await loadingTask.promise
        let fullText = ''

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            try {
                const page = await pdfDoc.getPage(pageNum)
                const textContent = await page.getTextContent()

                const pageText = textContent.items
                    .map((item: any) => {
                        if ('str' in item) {
                            return item.str
                        }
                        return ''
                    })
                    .filter(text => text.length > 0)
                    .join(' ')

                fullText += pageText + '\n'
            } catch (pageError) {
                console.error(`Error processing page ${pageNum}:`, pageError)
                continue
            }
        }

        return fullText.trim()
    } catch (error) {
        console.error('pdfjs-dist extraction failed:', error)
        throw error
    }
}

// Fallback extraction method
async function extractTextWithFallback(buffer: Buffer) {
    try {
        const text = buffer.toString('utf8')
        const cleanText = text.replace(/[^\x20-\x7E\n]/g, ' ')
        return cleanText
    } catch (error) {
        console.error('Fallback extraction failed:', error)
        throw error
    }
}

// Main export function that tries all methods
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    const extractionMethods = [
        { name: 'pdf-parse', method: () => extractTextWithPdfParse(buffer) },
        { name: 'pdfjs-dist', method: () => extractTextWithPdfJs(buffer) },
        { name: 'fallback', method: () => extractTextWithFallback(buffer) },
    ]

    let extractionErrors = []
    let textResult = ''

    for (const { name, method } of extractionMethods) {
        try {
            console.log(`Trying extraction method: ${name}`)
            textResult = await method()

            // Clean up extracted text
            textResult = textResult
                .replace(/\s+/g, ' ')
                .replace(/\n{3,}/g, '\n\n')
                .trim()

            if (textResult && textResult.length > 50) {
                console.log(`${name} successful, text length:`, textResult.length)
                console.log('Text preview:', textResult.substring(0, 500))
                return textResult
            } else {
                console.log(`${name} returned insufficient text, trying next method`)
                extractionErrors.push(`${name}: Insufficient text extracted`)
                textResult = ''
            }
        } catch (methodError) {
            const errorMsg = `${name}: ${methodError instanceof Error ? methodError.message : 'Unknown error'}`
            console.error(errorMsg)
            extractionErrors.push(errorMsg)
            continue
        }
    }

    // If no method worked, throw error with details
    throw new Error(`All PDF extraction methods failed: ${extractionErrors.join('; ')}`)
}