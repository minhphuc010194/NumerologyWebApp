import { FC } from "react";
import Image from "next/image";
import { Box, useColorMode } from "./";

export const Footer: FC = () => {
   const { toggleColorMode } = useColorMode();
   return (
      <footer>
         {/* <a href="/" target="_blank" rel="noopener noreferrer"> */}
         <Box textAlign="center">
            <Image
               src="/Images/numerologyPNG.png"
               alt="numerology logo"
               width="50%"
               height="50%"
               placeholder="blur"
               blurDataURL="/Images/numerologyPNG.png"
               style={{
                  cursor: "pointer",
               }}
               onClick={toggleColorMode}
            />
         </Box>
         {/* </a> */}
      </footer>
   );
};
