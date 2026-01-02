"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner"; // Using toast for notifications
import { Spinner } from "@/components/ui/spinner"; // Spinner component for loading state
import z from "zod";

const emailSchema = z.email("Please provide a valid email address.");

export default function ResendVerificationPage() {
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  // Function to handle the email resend
  const resendVerification = async () => {
    if (!email) {
      toast.error("Please provide a valid email address.");
      return;
    }

    const result = emailSchema.safeParse(email);

    if (!result.success) {
      toast.error(result.error.flatten().formErrors[0]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (data.ok) {
        toast.success("Verification email sent successfully!");
        setMessage(
          "We've sent a new verification email. Please check your inbox.",
        );
      } else {
        toast.error(data.error || "Something went wrong. Please try again.");
        setMessage("Failed to send the verification email.");
        setIsError(true);
      }
    } catch (error) {
      toast.error("Error occurred while resending the email.");
      setMessage("An unexpected error occurred. Please try again later.");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen items-center justify-center bg-slate-950">
      <div className="w-full max-w-md text-center text-white">
        <h2 className="mb-4 text-2xl font-semibold">
          Resend Verification Email
        </h2>
        <p className="mb-6 w-full text-lg">
          Please enter your email address to receive a verification link.
        </p>

        {/* Email Input Form */}
        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-slate-800 p-3 text-white"
          />

          {/* Submit Button */}
          <Button
            onClick={resendVerification}
            disabled={isLoading || !email}
            className="mt-4 w-full"
          >
            {isLoading ? <Spinner /> : "Send Verification Email"}
          </Button>

          {/* Display Success/Failure Message */}
          {message && (
            <p
              className={`mt-4 w-full text-center ${isError ? "text-red-400" : "text-green-400"}`}
            >
              {message}
            </p>
          )}
        </div>

        {/* Option to go back to Sign In if there's an error */}
        {isError && (
          <div className="mt-4 space-x-2">
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/auth/signin")}
            >
              Go to Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
