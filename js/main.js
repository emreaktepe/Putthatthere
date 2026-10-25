// Açılış: config yükle -> doğrula -> oyun verisini kur -> sahneyi/sesi hazırla -> menü.
// Not: modüllerin içe aktarılması sahneyi (renderer, ışıklar) hemen kurar; oyun VERİSİ ise yalnızca yükleme başarılıysa kurulur.
import { adapt } from "./config/adapt.js";
import { loadGameConfig } from "./config/load.js";
import { formatIssue } from "./config/validate.js";
import { CONFIG_INFO, setConfigInfo, setData } from "./core/data.js";
import { RT, S, enemies, initState, pickups } from "./core/state.js";
import { hurt, killEnemy } from "./game/combat.js";
import { devStart, gameOver, introLevel, levelClear, showMainMenu, startLevel } from "./game/flow.js";
import { startLoop } from "./game/loop.js";
import { applyTheme } from "./render/themes.js";
import { initWizard } from "./render/wizard.js";
import { devBar } from "./ui/devbar.js";
import { renderHud, renderWeapons } from "./ui/hud.js";
import { applyStaticIcons } from "./ui/icons.js";
import { initPause } from "./ui/pause.js";
import { showFatal } from "./ui/screens.js";

async function boot() {
  const res = await loadGameConfig();
  if (!res.ok) {
    console.error("[config]", res.message, res.errors);
    showFatal({
      title: res.reason === "file" ? "Sunucu gerekli" : "Yapılandırma yüklenemedi",
      message: res.message,
      lines: res.errors.map((e) => formatIssue(e, null)),
      retry: res.reason !== "file",
    });
    return;
  }
  for (const n of res.notices) console.warn("[config]", n);
  for (const w of res.warnings) console.warn("[config]", formatIssue(w, res.config));
  setData(adapt(res.config));
  applyStaticIcons();
  setConfigInfo({ source: res.source, baseHash: res.baseHash, notices: res.notices, warnings: res.warnings });
  initState();
  initWizard();
  applyTheme(0);
  renderWeapons();
  initPause();
  startLoop();
  showMainMenu();
  // ?dev=1 (+ &level=<id>): geliştirici şeridi ve bölümden başlatma; varsayılan oyun akışını etkilemez
  const q = new URLSearchParams(location.search);
  if (q.get("dev") === "1") {
    const lv = q.get("level");
    const started = lv ? devStart(lv) : false;
    if (lv && !started) console.warn("[dev] bilinmeyen bölüm kimliği:", lv);
    devBar({ source: res.source, baseHash: res.baseHash, warnings: res.warnings.length, notices: res.notices, level: started ? lv : null, wanted: q.get("cfg") === "draft" });
  }
  // ?debug: yalnızca elle/otomatik doğrulama için konsol kancası (oyun akışını etkilemez)
  if (new URLSearchParams(location.search).has("debug")) window.__buyucu = { S, RT, enemies, pickups, CONFIG_INFO, introLevel, startLevel, levelClear, gameOver, killEnemy, hurt, renderHud };
}
boot().catch((e) => {
  console.error(e);
  showFatal({ title: "Beklenmeyen hata", message: String((e && e.message) || e), retry: true });
});
