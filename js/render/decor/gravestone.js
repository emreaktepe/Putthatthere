// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/gravestone.js); içerik değiştirilmeden kopyalandı.
// gravestone - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorGravestone({ variant = 0 } = {}) {
  return createDecorFromRecipe('gravestone', { variant });
}
