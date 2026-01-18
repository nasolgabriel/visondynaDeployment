// lib/auth.ts
import prisma from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";
import VerificationEmail from "@/components/email/verification-email";
import { getBaseUrl } from "@/lib/utils";

const resend = new Resend(process.env.RESEND_API_KEY);

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email ?? "";
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            firstname: true,
            lastname: true,
            role: true,
            password: true,
            emailVerified: true,
            applicantInfo: { select: { profileCompleted: true } },
          },
        });
        if (!user) return null;

        if (!user.emailVerified) return null;

        const match = await bcrypt.compare(password, user.password);
        if (!match) return null;

        return {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          role: user.role,
          emailVerified: Boolean(user.emailVerified),
          profileCompleted: Boolean(user.applicantInfo?.profileCompleted),
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") return true;

      const baseUrl = getBaseUrl();
      const email = user.email ?? "";
      if (!email) {
        const url = new URL("/auth/signin", baseUrl);
        url.searchParams.set("error", "OAuthNoEmail");
        return url.toString();
      }

      const displayName = user.name ?? "";
      const [first, ...rest] = displayName.split(" ");
      const firstname = first || "User";
      const lastname =
        rest.join(" ") ||
        (account.provider === "google" ? "Google" : "Facebook");

      const existing = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          emailVerified: true,
          applicantInfo: { select: { profileCompleted: true } },
        },
      });

      let userId: string;
      let alreadyVerified = false;

      if (!existing) {
        const passwordHash = await bcrypt.hash(
          `oauth-${account.provider}-${crypto.randomBytes(48).toString("hex")}`,
          10,
        );

        const created = await prisma.user.create({
          data: {
            email,
            firstname,
            lastname,
            birthDate: new Date("1970-01-01"),
            gender: "unspecified",
            role: "APPLICANT",
            password: passwordHash,
            applicantInfo: { create: { profileCompleted: false } },
          },
          select: { id: true },
        });
        userId = created.id;
      } else {
        userId = existing.id;
        alreadyVerified = Boolean(existing.emailVerified);
        if (!existing.applicantInfo) {
          await prisma.profile.create({
            data: { userId, profileCompleted: false },
          });
        }
      }

      if (!alreadyVerified) {
        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto
          .createHash("sha256")
          .update(token)
          .digest("hex");
        const expires = new Date(Date.now() + 30 * 60 * 1000);

        await prisma.emailVerificationToken.upsert({
          where: { userId },
          update: { tokenHash, expires },
          create: { userId, tokenHash, expires },
        });

        const verifyUrl = `${baseUrl}/auth/verify-email?token=${token}`;
        const { error } = await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: email,
          subject: "Verify your email at Visondyna",
          react: VerificationEmail({
            verifyUrl,
            userName: `${firstname} ${lastname}`,
          }),
        });
        if (error) {
          const url = new URL("/auth/signin", baseUrl);
          url.searchParams.set("error", "EmailSendFailed");
          return url.toString();
        }

        const url = new URL("/auth/verify-email", baseUrl);
        url.searchParams.set("checkInbox", "1");
        return url.toString();
      }

      return true;
    },

    async jwt({ token, account }) {
      let user;
      if (account?.provider === "credentials" && token.sub) {
        user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
            role: true,
            emailVerified: true,
            applicantInfo: { select: { profileCompleted: true } },
          },
        });
      } else if (account?.provider !== "credentials" && token.email) {
        user = await prisma.user.findUnique({
          where: { email: token.email },
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
            role: true,
            emailVerified: true,
            applicantInfo: { select: { profileCompleted: true } },
          },
        });
      } else {
        user = null;
      }

      if (user) {
        token.userId = user.id;
        token.email = user.email;
        token.firstname = user.firstname;
        token.lastname = user.lastname;
        token.role = user.role;
        token.emailVerified = Boolean(user.emailVerified);
        token.profileCompleted = Boolean(user.applicantInfo?.profileCompleted);
        token.name = [user.firstname, user.lastname].filter(Boolean).join(" ");
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId as string) ?? (token.sub as string);
        session.user.firstname = (token.firstname as string) || "";
        session.user.lastname = (token.lastname as string) || "";
        session.user.role = token.role;
        session.user.emailVerified = Boolean(token.emailVerified);
        session.user.profileCompleted = Boolean(token.profileCompleted);
        if (typeof token.name === "string") session.user.name = token.name;
      }

      if (token.picture) session.user.image = token.picture;

      return session;
    },
  },
};
