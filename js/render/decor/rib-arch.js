// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/rib-arch.js); içerik değiştirilmeden kopyalandı.
// rib-arch - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorRibArch({ variant = 0 } = {}) {
  return createDecorFromRecipe('rib-arch', { variant });
}
