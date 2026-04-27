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
  'prairie.butterfly': 3,
  'prairie.village': 3,
  'prairie.bird': 2,
  'prairie.island': 3,
  'prairie.cave': 2,
  'forest.brook': 2,
  'forest.boneyard': 2,
  'forest.end': 2,
  'forest.tree': 2,
  'forest.sunny': 2,
  'valley.rink': 3,
  'valley.dreams': 2,
  'valley.hermit': 2,
  'wasteland.temple': 3,
  'wasteland.battlefield': 3,
  'wasteland.graveyard': 2,
  'wasteland.crab': 2,
  'wasteland.ark': 4,
  'vault.starlight': 3,
  'vault.jelly': 2,
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
// Fully validated against April 2026 CN community calendar (12/12 correct).
// Note: the calendar itself had Apr 17 wrong — in-game observation is ground truth.
//
// ANCHOR: Sunday 2026-04-19 = forest (realm 1)
// Sunday advances +2 realms per week with no monthly reset.
//
// Per-weekday offsets from next-Sunday realm (Luxon: 1=Mon…7=Sun):
//   Sun (+0), Sat (+4), Fri (+3), Wed (+1), Tue (+0)
//
// Why Fri=+3: Friday's realm equals the PREVIOUS week's Sunday realm,
//   which is the same as next-Sunday − 2 = next-Sunday + 3 (mod 5).
// ─────────────────────────────────────────────────────────────────────────────
const ANCHOR = DateTime.fromISO('2026-04-19', { zone: 'Asia/Shanghai' });
const ANCHOR_REALM = 1;

function getSundayRealmForWeek(date: DateTime): number {
  const sunday = date.weekday === 7
    ? date
    : date.plus({ days: 7 - date.weekday });
  const weeksDiff = Math.round(sunday.diff(ANCHOR, 'weeks').weeks);
  return ((ANCHOR_REALM + weeksDiff * 2) % 5 + 5) % 5;
}

// Offset from that week's Sunday realm, by Luxon weekday (1=Mon…7=Sun)
const realmOffset: Partial<Record<number, number>> = {
  7: 0, // Sunday
  6: 4, // Saturday = Sun − 1
  5: 3, // Friday   = prev-week Sun (= nextSun + 3)
  3: 1, // Wednesday
  2: 0, // Tuesday
};

// Map list per realm — order determines cycling.
// Update these as more in-game observations confirm the rotation.
const realmMaps: Record<string, Areas[]> = {
  prairie: ['prairie.butterfly', 'prairie.village', 'prairie.bird', 'prairie.island', 'prairie.cave'],
  forest: ['forest.brook', 'forest.boneyard', 'forest.end', 'forest.tree', 'forest.sunny'],
  valley: ['valley.rink', 'valley.dreams', 'valley.hermit'],
  wasteland: ['wasteland.temple', 'wasteland.battlefield', 'wasteland.graveyard', 'wasteland.crab', 'wasteland.ark'],
  vault: ['vault.starlight', 'vault.jelly'],
};

function getNetEaseRealmRotation(date: DateTime): { realmIndex: number; map: Areas } {
  // Manual overrides take priority
  const dateStr = date.toFormat('yyyy-MM-dd');
  const manual = manualLocationOverrides.find(o => o.date === dateStr);
  if (manual) {
    return { realmIndex: manual.realmIndex, map: manual.map };
  }

  // Algorithm
  const realmIndex = (getSundayRealmForWeek(date) + (realmOffset[date.weekday] ?? 0)) % 5;
  const realmName = realms[realmIndex];
  const maps = realmMaps[realmName];

  const sunday = date.weekday === 7 ? date : date.plus({ days: 7 - date.weekday });
  const absWeek = Math.round(sunday.diff(ANCHOR, 'weeks').weeks);
  const mapIndex = ((absWeek % maps.length) + maps.length) % maps.length;

  return { realmIndex, map: maps[mapIndex] };
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

  const { realmIndex, map } = getNetEaseRealmRotation(today);
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