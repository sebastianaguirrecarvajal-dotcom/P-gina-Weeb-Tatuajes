"use server";

import { redirect } from "next/navigation";
import { startClientSession, endClientSession } from "@/lib/client-session";
import { clientLoginSchema } from "@/lib/validation";

// Ingreso del cliente SIN contraseña: sólo nombre completo.
export async function loginClientAction(formData: FormData) {
  const parsed = clientLoginSchema.safeParse({
    fullName: formData.get("fullName"),
  });
  const next = (formData.get("next") as string) || "/cliente";

  if (!parsed.success) {
    redirect(`/cliente?error=1&next=${encodeURIComponent(next)}`);
  } else {
    await startClientSession(parsed.data.fullName);
    redirect(next);
  }
}

export async function logoutClientAction() {
  endClientSession();
  redirect("/");
}
