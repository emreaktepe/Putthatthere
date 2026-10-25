// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/castle-window.js); içerik değiştirilmeden kopyalandı.
// castle-window - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorCastleWindow({ variant = 0 } = {}) {
  return createDecorFromRecipe('castle-window', { variant });
}
