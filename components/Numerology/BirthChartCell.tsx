'use client';
import { FC, useMemo } from 'react';
import {
  Box,
  Text,
  Tooltip,
  useColorModeValue
} from '@/components';
import type { BirthChartGrid } from '@/hooks/useBirthChart';
import { useTranslations } from 'next-intl';

interface BirthChartCellProps {
  cell: BirthChartGrid;
  onClick?: (number: number) => void;
  /** Stagger delay index for animation */
  animationIndex: number;
}

export const BirthChartCell: FC<BirthChartCellProps> = ({
  cell,
  onClick,
  animationIndex
}) => {
  const tChart = useTranslations('BirthChart');
  const isPresent = cell.frequency > 0;

  // Color tokens
  const presentBg = useColorModeValue(
    'linear(to-br, brand.50, orange.50)',
    'linear(to-br, whiteAlpha.100, brand.900)'
  );
  const absentBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const presentBorder = useColorModeValue('brand.300', 'brand.600');
  const absentBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const numberColor = useColorModeValue('brand.600', 'brand.300');
  const absentNumberColor = useColorModeValue('gray.300', 'whiteAlpha.300');
  const glowColor = useColorModeValue(
    '0 0 12px rgba(221, 107, 32, 0.25)',
    '0 0 12px rgba(237, 137, 54, 0.2)'
  );
  
  const isolatedBorder = useColorModeValue('red.400', 'red.500');
  const isolatedGlow = useColorModeValue(
    '0 0 12px rgba(229, 62, 62, 0.4)',
    '0 0 12px rgba(252, 129, 129, 0.3)'
  );
  const frequencyBadgeBg = useColorModeValue('brand.500', 'brand.400');

  const displayContent = useMemo(() => {
    if (!isPresent) return String(cell.number);
    // Show the digit repeated by frequency (e.g., 1 appears 2 times → "11")
    return String(cell.number).repeat(cell.frequency);
  }, [cell.number, cell.frequency, isPresent]);

  let tooltipLabel = isPresent
    ? tChart('frequency', { count: cell.frequency })
    : tChart('absent');

  if (cell.isIsolated) {
    tooltipLabel += ` - ${tChart('isolatedNumber') || 'Bị cô lập'}`;
  }

  return (
    <Tooltip
      label={tooltipLabel}
      placement="top"
      hasArrow
      fontSize="xs"
      borderRadius="md"
    >
      <Box
        position="relative"
        w="100%"
        paddingBottom="100%"
        cursor={onClick ? 'pointer' : 'default'}
        onClick={() => onClick?.(cell.number)}
        role="button"
        aria-label={`${tChart('cellLabel', { number: cell.number })} — ${tooltipLabel}`}
        sx={{
          animation: `fadeInCell 0.4s ease-out ${animationIndex * 0.06}s both`
        }}
      >
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          bgGradient={isPresent ? presentBg : undefined}
          bg={isPresent ? undefined : absentBg}
          borderWidth={cell.isIsolated ? '2px' : '1.5px'}
          borderColor={cell.isIsolated ? isolatedBorder : (isPresent ? presentBorder : absentBorder)}
          borderStyle={isPresent ? 'solid' : 'dashed'}
          borderRadius={{ base: 'lg', md: 'xl' }}
          shadow={cell.isIsolated ? isolatedGlow : (isPresent ? glowColor : 'none')}
          transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
          _hover={{
            transform: 'scale(1.06)',
            shadow: isPresent ? 'lg' : 'md',
            borderColor: 'brand.400'
          }}
          _active={{
            transform: 'scale(0.97)'
          }}
          sx={
            isPresent
              ? { animation: 'cellPulse 3s ease-in-out infinite' }
              : undefined
          }
        >
          {/* Number display */}
          <Text
            fontSize={{ base: 'lg', sm: 'xl', md: '2xl' }}
            fontWeight={800}
            color={isPresent ? numberColor : absentNumberColor}
            lineHeight={1}
            letterSpacing={cell.frequency > 1 ? '2px' : 'normal'}
          >
            {displayContent}
          </Text>

          {/* Frequency badge - only show when > 1 */}
          {cell.frequency > 1 && (
            <Box
              position="absolute"
              top={{ base: '2px', md: '4px' }}
              right={{ base: '2px', md: '4px' }}
              bg={frequencyBadgeBg}
              color="white"
              borderRadius="full"
              w={{ base: '14px', md: '18px' }}
              h={{ base: '14px', md: '18px' }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize={{ base: '8px', md: '10px' }}
              fontWeight={700}
            >
              {cell.frequency}
            </Box>
          )}
        </Box>
      </Box>
    </Tooltip>
  );
};
