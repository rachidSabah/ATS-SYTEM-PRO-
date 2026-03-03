// PDF parsing API - Dedicated endpoint for PDF files
// Build version: 4.0 - Using pdfjs-dist for better server compatibility
import { NextRequest, NextResponse } from 'next/server';
import * as pdfjsLib from 'pdfjs-dist';

// Specify Node.js runtime for file system operations
export const runtime = 'nodejs';

// Configure PDF.js for Node.js environment (disable worker)
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

// Extract text from PDF using pdfjs-dist
async function extractPdfText(buffer: Buffer): Promise<{ text: string; pages: number }> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  });
  
  const pdfDocument = await loadingTask.promise;
  let fullText = '';
  
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  return { text: fullText, pages: pdfDocument.numPages };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF
    const { text, pages } = await extractPdfText(buffer);
    
    return NextResponse.json({ 
      text: text,
      pages: pages
    });

  } catch (error: any) {
    console.error('PDF Parse Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to parse PDF' 
    }, { status: 500 });
  }
}
