import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const GOOGLE_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
console.log(`id is ${GOOGLE_CLIENT_ID}`);
console.log(`secret is ${GOOGLE_CLIENT_SECRET}`);


const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT // backend redirect end point
);

export default oauth2Client;