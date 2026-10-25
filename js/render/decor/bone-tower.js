// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/bone-tower.js); içerik değiştirilmeden kopyalandı.
// bone-tower - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorBoneTower({ variant = 0 } = {}) {
  return createDecorFromRecipe('bone-tower', { variant });
}
