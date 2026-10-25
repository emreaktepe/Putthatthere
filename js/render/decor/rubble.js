// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/rubble.js); içerik değiştirilmeden kopyalandı.
// rubble - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorRubble({ variant = 0 } = {}) {
  return createDecorFromRecipe('rubble', { variant });
}
