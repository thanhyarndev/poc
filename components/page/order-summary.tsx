"use client";

import { FC } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface OrderSummaryProps {
  subtotal: number;
  discount: number;
  tax: number;
  totalDue: number;
  isEmpty?: boolean; // ✅ Thêm prop này để biết giỏ hàng có trống không
}

const OrderSummary: FC<OrderSummaryProps> = ({
  subtotal,
  discount,
  tax,
  totalDue,
  isEmpty = false,
}) => {
  const t = useTranslations("Checkout");

  return (
    <Card>
      <CardContent>
        <h2 className="text-md font-semibold mb-4 mt-2">
          {t("orderSummaryTitle")}
        </h2>

        {/* Nếu giỏ hàng trống thì hiển thị lời nhắc */}
        {isEmpty ? (
          <div className="text-center text-sm text-gray-500">
            {t("pleaseSelectProduct")} {/* key đa ngôn ngữ */}
          </div>
        ) : (
          <>
            <div className="flex justify-between mb-2">
              <span>{t("subtotal")}:</span>
              <span>{subtotal.toLocaleString("vi-VN")} ₫</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>{t("discount")}:</span>
              <span>{discount.toLocaleString("vi-VN")} ₫</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>{t("tax")}:</span>
              <span>{tax.toLocaleString("vi-VN")} ₫</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between mb-2 font-bold">
              <span>{t("totalDue")}:</span>
              <span>{totalDue.toLocaleString("vi-VN")} ₫</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>{t("amountPaid")}:</span>
              <span>{totalDue.toLocaleString("vi-VN")} ₫</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderSummary;
