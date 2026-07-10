import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({
  quiet: true,  //Makes the connection to db slient and give no output
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL missing");
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
