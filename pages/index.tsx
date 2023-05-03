import type { NextPage } from "next";
import { Numerology as NumerologyTxt } from "Utils/constaints";
import { Box, Heading, Layout, Numerology } from "Components";

const Home: NextPage = () => {
   return (
      <Layout>
         <div>
            <Heading as="h3" textAlign="center" fontFamily="fantasy" pt={4}>
               {NumerologyTxt}
            </Heading>
            <Box as="br" />
            <main>
               <Numerology />
            </main>
         </div>
      </Layout>
   );
};

export default Home;
