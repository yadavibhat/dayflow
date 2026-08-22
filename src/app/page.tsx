import { redirect } from "next/navigation";

export default function IndexPage() {
  // Automatically redirect the index root path "/" to "/signin"
  redirect("/signin");
}
