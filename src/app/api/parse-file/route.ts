// File parsing API - Supports PDF, DOCX, and text files
// Build version: 4.0 - Using pdfjs-dist for better server compatibility
import { NextRequest, NextResponse } from 'next/server';
import * as pdfjsLib from 'pdfjs-dist';

// Specify Node.js runtime for file system operations
export const runtime = 'nodejs';

// Configure PDF.js for Node.js environment (disable worker)
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

// Extract text from PDF using pdfjs-dist
async function extractPdfText(buffer: Buffer): Promise<string> {
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
  
  return fullText;
}

// Extract text from DOCX using dynamic import
async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = '';

    // Parse based on file type
    if (fileName.endsWith('.pdf')) {
      text = await extractPdfText(buffer);
    } else if (fileName.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      text = await extractDocxText(buffer);
    } else {
      // Plain text file
      text = buffer.toString('utf-8');
    }

    return NextResponse.json({ 
      text: text,
      fileName: file.name,
      size: file.size
    });

  } catch (error: any) {
    console.error('File Parse Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to parse file' 
    }, { status: 500 });
  }
}
