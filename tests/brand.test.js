// HEXORA marka geçişi: sabitler, karşılama (splash) gösterim kuralı, menü geçiş gecikmeleri, isim geçişinin config/doğrulayıcı ve dosyalarla uyumu.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { BRAND, ENTER_MAX_STEPS, ENTER_STAGGER_MS, SPLASH_KEY, enterDelay, sparkCount, splashModel, wordmarkSpec } from "../js/ui/brandmodel.js";
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
  assert.match(html, /og:image" content="[^"]*assets\/favicon\/og-image-alternatif\.png"/);
  assert.match(html, /twitter:image" content="[^"]*assets\/favicon\/og-image-alternatif\.png"/);
  assert.equal(man.name, BRAND.full);
  assert.equal(man.short_name, "HEXORA");
  assert.equal(man.theme_color, man.background_color);
  assert.match(html, new RegExp(`theme-color" content="${man.theme_color}"`));
  assert.match(read("admin.html"), /<title>[^<]*HEXORA/);
});

// ağacı gezer: [{ tag, attrs }]
const walk = (n, out = []) => { if (typeof n === "string") return out; out.push(n); n.children.forEach((c) => walk(c, out)); return out; };
const assetsIn = (text) => [...text.matchAll(/(?:\.\/|\/Putthatthere\/)?(assets\/[A-Za-z0-9_\-./]+\.(?:png|webp|jpg|svg|ico))/g)].map((m) => m[1]);
const exists = (p) => existsSync(new URL("../" + p, import.meta.url));

test("marka varlıkları: düz assets/favicon dosyaları var ve boyut bütçesi içinde", () => {
  const size = (p) => statSync(new URL("../" + p, import.meta.url)).size;
  assert.ok(size("assets/favicon/icon-256.webp") <= 40 * 1024);
  assert.ok(size("assets/favicon/icon-512.webp") <= 90 * 1024);
  assert.ok(size("assets/favicon/og-image-alternatif.png") <= 600 * 1024);
  for (const p of [BRAND.emblem256, BRAND.emblem512]) { assert.match(p, /^\.\/assets\/favicon\/icon-\d+\.webp$/); assert.ok(exists(p.slice(2)), p); }
});

test("başvurular: index.html, admin.html, manifest ve kaynak kodundaki tüm assets/ yolları gerçek dosyaya çıkar", () => {
  for (const f of ["index.html", "admin.html", "manifest.webmanifest", "js/ui/brandmodel.js", "js/ui/hud.js", "js/ui/map.js", "js/ui/pause.js", "css/screens.css", "css/game.css"]) {
    for (const a of assetsIn(read(f))) assert.ok(exists(a), f + " -> " + a);
  }
  assert.doesNotMatch(read("index.html") + read("admin.html") + read("manifest.webmanifest"), new RegExp(["assets/br" + "and", "kurulum/", "logo-alterna" + "tifler/", "favicon/we" + "b/", "favicon/sosy" + "al/", "favicon\\.ico"].join("|")));
  const head = read("index.html");
  assert.match(head, /rel="icon"[^>]*sizes="96x96"[^>]*icon-96\.png/);
  assert.match(head, /rel="apple-touch-icon"[^>]*apple-touch-icon\.png/);
  assert.match(head, /rel="preload"[^>]*icon-512\.webp/);
});

test("manifest ikonları: 192 ve 512 PNG, purpose any (maskable sürüm yok)", () => {
  const icons = JSON.parse(read("manifest.webmanifest")).icons;
  assert.deepEqual(icons.map((i) => i.sizes), ["192x192", "512x512"]);
  for (const i of icons) { assert.equal(i.purpose, "any"); assert.equal(i.type, "image/png"); assert.ok(exists(i.src), i.src); }
});

test("HEXORA yazı logosu üretici: HEXORA harfleri var; script/olay niteliği/dış başvuru yok; kimlikler uid ile ayrışır", () => {
  const nodes = walk(wordmarkSpec("a"));
  assert.equal(nodes[0].tag, "svg");
  assert.equal(nodes.filter((n) => n.tag === "text").map((n) => n.children[0]).join(""), "HEXORA".replace("O", "") + "HEXORA".replace("O", ""), "harfler hem maskede hem çizimde (O halka olarak çizilir)");
  assert.ok(nodes.some((n) => n.tag === "linearGradient"));
  const allowed = new Set(["svg", "defs", "linearGradient", "stop", "mask", "g", "text", "ellipse", "polygon", "path", "rect"]);
  for (const n of nodes) {
    assert.ok(allowed.has(n.tag), n.tag);
    for (const [k, v] of Object.entries(n.attrs)) {
      assert.doesNotMatch(k, /^on|href/i, k);
      assert.doesNotMatch(String(v), /javascript:|<script|https?:/i, k);
      if (/url\(/.test(String(v))) assert.match(String(v), /^url\(#[\w-]+\)$/, "yalnızca belge içi başvuru");
    }
  }
  const ids = (u) => walk(wordmarkSpec(u)).map((n) => n.attrs.id).filter(Boolean);
  assert.equal(ids("a").filter((x) => ids("b").includes(x)).length, 0);
  const tree = JSON.stringify(wordmarkSpec("a"));
  for (const id of ids("a")) assert.ok(tree.includes("url(#" + id + ")"), id + " kullanılmıyor");
});
