"use client";

import {
  BriefcaseBusiness,
  Bell,
  ChevronDown,
  Home,
  MessageCircle,
  Sun,
  Moon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Notifications from "./notification";
import { signOut, useSession } from "next-auth/react";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";

export default function Navbar() {
  const session = useSession();
  const { setTheme } = useTheme();
  const pathname = usePathname();
  const user = session.data?.user;

  const links = [
    { href: "/feed", label: "My Feed", icon: Home },
    { href: "/jobs", label: "Find Jobs", icon: BriefcaseBusiness },
    { href: "/messages", label: "Messages", icon: MessageCircle },
  ];

  return (
    <>
      <header className="daark:border-slate-800 z-10 flex items-center border-b bg-white p-2 dark:bg-slate-900">
        <div className="mx-auto grid w-3/4 grid-cols-3 items-center px-4">
          <Link
            href="/feed"
            className="text-xl font-bold tracking-wide text-lime-500"
          >
            VISONDYNA
          </Link>
          <nav className="relative hidden items-center justify-between gap-4 md:flex">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex flex-col items-center text-xs transition-colors ${
                    active
                      ? "text-lime-500 dark:text-slate-50"
                      : "text-slate-400 dark:text-slate-500"
                  } hover:text-slate-300 dark:hover:text-slate-50`}
                >
                  <Icon size={22} className={`mb-1`} />
                  <span className="tracking-normal">{label}</span>
                  <span
                    className={`absolute ${
                      active ? "w-24" : "w-0"
                    } -bottom-3 border-b-2 border-lime-500 transition-all delay-150`}
                  />
                </Link>
              );
            })}
            <Notifications
              trigger={
                <div className="flex flex-col items-center text-slate-400 transition-colors hover:text-slate-300 dark:text-slate-500 dark:hover:text-slate-50">
                  <Bell size={22} className="mb-1" />
                  <span className="text-xs">Notifications</span>
                </div>
              }
            />
          </nav>
          <div className="inline-flex items-center gap-2 justify-self-end">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={
                      user?.image
                        ? user.image
                        : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                    }
                  />
                  <AvatarFallback>{user?.name?.at(0)}</AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start md:flex">
                  <span className="text-sm font-medium dark:text-white">
                    {user?.name}
                  </span>
                  <span className="text-xs font-medium text-green-500">
                    Online
                  </span>
                </div>
                <ChevronDown size={16} className="ml-1 text-gray-500" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 dark:bg-slate-900"
              >
                <DropdownMenuItem className="cursor-pointer">
                  <Link href={`/profile/`}>My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-slate-800"
                  asChild
                >
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-slate-800">
                  Help
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-red-500 hover:bg-slate-800"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-between gap-4 border-t border-slate-800 bg-slate-900 px-6 py-2 md:hidden">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-1 text-xs transition-colors hover:text-lime-500 ${
                active ? "text-lime-500" : "text-slate-500"
              }`}
            >
              <Icon size={20} />
              <span>{label}</span>
              {active && (
                <>
                  <span className="absolute -top-2 w-16 border-b border-lime-500"></span>
                </>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
