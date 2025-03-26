import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prompt as contentPrompt } from "./prompt";

export async function POST(req: NextRequest) {
   try {
      const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;

      const { messages } = await req.json();
      // Add system prompt
      const systemPrompt = {
         role: "system",
         content: contentPrompt,
      };
      // Combine system prompt with user messages
      const completeMessages = [systemPrompt, ...messages];
      if (!baseURL || !apiKey) {
         return new Response("Missing API configuration", { status: 500 });
      }

      const client = new OpenAI({
         apiKey: apiKey,
         baseURL: baseURL,
      });
      const model = process.env.NEXT_PUBLIC_MODEL || "";
      // First, send user message
      const userMessage = messages[messages.length - 1];
      // Create stream with proper encoding for useChat
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
         async start(controller) {
            try {
               // Send user message first
               controller.enqueue(
                  encoder.encode(
                     `data: ${JSON.stringify({
                        id: crypto.randomUUID(),
                        role: "user",
                        content: userMessage.content,
                        createdAt: new Date(),
                     })}\n\n`
                  )
               );
               const response = await client.chat.completions.create({
                  model: model,
                  messages: completeMessages,
                  stream: true,
               });
               for await (const chunk of response) {
                  const content = chunk.choices[0]?.delta?.content || "";
                  controller.enqueue(
                     encoder.encode(
                        `data: ${JSON.stringify({
                           id: chunk.id,
                           role: "assistant",
                           content: content,
                           createdAt: new Date(),
                        })}\n\n`
                     )
                  );
               }
               controller.enqueue(encoder.encode("data: [DONE]\n\n"));
               controller.close();
            } catch (error) {
               controller.error(error);
            }
         },
      });

      return new Response(stream, {
         headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
         },
      });
   } catch (error) {
      console.error("Error:==>", error);
      return new Response("Error processing request", { status: 500 });
   }
}

export async function GET() {
   return NextResponse.json({
      message: "This endpoint only supports POST requests.",
   });
}
