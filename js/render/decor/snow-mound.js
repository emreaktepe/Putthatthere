// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/snow-mound.js); içerik değiştirilmeden kopyalandı.
// snow-mound - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorSnowMound({ variant = 0 } = {}) {
  return createDecorFromRecipe('snow-mound', { variant });
}
