// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/rock.js); içerik değiştirilmeden kopyalandı.
// rock - Three.js r185, procedural static decoration.
import { createDecorFromRecipe } from './common.js';
export function createDecorRock({ variant = 0 } = {}) {
  return createDecorFromRecipe('rock', { variant });
}
