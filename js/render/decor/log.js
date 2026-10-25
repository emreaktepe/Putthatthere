// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/log.js); içerik değiştirilmeden kopyalandı.
// log - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorLog({ variant = 0 } = {}) {
  return createDecorFromRecipe('log', { variant });
}
