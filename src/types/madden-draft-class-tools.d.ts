declare module 'madden-draft-class-tools' {
  export enum Position {
    'QB' = 0,
    'HB' = 1,
    'FB' = 2,
    'WR' = 3,
    'TE' = 4,
    'LT' = 5,
    'LG' = 6,
    'C' = 7,
    'RG' = 8,
    'RT' = 9,
    'LE' = 10,
    'RE' = 11,
    'DT' = 12,
    'LOLB' = 13,
    'MLB' = 14,
    'ROLB' = 15,
    'CB' = 16,
    'FS' = 17,
    'SS' = 18,
    'K' = 19,
    'P' = 20,
  }

  export interface Prospect {
    id: string;
    firstName: string;
    lastName: string;
    position: Position;
    overall: number;
    age: number;
    // Add other prospect properties as needed
  }
  export interface DraftClass {
    header: Object;
    prospects: Prospect[];
    // Add other draft class properties as needed
  }

  export function readDraftClass(filePath: string): Promise<DraftClass>;
  export function writeDraftClass(draftClass: DraftClass): Buffer;
}
