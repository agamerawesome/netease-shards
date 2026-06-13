import { DateTime, Duration } from 'luxon';
import type { Translation } from '../i18n';
import type { Override } from './remoteConfig';

const landOffset = Duration.fromObject({ minutes: 0, seconds: 0 });
const eruptionDuration = Duration.fromObject({ minutes: 52 }); // accurate landing times

const realms = ['prairie', 'forest', 'valley', 'wasteland', 'vault'] as const;
type Areas = keyof Translation['skyMaps'];

interface ShardConfig {
  hasShard: boolean;
  isRed: boolean;
  times: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARD DAY SCHEDULE
//
// First half  (1st–15th):  Black=Tue,  Red=Sat+Sun,  No shard=Mon/Wed/Thu/Fri
// Second half (16th–31st): Black=Wed,  Red=Fri+Sun,  No shard=Mon/Tue/Thu/Sat
// Sunday is always Red all month.
// ─────────────────────────────────────────────────────────────────────────────
const shardSchedule: Record<number, (dayOfMonth: number) => ShardConfig> = {
  1: (_day) => ({ hasShard: false, isRed: false, times: [] }),
  2: (day) => ({ hasShard: day <= 15, isRed: false, times: ['09:08', '14:08', '19:08'] }),
  3: (day) => ({ hasShard: day > 15, isRed: false, times: ['09:08', '15:08', '21:08'] }),
  4: (_day) => ({ hasShard: false, isRed: false, times: [] }),
  5: (day) => ({ hasShard: day > 15, isRed: true, times: ['11:08', '14:08', '23:08'] }),
  6: (day) => ({ hasShard: day <= 15, isRed: true, times: ['10:08', '14:08', '22:08'] }),
  7: (_day) => ({ hasShard: true, isRed: true, times: ['07:08', '13:08', '19:08'] }),
};


const overrideRewardAC: Record<string, number> = {
  'prairie.cave': 1.5,
  'prairie.island': 3,
  'wasteland.graveyard': 2.5,
  'wasteland.crab': 2,       // 巨兽荒原 confirmed 2红蜡 from calendar
  'forest.end': 2.5,
  'valley.dreams': 2,
};

export const numMapVarients = {
  'prairie.butterfly': 3, //Black
  'prairie.village': 3, //Black
  'prairie.bird': 2, //Red
  'prairie.island': 3, //Red
  'prairie.cave': 2, //Red
  'forest.brook': 2, //Black
  'forest.boneyard': 2, //Black
  'forest.end': 2, //Red
  'forest.tree': 2, //Red
  'forest.sunny': 2, //Red
  'valley.rink': 3, //Black
  'valley.dreams': 2, //Red
  'valley.hermit': 2, //Red
  'wasteland.temple': 3,  //Black
  'wasteland.battlefield': 3, //Black
  'wasteland.graveyard': 2, //Red
  'wasteland.crab': 2, //Red
  'wasteland.ark': 4, //Red
  'vault.starlight': 3, //black
  'vault.jelly': 2, //Red
};

// ─────────────────────────────────────────────────────────────────────────────
// MANUAL LOCATION OVERRIDES
//
// These take priority over the algorithm. Two uses:
//   1. Confirmed in-game observations — ground truth for calibration
//   2. Known upcoming dates from the CN community calendar
//
// When you observe a wrong location in-game, add it here with note: 'in-game'.
// Remove calendar entries once you've passed the date and confirmed them.
//
// realmIndex: 0=prairie  1=forest  2=valley  3=wasteland  4=vault
// ─────────────────────────────────────────────────────────────────────────────
interface ManualOverride {
  date: string;       // 'YYYY-MM-DD' CST
  realmIndex: number;
  map: Areas;
  note?: string;
}

const manualLocationOverrides: ManualOverride[] = [
  // ── Confirmed 2025 (in-game) ─────────────────────────────────────────────
  { date: '2025-09-13', realmIndex: 0, map: 'prairie.cave' },
  { date: '2025-09-14', realmIndex: 1, map: 'forest.sunny' },
  { date: '2025-09-17', realmIndex: 4, map: 'vault.starlight' },
  { date: '2025-09-19', realmIndex: 1, map: 'forest.tree' },
  { date: '2025-09-21', realmIndex: 3, map: 'wasteland.ark' },
  { date: '2025-09-24', realmIndex: 1, map: 'forest.end' },
  { date: '2025-09-26', realmIndex: 3, map: 'wasteland.crab' },
  { date: '2025-09-28', realmIndex: 0, map: 'prairie.island' },
  { date: '2025-10-05', realmIndex: 2, map: 'valley.hermit' },
  { date: '2025-10-07', realmIndex: 4, map: 'vault.starlight' },
  { date: '2025-10-11', realmIndex: 3, map: 'wasteland.graveyard' },
  { date: '2025-10-12', realmIndex: 4, map: 'vault.jelly' },
  { date: '2025-10-17', realmIndex: 4, map: 'vault.jelly' },
  { date: '2025-10-19', realmIndex: 1, map: 'forest.tree' },

  // ── Confirmed 2026 Apr (in-game, supersedes any calendar data) ────────────
  { date: '2026-04-17', realmIndex: 4, map: 'vault.jelly', note: 'calendar: 禁阁-星漠水母湾' },
  { date: '2026-04-19', realmIndex: 1, map: 'forest.sunny', note: 'in-game — 秘密花园 grandmas table' },

  // ── April 2026 calendar (CN community — algorithm already correct for these,
  //    but keeping here so display is exact even if map cycling drifts) ───────
  { date: '2026-04-04', realmIndex: 1, map: 'forest.end', note: 'calendar: 雨林-终点神殿后' },
  { date: '2026-04-05', realmIndex: 2, map: 'valley.hermit', note: 'calendar: 霞谷-雪隐峰' },
  { date: '2026-04-07', realmIndex: 4, map: 'vault.starlight', note: 'calendar: 禁阁-星光沙漠' },
  { date: '2026-04-11', realmIndex: 3, map: 'wasteland.crab', note: 'calendar: 暮土-巨兽荒原' },
  { date: '2026-04-12', realmIndex: 4, map: 'vault.jelly', note: 'calendar: 禁阁-星漠水母湾' },
  { date: '2026-04-14', realmIndex: 1, map: 'forest.sunny', note: 'calendar: 雨林-荧光森林' },
  { date: '2026-04-22', realmIndex: 4, map: 'vault.starlight', note: 'calendar: 禁阁-星光沙漠' },
  { date: '2026-04-24', realmIndex: 1, map: 'forest.tree', note: 'calendar: 雨林-大树屋' },
  { date: '2026-04-26', realmIndex: 3, map: 'wasteland.ark', note: 'calendar: 暮土-失落方舟' },
  { date: '2026-04-29', realmIndex: 1, map: 'forest.boneyard', note: 'calendar: 雨林-密林遗迹' },
  { date: '2026-05-02', realmIndex: 4, map: 'vault.jelly', note: 'calendar: 禁阁-星漠水母湾' },

  // ── May 2026 calendar ────────────────────────────────────────────────────
  { date: '2026-05-02', realmIndex: 4, map: 'vault.starlight', note: 'calendar: 星光沙漠沉船' },
  { date: '2026-05-03', realmIndex: 0, map: 'prairie.island', note: 'calendar: 云野圣岛' },
  { date: '2026-05-05', realmIndex: 2, map: 'valley.rink', note: 'calendar: 霞谷溜冰场' },
  { date: '2026-05-09', realmIndex: 1, map: 'forest.end', note: 'calendar: 雨林神殿后院' },
  { date: '2026-05-10', realmIndex: 2, map: 'valley.hermit', note: 'calendar: 霞谷雪隐峰' },
  { date: '2026-05-12', realmIndex: 4, map: 'vault.starlight', note: 'calendar: 禁阁星光沙漠' },
  { date: '2026-05-17', realmIndex: 4, map: 'vault.starlight', note: 'calendar: 星光沙漠沉船' },
  { date: '2026-05-20', realmIndex: 2, map: 'valley.rink', note: 'calendar: 霞谷溜冰场' },
  { date: '2026-05-22', realmIndex: 4, map: 'vault.starlight', note: 'calendar: 星光沙漠沉船' },
  { date: '2026-05-24', realmIndex: 1, map: 'forest.sunny', note: 'calendar: 雨林秘密花园' },
  { date: '2026-05-27', realmIndex: 4, map: 'vault.starlight', note: 'calendar: 禁阁星光沙漠' },
  { date: '2026-05-29', realmIndex: 1, map: 'forest.tree', note: 'calendar: 雨林大树屋' },
  { date: '2026-05-31', realmIndex: 3, map: 'wasteland.ark', note: 'calendar: 暮土方舟' },
];

// ─────────────────────────────────────────────────────────────────────────────
// REALM ROTATION ALGORITHM
//
// Resets each calendar month. Realm is determined purely by day-of-month:
//
//   realmIndex = (dayOfMonth + 2) % 5
//
//   day 1→3(wasteland), 2→4(vault), 3→0(prairie), 4→1(forest), 5→2(valley), …
//
// Validated against all April + May 2026 CN community calendar entries.
//
// Each map is exclusively Black or Red — the shard type for the day (from
// shardSchedule) selects which map pool to draw from within the realm.
// The specific map within the pool is not yet confirmed; the fallback cycles
// through available maps using dayOfMonth % pool.length.
//
// Manual overrides in manualLocationOverrides[] are ground truth and always
// win over the algorithm.
// ─────────────────────────────────────────────────────────────────────────────

// Maps split by shard type — a map only ever hosts one type of shard.
const blackMapsPerRealm: Record<string, Areas[]> = {
  prairie:   ['prairie.butterfly', 'prairie.village'],
  forest:    ['forest.brook', 'forest.boneyard'],
  valley:    ['valley.rink'],
  wasteland: ['wasteland.temple', 'wasteland.battlefield'],
  vault:     ['vault.starlight'],
};

const redMapsPerRealm: Record<string, Areas[]> = {
  prairie:   ['prairie.bird', 'prairie.island', 'prairie.cave'],
  forest:    ['forest.end', 'forest.tree', 'forest.sunny'],
  valley:    ['valley.dreams', 'valley.hermit'],
  wasteland: ['wasteland.graveyard', 'wasteland.crab', 'wasteland.ark'],
  vault:     ['vault.jelly'],
};

function getNetEaseRealmRotation(date: DateTime, isRed: boolean): { realmIndex: number; map: Areas } {
  const cst = date.setZone('Asia/Shanghai').startOf('day');

  // Manual overrides take priority
  const dateStr = cst.toFormat('yyyy-MM-dd');
  const manual = manualLocationOverrides.find(o => o.date === dateStr);
  if (manual) return { realmIndex: manual.realmIndex, map: manual.map };

  // Realm: monthly reset keyed to calendar day-of-month
  const realmIndex = (cst.day + 2) % 5;
  const realmName = realms[realmIndex];

  // Map: filter by shard type; cycle within pool (inner rotation unconfirmed)
  const maps = isRed ? redMapsPerRealm[realmName] : blackMapsPerRealm[realmName];
  const map = maps[cst.day % maps.length];

  return { realmIndex, map };
}

export function getShardInfo(date: DateTime, override?: Override) {
  const today = date.setZone('Asia/Shanghai').startOf('day');
  const [dayOfMth, dayOfWk] = [today.day, today.weekday];

  const shardConfig = shardSchedule[dayOfWk](dayOfMth);

  const isRed = override?.isRed ?? shardConfig.isRed;
  const hasShard = override?.hasShard ?? shardConfig.hasShard;

  if (!hasShard) {
    return {
      date,
      isRed: false,
      hasShard: false,
      offset: Duration.fromObject({ hours: 0 }),
      interval: Duration.fromObject({ hours: 0 }),
      lastEnd: today,
      realm: 'prairie',
      map: 'prairie.butterfly' as Areas,
      numVarient: 1,
      rewardAC: undefined,
      occurrences: [],
      wasOverride: !!override,
    };
  }

  const { realmIndex, map } = override?.map != null
    ? { realmIndex: override.realm ?? realms.indexOf(override.map.split('.')[0] as typeof realms[number]), map: override.map as Areas }
    : getNetEaseRealmRotation(today, isRed);
  const rewardAC = isRed ? overrideRewardAC[map] ?? 3.5 : undefined;
  const numVarient = numMapVarients[map as keyof typeof numMapVarients] ?? 1;

  const occurrences = shardConfig.times.map(timeStr => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const start = today.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
    const land = start.plus(landOffset);
    const end = start.plus(eruptionDuration);
    return { start, land, end };
  });

