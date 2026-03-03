// File parsing API - Supports PDF, DOCX, and text files
// Build version: 2.0 - Force rebuild for Vercel
import { NextRequest, NextResponse } from 'next/server';

// Specify Node.js runtime for file system operations
export const runtime = 'nodejs';

// Dynamic import for pdf-parse (CommonJS module) - required for ESM compatibility
const pdfParse = async (buffer: Buffer) => {
  const { default: parse } = await import('pdf-parse');
  return parse(buffer);
};

// Dynamic import for mammoth (DOCX parsing)
const mammothExtract = async (buffer: Buffer) => {
  const mammoth = await import('mammoth');
  return mammoth.extractRawText({ buffer });
};

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
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (fileName.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammothExtract(buffer);
      text = result.value;
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
