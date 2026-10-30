// Savaş alanı gösteriş düzeyi (tarayıcıdan okunur; saf kurallar js/core/fxlevel.js). Her bölüm girişinde yenilenir (kalite/hareket tercihi değişmiş olabilir).
import { readFxProfile } from "../core/fxlevel.js";

export const FX = readFxProfile();
export function refreshFx() { Object.assign(FX, readFxProfile()); return FX; }
