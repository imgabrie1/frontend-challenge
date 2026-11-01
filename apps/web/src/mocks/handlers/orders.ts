import { http, HttpResponse, delay } from 'msw';
import { db } from '../db';
import type { Order } from '@/types';

function getUserId(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  return db.getUserByToken(token)?.id ?? null;
}

export const ordersHandlers = [
  http.post('/api/orders', async ({ request }) => {
    await delay(300);
    const userId = getUserId(request);
    if (!userId) return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });

    const body = await request.json() as {
      idempotencyKey: string;
      items: { nftId: string; editionId: string; quantity: number }[];
      couponCode: string | null;
      walletId: string;
      quoteTotal: string;
    };

    const existing = db.getOrderByIdempotencyKey(body.idempotencyKey);
    if (existing) {
      if (existing.userId === userId) {
        return HttpResponse.json({ data: existing });
      }
      return HttpResponse.json({ code: 'CONFLICT', message: 'Idempotency key conflict' }, { status: 409 });
    }

    const wallet = db.getWalletById(body.walletId);
    if (!wallet || wallet.userId !== userId) {
      return HttpResponse.json({ code: 'NOT_FOUND', message: 'Wallet not found' }, { status: 404 });
    }

    const quote = db.computeQuote(userId, body.couponCode);

    if (Math.abs(parseFloat(quote.total) - parseFloat(body.quoteTotal)) > 0.000001) {
      return HttpResponse.json(
        { code: 'PRICE_CHANGED', message: 'Prices have changed, please review your cart', quote },
        { status: 409 },
      );
    }

    const orderItems = body.items.map((item) => {
      const nft = db.getNFTById(item.nftId)!;
      const edition = nft.editions.find((e) => e.id === item.editionId)!;
      const unitPrice = edition.price;
      return {
        nftId: item.nftId,
        editionId: item.editionId,
        quantity: item.quantity,
        nftName: nft.name,
        editionName: edition.name,
        imageUrl: nft.imageUrl,
        unitPrice,
        subtotal: (parseFloat(unitPrice) * item.quantity).toFixed(6),
      };
    });

    const order: Order = {
      id: `order-${Date.now()}`,
      idempotencyKey: body.idempotencyKey,
      userId,
      status: 'pending',
      items: orderItems,
      subtotal: quote.subtotal,
      discount: quote.discount,
      networkFee: quote.networkFee,
      total: quote.total,
      couponCode: body.couponCode,
      walletAddress: wallet.address,
      walletNetwork: wallet.network,
      transactionHash: null,
      explorerUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    db.createOrder(order);

    setTimeout(() => {
      let result: 'confirmed' | 'declined' = Math.random() < 0.85 ? 'confirmed' : 'declined';
      if (typeof window !== 'undefined') {
        const force = localStorage.getItem('msw_force_order_status');
        if (force === 'declined' || force === 'confirmed') {
          result = force;
        }
      }

      const updatedOrder = db.updateOrder(order.id, {
        status: result,
        transactionHash: result === 'confirmed' ? `0x${Date.now().toString(16)}deadbeef` : null,
        explorerUrl: result === 'confirmed' ? `https://etherscan.io/tx/0x${Date.now().toString(16)}` : null,
        updatedAt: new Date().toISOString(),
      });

      if (result === 'confirmed') {
        for (const item of order.items) {
          const nft = db.getNFTById(item.nftId);
          if (nft) {
            const edition = nft.editions.find((e) => e.id === item.editionId);
            if (edition) {
              const newAvailable = Math.max(0, edition.available - item.quantity);
              const updatedNFT = db.updateNFTEdition(item.nftId, item.editionId, { available: newAvailable });
              if (typeof window !== 'undefined' && updatedNFT) {
                window.dispatchEvent(
                  new CustomEvent('msw:nft_updated', {
                    detail: {
                      nftId: item.nftId,
                      version: updatedNFT.version,
                      changes: {
                        available: newAvailable,
                        editionId: item.editionId,
                        price: edition.price,
                      },
                    },
                  }),
                );
              }
            }
          }
        }

        const cart = db.getCart(userId);
        if (cart) {
          cart.items = cart.items
            .map((cartItem) => {
              const purchased = order.items.find(
                (oi) => oi.nftId === cartItem.nftId && oi.editionId === cartItem.editionId,
              );
              if (!purchased) return cartItem;
              const remainingQty = cartItem.quantity - purchased.quantity;
              return remainingQty > 0 ? { ...cartItem, quantity: remainingQty } : null;
            })
            .filter((i): i is NonNullable<typeof i> => i !== null);

          if (cart.items.length === 0) {
            cart.couponCode = null;
          }
          db.setCart(userId, cart);
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('msw:order_updated', {
            detail: {
              orderId: order.id,
              userId,
              status: result,
              version: updatedOrder?.version ?? 2,
              transactionHash: updatedOrder?.transactionHash ?? null,
            },
          }),
        );
      }
    }, 2000);

    return HttpResponse.json({ data: order }, { status: 202 });
  }),

  http.get('/api/orders/:id', async ({ request, params }) => {
    await delay(150);
    const userId = getUserId(request);
    if (!userId) return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
    const order = db.getOrderById(params.id as string);
    if (!order) return HttpResponse.json({ code: 'NOT_FOUND' }, { status: 404 });
    if (order.userId !== userId) return HttpResponse.json({ code: 'FORBIDDEN' }, { status: 403 });
    return HttpResponse.json({ data: order });
  }),
];
