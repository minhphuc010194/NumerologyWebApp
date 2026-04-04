import { FC } from "react";
import { WrapItem } from "../";
import { NumerologyHookType } from "../../utils/types";
import { DisplayCard } from "./DisplayCard";
import { useTranslations } from "next-intl";

type PropTypes = {
   item: NumerologyHookType;
};
export const RenderItem: FC<PropTypes> = ({ item }) => {
   const t = useTranslations("NumerologyMetrics");
   return (
      <WrapItem>
         <DisplayCard
            title={t(item.key as any)}
            name={""}
            // @ts-expect-error - ReactNode type compatibility with Chakra UI Text component
            content={item.value}
            borderRadius={5}
         />
      </WrapItem>
   );
};
