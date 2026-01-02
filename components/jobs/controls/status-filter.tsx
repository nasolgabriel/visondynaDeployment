"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FunnelIcon } from "lucide-react";
import { toTitleCase } from "@/lib/utils";

type StatusVal = "ALL" | "OPEN" | "CLOSED" | "FILLED";

type Props = {
  value: StatusVal;
  onChange: (v: StatusVal) => void;
};

export default function StatusFilter({ value, onChange }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <FunnelIcon />
          <span className="text-muted-foreground">
            {value === "ALL" ? "All Statuses" : toTitleCase(value)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        <DropdownMenuGroup className="space-y-1">
          {(["ALL", "OPEN", "CLOSED", "FILLED"] as const).map((s) => (
            <DropdownMenuItem
              key={s}
              onClick={() => onChange(s)}
              className={`text-muted-foreground ${value === s && "bg-accent text-accent-foreground"}`}
            >
              {s === "ALL" ? "All" : toTitleCase(s)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
