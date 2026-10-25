"use server";

import { redirect } from "next/navigation";
import { authenticateArtist, createAdminSession } from "@/lib/auth";

export async function loginArtistAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const studio = await authenticateArtist(email, password);
  if (!studio) {
    redirect("/admin/login?error=1");
  } else {
    await createAdminSession(studio.id);
    redirect("/admin");
  }
}
