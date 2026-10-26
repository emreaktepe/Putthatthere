// Yıldız (★) rozetleri (docs/strateji/oyun-tasarimi-zorluk-ve-bolum-plani.md §3.7). Saf: DOM'a dokunmaz, Node'da test edilir.
//   ★1 "Yolcu": bölümü bitir. ★2 "Sakınan": en çok 2 vuruş (mini-boss / boss: 3). ★3 "Dokunulmaz": hasarsız.
// "Vuruş" = damagePlayer'ın can düşürdüğü çağrı (RT.hits; Mana Kalkanı'nın emdiği vuruş sayılmaz). Eşikler VARSAYIMDIR (oyuncu testi yok).
// Yıldızlar bölümleri KİLİTLEMEZ; alıştırma modunda yazılmaz (campaign.recordResult).

export const STAR_MAX = 3;
const BOSS_OBJECTIVES = ["miniboss", "boss"];

// en çok kaç vuruşla ★2 alınır
export const star2Hits = (objective) => (BOSS_OBJECTIVES.includes(objective) ? 3 : 2);

// bölüm kazanıldığında verilen yıldız sayısı (0 yalnızca alıştırmada: bölüm kazanılmadıysa bu fonksiyon çağrılmaz)
export function starsFor({ objective = "crystal", hits = 0, practice = false } = {}) {
  if (practice) return 0;
  const h = Math.max(Math.floor(Number(hits)) || 0, 0);
  if (h === 0) return 3;
  return h <= star2Hits(objective) ? 2 : 1;
}

// harita gösterimi: kayıttaki en iyi yıldız; tamamlanmış ama yıldız verisi olmayan (eski kayıt) bölüm en az ★1 sayılır
export function displayStars(best, completed) {
  const s = Math.min(Math.max(Math.floor(best && best.stars) || 0, 0), STAR_MAX);
  return completed ? Math.max(s, 1) : s;
}

// "★★☆" biçimli metin (ekran okuyucu için ayrıca sayı verilir)
export const starText = (n) => "★".repeat(Math.min(Math.max(n, 0), STAR_MAX)) + "☆".repeat(STAR_MAX - Math.min(Math.max(n, 0), STAR_MAX));
