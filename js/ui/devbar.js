// Geliştirici şeridi (?dev=1): yapılandırma kaynağı (repo|taslak), özet, bölüm. Yalnızca bilgi; oyun akışını etkilemez.
import { h } from "../core/dom.js";

export function devBar({ source, baseHash, warnings = 0, notices = [], level = null, wanted = false }) {
  const missed = wanted && source !== "draft"; // ?cfg=draft istendi ama uygulanmadı
  const parts = ["DEV", "kaynak: " + (source === "draft" ? "taslak" : source === "lastgood" ? "son iyi" : "repo"), "#" + baseHash, "uyarı: " + warnings];
  if (level) parts.push("bölüm: " + level);
  if (missed) parts.push("taslak uygulanmadı" + (notices.length ? " (" + notices[notices.length - 1] + ")" : ""));
  const bar = h("div", { id: "devbar", role: "status", class: missed ? "warn" : null }, parts.join(" · "));
  document.body.append(bar);
  return bar;
}
