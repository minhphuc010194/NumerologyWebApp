import { FC, ReactNode } from "react";
import { WrapItem } from "../";
import { NumerologyHookType } from "../../Utils/types";
import { DisplayCard } from "./DisplayCard";

type PropTypes = {
   item: NumerologyHookType;
};
export const RenderItem: FC<PropTypes> = ({ item }) => {
   return (
      <WrapItem>
         <DisplayCard
            title={item.name}
            name={item.name_en}
            // @ts-expect-error - ReactNode type compatibility with Chakra UI Text component
            content={item.value}
            borderRadius={5}
         />
      </WrapItem>
   );
};
