'use client';
import { FC, useCallback, useRef, useState, useEffect } from 'react';
import {
  Box,
  Text,
  HStack,
  Badge,
  Icon,
  useColorModeValue,
  Tooltip,
  MdArrowForward
} from '@/components';
import { useTranslations } from 'next-intl';
import { useBirthChart, type BirthChartArrow as ArrowData } from '@/hooks/useBirthChart';
import { BirthChartCell } from './BirthChartCell';
import { BirthChartArrow } from './BirthChartArrow';

interface BirthChartProps {
  birthDate: string;
  onCellClick?: (number: number) => void;
}

/** Row labels for the 3 planes */
const PLANE_LABELS: Record<number, string> = {
  2: 'mentalPlane',
  1: 'emotionalPlane',
  0: 'physicalPlane'
};

const BirthChartComponent: FC<BirthChartProps> = ({ birthDate, onCellClick }) => {
  const tChart = useTranslations('BirthChart');
  const { grid, arrows } = useBirthChart(birthDate);
  const gridRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(80);
  const gap = 8;

  // Responsive cell sizing
  useEffect(() => {
    const updateSize = () => {
      if (gridRef.current) {
        const containerWidth = gridRef.current.offsetWidth;
        if (containerWidth === 0) return; // Skip calculation if container is hidden/collapsed
        
        // 3 cells + 2 gaps, minus plane label space
        const availableWidth = Math.min(containerWidth - 60, 300);
        const computed = Math.floor((availableWidth - gap * 2) / 3);
        setCellSize(Math.max(50, Math.min(computed, 100)));
      }
    };

    updateSize();

    if (!gridRef.current) return;
    const observer = new ResizeObserver(() => {
      updateSize();
    });
    observer.observe(gridRef.current);

    return () => observer.disconnect();
  }, []);

  // Colors
  const titleColor = useColorModeValue('gray.700', 'gray.200');
  const planeLabelColor = useColorModeValue('gray.500', 'gray.400');
  const containerBg = useColorModeValue('white', 'gray.800');
  const containerBorder = useColorModeValue('gray.100', 'gray.700');
  const strengthBadgeBg = useColorModeValue('green.50', 'green.900');
  const strengthBadgeColor = useColorModeValue('green.600', 'green.300');
  const emptyBadgeBg = useColorModeValue('red.50', 'red.900');
  const emptyBadgeColor = useColorModeValue('red.500', 'red.300');

  // Sort grid by row (top first) then col (left first) for rendering
  const sortedGrid = [...grid].sort((a, b) => {
    if (a.row !== b.row) return b.row - a.row; // top row first
    return a.col - b.col;
  });

  const strengthArrows = arrows.filter((a) => a.type === 'strength');
  const emptyArrows = arrows.filter((a) => a.type === 'empty');

  const totalGridSize = cellSize * 3 + gap * 2;

  const renderArrowBadge = useCallback(
    (arrow: ArrowData) => {
      const isStrength = arrow.type === 'strength';
      return (
        <Tooltip
          key={arrow.id}
          label={`${arrow.numbers.join(' - ')} (${tChart(arrow.nameKey as any)})`}
          hasArrow
          fontSize="xs"
        >
          <Badge
            bg={isStrength ? strengthBadgeBg : emptyBadgeBg}
            color={isStrength ? strengthBadgeColor : emptyBadgeColor}
            borderRadius="full"
            px={2}
            py={0.5}
            fontSize="2xs"
            fontWeight={600}
            cursor="default"
          >
            {arrow.numbers.join('-')}
          </Badge>
        </Tooltip>
      );
    },
    [tChart, strengthBadgeBg, emptyBadgeBg, strengthBadgeColor, emptyBadgeColor]
  );

  return (
    <Box
      bg={containerBg}
      borderWidth="1px"
      borderColor={containerBorder}
      borderRadius="xl"
      p={{ base: 4, md: 6 }}
      shadow="sm"
      transition="all 0.3s"
      _hover={{ shadow: 'md' }}
    >
      {/* Grid Container */}
      <Box
        ref={gridRef}
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap={{ base: 2, md: 3 }}
      >
        {/* Plane labels (left side) */}
        <Box
          display={{ base: 'none', sm: 'flex' }}
          flexDirection="column"
          justifyContent="space-around"
          h={`${totalGridSize}px`}
          pr={2}
        >
          {[2, 1, 0].map((rowIndex) => (
            <Text
              key={rowIndex}
              fontSize="2xs"
              color={planeLabelColor}
              fontWeight={600}
              textTransform="uppercase"
              letterSpacing="wider"
              whiteSpace="nowrap"
              textAlign="right"
            >
              {tChart(PLANE_LABELS[rowIndex] as any)}
            </Text>
          ))}
        </Box>

        {/* Grid with SVG overlay */}
        <Box position="relative" flexShrink={0}>
          {/* 3x3 Grid */}
          <Box
            display="grid"
            gridTemplateColumns={`repeat(3, ${cellSize}px)`}
            gridTemplateRows={`repeat(3, ${cellSize}px)`}
            gap={`${gap}px`}
          >
            {sortedGrid.map((cell, index) => (
              <BirthChartCell
                key={cell.number}
                cell={cell}
                onClick={onCellClick}
                animationIndex={index}
              />
            ))}
          </Box>

          {/* SVG Arrow Overlay */}
          {arrows.length > 0 && (
            <Box
              as="svg"
              position="absolute"
              top={0}
              left={0}
              w={`${totalGridSize}px`}
              h={`${totalGridSize}px`}
              pointerEvents="none"
              overflow="visible"
            >
              {arrows.map((arrow) => (
                <BirthChartArrow
                  key={arrow.id}
                  arrow={arrow}
                  cellSize={cellSize}
                  gap={gap}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Arrow Legend */}
      {arrows.length > 0 && (
        <Box mt={4}>
          {strengthArrows.length > 0 && (
            <HStack
              spacing={2}
              justify="center"
              mb={2}
              flexWrap="wrap"
              gap={1}
            >
              <Text fontSize="xs" color={strengthBadgeColor} fontWeight={600}>
                {tChart('strengthArrow')}:
              </Text>
              {strengthArrows.map(renderArrowBadge)}
            </HStack>
          )}

          {emptyArrows.length > 0 && (
            <HStack
              spacing={2}
              justify="center"
              flexWrap="wrap"
              gap={1}
            >
              <Text fontSize="xs" color={emptyBadgeColor} fontWeight={600}>
                {tChart('emptyArrow')}:
              </Text>
              {emptyArrows.map(renderArrowBadge)}
            </HStack>
          )}
        </Box>
      )}
    </Box>
  );
};

export const BirthChart: any = BirthChartComponent;
