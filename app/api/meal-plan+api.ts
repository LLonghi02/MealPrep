import { searchMealPlan, validatePreferences } from '../../server/mealSearch';

let activeRequests = 0;
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: 'Origin not allowed.' }, { status: 403 });
  if (activeRequests >= 2) return Response.json({ error: 'Ricerca già in corso. Riprova tra poco.' }, { status: 429 });
  let input;
  try {
    const body = await request.text();
    if (body.length > 20000) throw new Error('Request too large.');
    input = validatePreferences(JSON.parse(body));
  } catch { return Response.json({ error: 'Preferenze non valide.' }, { status: 400 }); }
  activeRequests++;
  try { return Response.json({ plan: await searchMealPlan(input) }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Ricerca non disponibile. Riprova.' }, { status: 422 });
  } finally { activeRequests--; }
}
