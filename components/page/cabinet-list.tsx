"use client";

import { FC, useState } from "react";
import { CabinetItem } from "@/components/page/cabinet-detail";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // bạn có thể thay Table bằng <table> html thuần
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { mockProductsNew } from "@/app/[locale]/(auth-blank)/app/cabinet/data/sample-data";

interface CabinetListProps {
  items: CabinetItem[];
  expectedProductMap: Record<string, string[]>;
  onConfirmAdjustExpected: (productId: string, newExpectedQty: number) => void;
}

interface SelectedProductInfo {
  productId: string;
  expectedQty: number;
  detectedQty: number;
}

const getStatus = (expected: number, actual: number) => {
  if (actual === 0)
    return { label: "🛑 No Item", color: "bg-gray-300", status: "remove" };
  if (actual < expected)
    return {
      label: `⚠ Missed Item ${expected - actual}`,
      color: "bg-yellow-50",
      status: "remove",
    };
  if (actual === expected)
    return { label: "✅ Full", color: "bg-green-50", status: "neutral" };
  return {
    label: `➕ Dư ${actual - expected}`,
    color: "bg-red-50",
    status: "add",
  };
};

const CabinetList: FC<CabinetListProps> = ({
  items,
  expectedProductMap,
  onConfirmAdjustExpected,
}) => {
  // Tạo fullList với cả kỳ vọng + lạ như trước
  const expectedIds = Object.keys(expectedProductMap);
  const unexpectedIds = Array.from(
    new Set(
      items.map((i) => i._id).filter((p) => !expectedIds.includes(p))
    )
  );
  const fullIds = [...unexpectedIds, ...expectedIds];

  const fullList = fullIds.map((productId) => {
    const expectedQty = expectedProductMap[productId]?.length || 0;
    const existing = items.find((i) => i._id === productId);

    if (unexpectedIds.includes(productId)) {
      const actualQty = existing ? Object.keys(existing.epcs).length : 0;
      return {
        productId,
        name:
          existing?.itemName ||
          productId,
        category: existing?.itemGroup || "",
        price: existing?.standardSellingRate || 0,
        expectedQty: 0,
        actualQty,
        status: {
          label: "🚨 Lạ",
          color: "bg-purple-50",
          status: "add" as const,
        },
        firstSeen: existing
          ? new Date(
              Math.min(...Object.values(existing.firstSeenMap))
            ).toLocaleTimeString()
          : "--",
        lastSeen: existing
          ? new Date(
              Math.max(...Object.values(existing.epcs))
            ).toLocaleTimeString()
          : "--",
      };
    }

    if (existing) {
      const actualQty = Object.keys(existing.epcs).length;
      const status = getStatus(expectedQty, actualQty);
      return {
        productId,
        name: existing.itemName,
        category: existing.itemGroup,
        price: existing.standardSellingRate,
        expectedQty,
        actualQty,
        status,
        firstSeen:
          Object.keys(existing.firstSeenMap).length > 0
            ? new Date(
                Math.min(...Object.values(existing.firstSeenMap))
              ).toLocaleTimeString()
            : "--",
        lastSeen:
          Object.keys(existing.epcs).length > 0
            ? new Date(
                Math.max(...Object.values(existing.epcs))
              ).toLocaleTimeString()
            : "--",
      };
    }

    const info = mockProductsNew.find((p) => p.item_code === productId)!;
    return {
      productId,
      name: info.item_name,
      category: info.item_group,
      price: info.standard_rate,
      expectedQty,
      actualQty: 0,
      status: getStatus(expectedQty, 0),
      firstSeen: "--",
      lastSeen: "--",
    };
  });

  // State cho dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [selected, setSelected] = useState<SelectedProductInfo | null>(null);
  const [action, setAction] = useState<"add" | "remove">("add");
  const [adjust, setAdjust] = useState(1);

  const handleRowClick = (info: SelectedProductInfo) => {
    setSelected(info);
    if (info.detectedQty > info.expectedQty) {
      setAction("add");
      setAdjust(info.detectedQty - info.expectedQty);
    } else {
      setAction("remove");
      setAdjust(info.expectedQty - info.detectedQty || 1);
    }
    setOpenDialog(true);
  };

  const handleConfirm = () => {
    if (!selected) return;
    const newExp =
      action === "add"
        ? selected.expectedQty + adjust
        : Math.max(selected.expectedQty - adjust, 0);
    onConfirmAdjustExpected(selected.productId, newExp);
    setOpenDialog(false);
    setSelected(null);
  };

  return (
    <>
      <Card className="shadow-sm border rounded-xl">
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="text-xl font-semibold text-gray-900">Cabinet Contents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="p-3 w-3/12 text-left">Product</th>
                  <th className="p-3 w-2/12 text-left hidden md:table-cell">Category</th>
                  <th className="p-3 w-2/12 text-center">Price</th>
                  <th className="p-3 w-1/12 text-center">Expected</th>
                  <th className="p-3 w-1/12 text-center">Detected</th>
                  <th className="p-3 w-2/12 text-center">Status</th>
                  <th className="p-3 w-3/12 text-center">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fullList.map((item) => (
                  <tr
                    key={item.productId}
                    onClick={() =>
                      handleRowClick({
                        productId: item.productId,
                        expectedQty: item.expectedQty,
                        detectedQty: item.actualQty,
                      })
                    }
                    className={`${item.status.color} hover:bg-opacity-80 cursor-pointer transition-colors`}
                  >
                    <td className="p-3">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.productId}</div>
                    </td>
                    <td className="p-3 text-sm text-gray-600 hidden md:table-cell">
                      {item.category}
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-medium text-gray-900">
                        ${item.price.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.expectedQty}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {item.actualQty}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status.status === 'add' ? 'bg-red-100 text-red-800' :
                        item.status.status === 'remove' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.status.label}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-center">
                      <div className="space-y-1">
                        <div className="text-gray-600">First: {item.firstSeen}</div>
                        <div className="text-gray-600">Last: {item.lastSeen}</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Update Quantity</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">{selected.productId}</h4>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div>Expected: {selected.expectedQty}</div>
                  <div>Detected: {selected.detectedQty}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Action</label>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="act"
                      value="add"
                      checked={action === "add"}
                      onChange={() => setAction("add")}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Add</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="act"
                      value="remove"
                      checked={action === "remove"}
                      onChange={() => setAction("remove")}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remove</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={adjust}
                  min={1}
                  onChange={(e) => setAdjust(Number(e.target.value))}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CabinetList;
