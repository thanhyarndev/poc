"use client";

import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { CartItem } from "@/app/[locale]/(auth-blank)/app/checkout/data/sample-data";
import { useTranslations } from "next-intl";

interface CartTableProps {
  items: CartItem[];
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onRemove: (id: string) => void;
}

const CartTable: FC<CartTableProps> = ({
  items,
  onIncrease,
  onDecrease,
  onRemove,
}) => {
  const t = useTranslations("Checkout");

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-2 w-10 text-center">#</th>
          <th className="p-2 w-10 text-left">SKU</th>
          <th className="p-2 w-24 text-left">Product Name</th>
          <th className="p-2 w-24 text-right">Unit Price</th>
          <th className="p-2 w-10 text-right">Quantity</th>
          <th className="p-2 w-10 text-right">Total</th>
          <th className="p-2 w-10 text-center">X</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => {
          const itemTotal = item.price * item.quantity;
          return (
            <tr key={item.id} className="border-b last:border-b-0">
              <td className="p-2 text-center">{index + 1}</td>
              <td className="p-2 text-left">{item.sku}</td>
              <td className="p-2 text-left">{item.name}</td>
              <td className="p-2 text-right">
                {item.price?.toLocaleString("vi-VN")} ₫
              </td>
              <td className="p-2 text-right">
                <div className="flex items-center justify-end">
                  <span className="text-base font-small">{item.quantity}</span>
                </div>
              </td>
              <td className="p-2 text-right">
                {itemTotal.toLocaleString("vi-VN")} ₫
              </td>
              <td className="p-2 text-center">
                <Button
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => onRemove(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          );
        })}
        {items.length === 0 && (
          <tr>
            <td colSpan={7} className="p-4 text-center text-gray-500">
              {<div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No items in this order</h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    Click &quot;Start Scanning&quot; to begin adding items to this order using the RFID scanner.
                  </p>
                </div>}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default CartTable;
