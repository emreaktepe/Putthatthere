// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/grass-tuft.js); içerik değiştirilmeden kopyalandı.
// grass-tuft - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorGrassTuft({ variant = 0 } = {}) {
  return createDecorFromRecipe('grass-tuft', { variant });
}
