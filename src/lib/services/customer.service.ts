import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { mockCustomers } from "@/lib/data/mock-data";
import type { Customer } from "@/lib/types";

export const CustomerService = {
  async list(): Promise<Customer[]> {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        const { data } = await supabase
          .from("customers")
          .select("*")
          .order("total_spent", { ascending: false });
        if (data) return data as unknown as Customer[];
      }
    }
    return [...mockCustomers].sort((a, b) => b.totalSpent - a.totalSpent);
  },
};
