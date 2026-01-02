// types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "APPLICANT" | "HR";
      emailVerified?: boolean;
      firstname?: string;
      lastname?: string;
      profileCompleted?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email?: string | null;
    role: "ADMIN" | "APPLICANT" | "HR";
    emailVerified?: boolean;
    firstname?: string;
    lastname?: string;
  }

  interface AdapterUser {
    role: "ADMIN" | "APPLICANT" | "HR";
    emailVerified?: boolean;
    firstname?: string;
    lastname?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role: "ADMIN" | "APPLICANT" | "HR";
    emailVerified?: boolean;
    firstname?: string;
    lastname?: string;
    name?: string;
    profileCompleted?: boolean;
  }
}
