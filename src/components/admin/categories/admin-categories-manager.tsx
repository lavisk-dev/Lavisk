"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import type { Category } from "@/lib/types";

const GRADIENT_PRESETS = [
  { from: "#FFE9EF", to: "#FFDCE6", blob: "#FFB6C9" },
  { from: "#FFEBDF", to: "#FFD3B0", blob: "#FFD3B0" },
  { from: "#F3ECFF", to: "#E7D6FF", blob: "#E7D6FF" },
  { from: "#FFF0F3", to: "#FFE0E9", blob: "#FF8FA3" },
];

export function AdminCategoriesManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    const preset = GRADIENT_PRESETS[categories.length % GRADIENT_PRESETS.length];
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        count: 0,
        gradientFrom: preset.from,
        gradientTo: preset.to,
        blobColor: preset.blob,
      }),
    });
    const json = await res.json();
    setIsSaving(false);
    if (json.success) {
      setCategories((prev) => [...prev, json.data]);
      setName("");
      setOpen(false);
    } else {
      alert(json.error ?? "Couldn't create this category.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } else {
      alert(json.error ?? "Couldn't delete this category.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{categories.length} categories</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Add category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 px-6 pb-6">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Housewarming"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? "Creating…" : "Create category"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Gift count</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span
                    className="h-9 w-9 rounded-xl"
                    style={{
                      background: `linear-gradient(150deg,${category.gradientFrom},${category.gradientTo})`,
                    }}
                  />
                  <span className="font-semibold text-ink">{category.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted">{category.slug}</TableCell>
              <TableCell>{category.count}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
