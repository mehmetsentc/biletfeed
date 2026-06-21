import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export { protocol, rootDomain } from '@/lib/config/domain';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
