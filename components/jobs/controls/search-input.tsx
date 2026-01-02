"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Search } from "lucide-react";

type Props = {
  value: string;
  resultsHint?: number | null;
  loading?: boolean;
  onChange: (v: string) => void;
  placeholder?: string;
};

export default function SearchInput({
  value,
  resultsHint = null,
  loading,
  onChange,
  placeholder,
}: Props) {
  return (
    <InputGroup className="w-3/12">
      <InputGroupInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search"}
      />
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      {value && !loading && resultsHint !== null && (
        <InputGroupAddon align="inline-end">
          {resultsHint} results
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
