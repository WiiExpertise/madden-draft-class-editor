const Franchise = require('madden-franchise');
const { getBinaryReferenceData } = require('madden-franchise/services/utilService');
const { tables, tablesM25 } = require('./FranchiseTableId');
const path = require('path');
const os = require('os');
const fs = require('fs');
const prompt = require('prompt-sync')();


/*******************************************************
 *                  GLOBAL CONSTANTS                   *
 *                                                     *
 *   Any constant variable that is not class-specific  *
 *   should be placed in this file.                    *
 *******************************************************/


const ZERO_REF = '00000000000000000000000000000000';
const EMPTY_STRING = "";
const BASE_FILE_INIT_KWD = 'CAREER';
const FTC_FILE_INIT_KWD = 'franchise-';
const YES_KWD = "YES";
const NO_KWD = "NO";
const FORCEQUIT_KWD = "FORCEQUIT";
const DEBUG_MODE = !process.__nexe;

// GAME YEARS
const YEARS = {
  M19: 19,
  M20: 20,
  M21: 21,
  M22: 22,
  M23: 23,
  M24: 24,
  M25: 25
};

// TYPES OF SAVE FILES
const SAVE_TYPES = {
  ROSTER: "ROSTER-",
  DRAFTCLASS: "CAREERDRAFT-",
  CPUSLIDER: "CPUSKILL-",
  PLAYERSLIDER: "PLYRSKILL-",
  TEAMBUILDER: "TEAMBUILDER-"
};

const CONTRACT_STATUSES = {
  SIGNED: 'Signed',
  FREE_AGENT: 'FreeAgent',
  PRACTICE_SQUAD: 'PracticeSquad',
  DRAFT: 'Draft',
  DRAFTED: 'Drafted',
  RETIRED: 'Retired',
  CREATED: 'Created',
  EXPIRING: 'Expiring',
  DELETED: 'Deleted',
  NONE: 'None'
}

const TABLE_NAMES = {
  PLAYER: 'Player',
  COACH: 'Coach',
  TEAM: 'Team',
  SEASON_INFO: 'SeasonInfo',
  SALARY_INFO: 'SalaryInfo',
  TEAM_ROADMAP: 'TeamRoadmap',
  COACH_TALENT_EFFECTS: 'CoachTalentEffects',
  STADIUM: 'Stadium'
}

const SEASON_STAGES = {
  PRESEASON: 'PreSeason',
  NFL_SEASON: 'NFLSeason',
  OFFSEASON: 'OffSeason'
}

const EXTRA_TEAM_NAMES = {
  AFC: 'AFC',
  NFC: 'NFC',
  FREE_AGENTS: 'Free Agents'
}
const NFL_CONFERENCES = [EXTRA_TEAM_NAMES.AFC, EXTRA_TEAM_NAMES.NFC];

const OFFENSIVE_SKILL_POSITIONS = ['QB', 'HB', 'FB', 'WR', 'TE'];
const OLINE_POSITIONS = ['LT','LG','C','RG','RT'];
const ALL_OFFENSIVE_POSITIONS = [...OFFENSIVE_SKILL_POSITIONS, ...OLINE_POSITIONS];
const DEFENSIVE_LINE_POSITIONS = ['DT','LE','RE'];
const LINEBACKER_POSITIONS = ['MLB','LOLB','ROLB'];
const DEFENSIVE_BACK_POSITIONS = ['CB','FS','SS'];
const ALL_DEFENSIVE_POSITIONS = [...DEFENSIVE_LINE_POSITIONS, ...LINEBACKER_POSITIONS, ...DEFENSIVE_BACK_POSITIONS];
const SPECIAL_TEAM_POSITIONS = ['K','P'];

const COACH_SKIN_TONES = ['SkinTone1', 'SkinTone2', 'SkinTone3', 'SkinTone4', 'SkinTone5', 'SkinTone6', 'SkinTone7'];
const COACH_APPAREL = ['Facility1', 'Facility2', 'Practice1', 'Practice2', 'Practice3', 'Staff1', 'Staff2', 'Staff3', 'Staff4'];

const BODY_MAP = {
	1: 'Thin',
	2: 'Muscular',
	3: 'Heavy'
};

