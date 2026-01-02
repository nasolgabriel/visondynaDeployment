"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServerError } from "@/lib/types";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Spinner } from "../ui/spinner";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import Password from "../password";
import { signIn } from "next-auth/react";

const formSchema = z
  .object({
    firstname: z.string().nonempty("Please enter your first name."),
    lastname: z.string().nonempty("Please enter your last name."),
    email: z.email("Enter a valid email address.").trim(),
    birthDate: z.date(),
    gender: z.string().nonempty("Please select your gender."),
    role: z.literal("APPLICANT"),
    password: z
      .string()
      .nonempty("Create a password (8+ characters).")
      .min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().nonempty("Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      const today = new Date();
      const birthDate = new Date(data.birthDate);

      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();

      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age >= 18;
    },
    {
      message: "You must be at least 18 years old to sign up.",
      path: ["birthDate"],
    },
  );

export default function SignUpForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      birthDate: new Date(),
      gender: "",
      role: "APPLICANT",
      password: "",
      confirmPassword: "",
    },
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false); // New state for email sent

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...data }),
    });

    const error: ServerError = await res.json();
    if (!error.ok) {
      toast.error(error.error.message); // Show server error
      setIsLoading(false);
      return;
    }

    // Show success message
    toast.success("Sign up successful! Please verify your email.");
    setEmailSent(true); // Indicate that the email has been sent
    setIsLoading(false);
  }

  return (
    <div className="relative h-screen w-full">
      <div className="flex h-full items-center justify-center px-12">
        <div className="max-w-lg text-white">
          <h1 className="w-full text-center text-4xl font-bold">
            Start Your Career With{" "}
            <span className="text-lime-400">Visondyna</span>
          </h1>
          <p className="mb-6 mt-4 w-full text-center text-sm text-slate-200">
            We’re excited to have you! A few quick details and you’re in.
          </p>

          {/* Show success message after signup */}
          {emailSent ? (
            <p className="mb-4 w-full text-center text-sm text-green-500">
              We&apos;ve sent a verification link to your email. Please check it
              to verify your account.
            </p>
          ) : null}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              <div className="grid grid-cols-2 items-center gap-4">
                <FormField
                  control={form.control}
                  name="firstname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="John"
                          className="bg-slate-950"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Doe"
                          className="bg-slate-950"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Johndoe@gmail.com"
                        className="bg-slate-950"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      We’ll send a verification link.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 items-center gap-4">
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Select your birthdate</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent>
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            captionLayout="dropdown"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-slate-950">
                            <SelectValue placeholder="Choose your gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Password>
                        <Input
                          placeholder="Password"
                          className="border-none bg-transparent focus-visible:ring-0"
                          {...field}
                        />
                      </Password>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Password>
                        <Input
                          placeholder="Password"
                          className="border-none bg-transparent focus-visible:ring-0"
                          {...field}
                        />
                      </Password>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                size={isLoading ? "icon" : "lg"}
                className="!mt-6 w-full bg-lime-500 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    <span>Signing Up</span>
                  </>
                ) : (
                  <span>Sign Up</span>
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
              Sign up with Google
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
              Sign up with Facebook
            </Button>
          </div>
          <p className="mt-6 w-full text-center text-sm text-white/60">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="text-lime-500 hover:text-lime-400 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
