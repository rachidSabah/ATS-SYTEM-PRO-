import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { prompt, provider, apiKey, model } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // If using z-ai-web-dev-sdk (free SDK option)
    if (provider === 'z-ai' || !apiKey) {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert ATS optimization specialist and resume writer.' },
          { role: 'user', content: prompt }
        ],
      });
      
      return NextResponse.json({ 
        content: completion.choices[0]?.message?.content || '',
        provider: 'z-ai-web-dev-sdk'
      });
    }

    // If using custom API keys (OpenAI, Groq, DeepSeek, etc.)
    let endpoint = 'https://api.openai.com/v1/chat/completions';
    if (provider?.toLowerCase().includes('groq')) {
      endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    } else if (provider?.toLowerCase().includes('deepseek')) {
      endpoint = 'https://api.deepseek.com/chat/completions';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an expert ATS optimization specialist and resume writer.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ 
        error: 'API request failed', 
        details: errorData 
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ 
      content: data.choices[0]?.message?.content || '',
      provider: provider || 'openai'
    });

  } catch (error: any) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate content' 
    }, { status: 500 });
  }
}
