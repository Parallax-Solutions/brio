import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/get-server-session";

export const metadata: Metadata = {
  title: "Brio — App de Finanzas Personales Costa Rica | Presupuesto Multi-Moneda",
  description:
    "La mejor aplicación de finanzas personales en Costa Rica. Controla tu presupuesto en colones y dólares, gestiona gastos recurrentes, suscripciones e ingresos. Gratis y fácil de usar.",
};

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If user is authenticated, redirect to dashboard
  const session = await getServerAuthSession();
  if (session) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
