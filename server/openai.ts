export interface ModelResponse {
  output?: { type: string; action?: { sources?: { url: string }[] }; content?: { type: string; text?: string; annotations?: { url?: string }[] }[] }[];
  status?: string;
}

export function outputText(response: ModelResponse): string {
  return (response.output || []).flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text').map((item) => item.text || '').join('\n');
}

export function citedUrls(response: ModelResponse): string[] {
  return [...new Set((response.output || []).flatMap((item) => [
    ...(item.action?.sources || []).map((source) => source.url),
    ...(item.content || []).flatMap((content) => (content.annotations || []).map((annotation) => annotation.url || '')),
  ]).filter(Boolean))];
}

export async function askModel(body: Record<string, unknown>): Promise<ModelResponse> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error('Configura OPENAI_API_KEY sul server per cercare ricette sul web.');
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.OPENAI_RECIPE_MODEL || 'gpt-4.1-mini', store: false, ...body }),
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) {
    const details = await response.json().catch(() => null);
    console.error('Recipe API error:', response.status, details?.error?.message);
    throw new Error(`Ricerca ricette non disponibile (${response.status}). Riprova tra poco.`);
  }
  const result = await response.json();
  if (result.status === 'incomplete' || result.error) throw new Error('La ricerca non è stata completata. Riprova.');
  return result;
}

export const objectSchema = (properties: Record<string, unknown>) => ({
  type: 'object', additionalProperties: false, required: Object.keys(properties), properties,
});
