import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

type Props = {
  verifyUrl: string;
  userName?: string;
  brand?: string;
};

export default function VerificationEmail({
  verifyUrl,
  userName = "there",
  brand = "Visondyna",
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your email to finish setting up {brand}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: { 500: "#84cc16", 600: "#65a30d", 700: "#4d7c0f" }, // lime vibe
                slatebg: "#0f172a",
              },
            },
          },
        }}
      >
        <Body className="m-0 bg-[#0b1220] p-6 font-sans text-[14px] leading-6 text-white">
          <Container className="mx-auto max-w-[560px]">
            <Section className="rounded-2xl border border-white/10 bg-[#0f172a] px-6 py-8 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
              <Section className="mb-6 flex items-center gap-3">
                <Text className="text-brand-500 m-0 text-[16px] font-semibold uppercase tracking-wide">
                  {brand}
                </Text>
              </Section>

              <Section className="mb-4">
                <Text className="m-0 text-3xl font-semibold text-white">
                  {userName ? `Welcome, ${userName}!` : "Welcome to Visondyna!"}
                </Text>
                <Text className="mt-2 text-white/70">
                  Please confirm your email to finish setting up your account.
                </Text>
              </Section>

              <Section className="my-8 text-center">
                <Link
                  href={verifyUrl}
                  className="bg-brand-500 inline-block rounded-xl px-6 py-3 text-[14px] font-semibold text-black no-underline"
                >
                  Verify my email
                </Link>
                <Text className="mt-3 text-[12px] text-white/50">
                  This link expires in 30 minutes.
                </Text>
              </Section>

              <Section className="mt-8 rounded-lg bg-black/20 px-4 py-4">
                <Text className="m-0 text-[12px] text-white/60">
                  Having trouble with the button? Paste this link into your
                  browser:
                </Text>
                <Link
                  href={verifyUrl}
                  className="text-brand-500 break-all text-[12px]"
                >
                  {verifyUrl}
                </Link>
              </Section>

              <Section className="mt-10 border-t border-white/10 pt-6">
                <Text className="m-0 text-[12px] text-white/45">
                  You’re receiving this because you created an account on{" "}
                  {brand}. If this wasn’t you, you can safely ignore this email.
                </Text>
              </Section>
            </Section>

            <Section className="mt-6 text-center">
              <Text className="m-0 text-[11px] text-white/35">
                © {new Date().getFullYear()} {brand}. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
