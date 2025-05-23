"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const axios_1 = __importDefault(require("axios"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const googleauthclient_1 = __importDefault(require("./utils/googleauthclient"));
const otp_generator_1 = __importDefault(require("otp-generator"));
const mailsender_1 = __importDefault(require("./utils/mailsender"));
// Load environment variables
dotenv_1.default.config({ path: ".env" });
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cookie_parser_1.default)());
const corsOption = {
    origin: "http://localhost:5173",
    credentials: true,
};
app.use((0, cors_1.default)(corsOption));
app.use(express_1.default.json());
// Routes
app.get("/api/v1/oauth/google", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const code = req.query.code;
    console.log(`Received authorization code: ${code}`);
    try {
        // Step 1: Exchange code for tokens
        const googleRes = yield googleauthclient_1.default.getToken(typeof code === 'string' ? code : "");
        googleauthclient_1.default.setCredentials(googleRes.tokens);
        // Step 2: Fetch user info
        const userRes = yield axios_1.default.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`);
        console.log("User data received:", userRes.data);
        const { email, name } = userRes.data;
        // Step 3: Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: 1 }, process.env.JWT_SECRET || "chess_auth");
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict"
        });
        res.redirect(`${process.env.FRONTEND_URL}/game`);
    }
    catch (error) {
        console.error();
        res.status(500).json({
            success: false,
            message: 'Failed to authenticate with Google',
        });
    }
}));
// app.post("/api/v1/oauth/email", (req, res) => {
//     try {
//         const email
//     }
// })
app.post("/api/v1/oauth/sendotp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        console.log(` body  is ${body}`);
        let otp = otp_generator_1.default.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        console.log(` otp is ${otp}`);
        const emailResponse = yield (0, mailsender_1.default)(body.email, "Verification Email", `<h1>Please confirm your OTP</h1>
       <p>Here is your OTP code: ${otp}</p>`);
        console.log(`email Response is ${emailResponse}`);
        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            otp,
        });
    }
    catch (error) {
        console.error();
        res.status(500).json({
            success: false,
            message: "Error while generating OTP",
        });
    }
}));
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
