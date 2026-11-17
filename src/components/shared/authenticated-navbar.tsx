import NavbarWrapper from "@/components/shared/navbar-wrapper";
import { getSession } from "@/lib/get-session";

export default async function AuthenticatedNavbar() {
  const session = await getSession();

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

  return <NavbarWrapper user={user} />;
}
