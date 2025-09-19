// Client-side service that calls the API route

export interface QueryGenerationResult {
  query: string;
  explanation: string;
  error?: string;
}

// Schema and prompts moved to API route

export async function generateSupabaseQuery(naturalLanguageQuery: string): Promise<QueryGenerationResult> {
  try {
    const response = await fetch('/api/generate-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: naturalLanguageQuery }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate query');
    }

    const result = await response.json();
    
    return {
      query: result.query,
      explanation: result.explanation
    };

  } catch (error) {
    console.error('Error generating Supabase query:', error);
    
    return {
      query: '',
      explanation: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
