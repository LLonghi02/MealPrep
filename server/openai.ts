export interface ModelResponse {
  output?: { type: string; action?: { sources?: { url: string }[] }; content?: { type: string; text?: string; annotations?: { url?: string }[] }[] }[];
  status?: string;
}

export function outputText(response: ModelResponse): string {
  return (response.output || []).flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text').map((item) => item.text || '').join('\n');
}

export function citedUrls(response: ModelResponse): string[] {
  const output = response.output || [];
  return [...new Set([
    ...output.flatMap(item => (item.content || []).flatMap(content => (content.annotations || []).map(annotation => annotation.url || ''))),
    ...output.flatMap(item => (item.action?.sources || []).map(source => source.url)),
  ].filter(Boolean))];
}

export async function askModel(body: Record<string, unknown>): Promise<ModelResponse> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error('Configure OPENAI_API_KEY on the server to search for recipes.');
  let response: Response;
  try {
    response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_RECIPE_MODEL || 'gpt-4.1-mini', store: false, ...body }),
      signal: AbortSignal.timeout(30000),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError' || /timed out|timeout/i.test(error.message))) {
      throw new Error('Recipe search timed out. Please try again with fewer dietary restrictions or a slightly higher budget.');
    }
    throw error;
  }
  if (!response.ok) {
    const details = await response.json().catch(() => null);
    console.error('Recipe API error:', response.status, details?.error?.message);
    throw new Error(`Recipe search is unavailable (${response.status}). Please try again shortly.`);
  }
  const result = await response.json();
  if (result.status === 'incomplete' || result.error) throw new Error('Recipe search did not complete. Please try again.');
  return result;
}

export const objectSchema = (properties: Record<string, unknown>) => ({
  type: 'object', additionalProperties: false, required: Object.keys(properties), properties,
});
