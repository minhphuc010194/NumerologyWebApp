import { Box, CustomCard, Icon, MdOutlineFeedback, Tooltip } from "components";
import { useTranslations } from "next-intl";

export const Feeacback = () => {
  const t = useTranslations("Feedback");
  return (
    <Box>
      <Tooltip label={t("tooltip", { email: "bumlowkey@proton.me" })} hasArrow>
        <CustomCard as="a" href="mailto:chauminhphuc1994it@gmail.com">
          <Icon
            as={MdOutlineFeedback}
            boxSize={12}
            border="3px solid"
            rounded="100%"
            _hover={{ color: "gold" }}
          />
        </CustomCard>
      </Tooltip>
    </Box>
  );
};
