// components/settings/profile-form.tsx
"use client";

import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  profession: z.string().optional(),
  phone: z.string().optional(),
  profileSummary: z.string().optional(),
});

type Props = {
  initial: {
    profession: string;
    phone: string;
    profileSummary: string;
  };
};

export default function ProfileForm({ initial }: Props) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });

  const [saving, setSaving] = useState(false);

  async function onSubmit(values: z.infer<typeof schema>) {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Profile updated");
    } catch {
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
          name="profession"
          render={({ field }) => (
            <FormItem className="col-span-2 sm:col-span-1">
              <FormLabel>Profession</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Data Entry Specialist" {...field} />
              </FormControl>
              <FormDescription>Shown under your name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem className="col-span-2 sm:col-span-1">
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="+63 900 000 0000" {...field} />
              </FormControl>
              <FormDescription>Visible to employers.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="profileSummary"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>About</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-[120px]"
                  placeholder="Short summary about you…"
                  {...field}
                />
              </FormControl>
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
