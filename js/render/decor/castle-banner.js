// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/castle-banner.js); içerik değiştirilmeden kopyalandı.
// castle-banner - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorCastleBanner({ variant = 0 } = {}) {
  return createDecorFromRecipe('castle-banner', { variant });
}
