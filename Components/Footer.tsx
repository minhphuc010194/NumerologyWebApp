import { FC } from "react";
import Image from "next/image";
import { Box } from "./";

export const Footer: FC = () => {
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
            />
         </Box>
         {/* </a> */}
      </footer>
   );
};
