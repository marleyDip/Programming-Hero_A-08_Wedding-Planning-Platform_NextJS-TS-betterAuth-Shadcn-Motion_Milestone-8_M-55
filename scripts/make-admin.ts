// Creating the admin. Register the admin account normally, then promote it with a one-off script.

// scripts/make-admin.ts  (run: npx tsx scripts/make-admin.ts you@example.com)

// Important: If your environment file is named .env.local instead of .env, use this import instead:
// import dotenv from "dotenv";
// dotenv.config({ path: ".env.local" });

import "dotenv/config";
import { MongoClient } from "mongodb";

async function main() {
  const email = process.argv[2];

  // Validate the email argument
  if (!email) {
    console.error("Please provide an email address.");
    console.log("Usage: npx tsx scripts/make-admin.ts you@example.com");
    process.exitCode = 1;
    return;
  }

  // Validate MongoDB connection string
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("MONGODB_URI is not defined.");
    process.exitCode = 1;
    return;
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();

    const result = await client
      .db("wedding-planning-platform")
      .collection("user")
      .updateOne(
        { email },
        {
          $set: { role: "admin" },
        },
      );

    if (result.matchedCount > 0) {
      console.log(`Successfully promoted ${email} to admin.`);
    } else {
      console.log(`No user found with email: ${email}`);
    }
  } catch (error) {
    console.error("Failed to promote user:", error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();

/* import { MongoClient } from "mongodb";

const email = process.argv[2];
const client = new MongoClient(process.env.MONGODB_URI as string);
await client.connect();

const r = await client
  .db("wedding-planning-platform")
  .collection("user")
  .updateOne({ email }, { $set: { role: "admin" } });

console.log(r.matchedCount ? "Promoted to admin" : "No user with that email");

await client.close();
 */
