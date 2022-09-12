import type { NextPage } from "next";
import { Layout, Numerology } from "../Components";

const Home: NextPage = () => {
   return (
      <Layout>
         <main>
            <Numerology />
         </main>
      </Layout>
   );
};

export default Home;
