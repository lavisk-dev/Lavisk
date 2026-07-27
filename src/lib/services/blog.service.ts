import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { mockBlogPosts } from "@/lib/data/blog-data";
import type { BlogPost } from "@/lib/types";
import { slugify } from "@/lib/utils";

export const BlogService = {
  async listPublished(limit?: number): Promise<BlogPost[]> {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        let query = supabase
          .from("blog_posts")
          .select("*")
          .eq("is_published", true)
          .order("published_at", { ascending: false });
        if (limit) query = query.limit(limit);
        const { data } = await query;
        if (data) return data as unknown as BlogPost[];
      }
    }
    const items = [...mockBlogPosts]
      .filter((p) => p.isPublished)
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    return limit ? items.slice(0, limit) : items;
  },

  async listAll(): Promise<BlogPost[]> {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        const { data } = await supabase
          .from("blog_posts")
          .select("*")
          .order("published_at", { ascending: false });
        if (data) return data as unknown as BlogPost[];
      }
    }
    return [...mockBlogPosts].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  },

  async getBySlug(slug: string): Promise<BlogPost | null> {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        const { data } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();
        if (data) return data as unknown as BlogPost;
      }
    }
    return mockBlogPosts.find((p) => p.slug === slug) ?? null;
  },

  async getRelated(post: BlogPost, limit = 3): Promise<BlogPost[]> {
    const all = await this.listPublished();
    return all
      .filter((p) => p.id !== post.id && (p.category === post.category || post.keywords?.some((k) => p.keywords?.includes(k))))
      .slice(0, limit);
  },

  async create(input: Partial<BlogPost>): Promise<BlogPost> {
    const admin = createAdminClient();
    const now = new Date().toISOString();
    const payload = {
      ...input,
      slug: input.slug ?? slugify(input.title ?? ""),
      publishedAt: input.publishedAt ?? now,
      updatedAt: now,
    };
    if (isSupabaseAdminConfigured && admin) {
      const { data, error } = await admin.from("blog_posts").insert(payload).select().single();
      if (error) throw new Error(error.message);
      return data as unknown as BlogPost;
    }
    const post: BlogPost = {
      id: `blog_${Date.now()}`,
      slug: payload.slug as string,
      title: input.title ?? "Untitled post",
      excerpt: input.excerpt ?? "",
      content: input.content ?? "",
      authorName: input.authorName ?? "Editorial",
      authorRole: input.authorRole,
      category: input.category ?? "Ideas",
      readingMinutes: input.readingMinutes ?? 3,
      coverColorFrom: input.coverColorFrom ?? "#FFB6C9",
      coverColorTo: input.coverColorTo ?? "#FF8FA3",
      coverEmoji: input.coverEmoji ?? "🎁",
      coverImageUrl: input.coverImageUrl ?? null,
      coverImagePublicId: input.coverImagePublicId ?? null,
      isPublished: input.isPublished ?? false,
      publishedAt: payload.publishedAt as string,
      updatedAt: now,
      faq: input.faq,
      keywords: input.keywords,
    };
    mockBlogPosts.push(post);
    return post;
  },
};
