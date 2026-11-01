import { delay } from 'msw';

export async function simDelay(ms = 150): Promise<void> {
  if (typeof window !== 'undefined') {
    const speed = localStorage.getItem('msw_network_speed');
    if (speed === 'slow') {
      await delay(2500);
      return;
    }
  }
  await delay(ms);
}
