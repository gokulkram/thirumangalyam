import { redirect } from "next/navigation";

export default function IndividualRegisterPage() {
  redirect("/register?role=myself");
}
