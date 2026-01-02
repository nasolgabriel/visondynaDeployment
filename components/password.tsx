"use client";

import React, { useState, cloneElement } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "./ui/input-group";
import { Eye, EyeOff } from "lucide-react";

export default function Password({
  children,
}: {
  children: React.ReactElement;
}) {
  const [type, setType] = useState<"password" | "text">("password");

  function changeType() {
    if (type === "password") setType("text");
    else setType("password");
  }

  return (
    <InputGroup className="bg-slate-950">
      {cloneElement(children, { type })}
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          variant="ghost"
          size="icon-sm"
          className="hover:bg-none"
          onClick={changeType}
        >
          {type === "password" ? <Eye /> : <EyeOff />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
