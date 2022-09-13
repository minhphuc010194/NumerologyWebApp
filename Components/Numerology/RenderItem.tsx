import { FC } from "react";
import { Box, Wrap, WrapItem } from "../";
import { useProcessNumerology } from "../../Hooks";
import { DisplayCard } from "./DisplayCard";

type PropTypes = {
   name: string;
   birth: string;
};
export const RenderItem: FC<PropTypes> = ({ name, birth }) => {
   const data = useProcessNumerology(name, birth);
   console.log(data);
   return (
      <Box>
         <Wrap spacing="10px" justify="center">
            <WrapItem>
               <DisplayCard
                  title="Đường đời"
                  content={data.walksOfLife}
                  borderRadius={3}
               />
            </WrapItem>
            {/* <WrapItem>
               <DisplayCard title="Đường đời" content={data.walksOfLife} />
            </WrapItem> */}
         </Wrap>
      </Box>
   );
};
