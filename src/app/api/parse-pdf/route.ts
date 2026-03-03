import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';

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
    const data = await pdfParse(buffer);
    
    return NextResponse.json({ 
      text: data.text,
      pages: data.numpages
    });

  } catch (error: any) {
    console.error('PDF Parse Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to parse PDF' 
    }, { status: 500 });
  }
}
