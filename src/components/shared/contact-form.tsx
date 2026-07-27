"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(2, "Please add a subject"),
  message: z.string().min(5, "Please write a short message"),
});
type FormValues = z.infer<typeof formSchema>;

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json();
    if (json.success) setSent(true);
    else setError(json.error ?? "Something went wrong. Please try again.");
  };

  if (sent) {
    return (
      <div className="rounded-[24px] bg-white p-10 text-center shadow-soft">
        <div className="mb-3 text-4xl">💌</div>
        <h3 className="font-display text-2xl font-bold">Message sent</h3>
        <p className="mt-2 text-muted">We&apos;ll get back to you within one business day.</p>
      </div>
    );
  }

  const inputError = (msg?: string) =>
    msg ? <span className="text-xs text-destructive">{msg}</span> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-[24px] bg-white p-6 shadow-soft md:p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} placeholder="Jamie Rivera" />
          {inputError(errors.name?.message)}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} placeholder="you@email.com" />
          {inputError(errors.email?.message)}
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" {...register("subject")} placeholder="Corporate gifting enquiry" />
          {inputError(errors.subject?.message)}
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" {...register("message")} placeholder="How can we help?" />
          {inputError(errors.message?.message)}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <Button type="submit" size="lg" className="mt-6" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
