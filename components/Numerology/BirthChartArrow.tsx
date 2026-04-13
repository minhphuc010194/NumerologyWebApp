'use client';
import { FC } from 'react';
import { Box, useColorModeValue } from '@/components';
import type { BirthChartArrow as ArrowData } from '@/hooks/useBirthChart';

interface BirthChartArrowProps {
  arrow: ArrowData;
  /** Size of one cell in the grid (for positioning) */
  cellSize: number;
  /** Gap between cells */
  gap: number;
}

/**
 * SVG-based arrow overlay for the Birth Chart grid.
 * Renders lines across rows, columns, or diagonals.
 */
export const BirthChartArrow: FC<BirthChartArrowProps> = ({
  arrow,
  cellSize,
  gap
}) => {
  const strengthColor = useColorModeValue('#DD6B20', '#ED8936');
  const emptyColor = useColorModeValue('#CBD5E0', '#4A5568');
  const color = arrow.type === 'strength' ? strengthColor : emptyColor;
  const strokeWidth = arrow.type === 'strength' ? 2.5 : 1.5;
  const dashArray = arrow.type === 'empty' ? '6,4' : 'none';

  const totalSize = cellSize * 3 + gap * 2;
  const halfCell = cellSize / 2;

  // Calculate start and end points based on direction
  const getLineCoords = () => {
    const pos = arrow.position;

    switch (arrow.direction) {
      case 'row': {
        // Horizontal line across a row (row 0=bottom, 1=middle, 2=top)
        // In SVG: row 0 is at the bottom, so we invert
        const invertedRow = 2 - pos;
        const y = invertedRow * (cellSize + gap) + halfCell;
        return { x1: halfCell * 0.3, y1: y, x2: totalSize - halfCell * 0.3, y2: y };
      }
      case 'col': {
        // Vertical line down a column
        const x = pos * (cellSize + gap) + halfCell;
        return { x1: x, y1: halfCell * 0.3, x2: x, y2: totalSize - halfCell * 0.3 };
      }
      case 'diagonal': {
        if (pos === 0) {
          // 1-5-9: bottom-left to top-right
          return {
            x1: halfCell * 0.3,
            y1: totalSize - halfCell * 0.3,
            x2: totalSize - halfCell * 0.3,
            y2: halfCell * 0.3
          };
        }
        // 3-5-7: top-left to bottom-right
        return {
          x1: halfCell * 0.3,
          y1: halfCell * 0.3,
          x2: totalSize - halfCell * 0.3,
          y2: totalSize - halfCell * 0.3
        };
      }
      default:
        return { x1: 0, y1: 0, x2: 0, y2: 0 };
    }
  };

  const coords = getLineCoords();

  return (
    <Box
      as="line"
      x1={coords.x1}
      y1={coords.y1}
      x2={coords.x2}
      y2={coords.y2}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={dashArray}
      strokeLinecap="round"
      opacity={arrow.type === 'strength' ? 0.8 : 0.5}
      sx={{
        animation: 'drawArrow 0.8s ease-out forwards'
      }}
    />
  );
};
