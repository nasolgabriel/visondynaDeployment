"use client";

import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// helpers
function toYyyyMmDd(d: Date): string {
  // Use UTC parts so it’s consistent everywhere
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromYyyyMmDd(value: string): Date {
  // Construct a Date at UTC midnight so Calendar shows the correct day
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDateUTC(yyyyMmDd: string): string {
  const d = fromYyyyMmDd(yyyyMmDd);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}

const schema = z.object({
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  email: z.string().email(),
  // store as date-only to avoid hydration TZ drift
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
    .optional(),
  gender: z.enum(["male", "female"], { message: "Please select gender" }),
});

type Props = {
  initial: {
    firstname: string;
    lastname: string;
    email: string;
    // send from server as date-only string (YYYY-MM-DD) for stability
    birthDateISO?: string; // e.g. "2000-06-17"
    gender: "male" | "female" | string;
  };
};

export default function AccountForm({ initial }: Props) {
  const initialBirthDate =
    initial.birthDateISO && /^\d{4}-\d{2}-\d{2}$/.test(initial.birthDateISO)
      ? initial.birthDateISO
      : undefined;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstname: initial.firstname,
      lastname: initial.lastname,
      email: initial.email,
      birthDate: initialBirthDate, // keep date-only
      gender:
        initial.gender === "male" || initial.gender === "female"
          ? (initial.gender as "male" | "female")
          : "male",
    },
  });

  const [saving, setSaving] = useState(false);

  // ✅ Watch just the field value (no useMemo needed, no complex deps)
  const birthDate = useWatch({
    control: form.control,
    name: "birthDate",
  });
  const selectedDateObj = birthDate ? fromYyyyMmDd(birthDate) : undefined;

  async function onSubmit(values: z.infer<typeof schema>) {
    setSaving(true);
    try {
      const payload = {
        ...values,
        // if provided, send as ISO at UTC midnight
        birthDate: values.birthDate
          ? new Date(`${values.birthDate}T00:00:00.000Z`).toISOString()
          : undefined,
      };

      const res = await fetch("/api/settings/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update account");
      toast.success("Account updated");
    } catch (err) {
      console.error(err);
      toast.error("Could not save changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form
        className="grid grid-cols-2 gap-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="firstname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="col-span-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="birthDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Birth date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-between text-left font-normal",
                    )}
                  >
                    {field.value ? formatDateUTC(field.value) : "Select date"}
                    <CalendarIcon className="ml-2 h-4 w-4 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDateObj}
                    onSelect={(d) => {
                      if (d) field.onChange(toYyyyMmDd(d));
                    }}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="col-span-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
