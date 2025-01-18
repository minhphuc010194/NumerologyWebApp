import { NextResponse } from "next/server";
import ollama from "ollama";

export async function POST(req: { json: () => any }) {
   const body = await req.json();
   if (!body) {
      return NextResponse.json({ message: "Bad request", status: 400 });
   }

   try {
      const { messages } = body;
      const response = await ollama.chat({
         model: "llama3.1",
         messages,
         stream: true,
      });

      // Create a ReadableStream to handle the streaming response
      const stream = new ReadableStream({
         async start(controller) {
            try {
               for await (const part of response) {
                  const text = part.message.content;
                  // console.log("Streaming chunk: ", text);
                  controller.enqueue(new TextEncoder().encode(text));
               }
               controller.close();
            } catch (err) {
               console.error("Error during streaming: ", err);
               controller.error(err);
            }
         },
      });

      return new Response(stream, {
         headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Transfer-Encoding": "chunked",
         },
      });
   } catch (err) {
      console.error("Error in API handler: ", err);
      return NextResponse.json({ message: err, status: 400 });
   }
}
