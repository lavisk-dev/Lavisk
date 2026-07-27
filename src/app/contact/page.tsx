import type { Metadata } from "next";
import { Mail, MessageCircle, MapPin } from "lucide-react";
import { ContactForm } from "@/components/shared/contact-form";
import { PageHeader } from "@/components/shared/page-header";
import { Reveal } from "@/components/shared/reveal";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Lavisk team.",
};

const CHANNELS = [
  { icon: Mail, label: "Email us", value: "hello@lavisk.example" },
  { icon: MessageCircle, label: "Live chat", value: "Mon–Fri, 9am–6pm IST" },
  { icon: MapPin, label: "Studio", value: "Chennai, India" },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 pb-16 md:px-8">
      <PageHeader
        eyebrow="Say hello"
        title="Let's talk gifting"
        subtitle="Questions, corporate orders, or just want to say hi? We'd love to hear from you."
      />

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Reveal className="flex flex-col gap-4">
          {CHANNELS.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-4 rounded-[24px] bg-white p-6 shadow-soft">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-mist">
                <Icon className="h-5 w-5 text-brand" />
              </div>
              <div>
                <div className="font-display font-bold">{label}</div>
                <div className="mt-0.5 text-sm text-muted">{value}</div>
              </div>
            </div>
          ))}
        </Reveal>

        <div className="lg:col-span-2">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
