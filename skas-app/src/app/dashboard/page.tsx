import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardRedirect() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const role = user?.publicMetadata?.role as string ?? "teacher";

  if (role === "ppd_admin") redirect("/dashboard/ppd");
  if (role === "school_admin") redirect("/dashboard/school");
  redirect("/dashboard/teacher");
}
