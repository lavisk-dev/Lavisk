import { CustomerService } from "@/lib/services/customer.service";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminCustomersPage() {
  const customers = await CustomerService.list();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">{customers.length} customers</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>Total spent</TableHead>
            <TableHead>Customer since</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-semibold text-ink">{customer.name}</TableCell>
              <TableCell className="text-muted">{customer.email}</TableCell>
              <TableCell>{customer.totalOrders}</TableCell>
              <TableCell className="font-semibold">{formatCurrency(customer.totalSpent)}</TableCell>
              <TableCell className="text-muted">{formatDate(customer.createdAt)}</TableCell>
            </TableRow>
          ))}
          {customers.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-sm text-muted">
                No customers yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
