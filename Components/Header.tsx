import { type FC } from "react";
import Head from "next/head";

export const Header: FC = () => {
   return (
      <Head>
         <title>Numerology Web App</title>
         <meta name="description" content="Numerology Web App" />
         <link rel="icon" href="/Images/numerologyPNG.png" />
      </Head>
   );
};
