import { Box, CustomCard, Icon, MdOutlineFeedback, Tooltip, useColorModeValue, Flex } from "components";
import { useTranslations } from "next-intl";

export const Feeacback = ({ isHeader = false }: { isHeader?: boolean }) => {
  const t = useTranslations("Feedback");
  const hoverBg = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const textColor = useColorModeValue("gray.700", "whiteAlpha.900");

  return (
    <Box>
      <Tooltip label={t("tooltip", { email: "bumlowkey@proton.me" })} hasArrow>
        <CustomCard as="a" href="mailto:chauminhphuc1994it@gmail.com" p={isHeader ? 0 : undefined} m={isHeader ? 0 : 1} bg={isHeader ? "transparent" : undefined} shadow={isHeader ? "none" : undefined} border={isHeader ? "none" : undefined}>
          {isHeader ? (
             <Flex boxSize={9} align="center" justify="center" rounded="full" _hover={{ bg: hoverBg }} transition="all 0.2s" color={textColor}>
                <Icon as={MdOutlineFeedback} boxSize={5} />
             </Flex>
          ) : (
             <Icon
               as={MdOutlineFeedback}
               boxSize={12}
               border="3px solid"
               rounded="100%"
               _hover={{ color: "gold" }}
             />
          )}
        </CustomCard>
      </Tooltip>
    </Box>
  );
};
