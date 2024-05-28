import { Numerology as NumerologyTxt } from "Utils/constaints";
import { Box, FaFire, Heading, Icon, Layout, Numerology } from "Components";
import "../styles/globals.css";

export default function HomePage() {
   return (
      <Layout>
         <div>
            <Heading as="h1" textAlign="center" fontFamily="fantasy" pt={4}>
               {NumerologyTxt}
            </Heading>
            <Box
               textAlign="center"
               fontSize="sm"
               color="gray.500"
               fontWeight={500}
               className="sparkle-effect"
            >
               {"🤖 "}Numerology with AI BOT coming soon <Icon as={FaFire} />
            </Box>
            <Box as="br" />
            <main>
               <Numerology />
            </main>
         </div>
      </Layout>
   );
}
