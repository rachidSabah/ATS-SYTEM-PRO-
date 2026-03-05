// File parsing API - Supports PDF, DOCX, and text files
// Build version: 5.0 - Using pdf-parse for Node.js compatibility
import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';

// Specify Node.js runtime for file system operations
export const runtime = 'nodejs';

// Extract text from PDF using pdf-parse (Node.js native)
async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
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

  } catch (error: unknown) {
    console.error('File Parse Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse file';
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 });
  }
}