// Default FULL_CONTROL settings
const USER_CONTROL_SETTINGS = [
  {label: 'Trades and Free Agency', name: 'IsTradeAndFreeAgencyEnabled', value: true},
  {label: 'Scout College Players', name: 'IsScoutCollegePlayersEnabled', value: true},
  {label: 'League Advancement', name: 'IsManualAdvancementEnabled', value: true},
  {label: 'Manage Practice Reps', name: 'IsManagePracticeRepsEnabled', value: true},
  {label: 'Injury Management', name: 'IsInjuryManagementEnabled', value: true},
  {label: 'Offseason FA Bidding', name: 'IsCPUSignOffseasonFAEnabled', value: true},
  {label: 'Contract Negotiations', name: 'IsCPUReSignPlayersEnabled', value: true},
  {label: 'Preseason Cut Days', name: 'IsCPUCutPlayersEnabled', value: true},
  {label: 'Tutorial Pop-ups', name: 'IsTutorialPopupEnabled', value: false},
  {label: 'Auto Progress Talents', name: 'IsCPUProgressTalentsEnabled', value: false},
  {label: 'Auto Progress Players', name: 'IsCPUProgressPlayersEnabled', value: false},
  {label: 'Fill Roster', name: 'IsCPUFillRosterEnabled', value: false},
  {label: 'Manual Depth Chart', name: 'IsManualReorderDepthChartEnabled', value: true},
  {label: 'Season Experience', name: 'SeasonExperience', value: 'FULL_CONTROL'},
];

// Default SIMPLE settings
const CPU_CONTROL_SETTINGS = [
  {label: 'Trades and Free Agency', name: 'IsTradeAndFreeAgencyEnabled', value: false},
  {label: 'Scout College Players', name: 'IsScoutCollegePlayersEnabled', value: false},
  {label: 'League Advancement', name: 'IsManualAdvancementEnabled', value: false},
  {label: 'Manage Practice Reps', name: 'IsManagePracticeRepsEnabled', value: false},
  {label: 'Injury Management', name: 'IsInjuryManagementEnabled', value: false},
  {label: 'Offseason FA Bidding', name: 'IsCPUSignOffseasonFAEnabled', value: false},
  {label: 'Contract Negotiations', name: 'IsCPUReSignPlayersEnabled', value: false},
  {label: 'Preseason Cut Days', name: 'IsCPUCutPlayersEnabled', value: false},
  {label: 'Tutorial Pop-ups', name: 'IsTutorialPopupEnabled', value: false},
  {label: 'Auto Progress Talents', name: 'IsCPUProgressTalentsEnabled', value: true},
  {label: 'Auto Progress Players', name: 'IsCPUProgressPlayersEnabled', value: true},
  {label: 'Fill Roster', name: 'IsCPUFillRosterEnabled', value: true},
  {label: 'Manual Depth Chart', name: 'IsManualReorderDepthChartEnabled', value: false},
  {label: 'Season Experience', name: 'SeasonExperience', value: 'SIMPLE'},
];




// Function to calculate the Best Overall and Best Archetype for a player
// This takes in a player record object; For example, if you're iterating through the player table and are working
// with row i, pass through playerTable.records[i]
// Call it exactly like this:
// const player = playerTable.records[i];
// const {newOverall, newArchetype} = FranchiseUtils.calculateBestOverall(player);

// Afterwards, you can set the overall/archetype like this:
// player.OverallRating = newOverall;
// player.PlayerType = newArchetype;

// If you use this function, you HAVE to include ovrweights/ovrweightsPosMap in your included files when compiling to an exe
function calculateBestOverall(player) {

    const ovrWeights = JSON.parse(fs.readFileSync(path.join(__dirname, 'JsonLookups/ovrweights.json'), 'utf8'));
    const ovrWeightsPosMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'JsonLookups/ovrweightsPosMap.json'), 'utf8'));

    let newOverall = 0;
    let newArchetype = "";

    const position = ovrWeightsPosMap[player.Position]; //Get position
    for (const archetype of ovrWeights) { // Iterate to find the highest archetype
        if (archetype.Pos === position) {
            const ovrObj = ovrWeights.find(weight => weight.Archetype == archetype.Archetype);
            let sum = 0;
            const properties = archetype ? Object.keys(archetype).slice(4,55) : null;

            if (properties.length > 0) {
                if (player.fields != null) {
                    for (const attr in player.fields) {
                        if (properties.includes(attr)) {
                            const attrValue = ((player[attr] - ovrObj.DesiredLow) / (ovrObj.DesiredHigh - ovrObj.DesiredLow)) * (ovrObj[attr] / ovrObj.Sum);
                            sum += attrValue;
                        }
                    }
                } else {
                    for (const attr in player) {
                        if (properties.includes(attr)) {
                            const attrValue = ((player[attr] - ovrObj.DesiredLow) / (ovrObj.DesiredHigh - ovrObj.DesiredLow)) * (ovrObj[attr] / ovrObj.Sum);
                            sum += attrValue;
                        }
                    }
                }
            }

            const overall = Math.round(Math.min(sum * 99, 99));

            if (overall > newOverall) {
                newOverall = overall;
                newArchetype = archetype.Archetype;
            }
        }
    }

    // Return the highest overall/archetype
    return { newOverall, newArchetype };
};