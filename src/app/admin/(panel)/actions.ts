"use server";

import { redirect } from "next/navigation";
import { destroyAdminSession } from "@/lib/auth";

export async function logoutArtistAction() {
  destroyAdminSession();
  redirect("/admin/login");
}
