// "use client";

// import WedPlanNavbar from "@/components/shared/navbar";
// import { authClient } from "@/lib/auth-client";

// type NavbarUser = {
//   name: string;
//   image?: string | null;
//   role?: string;
//   subscriptionPlan?: string;
// } | null;

// interface NavbarWrapperProps {
//   user: NavbarUser;
// }

// export default function NavbarWrapper({ user }: NavbarWrapperProps) {
//   const handleLogout = async () => {
//     await authClient.signOut();
//   };

//   return (
//     <WedPlanNavbar isPending={false} user={user} onLogout={handleLogout} />
//   );
// }

"use client";

import WedPlanNavbar from "@/components/shared/navbar";
import { authClient } from "@/lib/auth-client";

export default function NavbarWrapper() {
  const { data: session, isPending } = authClient.useSession();

  const user = session?.user
    ? {
        name: session.user.name,
        image: session.user.image,
        role: (
          session.user as typeof session.user & {
            role?: string;
            subscriptionPlan?: string;
          }
        ).role,
        subscriptionPlan: (
          session.user as typeof session.user & {
            subscriptionPlan?: string;
          }
        ).subscriptionPlan,
      }
    : null;

  const handleLogout = async () => {
    await authClient.signOut();
  };

  return (
    <WedPlanNavbar isPending={isPending} user={user} onLogout={handleLogout} />
  );
}
