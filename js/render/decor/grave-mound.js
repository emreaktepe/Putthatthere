// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/grave-mound.js); içerik değiştirilmeden kopyalandı.
// grave-mound - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorGraveMound({ variant = 0 } = {}) {
  return createDecorFromRecipe('grave-mound', { variant });
}
