import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-5 pt-24 text-center">
      <div className="font-display text-[clamp(90px,20vw,160px)] font-extrabold leading-none tracking-[-0.04em] text-brand">
        404
      </div>
      <h1 className="mt-2 font-display text-3xl font-bold">This gift went missing</h1>
      <p className="mt-3 text-muted">
        The page you&apos;re looking for isn&apos;t here — but there&apos;s plenty more to unwrap.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/shop">Browse gifts</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </div>
  );
}
