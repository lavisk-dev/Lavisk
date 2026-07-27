"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import type { Collection } from "@/lib/types";

export function AdminCollectionsManager({ initialCollections }: { initialCollections: Collection[] }) {
  const [collections, setCollections] = useState(initialCollections);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    isActive: true,
    sortOrder: 0,
    seoTitle: "",
    seoDescription: "",
  });

  function resetForm() {
    setForm({ name: "", description: "", isActive: true, sortOrder: 0, seoTitle: "", seoDescription: "" });
    setEditing(null);
  }

  function openEdit(c: Collection) {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description,
      isActive: c.isActive,
      sortOrder: c.sortOrder,
      seoTitle: c.seoTitle ?? "",
      seoDescription: c.seoDescription ?? "",
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    const isEdit = Boolean(editing);
    const url = isEdit ? `/api/admin/collections/${editing!.id}` : "/api/admin/collections";
    const method = isEdit ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setIsSaving(false);
    if (json.success) {
      setCollections((prev) =>
        isEdit
          ? prev.map((c) => (c.id === editing!.id ? json.data : c))
          : [...prev, json.data]
      );
      setOpen(false);
      resetForm();
    } else {
      alert(json.error ?? "Couldn't save this collection.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this collection?")) return;
    const res = await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      setCollections((prev) => prev.filter((c) => c.id !== id));
    } else {
      alert(json.error ?? "Couldn't delete this collection.");
    }
  }

  const active = collections.filter((c) => c.isActive);
  const inactive = collections.filter((c) => !c.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{collections.length} collections</p>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setOpen(true); }}>
              <Plus className="h-4 w-4" /> Add collection
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit collection" : "New collection"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
              <div className="space-y-2">
                <Label htmlFor="col-name">Name</Label>
                <Input
                  id="col-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Valentine's Day"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="col-desc">Description</Label>
                <Textarea
                  id="col-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="A short description of this collection"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="col-sort">Sort order</Label>
                  <Input
                    id="col-sort"
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                  />
                </div>
                <div className="flex items-end pb-2">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="col-active"
                      checked={form.isActive}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                    />
                    <Label htmlFor="col-active" className="text-sm normal-case text-ink">Active</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="col-seo-title">SEO title (optional)</Label>
                <Input
                  id="col-seo-title"
                  value={form.seoTitle}
                  onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
                  placeholder="Meta title for this collection"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="col-seo-desc">SEO description (optional)</Label>
                <Textarea
                  id="col-seo-desc"
                  value={form.seoDescription}
                  onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
                  placeholder="Meta description for SEO"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? "Saving…" : editing ? "Save changes" : "Create collection"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Collection</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Order</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {active.map((collection) => (
            <TableRow key={collection.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-ink">{collection.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted">{collection.slug}</TableCell>
              <TableCell>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  Active
                </span>
              </TableCell>
              <TableCell className="text-muted">{collection.sortOrder}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(collection)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(collection.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {inactive.map((collection) => (
            <TableRow key={collection.id} className="opacity-60">
              <TableCell>
                <span className="font-semibold text-ink">{collection.name}</span>
              </TableCell>
              <TableCell className="text-muted">{collection.slug}</TableCell>
              <TableCell>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  Inactive
                </span>
              </TableCell>
              <TableCell className="text-muted">{collection.sortOrder}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(collection)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(collection.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}