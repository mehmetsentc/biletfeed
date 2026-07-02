import { NextResponse } from 'next/server';
import { notFound } from 'next/navigation';
import { isEventJoyEnabled } from '@/lib/config/features';

export function assertEventJoyEnabled(): void {
  if (!isEventJoyEnabled) notFound();
}

export function eventJoyApiDisabledResponse(): NextResponse | null {
  if (!isEventJoyEnabled) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return null;
}
