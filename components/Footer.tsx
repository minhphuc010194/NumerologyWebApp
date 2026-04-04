"use client";
import { FC } from "react";
import Image from "next/image";
import {
  Icon,
  Wrap,
  Tooltip,
  Donate,
  Feeacback,
  CustomCard,
  useColorMode,
  AiFillGithub,
  Disclaimer,
  LanguageSwitcher,
} from "components";
import { useTranslations } from "next-intl";

export const Footer: FC = () => {
  const t = useTranslations("Footer");
  const { toggleColorMode, colorMode } = useColorMode();
  return (
    <footer>
      <Disclaimer />
      <Wrap justify="center" my={1} align="center">
        <LanguageSwitcher />
        <Tooltip label={t("mode", { mode: colorMode })} hasArrow>
          <CustomCard>
            <Image
              src="/Images/numerologyPNG.png"
              alt={t("logoAlt")}
              placeholder="blur"
              blurDataURL="/Images/numerologyPNG.png"
              style={{
                cursor: "pointer",
              }}
              width={50}
              height={50}
              onClick={toggleColorMode}
            />
          </CustomCard>
        </Tooltip>

        <Tooltip label={t("sourceCode")} hasArrow>
          <CustomCard
            as="a"
            href="https://github.com/minhphuc010194/NumerologyWebApp"
            target="_blank"
          >
            <Icon
              as={AiFillGithub}
              boxSize={12}
              border="3px solid"
              rounded="100%"
            />
          </CustomCard>
        </Tooltip>
        <Feeacback />
        <Donate />
      </Wrap>
    </footer>
  );
};
