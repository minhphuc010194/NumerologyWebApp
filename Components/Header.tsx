import { FC } from "react";
import Head from "next/head";

export const Header: FC = () => {
   return (
      <Head>
         <title>Numerology App</title>
         <meta name="description" content="Numerology App" />
         <link rel="icon" href="/Images/numerologyPNG.png" />
      </Head>
   );
};
