import {
  Box,
  Icon,
  Flex,
  Tooltip,
  MdOutlineFeedback,
  useColorModeValue
} from 'components';
import { useTranslations } from 'next-intl';
import { openSurveyManually } from '@/hooks/useSurveyTrigger';

export const Feeacback = ({ isHeader = false }: { isHeader?: boolean }) => {
  const t = useTranslations('Feedback');
  const hoverBg = useColorModeValue('blackAlpha.100', 'whiteAlpha.200');
  const textColor = useColorModeValue('gray.700', 'whiteAlpha.900');

  return (
    <Box>
      <Tooltip label={t('tooltip', { email: 'bumlowkey@proton.me' })} hasArrow>
        <Flex
          as="button"
          onClick={openSurveyManually}
          boxSize={10}
          align="center"
          justify="center"
          rounded="full"
          color={textColor}
          _hover={{ bg: hoverBg }}
          transition="all 0.2s"
          aria-label={t('tooltip', { email: 'bumlowkey@proton.me' })}
        >
          <Icon as={MdOutlineFeedback} boxSize={5} />
        </Flex>
      </Tooltip>
    </Box>
  );
};
