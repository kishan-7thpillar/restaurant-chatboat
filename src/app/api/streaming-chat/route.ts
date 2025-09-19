import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the request to the external API
    const response = await fetch('https://agx.loclx.io/restaurant_ai_assistant/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `External API request failed: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    if (!response.body) {
      return NextResponse.json(
        { error: 'No response body received from external API' },
        { status: 500 }
      );
    }

    // Create a readable stream to forward the streaming response
    const stream = new ReadableStream({
      start(controller) {
        const reader = response.body!.getReader();
        
        function pump(): Promise<void> {
          return reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            
            controller.enqueue(value);
            return pump();
          }).catch((error) => {
            console.error('Stream error:', error);
            controller.error(error);
          });
        }
        
        return pump();
      }
    });

    // Return the streaming response with proper headers
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Proxy API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
