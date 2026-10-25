// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/puddle.js); içerik değiştirilmeden kopyalandı.
// puddle - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorPuddle({ variant = 0 } = {}) {
  return createDecorFromRecipe('puddle', { variant });
}
