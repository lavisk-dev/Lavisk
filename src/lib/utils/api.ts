import { NextResponse } from "next/server";
import type { ApiResponse } from "@/lib/types";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, init);
}

export function fail(error: string, status = 400) {
  return NextResponse.json<ApiResponse<never>>({ success: false, error }, { status });
}

export function serverError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Something went wrong. Please try again.";
  return NextResponse.json<ApiResponse<never>>(
    { success: false, error: message },
    { status: 500 }
  );
}
