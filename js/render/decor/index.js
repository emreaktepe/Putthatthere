// Köken: Emre'nin "Büyücünün Gecesi 3D Environment Complete v1" paketi (js/render/decor/index.js); içerik değiştirilmeden kopyalandı.
import { createDecorPine } from './pine.js';
import { createDecorDeadTree } from './dead-tree.js';
import { createDecorRock } from './rock.js';
import { createDecorGrassTuft } from './grass-tuft.js';
import { createDecorMushroomGlow } from './mushroom-glow.js';
import { createDecorLog } from './log.js';
import { createDecorStalactite } from './stalactite.js';
import { createDecorCaveCrystal } from './cave-crystal.js';
import { createDecorPuddle } from './puddle.js';
import { createDecorColumn } from './column.js';
import { createDecorArch } from './arch.js';
import { createDecorRubble } from './rubble.js';
import { createDecorRuneBanner } from './rune-banner.js';
import { createDecorGravestone } from './gravestone.js';
import { createDecorGraveMound } from './grave-mound.js';
import { createDecorIronFence } from './iron-fence.js';
import { createDecorLampPost } from './lamp-post.js';
import { createDecorCrypt } from './crypt.js';
import { createDecorIceSpike } from './ice-spike.js';
import { createDecorSnowMound } from './snow-mound.js';
import { createDecorFrozenBridge } from './frozen-bridge.js';
import { createDecorBurntHouse } from './burnt-house.js';
import { createDecorWell } from './well.js';
import { createDecorBonfire } from './bonfire.js';
import { createDecorCharredStump } from './charred-stump.js';
import { createDecorBigCrystal } from './big-crystal.js';
import { createDecorCrystalShard } from './crystal-shard.js';
import { createDecorCrystalPillar } from './crystal-pillar.js';
import { createDecorBonePile } from './bone-pile.js';
import { createDecorRibArch } from './rib-arch.js';
import { createDecorBoneTower } from './bone-tower.js';
import { createDecorCastlePillar } from './castle-pillar.js';
import { createDecorCastleBanner } from './castle-banner.js';
import { createDecorCastleWindow } from './castle-window.js';
import { createDecorShadowHeart } from './shadow-heart.js';
import { createDecorThrone } from './throne.js';
import { createDecorTaskinStatue } from './taskin-statue.js';
export const DECOR_FACTORIES = {
  'pine': createDecorPine,
  'dead-tree': createDecorDeadTree,
  'rock': createDecorRock,
  'grass-tuft': createDecorGrassTuft,
  'mushroom-glow': createDecorMushroomGlow,
  'log': createDecorLog,
  'stalactite': createDecorStalactite,
  'cave-crystal': createDecorCaveCrystal,
  'puddle': createDecorPuddle,
  'column': createDecorColumn,
  'arch': createDecorArch,
  'rubble': createDecorRubble,
  'rune-banner': createDecorRuneBanner,
  'gravestone': createDecorGravestone,
  'grave-mound': createDecorGraveMound,
  'iron-fence': createDecorIronFence,
  'lamp-post': createDecorLampPost,
  'crypt': createDecorCrypt,
  'ice-spike': createDecorIceSpike,
  'snow-mound': createDecorSnowMound,
  'frozen-bridge': createDecorFrozenBridge,
  'burnt-house': createDecorBurntHouse,
  'well': createDecorWell,
  'bonfire': createDecorBonfire,
  'charred-stump': createDecorCharredStump,
  'big-crystal': createDecorBigCrystal,
  'crystal-shard': createDecorCrystalShard,
  'crystal-pillar': createDecorCrystalPillar,
  'bone-pile': createDecorBonePile,
  'rib-arch': createDecorRibArch,
  'bone-tower': createDecorBoneTower,
  'castle-pillar': createDecorCastlePillar,
  'castle-banner': createDecorCastleBanner,
  'castle-window': createDecorCastleWindow,
  'shadow-heart': createDecorShadowHeart,
  'throne': createDecorThrone,
  'taskin-statue': createDecorTaskinStatue
};
export function createDecor(id,options={}) { const factory=DECOR_FACTORIES[id]; if(!factory) throw Error(`Unknown decor: ${id}`); return factory(options); }
