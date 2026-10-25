// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/mushroom-glow.js); içerik değiştirilmeden kopyalandı.
// mushroom-glow - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorMushroomGlow({ variant = 0 } = {}) {
  return createDecorFromRecipe('mushroom-glow', { variant });
}
