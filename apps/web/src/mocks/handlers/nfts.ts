import { http, HttpResponse } from 'msw';
import { simDelay } from './delay';
import { db } from '../db';

export const nftsHandlers = [
  http.get('/api/nfts', async ({ request }) => {
    if (typeof window !== 'undefined' && (window as any).__MSW_FORCE_NFT_ERROR__) {
      return HttpResponse.error()
    }

    await simDelay(150);
    const url = new URL(request.url);
    const filters = {
      search: url.searchParams.get('search') ?? undefined,
      category: url.searchParams.get('category') ?? undefined,
      network: url.searchParams.get('network') ?? undefined,
      minPrice: url.searchParams.get('minPrice') ?? undefined,
      maxPrice: url.searchParams.get('maxPrice') ?? undefined,
      sortBy: url.searchParams.get('sortBy') ?? undefined,
      page: Number(url.searchParams.get('page') ?? 1),
      limit: Number(url.searchParams.get('limit') ?? 12),
    };

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const user = token ? db.getUserByToken(token) : null;
    const favorites = user ? db.getFavorites(user.id) : [];

    const result = db.getNFTs(filters);
    const data = result.data.map((nft) => ({ ...nft, isFavorited: favorites.includes(nft.id) }));

    return HttpResponse.json({ ...result, data });
  }),

  http.get('/api/nfts/:id', async ({ request, params }) => {
    await simDelay(150);
    const nft = db.getNFTById(params.id as string);
    if (!nft) {
      return HttpResponse.json({ code: 'NOT_FOUND', message: 'NFT not found' }, { status: 404 });
    }

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const user = token ? db.getUserByToken(token) : null;
    const favorites = user ? db.getFavorites(user.id) : [];

    return HttpResponse.json({ data: { ...nft, isFavorited: favorites.includes(nft.id) } });
  }),
];
