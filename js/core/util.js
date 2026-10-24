// Küçük, bağımsız yardımcılar.

export const ARENA = 14; // geometriye bağlı sabit; konfigürasyondan değişmez
export const $ = (id) => document.getElementById(id);
export const rand = (r) => (Math.random() * 2 - 1) * r;
export const flatDist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
