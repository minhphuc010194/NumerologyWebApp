"use client";
import { FC } from "react";
import Image from "next/image";
import {
   Icon,
   Wrap,
   Tooltip,
   Feeacback,
   CustomCard,
   useColorMode,
   AiFillGithub,
} from "Components";

export const Footer: FC = () => {
   const { toggleColorMode, colorMode } = useColorMode();
   return (
      <footer>
         <Wrap justify="center" my={1}>
            <Tooltip label={colorMode + " mode"} hasArrow>
               <CustomCard>
                  <Image
                     src="/Images/numerologyPNG.png"
                     alt="numerology logo"
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

            <Tooltip label="Source code" hasArrow>
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
         </Wrap>
      </footer>
   );
};
