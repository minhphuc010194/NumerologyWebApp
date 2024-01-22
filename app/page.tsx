import { Numerology as NumerologyTxt } from "Utils/constaints";
import { Box, Heading, Layout, Numerology } from "Components";

export default function HomePage() {
   return (
      <Layout>
         <div>
            <Heading as="h1" textAlign="center" fontFamily="fantasy" pt={4}>
               {NumerologyTxt}
            </Heading>
            <Box as="br" />
            <main>
               <Numerology />
            </main>
         </div>
      </Layout>
   );
}