  return {
    date,
    isRed,
    hasShard,
    offset: Duration.fromObject({ hours: 0 }),
    interval: Duration.fromObject({ hours: 0 }),
    lastEnd: occurrences[occurrences.length - 1].end,
    realm: realms[realmIndex],
    map,
    numVarient,
    rewardAC,
    occurrences,
    wasOverride: !!override,
  };
}

export type ShardInfo = ReturnType<typeof getShardInfo>;

interface findShardOptions {
  only?: undefined | 'black' | 'red';
}

export function findNextShard(from: DateTime, opts: findShardOptions = {}): ShardInfo {
  const info = getShardInfo(from);
  const { hasShard, isRed, lastEnd } = info;
  const { only } = opts;

  if (hasShard && from < lastEnd && (!only || (only === 'red') === isRed)) {
    return info;
  } else {
    return findNextShard(from.plus({ days: 1 }), { only });
  }
}

export function getPredictedShards(from: DateTime, count: number = 7): ShardInfo[] {
  const predictions: ShardInfo[] = [];
  let currentDate = from;
  for (let i = 0; i < count; i++) {
    const shardInfo = getShardInfo(currentDate);
    if (shardInfo.hasShard) predictions.push(shardInfo);
    currentDate = currentDate.plus({ days: 1 });
  }
  return predictions;
}