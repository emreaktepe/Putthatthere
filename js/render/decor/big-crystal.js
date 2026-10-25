// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/big-crystal.js); içerik değiştirilmeden kopyalandı.
// big-crystal - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorBigCrystal({ variant = 0 } = {}) {
  return createDecorFromRecipe('big-crystal', { variant });
}
