"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Flex, Tooltip, useColorModeValue } from "@chakra-ui/react";
import { CustomCard } from "./CustomCard";

export const LanguageSwitcher = ({ isHeader = false }: { isHeader?: boolean }) => {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const hoverBg = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const textColor = useColorModeValue("gray.700", "whiteAlpha.900");

  const switchLocale = () => {
    const nextLocale = locale === "vi" ? "en" : "vi";
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
    router.push(`/${nextLocale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`);
  };

  return (
    <Tooltip label={locale === "vi" ? t("switchLocaleEn") : t("switchLocaleVi")} hasArrow>
      <CustomCard as="button" onClick={switchLocale} p={isHeader ? 0 : undefined} m={isHeader ? 0 : 1} bg={isHeader ? "transparent" : undefined} shadow={isHeader ? "none" : undefined} border={isHeader ? "none" : undefined}>
        {isHeader ? (
           <Flex
             boxSize={9}
             rounded="full"
             align="center"
             justify="center"
             fontSize="xs"
             fontWeight="bold"
             color={textColor}
             _hover={{ bg: hoverBg }}
             transition="all 0.2s"
           >
             {locale === "vi" ? "EN" : "VI"}
           </Flex>
        ) : (
           <Flex
             boxSize={12}
             border="3px solid"
             rounded="100%"
             align="center"
             justify="center"
             fontSize="lg"
             fontWeight="bold"
             _hover={{ color: "brand.700" }}
             transition="all 0.2s"
           >
             {locale === "vi" ? "EN" : "VI"}
           </Flex>
        )}
      </CustomCard>
    </Tooltip>
  );
};
