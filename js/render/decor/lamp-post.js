// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/lamp-post.js); içerik değiştirilmeden kopyalandı.
// lamp-post - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorLampPost({ variant = 0 } = {}) {
  return createDecorFromRecipe('lamp-post', { variant });
}
