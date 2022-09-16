import { FC } from "react";
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
            content={item.value.toString()}
            borderRadius={5}
         />
      </WrapItem>
   );
};
