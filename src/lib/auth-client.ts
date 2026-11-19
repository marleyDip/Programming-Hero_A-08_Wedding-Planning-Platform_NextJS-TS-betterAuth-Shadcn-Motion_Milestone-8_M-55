/**
 * Place at: lib/auth-client.ts
 *
 * Env (client):  NEXT_PUBLIC_AUTH_URL=http://localhost:3000   // wherever Better Auth is served
 */
import { inferAdditionalFields, jwtClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
// import { auth } from "@/lib/auth"

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,

  plugins: [
    // Makes `role`, `businessName`, etc. type-safe on the client.
    // These must match `user.additionalFields` in your server-side Better Auth config.
    inferAdditionalFields({
      user: {
        role: { type: "string" },
        isBlocked: { type: "boolean" },
        businessName: { type: "string" },
        subscriptionPlan: { type: "string" },
        phone: { type: "string" },
        address: { type: "string" },
      },
    }),

    jwtClient(),
  ],

  // plugins: [inferAdditionalFields<typeof auth>(), jwtClient()],
});

/* import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // baseURL: "http://localhost:3000",

  baseURL: process.env.BETTER_AUTH_URL,
});

export const { signIn, signUp, useSession } = createAuthClient();
 */
