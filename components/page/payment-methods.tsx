"use client";

import { FC } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface PaymentMethodsProps {
  onCheckout: () => void;
}

const PaymentMethods: FC<PaymentMethodsProps> = ({ onCheckout }) => {
  const t = useTranslations("Checkout");

  return (
    <Card>
      <CardContent>
        <h3 className="text-md font-semibold mb-2 mt-2">
          {t("choosePaymentMethod")}
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          <Button variant="outline">{t("cash")}</Button>
          <Button variant="outline">{t("bankTransfer")}</Button>
          <Button variant="outline">{t("card")}</Button>
          <Button variant="outline">{t("eWallet")}</Button>
        </div>
        <Button variant="default" className="w-full" onClick={onCheckout}>
          {t("checkout")}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PaymentMethods;
