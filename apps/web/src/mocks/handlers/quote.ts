import { http, HttpResponse, delay } from 'msw';
import { db } from '../db';

function getUserId(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  return db.getUserByToken(token)?.id ?? null;
}

export const quoteHandlers = [
  http.post('/api/quote', async ({ request }) => {
    await delay(150);
    const userId = getUserId(request);
    const body = await request.json() as { couponCode: string | null };
    const quote = db.computeQuote(userId, body.couponCode);
    return HttpResponse.json({ data: quote });
  }),
];
