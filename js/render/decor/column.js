// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/column.js); içerik değiştirilmeden kopyalandı.
// column - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorColumn({ variant = 0 } = {}) {
  return createDecorFromRecipe('column', { variant });
}
