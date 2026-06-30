/**
 * Offline tarama kuyruğu — IndexedDB tabanlı.
 * Ağ yokken doğrulama isteklerini saklar; bağlantı gelince senkronize eder.
 */

const DB_NAME = 'biletfeed-scan-queue';
const STORE_NAME = 'pending';
const DB_VERSION = 1;

export type QueuedScan = {
  id: string;
  qrRaw?: string;
  ticketCode?: string;
  eventId?: string;
  scannerId: string;
  queuedAt: number;
  attempts: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function enqueueScan(
  scan: Omit<QueuedScan, 'id' | 'queuedAt' | 'attempts'>
): Promise<string> {
  const db = await openDb();
  const id = crypto.randomUUID();
  const entry: QueuedScan = {
    ...scan,
    id,
    queuedAt: Date.now(),
    attempts: 0,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function listQueuedScans(): Promise<QueuedScan[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve((req.result as QueuedScan[]).sort((a, b) => a.queuedAt - b.queuedAt));
    req.onerror = () => reject(req.error);
  });
}

export async function removeQueuedScan(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function flushScanQueue(
  validateFn: (payload: {
    qrRaw?: string;
    ticketCode?: string;
    eventId?: string;
    scannerId: string;
    markUsed: boolean;
  }) => Promise<{ status: string }>
): Promise<{ synced: number; failed: number }> {
  const items = await listQueuedScans();
  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const result = await validateFn({
        qrRaw: item.qrRaw,
        ticketCode: item.ticketCode,
        eventId: item.eventId,
        scannerId: item.scannerId,
        markUsed: true,
      });
      if (result.status === 'VALID' || result.status === 'USED') {
        await removeQueuedScan(item.id);
        synced++;
      } else {
        await removeQueuedScan(item.id);
        synced++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

export function getOrCreateScannerId(): string {
  if (typeof window === 'undefined') return 'server';
  const key = 'bf-scanner-id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}
