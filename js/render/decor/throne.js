// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/throne.js); içerik değiştirilmeden kopyalandı.
// throne - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorThrone({ variant = 0 } = {}) {
  return createDecorFromRecipe('throne', { variant });
}
