import { DateTime, Duration } from 'luxon';
import type { Translation } from '../i18n';
import type { Override } from './remoteConfig';

const landOffset = Duration.fromObject({ minutes: 8, seconds: 40 });
const eruptionDuration = Duration.fromObject({ minutes: 52 }); // Shards last 52 minutes

const realms = ['prairie', 'forest', 'valley', 'wasteland', 'vault'] as const;
type Areas = keyof Translation['skyMaps'];

interface ShardConfig {
  hasShard: boolean;
  isRed: boolean;
  times: string[]; // Array of start times in "HH:mm" format
}

// NetEase specific configuration
const shardSchedule: Record<number, (dayOfMonth: number) => ShardConfig> = {
  // Monday
  1: (dayOfMonth) => ({
    hasShard: false,
    isRed: false,
    times: [],
  }),
  // Tuesday (Black shards in 1st-15th)
  2: (dayOfMonth) => ({
    hasShard: dayOfMonth <= 15,
    isRed: false,
    times: ['09:08', '14:08', '19:08'],
  }),
  // Wednesday (Black shards in 16th-end)
  3: (dayOfMonth) => ({
    hasShard: dayOfMonth > 15,
    isRed: false,
    times: ['09:08', '15:08', '21:08'],
  }),
  // Thursday
  4: (dayOfMonth) => ({
    hasShard: false,
    isRed: false,
    times: [],
  }),
  // Friday (Red shards in 16th-end)
  5: (dayOfMonth) => ({
    hasShard: dayOfMonth > 15,
    isRed: true,
    times: ['11:08', '14:08', '23:08'],
  }),
  // Saturday (Red shards in 1st-15th)
  6: (dayOfMonth) => ({
    hasShard: dayOfMonth <= 15,
    isRed: true,
    times: ['10:08', '14:08', '22:08'],
  }),
  // Sunday (Red shards all month)
  7: (dayOfMonth) => ({
    hasShard: true,
    isRed: true,
    times: ['07:08', '13:08', '19:08'],
  }),
};

// Updated reward values - set to 2 candles instead of 1.5
const overrideRewardAC: Record<string, number> = {
  'prairie.cave': 2, // Daylight Prairie Cave
  'forest.end': 2,
  'valley.dreams': 2,
  'forest.tree': 2,
  'vault.jelly': 2,
  // Add other locations as needed, all set to 2 candles
};

// Used to validate variation input, not listed = 1
export const numMapVarients = {
  'prairie.butterfly': 3,
  'prairie.village': 3,
  'prairie.bird': 2,
  'prairie.island': 3,
  'prairie.cave': 2, // Daylight Prairie Cave
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

// Custom realm rotation for NetEase version
function getNetEaseRealmRotation(date: DateTime): { realmIndex: number; map: Areas } {
  const dayOfMonth = date.day;
  const month = date.month;
  const year = date.year;

  // Special case for September 13th, 2025 - Daylight Prairie Cave
  if (year === 2025 && month === 9 && dayOfMonth === 13) {
    return { realmIndex: 0, map: 'prairie.cave' };
  }

  // Calculate a predictable rotation based on day of year
  // This ensures consistent rotation across months
  const dayOfYear = date.ordinal;
  const rotationIndex = dayOfYear % 5; // 5 realms to rotate through

  // Define the rotation order
  const rotationOrder: { realmIndex: number; map: Areas }[] = [
    { realmIndex: 0, map: 'prairie.cave' },     // Prairie - Cave
    { realmIndex: 1, map: 'forest.end' },       // Forest - End
    { realmIndex: 2, map: 'valley.dreams' },    // Valley - Dreams
    { realmIndex: 3, map: 'wasteland.graveyard' }, // Wasteland - Graveyard
    { realmIndex: 4, map: 'vault.jelly' },      // Vault - Jellyfish Cove
  ];

  return rotationOrder[rotationIndex];
}

export function getShardInfo(date: DateTime, override?: Override) {
  const today = date.setZone('Asia/Shanghai').startOf('day');
  const [dayOfMth, dayOfWk] = [today.day, today.weekday];

  // Get the shard configuration for this day
  const shardConfig = shardSchedule[dayOfWk](dayOfMth);

  // Handle overrides
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
      map: 'prairie.butterfly',
      numVarient: 1,
      rewardAC: undefined,
      occurrences: [],
      wasOverride: !!override,
    };
  }

  // Use NetEase-specific realm rotation
  const { realmIndex, map } = getNetEaseRealmRotation(today);
  const rewardAC = isRed ? overrideRewardAC[map] ?? 2 : undefined; // Default to 2 candles
  const numVarient = numMapVarients[map as keyof typeof numMapVarients] ?? 1;

  // Create occurrences based on the fixed times
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
    offset: Duration.fromObject({ hours: 0 }), // Not used with fixed times
    interval: Duration.fromObject({ hours: 0 }), // Not used with fixed times
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

// Function to get predicted shards for the next few days
export function getPredictedShards(from: DateTime, count: number = 7): ShardInfo[] {
  const predictions: ShardInfo[] = [];
  let currentDate = from;

  for (let i = 0; i < count; i++) {
    const shardInfo = getShardInfo(currentDate);
    if (shardInfo.hasShard) {
      predictions.push(shardInfo);
    }
    currentDate = currentDate.plus({ days: 1 });
  }

  return predictions;
}