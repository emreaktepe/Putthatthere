// Ölüm repliği süzgeci (saf): satırda `after: <bölüm kimliği>` varsa o bölüm tamamlanmadan seçilmez (örn. Taşkın w1-03 öncesi konuşmaz).
// Süzgeç hepsini elerse (yapılandırma hatası) süzülmemiş liste döner; oyun asla boş repliğe düşmez.
export function eligibleDeathLines(lines, completed) {
  const done = completed instanceof Set ? completed : new Set(completed || []);
  const ok = (lines || []).filter((l) => !l.after || done.has(l.after));
  return ok.length ? ok : (lines || []);
}
