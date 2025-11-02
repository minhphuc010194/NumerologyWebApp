import { FC } from "react";
import { Header, Footer, Container } from "./";

type PropTypes = {
   children: React.ReactNode;
};
export const Layout: FC<PropTypes> = ({ children }) => {
   return (
      <Container maxW="container.xl">
         <Header />
         {children}
         <Footer />
      </Container>
   );
};
