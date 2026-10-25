// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/castle-pillar.js); içerik değiştirilmeden kopyalandı.
// castle-pillar - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorCastlePillar({ variant = 0 } = {}) {
  return createDecorFromRecipe('castle-pillar', { variant });
}
