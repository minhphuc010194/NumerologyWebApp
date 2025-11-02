import { Box, CustomCard, Icon, MdOutlineFeedback, Tooltip } from "Components";

export const Feeacback = () => {
  return (
    <Box>
      <Tooltip label="Feedback to me: bumlowkey@proton.me" hasArrow>
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
