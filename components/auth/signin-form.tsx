"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { signIn, getSession, type SignInResponse } from "next-auth/react";
import { useState } from "react";
import z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Spinner } from "../ui/spinner";
import Password from "../password";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

const formSchema = z.object({
  // keep your existing validation shape
  email: z.email(),
  password: z.string().nonempty(),
});

type FormSchema = z.infer<typeof formSchema>;

/**
 * SignInForm (credentials) — UI preserved exactly as provided.
 *
 * Behavior changes (no UI changes):
 * - Use signIn(..., redirect: false) so we control the post-login redirect.
 * - After successful signIn, wait briefly for NextAuth client session to populate,
 *   then perform a role-aware redirect:
 *     - ADMIN -> /admin/dashboard
 *     - HR    -> /hr/dashboard
 *     - APPLICANT -> callbackUrl (if provided) or /feed
 * - If session isn't available after retries, fall back to next-auth returned url or callbackUrl.
 *
 * No "any" types are used; we use SignInResponse and typed schema.
 */

export default function SignInForm() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const callbackUrlParam = searchParams?.get("callbackUrl") ?? null;

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Retry helper: NextAuth client session can take a short moment to be available after signIn.
  async function getSessionWithRetry(attempts = 10, delayMs = 200) {
    for (let i = 0; i < attempts; i++) {
      // eslint-disable-next-line no-await-in-loop
      const s = await getSession();
      if (s) return s;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, delayMs));
    }
    return null;
  }

  async function onSubmit(data: FormSchema) {
    setIsLoading(true);
    try {
      const res = (await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
        // don't force callbackUrl here; we'll decide after inspecting role/session
        // callbackUrl: callbackUrl || "/feed",
      })) as SignInResponse | undefined;

      if (!res || res.error) {
        toast.error(
          "We couldn’t sign you in. Double-check your email and password and try again.",
        );
        setIsLoading(false);
        return;
      }

      // Wait for client session to be available (contains user.role)
      const session = await getSessionWithRetry(10, 200);

      // Map roles to their default landing pages
      const roleToDefault: Record<string, string> = {
        ADMIN: "/admin/dashboard",
        HR: "/hr/dashboard",
        APPLICANT: "/feed",
      };

      // Decide destination:
      let destination = callbackUrlParam || "/";

      if (session?.user) {
        const role = String(session.user.role ?? "").toUpperCase();

        if (role === "ADMIN" || role === "HR") {
          // Admin/HR get their dashboards regardless of callbackUrl to avoid landing on applicant pages
          destination = roleToDefault[role] ?? "/";
        } else {
          // Applicant: prefer provided callbackUrl, otherwise default feed
          destination = callbackUrlParam || roleToDefault["APPLICANT"];
        }
      } else {
        // Session not available — fall back to next-auth returned url, callbackUrl, or /feed
        destination = res.url ?? callbackUrlParam ?? "/feed";
      }

      router.push(destination);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      console.error("signin error:", message);
      toast.error("Sign in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative h-screen w-full">
      <div className="flex h-full items-center justify-center px-12">
        <div className="max-w-lg text-white">
          <h1 className="w-full text-center text-4xl font-bold">
            Welcome Back to <span className="text-lime-400">Visondyna</span>
          </h1>
          <p className="mb-6 mt-4 w-full text-center text-sm text-slate-200">
            Let’s get you where you left off.
          </p>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Johndoe@gmail.com"
                        className="bg-slate-950"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage></FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Password>
                        <Input
                          type="password"
                          placeholder="Password"
                          className="border-none bg-transparent focus-visible:ring-0"
                          {...field}
                        />
                      </Password>
                    </FormControl>
                    <FormMessage></FormMessage>
                  </FormItem>
                )}
              />

              <Button
                size={isLoading ? "icon" : "lg"}
                className="!mt-6 w-full bg-lime-500 text-white"
                type="submit"
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    <span>Signing In</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </Button>
            </form>
          </Form>
          <div className="my-6 flex items-center">
            <div className="h-px flex-1 bg-white/20"></div>
            <span className="px-3 text-sm text-white/60">Or</span>
            <div className="h-px flex-1 bg-white/20"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => signIn("google", { callbackUrl: "/feed" })}
            >
              <Image
                src="/google-icon.svg"
                alt="Google Logo"
                width={16}
                height={16}
              />
              Sign in with Google
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => signIn("facebook", { callbackUrl: "/feed" })}
            >
              <Image
                src="/fecebook.svg"
                alt="Facebook Logo"
                width={20}
                height={20}
              />
              Sign in with Facebook
            </Button>
          </div>
          <p className="mt-6 w-full text-center text-sm text-white/60">
            Don&apos;t have an account?{" "}
            <a
              href="/auth/signup"
              className="text-lime-500 hover:text-lime-400 hover:underline"
            >
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
