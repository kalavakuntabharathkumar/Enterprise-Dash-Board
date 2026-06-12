import React from "react";
import { useListProducts, useGetStockOverview } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, XCircle, DollarSign } from "lucide-react";

export default function InventoryPage() {
  const { data: products, isLoading: isLoadingProducts } = useListProducts();
  const { data: stats, isLoading: isLoadingStats } = useGetStockOverview();

  const metrics = [
    { title: "Total Products", value: stats?.total_products || 0, icon: Package, color: "text-blue-500" },
    { title: "Low Stock Items", value: stats?.low_stock || 0, icon: AlertTriangle, color: "text-amber-500" },
    { title: "Out of Stock", value: stats?.out_of_stock || 0, icon: XCircle, color: "text-red-500" },
    { title: "Total Value", value: `$${(stats?.total_value || 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-500" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground mt-2 text-sm">Product catalog and stock management.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <Card key={i} className="shadow-sm border-gray-200/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.title}</CardTitle>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "-" : m.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingProducts ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading products...</TableCell>
                </TableRow>
              ) : products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{product.sku}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="text-right">${product.unit_price.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">{product.stock}</TableCell>
                  <TableCell>
                    <Badge variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}>
                      {product.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoadingProducts && products?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
