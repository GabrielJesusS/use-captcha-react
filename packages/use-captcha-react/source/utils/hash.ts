const BASE = 0x811c9dc5;

export default function hash(s: string): number {
  const l = s.length;
  let ih = BASE;

  for (let i = 0; i < l; i++) {
    ih ^= s.charCodeAt(i);
    ih += (ih << 1) + (ih << 4) + (ih << 7) + (ih << 8) + (ih << 24);
  }

  return ih >>> 0;
}
