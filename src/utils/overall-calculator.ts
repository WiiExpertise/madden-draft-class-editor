import { Prospect, PlayerArchetype } from '../types/draft-class';
import ovrWeights from '../assets/ovrweights.json';
import ovrWeightsPosMap from '../assets/ovrweightsPosMap.json';

interface OvrWeight {
  Pos: string;
  Archetype: string;
  DesiredLow: number;
  DesiredHigh: number;
  Sum: number;
  [key: string]: any; // For all the rating fields
}

interface PositionMap {
  [key: number]: string;
}

// Map between prospect rating names and lookup file rating names
const ratingMap: { [key: string]: string } = {
  speed: 'SpeedRating',
  acceleration: 'AccelerationRating',
  agility: 'AgilityRating',
  awareness: 'AwarenessRating',
  ballCarrierVision: 'BCVisionRating',
  blockShedding: 'BlockSheddingRating',
  breakSack: 'BreakSackRating',
  breakTackle: 'BreakTackleRating',
  carrying: 'CarryingRating',
  catching: 'CatchingRating',
  catchInTraffic: 'CatchInTrafficRating',
  changeOfDirection: 'ChangeOfDirectionRating',
  finesseMoves: 'FinesseMovesRating',
  hitPower: 'HitPowerRating',
  impactBlocking: 'ImpactBlockingRating',
  injury: 'InjuryRating',
  jukeMove: 'JukeMoveRating',
  jumping: 'JumpingRating',
  kickAccuracy: 'KickAccuracyRating',
  kickPower: 'KickPowerRating',
  leadBlock: 'LeadBlockRating',
  manCoverage: 'ManCoverageRating',
  passBlockFinesse: 'PassBlockFinesseRating',
  passBlockPower: 'PassBlockPowerRating',
  passBlock: 'PassBlockRating',
  playAction: 'PlayActionRating',
  playRecognition: 'PlayRecognitionRating',
  powerMoves: 'PowerMovesRating',
  pressCoverage: 'PressRating',
  pursuit: 'PursuitRating',
  release: 'ReleaseRating',
  shortRouteRunning: 'ShortRouteRunningRating',
  mediumRouteRunning: 'MediumRouteRunningRating',
  deepRouteRunning: 'DeepRouteRunningRating',
  runBlockFinesse: 'RunBlockFinesseRating',
  runBlockPower: 'RunBlockPowerRating',
  runBlock: 'RunBlockRating',
  spectacularCatch: 'SpectacularCatchRating',
  spinMove: 'SpinMoveRating',
  stamina: 'StaminaRating',
  stiffArm: 'StiffArmRating',
  strength: 'StrengthRating',
  tackle: 'TackleRating',
  throwAccuracyDeep: 'ThrowAccuracyDeepRating',
  throwAccuracyMid: 'ThrowAccuracyMidRating',
  throwAccuracy: 'ThrowAccuracyRating',
  throwAccuracyShort: 'ThrowAccuracyShortRating',
  throwOnTheRun: 'ThrowOnTheRunRating',
  throwPower: 'ThrowPowerRating',
  throwUnderPressure: 'ThrowUnderPressureRating',
  toughness: 'ToughnessRating',
  trucking: 'TruckingRating',
  zoneCoverage: 'ZoneCoverageRating',
};

export default function calculateBestOverall(prospect: Prospect): {
  overall: number;
  archetype: PlayerArchetype;
} {
  // Get position string from map
  const posMap = ovrWeightsPosMap as PositionMap;
  const posStr = posMap[prospect.position];
  if (!posStr) {
    return { overall: 0, archetype: PlayerArchetype.Invalid_ };
  }

  // Find best archetype for position
  const positionWeights = ovrWeights.filter((w) => w.Pos === posStr);
  let bestOverall = 0;
  let bestArchetype = PlayerArchetype.Invalid_;

  positionWeights.forEach((weight) => {
    let weightedSum = 0;
    let totalWeight = 0;

    // Calculate weighted sum for each rating
    Object.entries(weight).forEach(([key, value]) => {
      if (key.endsWith('Rating') && typeof value === 'number' && value > 0) {
        // Find the corresponding prospect rating name
        const prospectKey = Object.entries(ratingMap).find(
          ([_, lookupKey]) => lookupKey === key,
        )?.[0];

        if (prospectKey && prospectKey in prospect) {
          const ratingValue = (prospect as any)[prospectKey];
          if (typeof ratingValue === 'number') {
            // Normalize the rating value based on DesiredLow and DesiredHigh
            const normalizedValue = ((ratingValue - weight.DesiredLow) / (weight.DesiredHigh - weight.DesiredLow)) * 99;
            weightedSum += normalizedValue * value;
            totalWeight += value;
          }
        }
      }
    });

    // Calculate overall rating
    if (totalWeight > 0) {
      const overall = Math.min(99, Math.round(weightedSum / totalWeight));
      if (overall > bestOverall) {
        bestOverall = overall;
        bestArchetype = PlayerArchetype[weight.Archetype as keyof typeof PlayerArchetype];
      }
    }
  });

  return { overall: bestOverall, archetype: bestArchetype };
}
