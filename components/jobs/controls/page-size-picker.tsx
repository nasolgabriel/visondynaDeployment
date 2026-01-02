"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  value: number;
  options?: number[];
  onChange: (n: number) => void;
};

export default function PageSizePicker({
  value,
  options = [10, 20, 50, 100],
  onChange,
}: Props) {
  return (
    <div className="text-sm text-muted-foreground">
      <span>Rows per page </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="px-3">
            {value}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            {options.map((n) => (
              <DropdownMenuItem key={n} onClick={() => onChange(n)}>
                {n}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
