// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/crypt.js); içerik değiştirilmeden kopyalandı.
// crypt - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorCrypt({ variant = 0 } = {}) {
  return createDecorFromRecipe('crypt', { variant });
}
