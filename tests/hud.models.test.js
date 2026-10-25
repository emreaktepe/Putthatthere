// Oyun ekranı (HUD) saf modelleri: görevler, slot kilidi, duraklatma durum makinesi, kalpler, bekleme yüzdesi.
import test from "node:test";
import assert from "node:assert/strict";
import { cooldownFrac, heartStates, isPaused, pauseReduce, questRows, slotModel, stepDt } from "../js/ui/models.js";

test("questRows: kristal hedefi ilerlemesi ve yenilen düşman (en çok 2 satır)", () => {
  const rows = questRows({ objective: "crystal", goal: 8 }, { collected: 3 }, 5, { objective: "8 mana kristali topla", kills: "Yenilen düşman" });
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((r) => r.id), ["goal", "kills"]);
  assert.equal(rows[0].value, "3/8");
  assert.equal(rows[0].icon, "crystal");
  assert.equal(rows[0].done, false);
  assert.equal(rows[0].label, "8 mana kristali topla");
  assert.equal(rows[1].value, "5");
});

test("questRows: hedef tamamlanınca done, taşan değer kırpılır; totem; süre/boss değersiz", () => {
  assert.equal(questRows({ objective: "crystal", goal: 6 }, { collected: 9 }, 0)[0].value, "6/6");
  assert.equal(questRows({ objective: "crystal", goal: 6 }, { collected: 9 }, 0)[0].done, true);
  assert.equal(questRows({ objective: "totem", goal: 3 }, { totemsDown: 1 }, 0)[0].value, "1/3");
  assert.equal(questRows({ objective: "survive", goal: 40 }, {}, 0)[0].icon, "hourglass");
  assert.equal(questRows({ objective: "boss" }, {}, 0)[0].value, "");
  assert.equal(questRows({ objective: "boss" }, {}, -4)[1].value, "0");
});

test("slotModel: kilitli slot kilit etiketi, seçili yalnız açıkken", () => {
  const open = slotModel({ name: "Ateş Topu", key: "1", unlocked: true, selected: true });
  assert.deepEqual(open, { open: true, active: true, label: "Ateş Topu (1)" });
  const locked = slotModel({ name: "Meteor", key: "7", unlocked: false, selected: true });
  assert.equal(locked.open, false);
  assert.equal(locked.active, false);
  assert.match(locked.label, /kilitli/);
  assert.match(slotModel({ key: "R", kind: "ability" }).label, /^Yetenek R: kilitli$/);
});

test("pauseReduce: Esc/P döngüsü, harita onayı, sekme gizlenmesi", () => {
  assert.equal(pauseReduce("play", "toggle"), "pause");
  assert.equal(pauseReduce("pause", "toggle"), "play");
  assert.equal(pauseReduce("leave", "toggle"), "play");
  assert.equal(pauseReduce("play", "leave"), "leave");
  assert.equal(pauseReduce("leave", "pause"), "pause"); // Vazgeç: kart duraklatmaya döner
  assert.equal(pauseReduce("pause", "resume"), "play");
  assert.equal(pauseReduce("leave", "exit"), "play");
  assert.equal(pauseReduce("play", "hide"), "pause");
  assert.equal(pauseReduce("leave", "hide"), "leave"); // zaten duraklı: onay kartı bozulmaz
  assert.equal(pauseReduce("pause", "bilinmeyen"), "pause");
});

test("pauseReduce: bölüm dışında duraklatılamaz", () => {
  for (const ev of ["toggle", "pause", "leave", "hide"]) assert.equal(pauseReduce("play", ev, false), "play");
  assert.equal(pauseReduce("pause", "toggle", false), "play");
});

test("isPaused ve stepDt: duraklatmada oyun saati 0", () => {
  assert.equal(isPaused("play"), false);
  assert.equal(isPaused("pause"), true);
  assert.equal(isPaused("leave"), true);
  assert.equal(stepDt(0.016, true), 0);
  assert.equal(stepDt(0.016, false), 0.016);
});

test("HUD: yarım kalp ve bekleme yüzdesi", () => {
  assert.deepEqual(heartStates(2.5, 3), ["full", "full", "half"]);
  assert.equal(cooldownFrac(1, 4), 0.25);
});
