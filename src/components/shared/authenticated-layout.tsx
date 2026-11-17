import { headers } from "next/headers";

import Footer from "@/components/shared/footer";
import NavbarWrapper from "@/components/shared/navbar-wrapper";
import { auth } from "@/lib/auth";

export default async function AuthenticatedLayout() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const authUser = session?.user as
    | (typeof session.user & {
        role?: string;
        subscriptionPlan?: string;
      })
    | undefined;

  const user = authUser
    ? {
        name: authUser.name,
        image: authUser.image,
        role: authUser.role,
        subscriptionPlan: authUser.subscriptionPlan,
      }
    : null;

  return (
    <>
      <NavbarWrapper user={user} />
      <Footer isAuthenticated={!!session?.user} />
    </>
  );
}
