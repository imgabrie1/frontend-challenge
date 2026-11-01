import { http, HttpResponse, delay } from 'msw';
import { db } from '../db';
import type { Cart } from '@/types';

function getUserId(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const user = db.getUserByToken(token);
  return user?.id ?? null;
}

export const cartHandlers = [
  http.get('/api/cart', async ({ request }) => {
    await delay(150);
    const userId = getUserId(request);
    const cart = db.getCart(userId);
    return HttpResponse.json({ data: cart });
  }),

  http.post('/api/cart/items', async ({ request }) => {
    await delay(150);
    const userId = getUserId(request);
    const body = await request.json() as { nftId: string; editionId: string; quantity: number };

    const nft = db.getNFTById(body.nftId);
    if (!nft) return HttpResponse.json({ code: 'NOT_FOUND', message: 'NFT not found' }, { status: 404 });
    const edition = nft.editions.find((e) => e.id === body.editionId);
    if (!edition) return HttpResponse.json({ code: 'NOT_FOUND', message: 'Edition not found' }, { status: 404 });
    if (edition.available < body.quantity) {
      return HttpResponse.json({ code: 'INSUFFICIENT_STOCK', message: 'Not enough stock' }, { status: 409 });
    }

    const cart = db.getCart(userId);
    const existingIdx = cart.items.findIndex(
      (i) => i.nftId === body.nftId && i.editionId === body.editionId,
    );

    if (existingIdx >= 0) {
      cart.items[existingIdx].quantity = Math.min(cart.items[existingIdx].quantity + body.quantity, edition.available);
    } else {
      cart.items.push({
        nftId: body.nftId,
        editionId: body.editionId,
        quantity: body.quantity,
        nft: { id: nft.id, name: nft.name, imageUrl: nft.imageUrl, network: nft.network },
        edition: { id: edition.id, name: edition.name, price: edition.price },
      });
    }

    db.setCart(userId, cart);
    return HttpResponse.json({ data: cart });
  }),

  http.patch('/api/cart/items/:nftId/:editionId', async ({ request, params }) => {
    await delay(150);
    const userId = getUserId(request);
    const body = await request.json() as { quantity: number };
    const cart = db.getCart(userId);
    const item = cart.items.find((i) => i.nftId === params.nftId && i.editionId === params.editionId);
    if (!item) return HttpResponse.json({ code: 'NOT_FOUND' }, { status: 404 });
    if (body.quantity <= 0) {
      cart.items = cart.items.filter((i) => !(i.nftId === params.nftId && i.editionId === params.editionId));
    } else {
      item.quantity = body.quantity;
    }
    db.setCart(userId, cart);
    return HttpResponse.json({ data: cart });
  }),

  http.delete('/api/cart/items/:nftId/:editionId', async ({ request, params }) => {
    await delay(150);
    const userId = getUserId(request);
    const cart = db.getCart(userId);
    cart.items = cart.items.filter((i) => !(i.nftId === params.nftId && i.editionId === params.editionId));
    db.setCart(userId, cart);
    return HttpResponse.json({ data: null });
  }),

  http.post('/api/cart/coupon', async ({ request }) => {
    await delay(200);
    const userId = getUserId(request);
    const body = await request.json() as { code: string };
    const validation = db.validateCoupon(body.code);
    if (!validation.valid) {
      return HttpResponse.json(
        { code: 'INVALID_COUPON', message: `Coupon is ${validation.error}`, error: validation.error },
        { status: 422 },
      );
    }
    const cart = db.getCart(userId);
    cart.couponCode = body.code.toUpperCase();
    db.setCart(userId, cart);
    return HttpResponse.json({ data: cart });
  }),

  http.delete('/api/cart/coupon', async ({ request }) => {
    await delay(150);
    const userId = getUserId(request);
    const cart = db.getCart(userId);
    cart.couponCode = null;
    db.setCart(userId, cart);
    return HttpResponse.json({ data: cart });
  }),

  http.post('/api/cart/merge', async ({ request }) => {
    await delay(200);
    const userId = getUserId(request);
    if (!userId) return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
    const body = await request.json() as { items: Cart['items'] };
    const merged = db.mergeCart(userId, body.items);
    return HttpResponse.json({ data: merged });
  }),
];
