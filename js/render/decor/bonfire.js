// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/bonfire.js); içerik değiştirilmeden kopyalandı.
// bonfire - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorBonfire({ variant = 0 } = {}) {
  return createDecorFromRecipe('bonfire', { variant });
}
