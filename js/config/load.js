// Konfigürasyon yükleyici: fetch -> JSON.parse -> migrate -> validate (lenient) -> [taslak] -> sonuç.
// DOM'a dokunmaz; ortam (fetch, location, localStorage) parametreyle verilir, Node'da test edilir.
//
// Sonuç:
//   { ok: true,  config, source: "repo"|"draft"|"lastgood", baseHash, warnings[], notices[] }
//   { ok: false, reason: "file"|"network"|"parse"|"invalid"|"version", message, errors[], notices[] }
//
// Bozuk konfigürasyon kuralları (docs/mimari §4.3): repo JSON'u yüklenemezse "son iyi" önbellek, o da yoksa hata ekranı.
// Oyun içinde gömülü ikinci bir varsayılan TUTULMAZ. Taslak hatalıysa/eskimişse yok sayılır, repo varsayılanı kullanılır.

import { validateLenient } from "./validate.js";
import { migrate } from "./migrate.js";
import { configHash } from "./hash.js";
import { MAX_CONFIG_BYTES } from "./registry.js";
import { makeStore, resolveDraft, LASTGOOD_KEY, LASTGOOD_MAX_BYTES } from "./storage.js";

export const FILE_PROTOCOL_MESSAGE = "Bu oyun bir sunucudan açılmalı: dosyaya çift tıklamak (file://) tarayıcıda çalışmaz. Proje klasöründe `npx serve . -l 8000` çalıştırıp http://localhost:8000 adresini açın.";

// index.html'in yanındaki data/ klasörü; js/config/ içinden göreli (Pages alt yolunda da çalışır)
export const defaultConfigUrl = () => new URL("../../data/game.config.json", import.meta.url);

// ham metin -> { ok, config|errors }
export function parseAndCheck(text) {
  if (typeof text !== "string" || text.length > MAX_CONFIG_BYTES) return { ok: false, reason: "invalid", message: "Konfigürasyon çok büyük (en çok 1 MB)", errors: [] };
  let raw;
  try { raw = JSON.parse(text); } catch (e) { return { ok: false, reason: "parse", message: "Konfigürasyon JSON olarak okunamadı: " + e.message, errors: [] }; }
  const m = migrate(raw);
  if (m.error) return { ok: false, reason: "version", message: m.error, errors: [] };
  const r = validateLenient(m.config);
  if (!r.ok) {
    const ver = r.errors.some((e) => e.code === "E_VERSION");
    return { ok: false, reason: ver ? "version" : "invalid", message: ver ? r.errors.find((e) => e.code === "E_VERSION").message : "Konfigürasyon geçersiz", errors: r.errors };
  }
  return { ok: true, config: r.config, warnings: r.warnings, repaired: r.repaired, base: m.config };
}

export async function loadGameConfig(env = {}) {
  const loc = env.location || globalThis.location;
  const doFetch = env.fetch || globalThis.fetch;
  const store = env.store || makeStore(env.localStorage);
  const url = env.url || defaultConfigUrl();
  const notices = [];

  if (loc && loc.protocol === "file:") return { ok: false, reason: "file", message: FILE_PROTOCOL_MESSAGE, errors: [], notices };

  let text = null, netError = null;
  try {
    const res = await doFetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    text = await res.text();
  } catch (e) { netError = e; }

  if (text === null) {
    const cached = store.get(LASTGOOD_KEY);
    if (cached) {
      const c = parseAndCheck(cached);
      if (c.ok) {
        notices.push("Yapılandırma ağdan yüklenemedi; son çalışan kopya kullanılıyor.");
        return { ok: true, config: c.config, source: "lastgood", baseHash: configHash(c.base), warnings: c.warnings, notices };
      }
    }
    return { ok: false, reason: "network", message: "Yapılandırma yüklenemedi" + (netError && netError.message ? " (" + netError.message + ")" : ""), errors: [], notices };
  }

  const repo = parseAndCheck(text);
  if (!repo.ok) return { ...repo, notices };
  const baseHash = configHash(repo.base);
  if (repo.repaired) notices.push("Yapılandırmada küçük sapmalar onarıldı (ayrıntı konsolda).");

  // taslak katmanı: yalnızca ?cfg=draft ile
  const wantDraft = loc && typeof loc.search === "string" && /(?:^|[?&])cfg=draft(?:&|$)/.test(loc.search);
  if (wantDraft) {
    const d = resolveDraft(repo.base, store);
    if (d.status === "applied") {
      return { ok: true, config: d.config, source: "draft", baseHash, warnings: [...repo.warnings, ...(d.warnings || [])], notices };
    }
    notices.push(d.message || (d.status === "none" ? "Taslak bulunamadı; repo varsayılanı kullanılıyor." : "Taslak uygulanmadı; repo varsayılanı kullanılıyor."));
    return finish(repo, "repo", baseHash, notices, store, d.errors);
  }
  return finish(repo, "repo", baseHash, notices, store);
}

function finish(repo, source, baseHash, notices, store, draftErrors) {
  const text = JSON.stringify(repo.base);
  if (text.length <= LASTGOOD_MAX_BYTES) store.set(LASTGOOD_KEY, text);
  return { ok: true, config: repo.config, source, baseHash, warnings: repo.warnings, notices, draftErrors: draftErrors || [] };
}
