"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ProductImageUpload } from "@/components/products/image-upload/product-image-upload";
import type { Category, Collection, Product } from "@/lib/types";

interface ProductFormProps {
  product?: Product;
}

const GRADIENT_PRESETS = [
  { from: "#FFB6C9", to: "#FF8FA3", label: "Rose" },
  { from: "#FFD3B0", to: "#FFB6C9", label: "Apricot" },
  { from: "#F6DFD3", to: "#FFD3B0", label: "Cocoa" },
  { from: "#E7D6FF", to: "#FFB6C9", label: "Lilac" },
  { from: "#FFCFDD", to: "#E7D6FF", label: "Blush" },
];

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const isEditing = Boolean(product);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    story: product?.story ?? "",
    price: product?.price ?? 0,
    compareAtPrice: product?.compareAtPrice ?? undefined,
    tag: product?.tag ?? "",
    categorySlug: product?.categorySlug ?? "",
    collectionSlug: product?.collectionSlug ?? "",
    collectionSlugs: product?.collectionSlugs ?? [],
    gradientFrom: product?.gradientFrom ?? GRADIENT_PRESETS[0].from,
    gradientTo: product?.gradientTo ?? GRADIENT_PRESETS[0].to,
    stock: product?.stock ?? 0,
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    isTrending: product?.isTrending ?? false,
  });

  const [images, setImages] = useState(product?.images ?? []);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCategories(json.data);
      });
    fetch("/api/collections")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCollections(json.data);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const payload = {
      ...form,
      compareAtPrice: form.compareAtPrice || null,
      collectionSlug: form.collectionSlug || null,
      collectionSlugs: form.collectionSlugs.length > 0 ? form.collectionSlugs : undefined,
      tag: form.tag || null,
      images,
    };

    const res = await fetch(
      isEditing ? `/api/admin/products/${product!.id}` : "/api/admin/products",
      {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    setIsSaving(false);

    if (!json.success) {
      setError(json.error ?? "Couldn't save this product.");
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Short description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="story">Product story</Label>
              <Textarea
                id="story"
                value={form.story}
                onChange={(e) => setForm((f) => ({ ...f, story: e.target.value }))}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ProductImageUpload images={images} onChange={setImages} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & inventory</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 pt-0 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compareAtPrice">Compare-at price</Label>
              <Input
                id="compareAtPrice"
                type="number"
                min={0}
                step="0.01"
                value={form.compareAtPrice ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    compareAtPrice: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Card gradient</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-3">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, gradientFrom: preset.from, gradientTo: preset.to }))
                  }
                  className="flex flex-col items-center gap-2"
                >
                  <span
                    className="h-12 w-12 rounded-2xl ring-2 ring-offset-2 transition"
                    style={{
                      background: `linear-gradient(150deg,${preset.from},${preset.to})`,
                    }}
                  />
                  <span className="text-xs text-muted">{preset.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.categorySlug}
                onValueChange={(value) => setForm((f) => ({ ...f, categorySlug: value }))}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection">Collection</Label>
              <Select
                value={form.collectionSlug}
                onValueChange={(value) => setForm((f) => ({ ...f, collectionSlug: value }))}
              >
                <SelectTrigger id="collection">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((col) => (
                    <SelectItem key={col.id} value={col.slug}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {collections.length > 0 && (
              <div className="space-y-2">
                <Label>Secondary collections</Label>
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-2xl border p-3">
                  {collections
                    .filter((col) => col.slug !== form.collectionSlug)
                    .map((col) => (
                      <label key={col.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.collectionSlugs.includes(col.slug)}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              collectionSlugs: e.target.checked
                                ? [...f.collectionSlugs, col.slug]
                                : f.collectionSlugs.filter((s: string) => s !== col.slug),
                            }))
                          }
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        {col.name}
                      </label>
                    ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="tag">Badge tag</Label>
              <Input
                id="tag"
                placeholder="Bestseller, New, Luxe…"
                value={form.tag}
                onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive" className="normal-case text-sm text-ink">
                Active in storefront
              </Label>
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isFeatured" className="normal-case text-sm text-ink">
                Featured on homepage
              </Label>
              <Switch
                id="isFeatured"
                checked={form.isFeatured}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isTrending" className="normal-case text-sm text-ink">
                Show in trending
              </Label>
              <Switch
                id="isTrending"
                checked={form.isTrending}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isTrending: v }))}
              />
            </div>
          </CardContent>
        </Card>

        {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={isSaving}>
          {isSaving ? "Saving…" : isEditing ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}