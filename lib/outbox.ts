"use client";

export interface QueuedBet {
  idempotencyKey: string;
  eventId: string;
  outcomeId: string;
  amount: number;
  bonusId?: string;
  queuedAt: string;
}

const DB_NAME = "wedbet-offline";
const STORE_NAME = "bet-outbox";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: "idempotencyKey" }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueBet(bet: QueuedBet): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(bet);
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function flushBetOutbox(): Promise<void> {
  const db = await openDb();
  const bets = await new Promise<QueuedBet[]>((resolve, reject) => {
    const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  for (const bet of bets) {
    try {
      const response = await fetch("/api/bets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(bet) });
      if (!response.ok && response.status >= 500) continue;
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, "readwrite"); tx.objectStore(STORE_NAME).delete(bet.idempotencyKey); tx.oncomplete = () => resolve();
      });
    } catch { break; }
  }
  db.close();
}
