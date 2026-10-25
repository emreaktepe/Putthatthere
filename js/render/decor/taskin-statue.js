// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/taskin-statue.js); içerik değiştirilmeden kopyalandı.
// taskin-statue - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorTaskinStatue({ variant = 0 } = {}) {
  return createDecorFromRecipe('taskin-statue', { variant });
}
