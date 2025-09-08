import { DateTime, Duration } from 'luxon';
import type { Translation } from '../i18n';
import type { Override } from './remoteConfig';

const landOffset = Duration.fromObject({ minutes: 8, seconds: 40 }); // after start
const endOffset = Duration.fromObject({ hours: 1 }); // Changed from 4 hours to 1 hour for Light-yu

const blackShardInterval = Duration.fromObject({ hours: 8 });
const redShardInterval = Duration.fromObject({ hours: 6 });

const realms = ['prairie', 'forest', 'valley', 'wasteland', 'vault'] as const;
type Areas = keyof Translation['skyMaps'];

interface ShardConfig {
  noShardWkDay: number[];
  offset: Duration;
  interval: Duration;
  maps: [Areas, Areas, Areas, Areas, Areas];
  defRewardAC?: number;
}

// Light-yu specific configuration
const shardsInfo = [
  // First half of month (1st-15th) configuration
  {
    noShardWkDay: [1, 3, 4, 5], // Monday, Wednesday, Thursday, Friday
    interval: blackShardInterval,
    offset: Duration.fromObject({ hours: 2, minutes: 10 }),
    maps: ['prairie.village', 'forest.boneyard', 'valley.rink', 'wasteland.battlefield', 'vault.starlight'],
  },
  {
    noShardWkDay: [1, 3, 4, 5], // Monday, Wednesday, Thursday, Friday
    interval: redShardInterval,
    offset: Duration.fromObject({ hours: 7, minutes: 40 }),
    maps: ['prairie.cave', 'forest.end', 'valley.dreams', 'wasteland.graveyard', 'vault.jelly'],
    defRewardAC: 2,
  },
  // Second half of month (16th-31st) configuration
  {
    noShardWkDay: [1, 2, 4, 6], // Monday, Tuesday, Thursday, Saturday
    interval: blackShardInterval,
    offset: Duration.fromObject({ hours: 3, minutes: 30 }),
    maps: ['prairie.island', 'forest.sunny', 'valley.hermit', 'wasteland.ark', 'vault.jelly'],
  },
  {
    noShardWkDay: [1, 2, 4, 6], // Monday, Tuesday, Thursday, Saturday
    interval: redShardInterval,
    offset: Duration.fromObject({ hours: 2, minutes: 20 }),
    maps: ['prairie.bird', 'forest.tree', 'valley.dreams', 'wasteland.crab', 'vault.jelly'],
    defRewardAC: 2.5,
  },
] satisfies ShardConfig[];

const overrideRewardAC: Record<string, number> = {
  'forest.end': 2.5,
  'valley.dreams': 2.5,
  'forest.tree': 3.5,
  'vault.jelly': 3.5,
};

// Used to validate variation input, not listed = 1
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

// Function to get the first shard day of the month based on the 1st's weekday
function getFirstShardDay(firstOfMonth: DateTime): { realmIndex: number; mapIndex: number } {
  const weekday = firstOfMonth.weekday; // 1 = Monday, 7 = Sunday

  switch (weekday) {
    case 1: // Monday - No shard, next is Tuesday in Starlight Desert (Vault)
      return { realmIndex: 4, mapIndex: 0 }; // Vault, Starlight Desert
    case 2: // Tuesday - Broken Temple (Wasteland)
      return { realmIndex: 3, mapIndex: 0 }; // Wasteland, Broken Temple
    case 3: // Wednesday - No shard, next is Saturday in Forest End
      return { realmIndex: 1, mapIndex: 2 }; // Forest, Forest End
    case 4: // Thursday - No shard, next is Saturday in Prairie Caves
      return { realmIndex: 0, mapIndex: 4 }; // Prairie, Cave
    case 5: // Friday - No shard, next is Saturday in Jellyfish Cove
      return { realmIndex: 4, mapIndex: 1 }; // Vault, Jellyfish Cove
    case 6: // Saturday - Graveyard (Wasteland)
      return { realmIndex: 3, mapIndex: 2 }; // Wasteland, Graveyard
    case 7: // Sunday - Forgotten Ark (Wasteland)
      return { realmIndex: 3, mapIndex: 4 }; // Wasteland, Forgotten Ark
    default:
      return { realmIndex: 3, mapIndex: 0 }; // Default to Wasteland, Broken Temple
  }
}

