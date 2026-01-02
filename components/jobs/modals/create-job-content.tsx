"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BriefcaseBusiness,
  CaseSensitive,
  MapPin,
  PhilippinePeso,
  Users,
} from "lucide-react";
import {
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toTitleCase } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import type { JobStatus } from "@prisma/client";

type Skill = { id: string; name: string };

type Category = {
  id: string;
  name: string;
  skills?: Skill[];
};

type CreatedJob = {
  id: string;
  title: string;
  description: string;
  manpower: number;
  salary: number;
  company: string;
  location: string;
  status: JobStatus;
  createdAt: string | Date;
  categoryId: string;
};

type ApiOk<T> = { ok: true; data: T; meta?: unknown };
type ApiErr = { ok: false; error?: string; message?: string; meta?: unknown };

type Props = {
  jobId?: string | null; // if present => edit mode
  onSuccess?: (job: CreatedJob) => void;
  onCancel?: () => void;
};

const schema = z.object({
  title: z.string().min(2, "Job title is required"),
  company: z.string().min(2, "Company is required"),
  location: z.string().min(2, "Location is required"),
  salary: z.coerce.number().int().min(0, "Salary must be non-negative"),
  manpower: z.coerce.number().int().min(1, "At least 1"),
  categoryId: z.string().min(1, "Select a category"),
  status: z.enum(["OPEN", "CLOSED", "FILLED"]).default("OPEN"),
  description: z.string().min(5, "Write a short description"),
  skills: z.array(z.string()).default([]),
});

type FormValues = z.output<typeof schema>;

// Zod + RHF resolver
const typedResolver: Resolver<FormValues> = zodResolver(
  schema,
) as unknown as Resolver<FormValues>;

const CATEGORIES_ENDPOINT = "/api/categories?withSkills=1";
const JOBS_ENDPOINT = "/api/jobs";

// Shape returned by GET /api/jobs/:id .data
type JobFromApi = {
  id: string;
  title: string;
  description: string;
  manpower: number;
  salary: number;
  company: string;
  location: string;
  status: JobStatus;
  createdAt: string;
  category: { id: string; name: string } | null;
  skills: { id: string; name: string }[];
};

