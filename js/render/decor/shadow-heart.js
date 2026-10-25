// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/shadow-heart.js); içerik değiştirilmeden kopyalandı.
// shadow-heart - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorShadowHeart({ variant = 0 } = {}) {
  return createDecorFromRecipe('shadow-heart', { variant });
}
