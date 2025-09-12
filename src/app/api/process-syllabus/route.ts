// src/app/api/process-syllabus/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF } from '../../lib/pdfExtractor';
import { analyzeTextWithOpenAI } from '../../lib/openaiAnalyzer';

// Interface for API response
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
    try {
        const formData = await request.formData();
        let textToAnalyze = '';
        let processingMethod = '';
        let fileSize = 0;

        // Check if there is manual text input
        const manualText = formData.get('manualText') as string;
        if (manualText?.trim() && manualText.length > 20) {
            textToAnalyze = manualText.trim();
            processingMethod = 'manual-input';
        } else {
            // Process PDF file
            const file = formData.get('file') as File;

            if (!file) {
                return NextResponse.json({
                    success: false,
                    error: 'Please upload a PDF file or enter text manually'
                } as APIResponse);
            }

            fileSize = file.size;
            processingMethod = 'pdf-extraction';

            // File validation
            if (!file.name.toLowerCase().endsWith('.pdf')) {
                return NextResponse.json({
                    success: false,
                    error: 'Please upload a PDF format file'
                } as APIResponse);
            }

            if (fileSize > 50 * 1024 * 1024) { // 50MB limit
                return NextResponse.json({
                    success: false,
                    error: 'File is too large (over 50MB). Please try a smaller file.'
                } as APIResponse);
            }

            // Convert File to Buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Extract text from PDF
            try {
                textToAnalyze = await extractTextFromPDF(buffer);

                if (!textToAnalyze || textToAnalyze.length < 50) {
                    throw new Error('PDF does not contain enough text for processing');
                }

            } catch (extractError) {
                const errorMessage = extractError instanceof Error
                    ? extractError.message
                    : 'Unknown text extraction error';

                return NextResponse.json({
                    success: false,
                    error: `PDF processing error: ${errorMessage}`,
                    details: 'Try copying the syllabus text manually into the text field.'
                } as APIResponse);
            }
        }

        // Check text length
        if (textToAnalyze.length < 50) {
            return NextResponse.json({
                success: false,
                error: `Text is too short for analysis (${textToAnalyze.length} characters). Minimum 50 characters required.`
            } as APIResponse);
        }

        // Don't truncate text - new analyzer will process it in chunks

        // Analyze text using OpenAI
        const events = await analyzeTextWithOpenAI(textToAnalyze);

        // Validate and clean events
        const validEvents = events
            .filter((event, index) => {
                const isValid = event.title && event.date && event.type;
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
                // Additional date validation
                const dateObj = new Date(event.date);
                const isValidDate = !isNaN(dateObj.getTime());
                return isValidDate;
            });

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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return NextResponse.json({
            success: false,
            error: `Processing error: ${errorMessage}`,
            details: 'Please try again or enter text manually.'
        } as APIResponse);
    }
}