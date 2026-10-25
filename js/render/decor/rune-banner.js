// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/rune-banner.js); içerik değiştirilmeden kopyalandı.
// rune-banner - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorRuneBanner({ variant = 0 } = {}) {
  return createDecorFromRecipe('rune-banner', { variant });
}
