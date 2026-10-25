// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/dead-tree.js); içerik değiştirilmeden kopyalandı.
// dead-tree - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorDeadTree({ variant = 0 } = {}) {
  return createDecorFromRecipe('dead-tree', { variant });
}
