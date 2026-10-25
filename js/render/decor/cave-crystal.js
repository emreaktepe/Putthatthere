// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/cave-crystal.js); içerik değiştirilmeden kopyalandı.
// cave-crystal - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorCaveCrystal({ variant = 0 } = {}) {
  return createDecorFromRecipe('cave-crystal', { variant });
}
