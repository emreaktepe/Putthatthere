// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/pine.js); içerik değiştirilmeden kopyalandı.
// pine - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorPine({ variant = 0 } = {}) {
  return createDecorFromRecipe('pine', { variant });
}
