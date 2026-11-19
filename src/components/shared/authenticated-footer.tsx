import Footer from "@/components/shared/footer";
import { getSession } from "@/lib/get-session";

export default async function AuthenticatedFooter() {
  // const session = await auth.api.getSession({
  //   headers: await headers(),
  // });

  const session = await getSession();

  return <Footer isAuthenticated={!!session?.user} />;
}
