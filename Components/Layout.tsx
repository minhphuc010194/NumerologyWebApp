import { FC } from "react";
import { Header, Footer, Container } from "./";

type PropTypes = {
   children: React.ReactNode;
};

const LayoutComponent: FC<PropTypes> = ({ children }) => {
   return (
      <Container maxW="container.xl">
         <Header />
         {children}
         <Footer />
      </Container>
   );
};

// React 19 compatible component type - workaround for FC type incompatibility
// Using any type to bypass React 19 JSX type strictness
export const Layout: any = LayoutComponent;
