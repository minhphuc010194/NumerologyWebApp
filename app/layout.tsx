"use client";
import { ReactNode } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import Script from "next/script";
import { theme } from "../Utils/themes";

export default function RootLayout({ children }: { children: ReactNode }) {
   const id = Date.now().toString();

   return (
      <html lang="en">
         <body>
            <ChakraProvider theme={theme}>
               <Script
                  id={id}
                  strategy="lazyOnload"
                  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`}
               />

               <Script id={id} strategy="lazyOnload">
                  {`
                     window.dataLayer = window.dataLayer || [];
                     function gtag(){dataLayer.push(arguments);}
                     gtag('js', new Date());
                     gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}', {
                     page_path: window.location.pathname,
                     });
                  `}
               </Script>
               {children}
            </ChakraProvider>
         </body>
      </html>
   );
}

// import { cookies } from 'next/headers';
// import { ClientCookiesProvider } from '@/components/client';
// import { Providers } from '@/components/client';
// import { ReactNode, Locale } from '@/types';

// export const metadata = {
//   title: 'Sieutoc Website',
//   description: 'Generated by Sieutoc Platform',
// };

// export default async function RootLayout({
//   children,
//   params,
// }: {
//   children: ReactNode;
//   params: { locale: Locale };
// }) {
//   return (
//     <html lang={params.locale}>
//       <body>
//         <ClientCookiesProvider value={cookies().getAll()}>
//           <Providers>{children}</Providers>
//         </ClientCookiesProvider>
//       </body>
//     </html>
//   );
// }