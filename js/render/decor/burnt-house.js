// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/burnt-house.js); içerik değiştirilmeden kopyalandı.
// burnt-house - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorBurntHouse({ variant = 0 } = {}) {
  return createDecorFromRecipe('burnt-house', { variant });
}
