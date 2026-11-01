import { http, HttpResponse, delay } from 'msw';
import { db } from '../db';

function getUser(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  return db.getUserByToken(token);
}

export const favoritesHandlers = [
  http.get('/api/favorites', async ({ request }) => {
    await delay(150);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
    const favoriteIds = db.getFavorites(user.id);
    const data = favoriteIds.map((nftId) => ({ nftId, userId: user.id, createdAt: new Date().toISOString() }));
    return HttpResponse.json({ data });
  }),

  http.post('/api/favorites', async ({ request }) => {
    await delay(150);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
    const body = await request.json() as { nftId: string };
    db.addFavorite(user.id, body.nftId);
    return HttpResponse.json({ data: { nftId: body.nftId, userId: user.id, createdAt: new Date().toISOString() } });
  }),

  http.delete('/api/favorites/:nftId', async ({ request, params }) => {
    await delay(150);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
    db.removeFavorite(user.id, params.nftId as string);
    return HttpResponse.json({ data: null });
  }),
];
