"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Spinner } from "@/components/ui/spinner";
import Password from "@/components/password";
import { toast } from "sonner";

const ENDPOINT = "/api/admin/users";

const formSchema = z.object({
  firstname: z.string().nonempty("Please enter the first name."),
  lastname: z.string().nonempty("Please enter the last name."),
  email: z.email("Enter a valid email address."),
  gender: z.string().nonempty("Please select a gender."),
  role: z.enum(["HR", "ADMIN"]),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  autoVerify: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateAdminUserContent({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      password: "",
      gender: "",
      role: "HR",
      autoVerify: false,
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: FormValues) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);

        console.log(error);

        const description =
          error?.error?.details?.message ||
          error?.message ||
          (error?.details?.fieldErrors
            ? Object.values(error.details.fieldErrors).flat().join(", ")
            : null) ||
          "An unexpected error occurred.";

        toast.error("Failed to create user", { description });
        return;
      }

      toast.success("User created", {
        description: "The new admin/HR account has been successfully created.",
      });

      form.reset();
      onCreated?.();
    } catch (err) {
      console.log(err);
      toast.error("Network error", {
        description: "Could not connect to the server.",
      });
    }
  }

  return (
    <SheetContent
      side="right"
      className="w-full max-w-lg overflow-y-auto bg-slate-950 p-0"
    >
      <div className="space-y-6 p-6">
        <SheetHeader>
          <SheetTitle className="text-lg">Create a New User</SheetTitle>
          <SheetDescription>
            Create an Admin or HR account. You may auto-verify the email.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* FIRST + LAST NAME */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="firstname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan" {...field} />
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
                      <Input placeholder="Dela Cruz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* EMAIL */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PASSWORD */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Password>
                      <Input
                        placeholder="Password"
                        type="password"
                        className="border-none bg-transparent focus-visible:ring-0"
                        {...field}
                      />
                    </Password>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* GENDER */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ROLE */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* AUTO VERIFY */}
            <FormField
              control={form.control}
              name="autoVerify"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 rounded-md border border-slate-800 px-3 py-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  </FormControl>
                  <div>
                    <FormLabel>Auto confirm user?</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      When checked, the user’s email becomes verified instantly.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* FOOTER */}
            <SheetFooter className="pt-2">
              <SheetClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </SheetClose>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-lime-500 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 size-4" /> Creating…
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </div>
    </SheetContent>
  );
}
