"use client";

import MultiOrderCheckoutWebSerial from "@/components/page/multi-order-checkout-webserial";


/**
 * Đây là entry chính cho route /checkout.
 * Chỉ cần render component "MultiOrderCheckout" – nơi chúng ta quản lý nhiều hóa đơn.
 */
export default function NewCheckoutPage() {
  return <MultiOrderCheckoutWebSerial />;
}
