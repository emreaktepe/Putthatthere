// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/arch.js); içerik değiştirilmeden kopyalandı.
// arch - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorArch({ variant = 0 } = {}) {
  return createDecorFromRecipe('arch', { variant });
}
