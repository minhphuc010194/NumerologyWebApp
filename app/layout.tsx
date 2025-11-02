import { ReactNode } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import Script from "next/script";
import { theme } from "Utils/themes";

// React 19 compatibility - cast ChakraProvider to any type
const ChakraProviderCompat = ChakraProvider as any;

export default function RootLayout({ children }: { children: ReactNode }) {
   const id = Date.now().toString();

   return (
      <html lang="en">
         <head>
            <title>Numerology Web App</title>
            <meta
               name="description"
               content="Numerology Web App - Tra cứu thần số học"
            />
            <link rel="icon" href="/Images/numerologyPNG.png" />
            {/* <script
               async
               src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4328746565330736"
               crossOrigin="anonymous"
            ></script> */}
         </head>

         <body>
            <ChakraProviderCompat theme={theme}>
               <Script
                  id={id}
                  strategy="lazyOnload"
                  src={`https://www.googletagmanager.com/gtag/js?id=${
                     process.env?.NEXT_PUBLIC_GOOGLE_ANALYTICS ??
                     "UA-137260564-1"
                  }`}
               />

               {children}
            </ChakraProviderCompat>
            <Script id={id} strategy="lazyOnload">
               {`
                     window.dataLayer = window.dataLayer || [];
                     function gtag(){dataLayer.push(arguments);}
                     gtag('js', new Date());
                     gtag('config', '${
                        process.env?.NEXT_PUBLIC_GOOGLE_ANALYTICS ??
                        "UA-137260564-1"
                     }', {
                     page_path: window.location.pathname,
                     });
                  `}
            </Script>
         </body>
      </html>
   );
}
