// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/stalactite.js); içerik değiştirilmeden kopyalandı.
// stalactite - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorStalactite({ variant = 0 } = {}) {
  return createDecorFromRecipe('stalactite', { variant });
}
