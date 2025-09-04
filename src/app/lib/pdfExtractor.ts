// lib/pdfExtractor.ts

import { ExtractionMethod } from '@/types'

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    const methods: ExtractionMethod[] = [
        {
            name: 'pdf-parse',
            method: () => extractWithPdfParse(buffer)
        },
        {
            name: 'pdfjs-dist',
            method: () => extractWithPdfJs(buffer)
        },
        {
            name: 'fallback',
            method: () => extractWithFallback(buffer)
        },
    ]

    const errors: string[] = []

    for (const { name, method } of methods) {
        try {
            console.log(`Trying extraction method: ${name}`)
            let text = await method()

            // Clean extracted text
            text = cleanExtractedText(text)

            if (text.length > 50) {
                console.log(`${name} successful, text length: ${text.length}`)
                return text
            }

            errors.push(`${name}: Insufficient text extracted`)
        } catch (error) {
            const msg = `${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
            console.error(msg)
            errors.push(msg)
        }
    }

    throw new Error(`All extraction methods failed: ${errors.join('; ')}`)
}

async function extractWithPdfParse(buffer: Buffer): Promise<string> {
    const pdfParse = await import('pdf-parse')
    const data = await pdfParse.default(buffer)
    return data.text
}

async function extractWithPdfJs(buffer: Buffer): Promise<string> {
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
                .map((item: any) => ('str' in item ? item.str : ''))
                .filter(text => text.length > 0)
                .join(' ')

            fullText += pageText + '\n'
        } catch (pageError) {
            console.error(`Error processing page ${pageNum}:`, pageError)
        }
    }

    return fullText.trim()
}

async function extractWithFallback(buffer: Buffer): Promise<string> {
    const text = buffer.toString('utf8')
    return text.replace(/[^\x20-\x7E\n]/g, ' ')
}

function cleanExtractedText(text: string): string {
    return text
        .replace(/\s+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}