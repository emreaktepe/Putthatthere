// Hasar yuvarlama: düşman canı tam sayıdır, Güç Tılsımı gibi çarpanlar ondalık verir. Kesirli kısım birikir ("taşıma"),
// böylece +%25 çarpan her dördüncü vuruşta fazladan 1 hasar demektir; 1-2 canlı düşmanlara karşı da hissedilir (plan B5).
// Saf: Node'da test edilir. st: { carry } (oyuncuya ait; bölüm başında sıfırlanır).
export function rollDamage(base, mul, st) {
  if (!Number.isInteger(base) || !(mul > 1)) return base * (mul > 0 ? mul : 1); // ondalık taban hasar (örn. 0.5) yuvarlanmaz
  const raw = base * mul + (st.carry || 0);
  const d = Math.max(base, Math.floor(raw + 1e-9));
  st.carry = raw - d;
  return d;
}
// bölüm başına sıfırlanan paylaşılan taşıma durumu (weapons.js kullanır, flow.js sıfırlar)
export const dmgState = { carry: 0 };
