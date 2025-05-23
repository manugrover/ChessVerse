import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const mailSender = async (email : any, title : any , body:any) => {
    try {
        let transporter = nodemailer.createTransport({
            //@ts-ignore
            host?: process.env.MAILHOST,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        let info = await transporter.sendMail({
            from: "www.manuj.me - manuj grover",
            to: email,
            subject: title,
            html: body,
        });
        console.log(`Email info : ${info}`);
        return info ;
    } catch(error){
        console.error();
        return error;
    }
}

export default mailSender;