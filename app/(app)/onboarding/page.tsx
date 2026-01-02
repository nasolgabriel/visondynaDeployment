"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import SetupSkills from "@/components/profile/setup-skills";
import SetupExperience from "@/components/profile/setup-experience";
import SetupEducation from "@/components/profile/setup-education";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { toast } from "sonner";

export default function OnBoard() {
  const router = useRouter();
  const [api, setApi] = useState<CarouselApi>();
  const [, setCount] = useState(0);
  const [current, setCurrent] = useState(0);
  const progress = (current - 1) * 33.33;

  async function finish() {
    const res = await fetch("/api/profile/completed", { method: "POST" });

    if (!res.ok) {
      toast.error("Could not complete onboarding. Try again.");
      return;
    }

    toast.success("Onboarding complete!", {
      description:
        "Your profile is now set up. You’re all set to get started — welcome aboard! 🚀",
    });

    router.push("/feed");
  }

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => setCurrent(api.selectedScrollSnap() + 1));
  }, [api]);

  return (
    <SessionProvider>
      <div className="flex h-full items-center">
        <Carousel
          opts={{ watchDrag: false, watchResize: true }}
          setApi={setApi}
          className="mx-auto w-4/12"
        >
          <Card>
            <CardHeader>
              <Progress value={progress} className="h-1" />
            </CardHeader>
            <CarouselContent>
              <CarouselItem className="flex flex-col">
                <CardContent className="flex h-full flex-col items-center justify-center space-y-2">
                  <Image
                    src="/character/setup-profile.svg"
                    alt="Pana setting up resume"
                    width={400}
                    height={400}
                  />
                  <CardTitle className="text-center text-2xl">
                    Welcome to <span className="text-lime-500">Visondyna</span>
                  </CardTitle>
                  <CardDescription className="w-4/6 text-center">
                    Let’s set up your profile so employers can evaluate you
                    quickly. This takes about 3–5 minutes.
                  </CardDescription>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button
                    type="button"
                    onClick={() => api?.scrollNext()}
                    disabled={!api?.canScrollNext()}
                    className="w-full"
                  >
                    Let&rsquo;s start
                  </Button>
                </CardFooter>
              </CarouselItem>
              <CarouselItem className="flex flex-col">
                {current === 2 && (
                  <CardContent className="flex-1">
                    <SetupSkills api={api} />
                  </CardContent>
                )}
              </CarouselItem>
              <CarouselItem className="flex flex-col">
                <CardContent className="flex-1">
                  <SetupEducation onDone={() => api?.scrollNext()} api={api} />
                </CardContent>
              </CarouselItem>
              <CarouselItem className="flex flex-col">
                <CardContent className="flex-1">
                  <SetupExperience />
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button className="w-full" onClick={finish}>
                    Finish Onboarding
                  </Button>
                </CardFooter>
              </CarouselItem>
            </CarouselContent>
          </Card>
        </Carousel>
      </div>
    </SessionProvider>
  );
}
