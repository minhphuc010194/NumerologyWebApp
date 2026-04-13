/**
 * Birth Chart calculation hook.
 * Parses a birth date into a 3×3 Pythagoras grid,
 * computes digit frequencies, and detects strength/empty arrows.
 */
import { useMemo } from 'react';

// --- Types ---

export interface BirthChartGrid {
  /** Number 1-9 */
  number: number;
  /** How many times this number appears in the birth date digits */
  frequency: number;
  /** Row index (0=bottom/physical, 1=middle/emotional, 2=top/mental) */
  row: number;
  /** Column index (0=left, 1=center, 2=right) */
  col: number;
  /** Whether this number is isolated (only applies to 1, 3, 7, 9 if no neighbors exist) */
  isIsolated: boolean;
}

export type ArrowType = 'strength' | 'empty';

export interface BirthChartArrow {
  /** Arrow identifier */
  id: string;
  /** Display name key for i18n */
  nameKey: string;
  /** Numbers included in this arrow */
  numbers: number[];
  /** Whether it's a strength or empty arrow */
  type: ArrowType;
  /** Direction for visual rendering */
  direction: 'row' | 'col' | 'diagonal';
  /** Position index for layout (row/col index or diagonal id) */
  position: number;
}

export interface BirthChartData {
  grid: BirthChartGrid[];
  arrows: BirthChartArrow[];
  frequencies: Map<number, number>;
  /** Raw digits from the birth date */
  digits: number[];
  /** Array of isolated numbers (1, 3, 7, 9 without neighbors) */
  isolatedNumbers: number[];
}

// --- Arrow Definitions ---

interface ArrowDefinition {
  id: string;
  nameKey: string;
  numbers: number[];
  direction: 'row' | 'col' | 'diagonal';
  position: number;
}

const ARROW_DEFINITIONS: ArrowDefinition[] = [
  // Rows (bottom to top)
  { id: 'row-physical', nameKey: 'arrowPhysical', numbers: [1, 4, 7], direction: 'row', position: 0 },
  { id: 'row-emotional', nameKey: 'arrowEmotional', numbers: [2, 5, 8], direction: 'row', position: 1 },
  { id: 'row-mental', nameKey: 'arrowMental', numbers: [3, 6, 9], direction: 'row', position: 2 },
  // Columns (left to right)
  { id: 'col-mind', nameKey: 'arrowMind', numbers: [1, 2, 3], direction: 'col', position: 0 },
  { id: 'col-will', nameKey: 'arrowWill', numbers: [4, 5, 6], direction: 'col', position: 1 },
  { id: 'col-action', nameKey: 'arrowAction', numbers: [7, 8, 9], direction: 'col', position: 2 },
  // Diagonals
  { id: 'diag-determination', nameKey: 'arrowDetermination', numbers: [1, 5, 9], direction: 'diagonal', position: 0 },
  { id: 'diag-spirituality', nameKey: 'arrowSpirituality', numbers: [3, 5, 7], direction: 'diagonal', position: 1 }
];

/**
 * Grid layout mapping: number → (row, col)
 * Layout follows Pythagoras convention:
 *   Row 2 (top):    3, 6, 9  ← Mental
 *   Row 1 (middle): 2, 5, 8  ← Emotional
 *   Row 0 (bottom): 1, 4, 7  ← Physical
 */
const GRID_POSITIONS: Record<number, { row: number; col: number }> = {
  3: { row: 2, col: 0 }, 6: { row: 2, col: 1 }, 9: { row: 2, col: 2 },
  2: { row: 1, col: 0 }, 5: { row: 1, col: 1 }, 8: { row: 1, col: 2 },
  1: { row: 0, col: 0 }, 4: { row: 0, col: 1 }, 7: { row: 0, col: 2 }
};

// --- Core Logic ---

function parseBirthDateToDigits(birthDate: string): number[] {
  // Remove separators, keep only digits
  const digitsString = birthDate.replace(/\D/g, '');
  return digitsString.split('').map(Number).filter((n) => n >= 0 && n <= 9);
}

function computeFrequencies(digits: number[]): Map<number, number> {
  const freq = new Map<number, number>();
  for (let i = 1; i <= 9; i++) {
    freq.set(i, 0);
  }
  for (const digit of digits) {
    if (digit >= 1 && digit <= 9) {
      freq.set(digit, (freq.get(digit) ?? 0) + 1);
    }
  }
  return freq;
}

function detectIsolated(frequencies: Map<number, number>): number[] {
  const isolated: number[] = [];
  const corners: Record<number, number[]> = {
    1: [2, 4, 5],
    3: [2, 6, 5],
    7: [4, 8, 5],
    9: [6, 8, 5]
  };

  for (const [corner, neighbors] of Object.entries(corners)) {
    const cornerNum = Number(corner);
    if ((frequencies.get(cornerNum) ?? 0) > 0) {
      const hasAdjacent = neighbors.some((n) => (frequencies.get(n) ?? 0) > 0);
      if (!hasAdjacent) {
        isolated.push(cornerNum);
      }
    }
  }
  return isolated;
}

function buildGrid(frequencies: Map<number, number>, isolatedNumbers: number[]): BirthChartGrid[] {
  const grid: BirthChartGrid[] = [];
  for (let num = 1; num <= 9; num++) {
    const pos = GRID_POSITIONS[num];
    grid.push({
      number: num,
      frequency: frequencies.get(num) ?? 0,
      row: pos.row,
      col: pos.col,
      isIsolated: isolatedNumbers.includes(num)
    });
  }
  return grid;
}

function detectArrows(frequencies: Map<number, number>): BirthChartArrow[] {
  const arrows: BirthChartArrow[] = [];

  for (const def of ARROW_DEFINITIONS) {
    const allPresent = def.numbers.every((n) => (frequencies.get(n) ?? 0) > 0);
    const allAbsent = def.numbers.every((n) => (frequencies.get(n) ?? 0) === 0);

    if (allPresent) {
      arrows.push({ ...def, type: 'strength' });
    } else if (allAbsent) {
      arrows.push({ ...def, type: 'empty' });
    }
  }

  return arrows;
}

// --- Hook ---

export function useBirthChart(birthDate: string): BirthChartData {
  return useMemo(() => {
    const digits = parseBirthDateToDigits(birthDate);
    const frequencies = computeFrequencies(digits);
    const isolatedNumbers = detectIsolated(frequencies);
    const grid = buildGrid(frequencies, isolatedNumbers);
    const arrows = detectArrows(frequencies);

    return { grid, arrows, frequencies, digits, isolatedNumbers };
  }, [birthDate]);
}
