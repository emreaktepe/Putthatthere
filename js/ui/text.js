// Arayüz metinleri. Oyun içeriği metinleri (bölüm adı, hedef, hikâye) data/game.config.json -> strings'ten gelir;
// burada yalnızca yeni ekranların (harita, menü, kamera) kısa etiketleri durur. Mimari: ileride config.strings.ui altına taşınabilir.
import { STRINGS } from "../core/data.js";
import { fmt } from "../core/dom.js";

export const UI = {
  version: "1.1",
  menu: { continue: "Devam Et", newGame: "Yeni Oyun", sound: "Ses", graphics: "Grafik", confirmNew: "Kayıt silinsin mi? Tekrar dokun", map: "Harita", subtitle: "Bir büyücü, bir gece, kırılmış bir kalp.", noSave: "Kayıt okunamadı; yeni oyun başlatıldı.", newer: "Kayıt daha yeni bir sürümden; yeni oyun başlatılacak." },
  intro: { skip: "Atla", next: "Devam" },
  map: { title: "Harita", back: "Menü", completed: "Tamamlanan", best: "En iyi", locked: "Kilitli", open: "Açık", done: "Tamamlandı", play: "Savaşa gir", practice: "Tekrar oyna", practiceNote: "Alıştırma: ilerleme değişmez", lockedNote: "Önceki bölümü tamamla", close: "Kapat", time: "Süre", reward: "Ödül", foes: "Düşmanlar", sec: "sn", goal: "Hedef" },
  hud: { score: "Puan", cam: "Kamera" },
  result: { back: "Haritaya dön", total: "Toplam", timeBonus: "Süre bonusu", levelBonus: "Bölüm bonusu", newSpell: "Yeni büyü", newAbility: "Yeni yetenek", key: "Tuş", damage: "Hasar", cooldown: "Bekleme", practiceDone: "Alıştırma tamamlandı", confirm: "Emin misin? Tekrar dokun", seeMap: "Haritayı gör" },
};

export function objectiveText(L) {
  const O = STRINGS.objective;
  switch (L.objective) {
    case "crystal": return fmt(O.crystal, { goal: L.goal });
    case "survive": return fmt(O.survive, { goal: L.goal });
    case "totem": return fmt(O.totem, { goal: L.goal });
    case "miniboss": return O.miniboss;
    default: return O.boss;
  }
}
