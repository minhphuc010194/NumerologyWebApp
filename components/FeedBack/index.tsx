import {
  Box,
  Icon,
  Flex,
  Tooltip,
  MdOutlineFeedback,
  useColorModeValue
} from 'components';
import { useTranslations } from 'next-intl';

export const Feeacback = ({ isHeader = false }: { isHeader?: boolean }) => {
  const t = useTranslations('Feedback');
  const hoverBg = useColorModeValue('blackAlpha.100', 'whiteAlpha.200');
  const textColor = useColorModeValue('gray.700', 'whiteAlpha.900');

  return (
    <Box>
      <Tooltip label={t('tooltip', { email: 'bumlowkey@proton.me' })} hasArrow>
        <Flex
          as="a"
          href="mailto:chauminhphuc1994it@gmail.com"
          boxSize={10}
          align="center"
          justify="center"
          rounded="full"
          color={textColor}
          _hover={{ bg: hoverBg }}
          transition="all 0.2s"
        >
          <Icon as={MdOutlineFeedback} boxSize={5} />
        </Flex>
      </Tooltip>
    </Box>
  );
};
