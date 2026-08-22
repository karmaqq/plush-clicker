import { BUILDINGS_DATA, PACKS_DATA } from "./js/game-data.js";
import * as core from "./js/game-core.js";

const powerId = Object.keys(BUILDINGS_DATA).find(
  (k) => BUILDINGS_DATA[k].type === "producer" && BUILDINGS_DATA[k].outputResource === "power"
);
const uretimPack = Object.keys(PACKS_DATA).find((k) => PACKS_DATA[k].productionBonusPerLevel);
const perLvl = BUILDINGS_DATA[powerId].production;

core.state.buildings[powerId] = 40;
const r0 = core.getBuildingProduction(powerId);

core.state.packs[uretimPack] = 1;
const r1 = core.getBuildingProduction(powerId);
const rp1 = core.getResourceProduction("power");
const lvl1 = core.getBuildingProduction(powerId) / 40;

core.state.packs[uretimPack] = 2;
const r2 = core.getBuildingProduction(powerId);
const lvl2 = core.getBuildingProduction(powerId) / 40;

console.log(
  JSON.stringify(
    {
      senaryo: `${perLvl}/seviye x ${core.getBuildingCount(powerId)} seviye`,
      paket: uretimPack,
      paketsiz: r0,
      tekPaket_ttYeni: Number(r1.toFixed(2)),
      tekPaket_motor: Number(rp1.toFixed(2)),
      tekPaket_seviye: Number(lvl1.toFixed(3)),
      ikiPaket_ttYeni: Number(r2.toFixed(2)),
      ikiPaket_seviye: Number(lvl2.toFixed(3)),
    },
    null,
    2
  )
);
