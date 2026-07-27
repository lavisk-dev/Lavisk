"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BRAND_NAME, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

export function StoreDetailsForm() {
  const [saved, setSaved] = useState(false);
  const [storeName, setStoreName] = useState(BRAND_NAME);
  const [supportEmail, setSupportEmail] = useState("hello@lavisk.example");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(FREE_SHIPPING_THRESHOLD);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="storeName">Store name</Label>
        <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="supportEmail">Support email</Label>
        <Input
          id="supportEmail"
          type="email"
          value={supportEmail}
          onChange={(e) => setSupportEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="freeShipping">Free shipping threshold ($)</Label>
        <Input
          id="freeShipping"
          type="number"
          min={0}
          value={freeShippingThreshold}
          onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
        />
      </div>
      <div className="flex items-end sm:col-span-2">
        <Button type="submit">{saved ? "Saved ✓" : "Save changes"}</Button>
      </div>
    </form>
  );
}
