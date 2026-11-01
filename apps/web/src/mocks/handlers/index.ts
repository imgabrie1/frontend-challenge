import { authHandlers } from './auth';
import { nftsHandlers } from './nfts';
import { favoritesHandlers } from './favorites';
import { cartHandlers } from './cart';
import { quoteHandlers } from './quote';
import { ordersHandlers } from './orders';
import { profileHandlers } from './profile';
import { walletsHandlers } from './wallets';
import { socketHandler } from './socket';

export const handlers = [
  socketHandler,
  ...authHandlers,
  ...nftsHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...quoteHandlers,
  ...ordersHandlers,
  ...profileHandlers,
  ...walletsHandlers,
];
