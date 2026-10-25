// HEXORA marka geçişi: sabitler, karşılama (splash) gösterim kuralı, menü geçiş gecikmeleri, isim geçişinin config/doğrulayıcı ve dosyalarla uyumu.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { BRAND, ENTER_MAX_STEPS, ENTER_STAGGER_MS, SPLASH_KEY, enterDelay, sparkCount, splashModel } from "../js/ui/brandmodel.js";
import { validate } from "../js/config/validate.js";
import { UI } from "../js/ui/text.js";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const cfg = JSON.parse(read("data/game.config.json"));
const params = (s) => new URLSearchParams(s);

test("marka sabitleri: HEXORA ana ad, Büyücünün Gecesi alt başlık, slogan menü metninde", () => {
  assert.equal(BRAND.name, "HEXORA");
  assert.equal(BRAND.sub, "Büyücünün Gecesi");
  assert.equal(BRAND.full, "HEXORA: Büyücünün Gecesi");
  assert.equal(BRAND.kicker, "KARANLIĞIN KALBİ");
  assert.equal(UI.menu.subtitle, BRAND.slogan);
  assert.equal(UI.hud.brand, "HEXORA");
  assert.match(BRAND.colors.violet, /^#[0-9A-Fa-f]{6}$/);
});

test("splash: oturumda bir kez gösterilir; görülmüşse menü doğrudan açılır", () => {
  assert.equal(splashModel({ seen: false, params: params("") }).show, true);
  assert.equal(splashModel({ seen: true, params: params("") }).show, false);
  assert.equal(SPLASH_KEY.startsWith("buyucu_"), false, "kayıt anahtarlarıyla karışmamalı");
});

test("splash: azaltılmış harekette statik (still) ama yine de gösterilir; dev/debug/nosplash atlar", () => {
  assert.deepEqual(splashModel({ seen: false, reduced: true, params: params("") }), { show: true, still: true });
  assert.equal(splashModel({ reduced: false }).still, false);
  for (const q of ["dev=1", "debug", "nosplash=1", "dev=1&level=l3"]) assert.equal(splashModel({ params: params(q) }).show, false, q);
});

test("menü geçişi: 50 ms aralık, üst sınırlı; kıvılcım sayısı yatayda/düşükte yarıya iner, reduced-motion'da 0", () => {
  assert.equal(ENTER_STAGGER_MS, 50);
  assert.equal(enterDelay(0), 0);
  assert.equal(enterDelay(3), 150);
  assert.equal(enterDelay(99), ENTER_MAX_STEPS * 50);
  assert.equal(enterDelay(-2), 0);
  assert.equal(sparkCount({}), 16);
  assert.equal(sparkCount({ landscapeSmall: true }), 8);
  assert.equal(sparkCount({ low: true }), 8);
  assert.equal(sparkCount({ reduced: true, low: false }), 0);
});

test("isim geçişi: config doğrulayıcıdan geçer; başlık HEXORA ile başlar; kayıt anahtarları değişmedi", () => {
  const r = validate(cfg);
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors.slice(0, 2)));
  assert.equal(cfg.strings.title, BRAND.full);
  assert.ok(cfg.meta.name.startsWith("HEXORA"));
  assert.match(cfg.strings.opening, /Gece Kalbi/, "hikâye metinlerine dokunulmaz");
  const all = ["js/core/save.js", "js/core/quality.js", "js/audio/engine.js"].filter((p) => existsSync(new URL("../" + p, import.meta.url))).map(read).join("\n");
  assert.match(all, /buyucu_save/);
  assert.match(all, /buyucu_kalite/);
  assert.match(all, /buyucu_ses/);
});

test("meta ve manifest: HEXORA adı, og görseli yeni dosya, tema renkleri tutarlı, JSON geçerli", () => {
  const html = read("index.html"), man = JSON.parse(read("manifest.webmanifest"));
  assert.match(html, /<title>HEXORA: Büyücünün Gecesi/);
  assert.match(html, /apple-mobile-web-app-title" content="HEXORA"/);
  assert.match(html, /og:site_name" content="HEXORA"/);
  assert.match(html, /og:image" content="[^"]*assets\/brand\/hexora-og-1200x630\.jpg"/);
  assert.match(html, /twitter:image" content="[^"]*assets\/brand\/hexora-og-1200x630\.jpg"/);
  assert.equal(man.name, BRAND.full);
  assert.equal(man.short_name, "HEXORA");
  assert.equal(man.theme_color, man.background_color);
  assert.match(html, new RegExp(`theme-color" content="${man.theme_color}"`));
  assert.match(read("admin.html"), /<title>[^<]*HEXORA/);
});

test("marka varlıkları: dosyalar var, küçük ve SVG güvenli (betik yok)", () => {
  const size = (p) => statSync(new URL("../" + p, import.meta.url)).size;
  assert.ok(size("assets/brand/hexora-emblem-256.webp") <= 40 * 1024);
  assert.ok(size("assets/brand/hexora-emblem-512.webp") <= 90 * 1024);
  assert.ok(size("assets/brand/hexora-og-1200x630.jpg") < 300 * 1024);
  const svgText = read("assets/brand/hexora-wordmark.svg");
  assert.ok(svgText.length < 6000);
  assert.match(svgText, /linearGradient/);
  assert.doesNotMatch(svgText, /<script|onload|href=/i);
  for (const p of [BRAND.emblem256, BRAND.emblem512, BRAND.wordmark]) assert.ok(existsSync(new URL("../" + p.slice(2), import.meta.url)), p);
});
