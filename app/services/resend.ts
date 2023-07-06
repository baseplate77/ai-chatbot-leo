import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendMail = async (to: string, subject: string, msg: string) => {
    try {
        const data = await resend.emails.send({
            from: 'WebBotify <noreply@webbotify.com>',
            to: [to],
            subject: subject,
            html: msg
        });
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}