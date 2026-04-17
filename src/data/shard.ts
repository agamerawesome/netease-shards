import { DateTime, Duration } from 'luxon';
import type { Translation } from '../i18n';
import type { Override } from './remoteConfig';

const landOffset = Duration.fromObject({ minutes: 0, seconds: 0 });
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

const overrideRewardAC: Record<string, number> = {
  'prairie.cave': 1.5, // Daylight Prairie Cave
  'prairie.island': 3,
  'wasteland.graveyard': 2.5,
  'forest.end': 2.5, // Rainforest End Temple - 2025/10/04
  'valley.dreams': 2, // Wasteland Giant Creature Field - 2025/10/11
  // Add other locations as needed, all set to 3.5 candles
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
// Improved prediction algorithm for Chinese version
// Data-driven approach with fallback predictions
interface ConfirmedObservation {
  date: string; // YYYY-MM-DD format
  realmIndex: number;
  map: Areas;
}

// Store your confirmed observations here
const confirmedObservations: ConfirmedObservation[] = [
  { date: '2025-09-13', realmIndex: 0, map: 'prairie.cave' }, // Memory: unknown [?], Candles: 1.5
  { date: '2025-09-14', realmIndex: 1, map: 'forest.sunny' }, // Memory: Jellyfish [1], Candles: 3.5
  { date: '2025-09-17', realmIndex: 4, map: 'vault.starlight' }, //[Shard: Black]
  { date: '2025-09-19', realmIndex: 1, map: 'forest.tree' }, // Memory: Elder [6], Candles: 3.5
  { date: '2025-09-21', realmIndex: 3, map: 'wasteland.ark' }, // Memory: Whale Void [5], Candles: 3.5
  { date: '2025-09-24', realmIndex: 1, map: 'forest.end' }, //[Shard: Black]
  { date: '2025-09-26', realmIndex: 3, map: 'wasteland.crab' }, // IDK
  { date: '2025-09-28', realmIndex: 0, map: 'prairie.island' }, // Memory: Jellyfish [1], Candles: 3
  { date: '2025-10-04', realmIndex: 1, map: 'forest.end' }, // Memory: IDK, Candles: IDK
  { date: '2025-10-05', realmIndex: 2, map: 'valley.hermit' }, // Memory: unknown, Candles: 3.5
  { date: '2025-10-07', realmIndex: 4, map: 'vault.starlight' }, //[Black Shard]
  { date: '2025-10-11', realmIndex: 3, map: 'wasteland.graveyard' }, // Memory: Crab, Candles: 2
  { date: '2025-10-12', realmIndex: 4, map: 'vault.jelly' }, // Memory: Jellyfish [1], Candles: 3.5
  { date: '2025-10-15', realmIndex: 1, map: 'forest.brook' }, // Memory: None [Black Shard]
  { date: '2025-10-17', realmIndex: 4, map: 'vault.jelly' }, // Memory: Jellyfish [1], Candles: 3.5
  { date: '2025-10-19', realmIndex: 1, map: 'forest.tree' }, // IDK
  { date: '2025-10-21', realmIndex: 4, map: 'vault.starlight' }, // Memory: None [Black Shard]
  { date: '2026-04-19', realmIndex: 4, map: 'vault.starlight' }, // IDK
];

function getNetEaseRealmRotation(date: DateTime): { realmIndex: number; map: Areas } {
  const dateStr = date.toFormat('yyyy-MM-dd');

  // Check if we have a confirmed observation for this date
  const observation = confirmedObservations.find(obs => obs.date === dateStr);
  if (observation) {
    return { realmIndex: observation.realmIndex, map: observation.map };
  }

  // If no confirmed observation, use prediction algorithm
  return predictRealm(date);
}

function predictRealm(date: DateTime): { realmIndex: number; map: Areas } {
  // Analyze patterns from confirmed observations to make better predictions
  if (confirmedObservations.length >= 2) {
    // Simple pattern detection - you can make this more sophisticated
    const lastObservation = confirmedObservations[confirmedObservations.length - 1];
    const secondLastObservation = confirmedObservations[confirmedObservations.length - 2];

    // Check if there's a pattern in realm progression
    const realmProgress = (lastObservation.realmIndex - secondLastObservation.realmIndex + 5) % 5;

    const realmsList: Areas[] = [
      'prairie.cave', 'prairie.island', 'prairie.village',
      'forest.sunny', 'forest.end', 'forest.boneyard',
      'valley.dreams', 'valley.rink', 'valley.hermit',
      'wasteland.graveyard', 'wasteland.battlefield', 'wasteland.crab',
      'vault.starlight', 'vault.jelly'
    ];

    // Predict next in sequence
    const predictedRealmIndex = (lastObservation.realmIndex + realmProgress) % 5;
    const realmMaps = realmsList.filter(map => map.startsWith(realms[predictedRealmIndex] + '.'));

    // Select a map from this realm (you might want to make this more sophisticated)
    const map = realmMaps[Math.floor(Math.random() * realmMaps.length)] as Areas;

    return { realmIndex: predictedRealmIndex, map };
  }

  // Fallback if not enough data
  return { realmIndex: 0, map: 'prairie.butterfly' };
}

// Function to add new observations
export function addObservation(date: DateTime, realmIndex: number, map: Areas) {
  const dateStr = date.toFormat('yyyy-MM-dd');
  const existingIndex = confirmedObservations.findIndex(obs => obs.date === dateStr);

  if (existingIndex >= 0) {
    confirmedObservations[existingIndex] = { date: dateStr, realmIndex, map };
  } else {
    confirmedObservations.push({ date: dateStr, realmIndex, map });
  }

  // Sort by date
  confirmedObservations.sort((a, b) => a.date.localeCompare(b.date));
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
  const rewardAC = isRed ? overrideRewardAC[map] ?? 3.5 : undefined; // Default to 3.5 candles
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