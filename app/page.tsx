import HomeCard from "@/components/home-card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import DarkVeil from "@/components/dark-veil";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const jobs = await prisma.job.findMany({
    select: {
      id: true,
      title: true,
      location: true,
      description: true,
      company: true,
      manpower: true,
      salary: true,
      status: true,
      skills: {
        take: 4,
        select: { skillTag: { select: { id: true, name: true } } },
      },
    },
    take: 9,
  });

  return (
    <div className="dark relative h-full w-full bg-slate-950">
      <div className="absolute top-0 h-full w-full">
        <DarkVeil hueShift={60} noiseIntensity={0.05} />
      </div>
      <div className="relative h-full overflow-y-scroll">
        <div className="flex w-full justify-end p-6">
          <Link href="/auth/signin" className="text-sm font-medium text-white">
            Sign In
          </Link>
        </div>
        <header className="h-4/5">
          <div className="flex h-full flex-col justify-center lg:m-auto lg:w-4/5">
            <div className="inline-flex flex-col lg:w-3/4 lg:gap-6 xl:w-3/5">
              <p className="font-extrabold tracking-tight text-lime-500">
                VISONDYNA
              </p>
              <h1 className="text-white">
                Empowering Businesses. Uplifting Careers.
              </h1>
              <p className="text-white">
                <span className="font-medium text-lime-500">
                  VisonDyna General Manpower Services
                </span>{" "}
                delivers skilled, dependable, and ready-to-work talent. Whether
                you’re hiring or seeking your next opportunity, we connect you
                to the right people — quickly, confidently, and with purpose.
              </p>
              <div className="inline-flex xl:gap-6">
                <Button size="lg" className="bg-lime-500 text-white" asChild>
                  <Link href="auth/signin">Apply now</Link>
                </Button>

                <Button size="lg" variant="ghost" className="text-white">
                  Learn more
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto flex items-center rounded-2xl border border-input border-slate-800 bg-slate-950 focus-within:ring-1 focus-within:ring-ring lg:h-24 lg:w-3/6 lg:gap-4 lg:px-8">
          <Search size="40px" color="white" />
          <Input
            type="search"
            placeholder="Search for job title, keywords, or skill"
            className="h-12 border-none text-white focus-visible:ring-0"
          />
          <Button size="lg" className="bg-lime-500 text-white">
            Get hired now
          </Button>
        </div>

        <main className="inline-flex w-full flex-col py-10 lg:gap-20">
          <div className="mx-auto flex max-w-[75%] flex-col items-center lg:gap-12">
            <h2 className="text-center text-white">
              Explore Job Openings Near You
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <HomeCard key={job.id} job={job} />
              ))}
            </div>
            <Button size="lg" variant="outline" className="text-white">
              View more jobs
            </Button>
          </div>
          <div className="mx-auto flex w-3/4 flex-col items-center lg:gap-12">
            <h2 className="text-center text-white">
              Discover the Right Fit for Your Skills
            </h2>
          </div>
        </main>

        <footer className="bg-gradient-to-t from-lime-700 to-transparent py-8">
          <div className="mx-auto grid w-3/4 items-center lg:grid-cols-[0.8fr_1fr]">
            <div className="flex flex-col gap-6">
              <div className="relative lg:h-16 lg:w-64">
                <Image
                  src="/visondyna.png"
                  alt="VisdonDyna Manpower Solution Services"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="w-4/5 text-sm text-slate-300">
                Visondyna Manpower General Services has been helping businesses
                grow by providing reliable and hardworking people across
                different industries. Guided by our values of politeness,
                commitment, and excellent service, we take pride in supporting
                both our clients and our workers every step of the way.
              </p>
            </div>
            <div className="grid w-full grid-cols-[0.5fr_0.4fr_0.5fr]">
              <div>
                <p className="leading-none tracking-tight text-white lg:mb-4 lg:font-semibold">
                  For Job Seekers
                </p>
                <ul className="flex flex-col gap-2">
                  <li className="text-sm text-slate-300">Browse Jobs</li>
                  <li className="text-sm text-slate-300">Sign In / Register</li>
                  <li className="text-sm text-slate-300">
                    Job Application Tips
                  </li>
                  <li className="text-sm text-slate-300">FAQs</li>
                </ul>
              </div>
              <div>
                <p className="leading-none tracking-tight text-white lg:mb-4 lg:font-semibold">
                  About
                </p>
                <ul className="flex flex-col gap-2">
                  <li className="text-sm text-slate-300">About Us</li>
                  <li className="text-sm text-slate-300">Our Services</li>
                  <li className="text-sm text-slate-300">Testimonials</li>
                  <li className="text-sm text-slate-300">Contact Us</li>
                </ul>
              </div>
              <div>
                <p className="leading-none tracking-tight text-white lg:mb-4 lg:font-semibold">
                  Legal & Policy
                </p>
                <ul className="flex flex-col gap-2">
                  <li className="text-sm text-slate-300">Privacy Policy</li>
                  <li className="text-sm text-slate-300">Terms of Service</li>
                  <li className="text-sm text-slate-300">Report a Problem</li>
                </ul>
              </div>
            </div>
          </div>
          <p className="mt-12 w-full text-center text-sm text-white">
            &copy; 2025 Visondyna General Manpower Services . All rights
            reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
