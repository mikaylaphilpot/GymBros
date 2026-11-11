import path from "node:path";
import dotenv from "dotenv";

// The project has one backend environment file: backend/.env. This module does
// not create or require another .env file. __dirname is backend/config while
// running through tsx, but becomes backend/dist/config after TypeScript
// compilation. Resolve from that known directory instead of process.cwd(),
// because npm run dev and npm start may be launched from different working
// directories and should still load backend/.env.
const configParent = path.resolve(__dirname, "..");

// In the compiled layout, configParent is backend/dist, so step back once
// more to reach the backend directory that owns the documented .env file.
const backendRoot =
  path.basename(configParent) === "dist"
    ? path.dirname(configParent)
    : configParent;

// Keep this exported so startup diagnostics and future configuration modules
// can refer to the exact environment file without duplicating path logic.
export const backendEnvPath = path.join(backendRoot, ".env");

// Load the single backend/.env file for both source and compiled layouts.
// Existing process environment variables remain available and dotenv does not
// overwrite them.
dotenv.config({ path: backendEnvPath });
