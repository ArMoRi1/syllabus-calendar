// src/app/lib/pdfExtractor.ts

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Configure PDF.js for Node.js environment
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface PDFExtractionResult {
    text: string;
    pages: number;
    method: string;
}

// Method 1: Using PDF.js (best for most PDFs)
async function extractWithPDFJS(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
        const uint8Array = new Uint8Array(buffer);
        const loadingTask = pdfjsLib.getDocument({
            data: uint8Array,
            verbosity: 0, // Disable verbose logging
        });

        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;

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
            } catch (pageError) {
                // Silent error handling for individual pages
            }
        }

        const fullText = textParts.join('\n\n').trim();

        return {
            text: fullText,
            pages: numPages,
            method: 'PDF.js'
        };

    } catch (error) {
        throw error;
    }
}

// Method 2: Using pdf-parse with proper configuration
async function extractWithPdfParse(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
        // Dynamic import of pdf-parse
        const pdfParse = await import('pdf-parse');

        const options = {
            // Settings for better text extraction
            normalizeWhitespace: false,
            disableCombineTextItems: false,
        };

        const data = await pdfParse.default(buffer, options);

        return {
            text: data.text,
            pages: data.numpages,
            method: 'pdf-parse'
        };

    } catch (error) {
        throw error;
    }
}

// Method 3: Simple regex parser (fallback)
function extractRawText(buffer: Buffer): PDFExtractionResult {
    try {
        const content = buffer.toString('latin1');
        const textParts: string[] = [];

        // Method 1: BT...ET blocks (most accurate)
        const btEtRegex = /BT\s+([\s\S]*?)\s+ET/gi;
        let match;

        while ((match = btEtRegex.exec(content)) !== null) {
            const block = match[1];

            // Extract text from various PDF operators
            const textOperators = [
                /\(([^)]+)\)\s*Tj/g,           // Simple text
                /\(([^)]+)\)\s*TJ/g,           // Text with array
                /<([0-9A-Fa-f]+)>\s*Tj/g,     // Hex-encoded text
            ];

            textOperators.forEach(regex => {
                let textMatch;
                while ((textMatch = regex.exec(block)) !== null) {
                    let text = textMatch[1];

                    // Decode hex if needed
                    if (regex.source.includes('A-Fa-f')) {
                        try {
                            text = Buffer.from(text, 'hex').toString('utf8');
                        } catch {
                            continue;
                        }
                    }

                    // Clean escape sequences
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

        // Method 2: Stream objects with more aggressive approach
        if (textParts.length < 10) {
            const streamRegex = /stream\s*([\s\S]*?)\s*endstream/gi;
            while ((match = streamRegex.exec(content)) !== null) {
                const streamData = match[1];

                // Extract readable text from stream
                const readableText = streamData
                    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                // Check if this is textual content
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

        return {
            text: result,
            pages: 1,
            method: 'Raw extraction'
        };

    } catch (error) {
        throw error;
    }
}

// Function for cleaning and validating text
function cleanAndValidateText(text: string, method: string): string {
    if (!text || text.length < 10) {
        throw new Error(`${method} returned empty or too short text`);
    }

    // Basic cleaning
    let cleaned = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/^\s+|\s+$/g, '');

    // Check text quality
    const words = (cleaned.match(/[a-zA-Z]{2,}/g) || []).length;
    const hasDatePatterns = /\d{4}|\d{1,2}\/\d{1,2}|january|february|march|april|may|june|july|august|september|october|november|december/i.test(cleaned);

    if (words < 20) {
        throw new Error(`Text quality too low: only ${words} words found`);
    }

    return cleaned;
}

// MAIN FUNCTION
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    // Validation
    if (!buffer || buffer.length === 0) {
        throw new Error('Empty PDF buffer provided');
    }

    if (buffer.length > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('PDF file too large (>50MB). Please use a smaller file.');
    }

    // Check PDF signature
    const header = buffer.toString('ascii', 0, 8);
    if (!header.startsWith('%PDF')) {
        throw new Error('Invalid file format - not a PDF document');
    }

    // Try different text extraction methods
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

    // Try each method
    for (const method of methods) {
        try {
            const result = await method.extract();

            if (result.text && result.text.length > 50) {
                results.push({ result });
            }

        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            results.push({ result: { text: '', pages: 0, method: method.name }, error: err });
        }
    }

    // Select the best result
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

    // Sort by text length (more = better)
    successful.sort((a, b) => b.result.text.length - a.result.text.length);
    const best = successful[0].result;

    // Clean and validate
    const cleanedText = cleanAndValidateText(best.text, best.method);

    return cleanedText;
}