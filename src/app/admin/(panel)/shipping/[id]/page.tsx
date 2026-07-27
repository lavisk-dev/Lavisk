import { AdminShippingDetail } from "@/components/admin/shipping/admin-shipping-detail";

export default async function AdminShipmentDetailPage() {
  return (
    <AdminShippingDetail
      shipment={{
        id: "",
        orderId: "",
        trackingNumber: null,
        courier: "",
        provider: "",
        weight: null,
        length: null,
        width: null,
        height: null,
        dimensionUnit: "cm",
        status: "pending",
        pickupStatus: "pending",
        pickupScheduledAt: null,
        pickedUpAt: null,
        deliveredAt: null,
        estimatedDelivery: null,
        labelUrl: null,
        labelFormat: null,
        packingSlipUrl: null,
        invoiceUrl: null,
        qrCode: null,
        barcode: null,
        shippingCost: null,
        isReturn: false,
        returnReason: null,
        notes: null,
        createdAt: "",
        updatedAt: "",
      }}
      tracking={[]}
      labels={[]}
      pickup={null}
    />
  );
}