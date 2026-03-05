// PDF parsing API - Dedicated endpoint for PDF files
// Build version: 5.0 - Using pdf-parse for Node.js compatibility
import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';

// Specify Node.js runtime for file system operations
export const runtime = 'nodejs';

// Extract text from PDF using pdf-parse (Node.js native)
async function extractPdfText(buffer: Buffer): Promise<{ text: string; pages: number }> {
  const data = await pdf(buffer);
  return { 
    text: data.text, 
    pages: data.numpages 
  };
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

  } catch (error: unknown) {
    console.error('PDF Parse Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse PDF';
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 });
  }
}
