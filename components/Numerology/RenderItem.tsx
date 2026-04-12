import { FC } from 'react';
import { Box, Icon, FaInfoCircle, useColorModeValue } from '@/components';
import { NumerologyHookType } from '@/utils/types';
import { DisplayCard } from './DisplayCard';
import { useTranslations } from 'next-intl';

type PropTypes = {
  item: NumerologyHookType;
  onClick?: () => void;
};
export const RenderItem: FC<PropTypes> = ({ item, onClick }) => {
  const t = useTranslations('NumerologyMetrics');
  const bgCard = useColorModeValue('blackAlpha.50', 'whiteAlpha.50');

  return (
    <Box w="100%" position="relative">
      <DisplayCard
        h="100%"
        bg={bgCard}
        title={t(item.key as any)}
        name={''}
        // @ts-expect-error - ReactNode type compatibility with Chakra UI Text component
        content={item.value}
        borderRadius={5}
        cursor="pointer"
        onClick={onClick}
        transition="all 0.2s"
        _hover={{
          transform: 'translateY(-3px)',
          shadow: 'lg',
          borderColor: 'red.400'
        }}
      />
      <Icon
        as={FaInfoCircle}
        position="absolute"
        top="8px"
        right="8px"
        color="gray.400"
        boxSize={3.5}
        opacity={0.6}
        pointerEvents="none"
      />
    </Box>
  );
};
