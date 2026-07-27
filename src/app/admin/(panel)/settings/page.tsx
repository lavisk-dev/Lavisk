import { isSupabaseConfigured } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isCloudinaryConfigured } from "@/lib/services/cloudinary";
import { isRazorpayConfigured } from "@/lib/services/payment/razorpay.service";
import { isResendConfigured } from "@/lib/services/email/resend";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StoreDetailsForm } from "@/components/admin/settings/store-details-form";

function IntegrationRow({
  name,
  description,
  configured,
  envVars,
}: {
  name: string;
  description: string;
  configured: boolean;
  envVars: string[];
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-4 last:border-0">
      <div>
        <div className="font-semibold text-ink">{name}</div>
        <div className="text-sm text-muted">{description}</div>
        <div className="mt-1 font-mono text-xs text-muted">{envVars.join(", ")}</div>
      </div>
      <Badge variant={configured ? "success" : "warning"}>
        {configured ? "Connected" : "Not configured"}
      </Badge>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>
              The storefront runs on mock data until these are configured — nothing breaks in the
              meantime.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <IntegrationRow
              name="Supabase (database)"
              description="Products, orders, categories and more."
              configured={isSupabaseConfigured}
              envVars={["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]}
            />
            <IntegrationRow
              name="Supabase (admin writes)"
              description="Required for the admin panel to create, edit and delete records."
              configured={isSupabaseAdminConfigured}
              envVars={["SUPABASE_SERVICE_ROLE_KEY"]}
            />
            <IntegrationRow
              name="Cloudinary"
              description="Image hosting for product photos and banners."
              configured={isCloudinaryConfigured}
              envVars={["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]}
            />
            <IntegrationRow
              name="Razorpay"
              description="Checkout payments."
              configured={isRazorpayConfigured}
              envVars={["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"]}
            />
            <IntegrationRow
              name="Resend"
              description="Order confirmation and admin notification emails."
              configured={isResendConfigured}
              envVars={["RESEND_API_KEY"]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Store details</CardTitle>
            <CardDescription>
              Cosmetic for now — wire this up to a settings table once Supabase is connected.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <StoreDetailsForm />
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Admin access</CardTitle>
          <CardDescription>Placeholder credentials gate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm text-muted">
          <p>
            Sign-in currently checks <code className="font-mono text-ink">ADMIN_USERNAME</code> /
            <code className="font-mono text-ink"> ADMIN_PASSWORD</code> environment variables and
            issues a signed cookie.
          </p>
          <p>Swap this for Supabase Auth or your SSO provider before going to production.</p>
        </CardContent>
      </Card>
    </div>
  );
}
