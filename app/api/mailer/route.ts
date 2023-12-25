import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

const host = process.env.NEXT_PUBLIC_EMAIL_SERVER_HOST;
const email = process.env.NEXT_PUBLIC_EMAIL_SERVER_USER ?? "";
const pass = process.env.NEXT_PUBLIC_EMAIL_SERVER_PASSWORD ?? "";
const port = Number(process.env.NEXT_PUBLIC_EMAIL_SERVER_PORT) ?? 0;
const reader = process.env.NEXT_PUBLIC_EMAIL_READ;
const transport: SMTPTransport.Options = {
   host,
   port,
   secure: true,
   service: "gmail",
   auth: {
      type: "LOGIN",
      user: email,
      pass,
   },
};
const transporter = nodemailer.createTransport(transport);

export async function POST(req: Request) {
   const mailOption = await req.json();

   if (!mailOption.message || !mailOption.email) {
      return NextResponse.json({ message: "Bad request", status: 400 });
   }

   try {
      // send to customer====>
      await transporter.sendMail(
         {
            from: email,
            to: mailOption.email,
            subject: "Feedback - Numerology web app",
            text: mailOption.message,
            html: "<p>Thanks for your feedback, I'll contact you when possible</p>",
         },
         function (err) {
            if (err) {
               return NextResponse.json({ message: err.message, status: 400 });
            }
         }
      );
      // send to reader====>
      await transporter.sendMail(
         {
            from: email,
            to: reader,
            subject: "Feedback - Numerology web app from " + mailOption.email,
            text: mailOption.message,
            html: `<p>${mailOption.message}</p>`,
         },
         function (err) {
            if (err) {
               return NextResponse.json({ message: err.message, status: 400 });
            }
         }
      );

      return NextResponse.json({ message: "Mail sent success", status: 200 });
   } catch (err) {
      return NextResponse.json({ message: err, status: 400 });
   }
}
