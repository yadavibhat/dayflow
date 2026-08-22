import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function IndexPage() {
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get("dayflow_session")?.value);

  if (hasSession) {
    redirect("/employees");
  } else {
    redirect("/signin");
  }
}
