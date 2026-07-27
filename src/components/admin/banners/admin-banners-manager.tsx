"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Banner } from "@/lib/types";

export function AdminBannersManager({ initialBanners }: { initialBanners: Banner[] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ title: "", subtitle: "", ctaLabel: "Shop the Collection", ctaHref: "/shop" });

  function resetForm() {
    setForm({ title: "", subtitle: "", ctaLabel: "Shop the Collection", ctaHref: "/shop" });
    setEditing(null);
  }

  function openEdit(banner: Banner) {
    setForm({
      title: banner.title,
      subtitle: banner.subtitle ?? "",
      ctaLabel: banner.ctaLabel ?? "Shop the Collection",
      ctaHref: banner.ctaHref ?? "/shop",
    });
    setEditing(banner.id);
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    const url = editing
      ? `/api/admin/banners/${editing}`
      : "/api/admin/banners";
    const method = editing ? "PUT" : "POST";
    const body = editing
      ? form
      : { ...form, isActive: true, sortOrder: banners.length };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setIsSaving(false);
    if (json.success) {
      if (editing) {
        setBanners((prev) => prev.map((b) => (b.id === editing ? json.data : b)));
      } else {
        setBanners((prev) => [...prev, json.data]);
      }
      resetForm();
      setOpen(false);
    } else {
      alert(json.error ?? "Couldn't save this banner.");
    }
  }

  async function toggleActive(banner: Banner) {
    const res = await fetch(`/api/admin/banners/${banner.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !banner.isActive }),
    });
    const json = await res.json();
    if (json.success) {
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? json.data : b)));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this banner?")) return;
    const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) setBanners((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {banners.length} banners — these power the rotating hero on the homepage.
        </p>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            if (!v) resetForm();
            setOpen(v);
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Add banner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit banner" : "New banner slide"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 px-6 pb-6">
              <div className="space-y-2">
                <Label htmlFor="title">Headline word</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="UNWRAP"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={form.subtitle}
                  onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                  placeholder="Joy, Tied Up With a Bow"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ctaLabel">Button label</Label>
                  <Input
                    id="ctaLabel"
                    value={form.ctaLabel}
                    onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaHref">Button link</Label>
                  <Input
                    id="ctaHref"
                    value={form.ctaHref}
                    onChange={(e) => setForm((f) => ({ ...f, ctaHref: e.target.value }))}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? "Saving…" : editing ? "Save changes" : "Create banner"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-soft"
          >
            <div>
              <div className="font-display text-lg font-bold text-ink">{banner.title}</div>
              {banner.subtitle && <div className="text-sm text-muted">{banner.subtitle}</div>}
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={banner.isActive} onCheckedChange={() => toggleActive(banner)} />
              <Button variant="ghost" size="icon" onClick={() => openEdit(banner)}>
                <Pencil className="h-4 w-4 text-muted" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(banner.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {banners.length === 0 && <p className="text-sm text-muted">No banners yet.</p>}
      </div>
    </div>
  );
}
