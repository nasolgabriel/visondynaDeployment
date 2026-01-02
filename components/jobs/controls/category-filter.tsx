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
import { Category } from "@/lib/types";
import { toTitleCase } from "@/lib/utils";

type Props = {
  categories: Category[];
  value: string; // categoryId or ""
  onChange: (id: string) => void;
};

export default function CategoryFilter({ categories, value, onChange }: Props) {
  const selected = value
    ? toTitleCase(categories.find((c) => c.id === value)?.name ?? "")
    : "All Categories";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <FunnelIcon />
          <span className="text-muted-foreground">{selected}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 p-1">
        <DropdownMenuLabel>Categories</DropdownMenuLabel>
        <DropdownMenuGroup className="space-y-1">
          <DropdownMenuItem
            onClick={() => onChange("")}
            className="text-muted-foreground"
          >
            All
          </DropdownMenuItem>
          {categories.map((c) => (
            <DropdownMenuItem
              key={c.id}
              onClick={() => onChange(c.id)}
              className={`text-muted-foreground ${value === c.id && "bg-accent text-accent-foreground"}`}
            >
              {toTitleCase(c.name)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
