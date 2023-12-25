// import { ChangeEvent, useState } from "react";
import {
   Box,
   CustomCard,
   Icon,
   MdOutlineFeedback,
   Tooltip,
   // Modal,
   // ModalOverlay,
   // ModalContent,
   // ModalHeader,
   // ModalBody,
   // ModalCloseButton,
   // Button,
   // useDisclosure,
   // FormLabel,
   // Input,
   // Textarea,
   // useToast,
} from "Components";

// type State = {
//    email: string;
//    message: string;
// };
export const Feeacback = () => {
   // const { isOpen, onOpen, onClose } = useDisclosure();
   // const toast = useToast();
   // const [state, setState] = useState<State>({
   //    email: "",
   //    message: "",
   // });

   // const handleSubmit = async (e: ChangeEvent<HTMLFormElement>) => {
   //    e.preventDefault();
   //    const res = await fetch("/api/mailer", {
   //       method: "POST",
   //       body: JSON.stringify({ ...state }),
   //    });
   //    const data = await res.json();
   //    if (data.status === 200) {
   //       toast({
   //          title: data.message,
   //          status: "success",
   //          position: "top",
   //          duration: 3000,
   //          isClosable: true,
   //       });
   //    } else {
   //       toast({
   //          title: data?.message,
   //          status: "warning",
   //          position: "top",
   //          duration: 3000,
   //          isClosable: true,
   //       });
   //    }
   //    onClose();
   //    // console.log("data :>> ", data);
   // };
   return (
      <Box>
         <Tooltip label="Feedback to me: bumlowkey@proton.me" hasArrow>
            <CustomCard as="a" href="mailto:chauminhphuc1994it@gmail.com">
               <Icon
                  as={MdOutlineFeedback}
                  boxSize={12}
                  border="3px solid"
                  rounded="100%"
                  _hover={{ color: "orange" }}
               />
            </CustomCard>
         </Tooltip>

         {/* <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
               <ModalHeader>Feedback</ModalHeader>
               <ModalCloseButton />
               <ModalBody>
                  <Box onSubmit={handleSubmit} as="form">
                     <FormLabel>Email</FormLabel>
                     <Input
                        onChange={(e) =>
                           setState({ ...state, email: e.target.value })
                        }
                        type="email"
                        required
                        placeholder="Your email..."
                        autoFocus
                     />
                     <FormLabel>Message</FormLabel>
                     <Textarea
                        required
                        onChange={(e) =>
                           setState({ ...state, message: e.target.value })
                        }
                        rows={2}
                     />
                     <Box my={3}>
                        <Button type="submit" colorScheme="blue" w="100%">
                           Submit
                        </Button>
                     </Box>
                  </Box>
               </ModalBody>
            </ModalContent>
         </Modal> */}
      </Box>
   );
};
