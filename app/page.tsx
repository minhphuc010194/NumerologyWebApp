import Link from "next/link";
import { Numerology as NumerologyTxt } from "Utils/constaints";
import { Box, Heading, Layout, Numerology } from "Components";
import "../styles/globals.css";

export default function HomePage() {
   return (
      <Layout>
         <div>
            <Heading as="h1" textAlign="center" fontFamily="fantasy" pt={4}>
               {NumerologyTxt}
            </Heading>
            <Link href="/chat">
               <Box
                  textAlign="center"
                  fontSize="sm"
                  color="gray.500"
                  fontWeight={500}
                  className="sparkle-effect"
                  cursor="pointer"
               >
                  👉 Try Numerology with AI BOT now {"🤖 "}
               </Box>
            </Link>
            <Box as="br" />
            <main>
               <Numerology />
            </main>
         </div>
      </Layout>
   );
}