export default function CreateJobSheetContent({
  jobId,
  onSuccess,
  onCancel,
}: Props) {
  const isEditMode = Boolean(jobId);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState<boolean>(true);
  const [loadingJob, setLoadingJob] = useState<boolean>(false);

  const form = useForm<FormValues>({
    resolver: typedResolver,
    defaultValues: {
      title: "",
      company: "",
      location: "",
      salary: 0,
      manpower: 1,
      categoryId: "",
      status: "OPEN",
      description: "",
      skills: [],
    },
  });

  const categoryId = form.watch("categoryId");
  const selectedSkillIds = form.watch("skills");

  // Load categories
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoadingCats(true);
        const res = await fetch(CATEGORIES_ENDPOINT, {
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to load categories");
        }

        const json = (await res.json()) as { data?: Category[] };
        if (!cancelled) setCategories(json.data ?? []);
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Unable to fetch categories";
        toast.error("Categories error", { description: msg });
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // If editing, load job details and populate form
  useEffect(() => {
    if (!jobId) {
      form.reset({
        title: "",
        company: "",
        location: "",
        salary: 0,
        manpower: 1,
        categoryId: "",
        status: "OPEN",
        description: "",
        skills: [],
      });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoadingJob(true);
        const res = await fetch(`${JOBS_ENDPOINT}/${jobId}`, {
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to load job");
        }

        const json = (await res.json()) as { data: JobFromApi };
        const job = json.data;

        if (cancelled) return;

        const initialValues: FormValues = {
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          manpower: job.manpower,
          categoryId: job.category?.id ?? "",
          status: job.status,
          description: job.description,
          skills: job.skills.map((s: { id: string }) => s.id),
        };

        form.reset(initialValues);
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Unable to load job for editing";
        toast.error("Job load error", { description: msg });
      } finally {
        if (!cancelled) setLoadingJob(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [jobId, form]);

  const skillsForCategory: Skill[] = useMemo(() => {
    if (!categoryId) return [];
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.skills ?? [];
  }, [categoryId, categories]);

  // Ensure selected skills belong to current category
  useEffect(() => {
    if (!categoryId) {
      form.setValue("skills", []);
      return;
    }
    const allowed = new Set(skillsForCategory.map((s) => s.id));
    const filtered = selectedSkillIds.filter((id) => allowed.has(id));
    if (filtered.length !== selectedSkillIds.length) {
      form.setValue("skills", filtered, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, skillsForCategory.length]);

  async function onSubmit(values: FormValues): Promise<void> {
    try {
      const payload: FormValues = {
        ...values,
        title: values.title.trim(),
        company: values.company.trim(),
        location: values.location.trim(),
        description: values.description.trim(),
      };

      const endpoint = isEditMode ? `${JOBS_ENDPOINT}/${jobId}` : JOBS_ENDPOINT;
      const method = isEditMode ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let parsed: ApiOk<CreatedJob> | ApiErr | null = null;

      try {
        parsed = text ? (JSON.parse(text) as ApiOk<CreatedJob> | ApiErr) : null;
      } catch {
        parsed = null;
      }

      if (!res.ok) {
        const description =
          (parsed &&
            ("error" in parsed || "message" in parsed) &&
            (parsed.error ?? parsed.message)) ||
          text ||
          (isEditMode
            ? "Server rejected this update"
            : "Server rejected this request");
        toast.error(
          isEditMode ? "Failed to update job" : "Failed to create job",
          { description },
        );
        return;
      }

      const job: CreatedJob | null =
        parsed && "data" in parsed ? (parsed.data as CreatedJob) : null;

      toast.success(
        isEditMode
          ? "Job has been successfully updated"
          : "Job has been successfully created",
      );

      if (!isEditMode) {
        form.reset();
      }

      if (job) {
        onSuccess?.(job);
        return;
      }

      // fallback object if server didn't return data
      onSuccess?.({
        id: jobId ?? "unknown",
        title: payload.title,
        description: payload.description,
        manpower: payload.manpower,
        salary: payload.salary,
        company: payload.company,
        location: payload.location,
        status: payload.status,
        createdAt: new Date().toISOString(),
        categoryId: payload.categoryId,
      });
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : isEditMode
            ? "Unexpected error updating job"
            : "Unexpected error creating job";
      toast.error("Error", { description: msg });
    }
  }

  function handleCancel() {
    form.reset();
    onCancel?.();
  }

  const submitting = form.formState.isSubmitting;
  const disabled = submitting || loadingJob;

  return (
    <SheetContent className="flex h-full flex-col">
      <SheetHeader>
        <SheetTitle className="border-none p-0 text-lg">
          {isEditMode ? "Edit Job Listing" : "Create a New Job Listing"}
        </SheetTitle>
        <SheetDescription className="w-full">
          {isEditMode
            ? "Update the details for this job. Categories and skills stay linked to your directory."
            : "Let’s add a new opportunity! Fill in the details below — categories and skills are pulled from your team’s directory."}
        </SheetDescription>
      </SheetHeader>

      <ScrollArea className="min-h-0 flex-1 pr-4">
        <div className="space-y-4 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupInput
                          placeholder="e.g. Office Cleaner, Sales Associate"
                          {...field}
                          disabled={disabled}
                        />
                        <InputGroupAddon>
                          <CaseSensitive className="size-4 text-muted-foreground" />
                        </InputGroupAddon>
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupInput
                          placeholder="e.g. Visondyna Manpower Solutions"
                          {...field}
                          disabled={disabled}
                        />
                        <InputGroupAddon>
                          <BriefcaseBusiness className="size-4 text-muted-foreground" />
                        </InputGroupAddon>
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupInput
                          placeholder="e.g. Clark Freeport Zone, Pampanga"
                          {...field}
                          disabled={disabled}
                        />
                        <InputGroupAddon>
                          <MapPin className="size-4 text-muted-foreground" />
                        </InputGroupAddon>
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      disabled={loadingCats || disabled}
                      value={field.value}
                      onValueChange={(v) => field.onChange(v)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingCats
                                ? "Loading..."
                                : "Choose a job category to match this role"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel className="font-normal text-muted-foreground">
                            Categories
                          </SelectLabel>

                          {loadingCats ? (
                            <SelectItem disabled value="#">
                              Loading categories...
                            </SelectItem>
                          ) : categories.length ? (
                            categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {toTitleCase(c.name)}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem disabled value="#">
                              No categories found
                            </SelectItem>
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Salary */}
              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupInput
                          type="number"
                          inputMode="numeric"
                          min={0}
                          placeholder="e.g. 25,000 (monthly)"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              Number(e.currentTarget.valueAsNumber),
                            )
                          }
                          disabled={disabled}
                        />
                        <InputGroupAddon>
                          <PhilippinePeso className="size-4 text-muted-foreground" />
                        </InputGroupAddon>
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Manpower */}
              <FormField
                control={form.control}
                name="manpower"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Slots Available</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupInput
                          type="number"
                          inputMode="numeric"
                          min={1}
                          placeholder="e.g. 5"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              Number(e.currentTarget.valueAsNumber),
                            )
                          }
                          disabled={disabled}
                        />
                        <InputGroupAddon>
                          <Users className="size-4 text-muted-foreground" />
                        </InputGroupAddon>
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What makes this role exciting? Mention duties, qualifications, and perks."
                        className="h-64 resize-none"
                        {...field}
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status (kept disabled; you manage status elsewhere) */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!jobId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="OPEN">Open</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
                          <SelectItem value="FILLED">Filled</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Skills */}
              <div className="grid gap-2">
                <Label>Key Skills / Requirements</Label>

                <p className="w-full text-sm text-muted-foreground">
                  {categoryId
                    ? "Choose relevant skills that best fit this job role."
                    : "Pick a category to unlock its skill list."}
                </p>

                <ScrollArea className="h-44">
                  <div>
                    {skillsForCategory.map((skill) => {
                      const checked = selectedSkillIds.includes(skill.id);
                      return (
                        <label
                          key={skill.id}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
                        >
                          <Checkbox
                            checked={checked}
                            disabled={disabled}
                            onCheckedChange={(v: CheckedState) => {
                              const next = new Set(selectedSkillIds);
                              if (v === true) next.add(skill.id);
                              else next.delete(skill.id);
                              form.setValue("skills", Array.from(next), {
                                shouldValidate: true,
                              });
                            }}
                          />
                          <span className="text-sm">{skill.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              <SheetFooter className="mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={disabled}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={disabled}>
                  {submitting
                    ? isEditMode
                      ? "Saving"
                      : "Posting"
                    : isEditMode
                      ? "Save Changes"
                      : "Post Job"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </ScrollArea>
    </SheetContent>
  );
}
