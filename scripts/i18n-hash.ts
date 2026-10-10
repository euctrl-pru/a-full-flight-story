import { createHash } from 'node:crypto';

/** Short stable hash of an English message value (first 12 hex of sha256). */
export const hashValue = (v: string): string => createHash('sha256').update(v).digest('hex').slice(0, 12);
