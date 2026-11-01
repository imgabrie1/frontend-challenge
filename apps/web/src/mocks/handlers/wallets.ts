import { http, HttpResponse, delay } from 'msw';
import { db } from '../db';
import type { Wallet } from '@/types';

function getUser(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  return db.getUserByToken(token);
}

export const walletsHandlers = [
  http.get('/api/wallets', async ({ request }) => {
    await delay(150);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
    const wallets = db.getWallets(user.id);
    return HttpResponse.json({ data: wallets });
  }),

  http.post('/api/wallets', async ({ request }) => {
    await delay(200);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
    const body = await request.json() as { address: string; role: string; network: string; label: string };
    const wallet = db.createWallet(user.id, body);
    return HttpResponse.json({ data: wallet }, { status: 201 });
  }),

  http.put('/api/wallets/:id', async ({ request, params }) => {
    await delay(200);
    const user = getUser(request);
    if (!user) return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
    const wallet = db.getWalletById(params.id as string);
    if (!wallet || wallet.userId !== user.id) {
      return HttpResponse.json({ code: 'NOT_FOUND' }, { status: 404 });
    }
    const body = await request.json() as Partial<Wallet>;
    const updated = db.updateWallet(params.id as string, body);
    return HttpResponse.json({ data: updated });
  }),
];
