// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/bone-pile.js); içerik değiştirilmeden kopyalandı.
// bone-pile - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorBonePile({ variant = 0 } = {}) {
  return createDecorFromRecipe('bone-pile', { variant });
}
