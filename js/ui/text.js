// Arayüz metinleri. Oyun içeriği metinleri (bölüm adı, hedef, hikâye) data/game.config.json -> strings'ten gelir;
// burada yalnızca yeni ekranların (harita, menü, kamera) kısa etiketleri durur. Mimari: ileride config.strings.ui altına taşınabilir.
import { STRINGS } from "../core/data.js";
import { fmt } from "../core/dom.js";

export const UI = {
  version: "1.1",
  menu: { continue: "Devam Et", startGame: "Başla", resumeLevel: "Devam edilen bölüm", kinds: "{n} çeşit", levelShort: "Bölüm", progress: "İlerleme", how: "Nasıl oynanır?", newGame: "Yeni Oyun", sound: "Ses", graphics: "Grafik", confirmNew: "Kayıt silinsin mi? Tekrar dokun", help: "Yardım", on: "Açık", off: "Kapalı", map: "Harita", subtitle: "Bir büyü. Bir gece. Tek kader.", noSave: "Kayıt okunamadı; yeni oyun başlatıldı.", newer: "Kayıt daha yeni bir sürümden; yeni oyun başlatılacak." },
  intro: { skip: "Atla", next: "Devam" },
  map: { title: "Harita", back: "Menü", completed: "Tamamlanan", best: "En iyi", locked: "Kilitli", open: "Açık", done: "Tamamlandı", play: "Savaşa gir", practice: "Tekrar oyna", practiceNote: "Alıştırma: ilerleme değişmez", lockedNote: "Önceki bölümü tamamla", close: "Kapat", detail: "Detay", less: "Daha az", time: "Süre", reward: "Ödül", foes: "Düşmanlar", sec: "sn", goal: "Hedef" },
  hud: {
    score: "Puan", cam: "Kamera", brand: "HEXORA", quests: "Görevler", kills: "Yenilen düşman",
    pause: "Durdur", sound: "Ses", map: "Harita", resume: "Devam Et", paused: "Duraklatıldı", toMap: "Haritaya Dön", cancel: "Vazgeç",
    leaveTitle: "Haritaya dönülsün mü?", leaveNote: "Bölümü şimdi bırakırsan bu bölümdeki ilerleme (puan, kristal, yenilen düşman) kaybolur.",
    pauseNote: "Oyun donduruldu. Süre ve düşmanlar bekliyor.", soundOn: "Ses: Açık", soundOff: "Ses: Kapalı", pauseKeys: "Esc / P: Devam", weapons: "Büyüler", abilities: "Yetenekler", camera: "Kamera açısı", lockedSpells: "{n} kilitli büyü",
  },
  result: { tip: "İpucu", helpOn: "Yardım açık", hp: "Can", back: "Haritaya dön", total: "Toplam", timeBonus: "Süre bonusu", levelBonus: "Bölüm bonusu", newSpell: "Yeni büyü", newAbility: "Yeni yetenek", key: "Tuş", damage: "Hasar", cooldown: "Bekleme", practiceDone: "Alıştırma tamamlandı", confirm: "Emin misin? Tekrar dokun", seeMap: "Haritayı gör" },
  // yıldız rozetleri (docs/strateji/hikaye-ve-bolum-kurgusu-27-bolum.md §6.3; ölçüt: js/game/stars.js)
  stars: { title: "Yıldız", count: "{n}/3 yıldız", badges: [{ name: "Yolcu", desc: "Bölümü tamamladın." }, { name: "Sakınan", desc: "En çok iki vuruş yiyerek bitirdin." }, { name: "Dokunulmaz", desc: "Hiç hasar almadan bitirdin." }], bossDesc: "En çok üç vuruş yiyerek bitirdin.", next: "Sonraki: {name}" },
};

export function objectiveText(L) {
  if (L.objectiveText) return L.objectiveText;
  const O = STRINGS.objective;
  switch (L.objective) {
    case "crystal": return fmt(O.crystal, { goal: L.goal });
    case "survive": return fmt(O.survive, { goal: L.goal });
    case "totem": return fmt(O.totem, { goal: L.goal });
    case "miniboss": return O.miniboss;
    default: return O.boss;
  }
}
