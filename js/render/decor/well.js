// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/well.js); içerik değiştirilmeden kopyalandı.
// well - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorWell({ variant = 0 } = {}) {
  return createDecorFromRecipe('well', { variant });
}
