import express, {Request, Response} from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import axios from "axios";
import jwt from "jsonwebtoken";
import oauth2Client from "./utils/googleauthclient";
import otpGenerator from "otp-generator";
import mailSender from "./utils/mailsender";
// Load environment variables
dotenv.config({ path: ".env" });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cookieParser());

const corsOption = {
    origin: "http://localhost:5173",
    credentials: true,
};
app.use(cors(corsOption));
app.use(express.json());

// Routes
app.get("/api/v1/oauth/google", async (req: Request, res: Response) => {
    const code = req.query.code;
    console.log(`Received authorization code: ${code}`);

    try {
        // Step 1: Exchange code for tokens
        const googleRes = await oauth2Client.getToken(typeof code === 'string' ? code : "");       
        oauth2Client.setCredentials(googleRes.tokens);
        
        // Step 2: Fetch user info
        const userRes = await axios.get(
            `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
        );
        console.log("User data received:", userRes.data);   
        const { email, name } = userRes.data;
        
        // Step 3: Generate JWT
        const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET || "chess_auth");
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict"
        });
        res.redirect(`${process.env.FRONTEND_URL}/game`);

    } catch (error) {
        console.error();
        res.status(500).json({
            success: false,
            message: 'Failed to authenticate with Google',
        });
    }
});

// app.post("/api/v1/oauth/email", (req, res) => {
//     try {
//         const email
//     }
// })

app.post("/api/v1/oauth/sendotp", async (req, res) => {
    try {
        const body = req.body;
        console.log(` body  is ${body}`);
        let otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        console.log(` otp is ${otp}`);


       const emailResponse = await mailSender(body.email,"Verification Email", `<h1>Please confirm your OTP</h1>
       <p>Here is your OTP code: ${otp}</p>`);


        console.log(`email Response is ${emailResponse}`);
        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            otp,
        });
    }catch(error){
        console.error();
        res.status(500).json({
            success: false,
            message: "Error while generating OTP",
        })
    }
});


// Start the server
const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
server.on('error', (error) => {
    console.error('Server failed to start:', error);
});

// Add global error handlers
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});