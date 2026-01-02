import SignUpForm from "@/components/auth/signup-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visondyna / Sign Up",
  description: "",
};

export default function SignUp() {
  return <SignUpForm />;
}
