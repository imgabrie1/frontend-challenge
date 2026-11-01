import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEth(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.000000 ETH';
  return `${num.toFixed(6).replace(/\.?0+$/, '')} ETH`;
}

export function formatUsd(eth: string | number, rate: number): string {
  const num = typeof eth === 'string' ? parseFloat(eth) : eth;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num * rate);
}

export function addEth(a: string, b: string): string {
  const aNum = parseFloat(a) || 0;
  const bNum = parseFloat(b) || 0;
  return (aNum + bNum).toFixed(6);
}

export function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
