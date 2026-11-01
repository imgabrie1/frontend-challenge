import { ws } from 'msw';
import { toSocketIo } from '@mswjs/socket.io-binding';
import type { NFTUpdatedEvent, OrderUpdatedEvent } from '@/types';

type SocketIoClient = ReturnType<typeof toSocketIo>['client'];

const connectedClients = new Set<SocketIoClient>();

export function emitNFTUpdated(event: Omit<NFTUpdatedEvent, 'type'>) {
  const payload: NFTUpdatedEvent = { type: 'nft.updated', ...event };
  for (const client of connectedClients) {
    client.emit('nft.updated', payload);
  }
}

export function emitOrderUpdated(event: Omit<OrderUpdatedEvent, 'type'>) {
  const payload: OrderUpdatedEvent = { type: 'order.updated', ...event };
  for (const client of connectedClients) {
    client.emit('order.updated', payload);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('msw:order_updated', ((e: CustomEvent<Omit<OrderUpdatedEvent, 'type'>>) => {
    emitOrderUpdated(e.detail);
  }) as EventListener);

  window.addEventListener('msw:nft_updated', ((e: CustomEvent<Omit<NFTUpdatedEvent, 'type'>>) => {
    emitNFTUpdated(e.detail);
  }) as EventListener);
}

const socketLink = ws.link(/.+/);

export const socketHandler = socketLink.addEventListener('connection', (connection) => {
  const { client } = toSocketIo(connection);
  connectedClients.add(client);

  client.on('disconnect', () => {
    connectedClients.delete(client);
  });

  client.on('simulate:nft_update', (_event: any, ...data: any[]) => {
    if (data[0]) emitNFTUpdated(data[0]);
  });
});
