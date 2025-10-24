"use client";

import MultiOrderCheckout from "@/components/page/multi-order-checkout";

/**
 * Đây là entry chính cho route /checkout.
 * Chỉ cần render component "MultiOrderCheckout" – nơi chúng ta quản lý nhiều hóa đơn.
 */
export default function CheckoutPage() {
  return <MultiOrderCheckout />;
}
