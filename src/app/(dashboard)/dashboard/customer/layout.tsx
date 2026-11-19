// app/dashboard/customer/layout.tsx

import CustomerShell from "@/components/dashboard/customer/customer-shell";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CustomerShell>{children}</CustomerShell>;
}