export function getShardInfo(date: DateTime, override?: Override) {
  const today = date.setZone('Asia/Shanghai').startOf('day');
  const [dayOfMth, dayOfWk] = [today.day, today.weekday];

  // Determine if it's first or second half of the month
  const isFirstHalf = dayOfMth <= 15;

  // Select the appropriate config based on half of month and day type
  let configIndex: number;
  if (isFirstHalf) {
    // First half: Black on Tuesday, Red on Saturday/Sunday
    if (dayOfWk === 2) configIndex = 0; // Tuesday - Black
    else if (dayOfWk === 6 || dayOfWk === 7) configIndex = 1; // Saturday/Sunday - Red
    else configIndex = -1; // No shard
  } else {
    // Second half: Black on Wednesday, Red on Friday/Sunday
    if (dayOfWk === 3) configIndex = 2; // Wednesday - Black
    else if (dayOfWk === 5 || dayOfWk === 7) configIndex = 3; // Friday/Sunday - Red
    else configIndex = -1; // No shard
  }

  // Handle overrides
  const isRed = override?.isRed ?? (configIndex === 1 || configIndex === 3);
  const hasShard = override?.hasShard ?? (configIndex !== -1);

  if (!hasShard) {
    return {
      date,
      isRed: false,
      hasShard: false,
      offset: Duration.fromObject({ hours: 0 }),
      interval: Duration.fromObject({ hours: 0 }),
      lastEnd: today,
      realm: 'prairie',
      map: 'prairie.butterfly',
      numVarient: 1,
      rewardAC: undefined,
      occurrences: [],
      wasOverride: !!override,
    };
  }

  const { interval, offset, maps, defRewardAC } = shardsInfo[configIndex];

  // Calculate realm index based on the first of the month
  const firstOfMonth = today.startOf('month');
  const { realmIndex: firstRealmIndex, mapIndex: firstMapIndex } = getFirstShardDay(firstOfMonth);

  // Calculate the number of shard days from the first shard day to today
  let shardDaysCount = 0;
  let currentDay = firstOfMonth;

  while (currentDay <= today) {
    const currentDayOfMth = currentDay.day;
    const currentDayOfWk = currentDay.weekday;
    const isCurrentFirstHalf = currentDayOfMth <= 15;

    const hasShardToday =
      (isCurrentFirstHalf && (currentDayOfWk === 2 || currentDayOfWk === 6 || currentDayOfWk === 7)) ||
      (!isCurrentFirstHalf && (currentDayOfWk === 3 || currentDayOfWk === 5 || currentDayOfWk === 7));

    if (hasShardToday) {
      shardDaysCount++;
    }

    currentDay = currentDay.plus({ days: 1 });
  }

  // Calculate realm and map indices
  const realmIdx = override?.realm ?? (firstRealmIndex + shardDaysCount - 1) % 5;
  const map = override?.map ?? maps[realmIdx];
  const rewardAC = isRed ? overrideRewardAC[map] ?? defRewardAC : undefined;
  const numVarient = numMapVarients[map as keyof typeof numMapVarients] ?? 1;

  let firstStart = today.plus(offset);
  // Detect timezone changes (DST)
  if (dayOfWk === 7 && today.isInDST !== firstStart.isInDST) {
    firstStart = firstStart.plus({ hours: firstStart.isInDST ? -1 : 1 });
  }

  const occurrences = Array.from({ length: 3 }, (_, i) => {
    const start = firstStart.plus(interval.mapUnits(x => x * i));
    const land = start.plus(landOffset);
    const end = start.plus(endOffset); // Now only 1 hour after start
    return { start, land, end };
  });

  return {
    date,
    isRed,
    hasShard,
    offset,
    interval,
    lastEnd: occurrences[2].end,
    realm: realms[realmIdx],
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