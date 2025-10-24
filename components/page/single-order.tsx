import CartTable from "./cart-table";
import { Button } from "@/components/ui/button";
import { FC, useState } from "react";
import type { CartItem } from "@/app/[locale]/(auth-blank)/app/checkout/data/sample-data";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle2, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface SingleOrderProps {
  order: {
    cartItems: CartItem[];
  };
  onSearchChange: () => void;
  onAddProduct: () => void;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onRemove: (id: string) => void;
  onTaxChange: (value: number) => void;
  onDiscountChange: (value: number) => void;
  subtotal: number;
  discount: number;
  tax: number;
  totalDue: number;
  taxPercentage: number;
  discountPercentage: number;
}

type CheckoutState = "idle" | "loading" | "qr" | "success";

const SingleOrder: FC<SingleOrderProps> = ({
  order,
  onIncrease,
  onDecrease,
  onRemove,
  onTaxChange,
  onDiscountChange,
  subtotal,
  discount,
  tax,
  totalDue,
  taxPercentage,
  discountPercentage,
}) => {
  const isEmpty = order.cartItems.length === 0;
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("idle");
  const [showDialog, setShowDialog] = useState(false);
  const [paymentData, setPaymentData] = useState<string>("");

  const handleCheckout = () => {
    setShowDialog(true);
    setCheckoutState("loading");
    
    // Generate payment data once
    const data = JSON.stringify({
      amount: totalDue,
      currency: "VND",
      orderId: `ORDER-${Date.now()}`,
      timestamp: new Date().toISOString(),
      items: order.cartItems.length,
      discount: discount,
      tax: tax,
    });
    setPaymentData(data);
    
    // Simulate loading time
    setTimeout(() => {
      setCheckoutState("qr");
    }, 2000);
  };

  const handlePaymentComplete = () => {
    setCheckoutState("success");
    
    // Simulate success state and close dialog
    setTimeout(() => {
      setShowDialog(false);
      setCheckoutState("idle");
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Product list */}
      <div className="w-[90%] mx-auto">
        <CartTable
          items={order.cartItems}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          onRemove={onRemove}
        />
      </div>

      {/* Summary and Checkout Button */}
      <div className="w-[90%] mx-auto">
        <div className="bg-white border rounded-md p-4 shadow-sm space-y-3">
          <h2 className="text-md font-semibold mb-2">Order Summary</h2>

          {isEmpty ? (
            <div className="text-center text-gray-500 text-sm">
              Please select products to place an order
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{subtotal.toLocaleString("vi-VN")} ₫</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Discount:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercentage}
                    onChange={(e) => onDiscountChange(Number(e.target.value))}
                    className="w-20 h-8"
                  />
                  %
                  <span className="w-32 text-right">{discount.toLocaleString("vi-VN")} ₫</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Tax:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={taxPercentage}
                    onChange={(e) => onTaxChange(Number(e.target.value))}
                    className="w-20 h-8"
                  />
                  %
                  <span className="w-32 text-right">{tax.toLocaleString("vi-VN")} ₫</span>
                </div>
              </div>
              <hr />
              <div className="flex justify-between font-semibold py-3">
                <span>Total Due:</span>
                <span>{totalDue.toLocaleString("vi-VN")} ₫</span>
              </div>
              <Button 
                className="w-full mt-2" 
                onClick={handleCheckout}
                disabled={checkoutState !== "idle"}
              >
                {checkoutState === "idle" ? "Checkout" : "Processing..."}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Payment</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-6">
            {checkoutState === "loading" && (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                <p className="text-gray-600">Preparing payment...</p>
              </div>
            )}

            {checkoutState === "qr" && (
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <QRCodeSVG 
                    value={paymentData}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-gray-600">Scan this QR code with your mobile banking app</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold">{totalDue.toLocaleString("vi-VN")} ₫</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items:</span>
                      <span>{order.cartItems.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount:</span>
                      <span>{discount.toLocaleString("vi-VN")} ₫</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span>{tax.toLocaleString("vi-VN")} ₫</span>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handlePaymentComplete}
                  className="mt-4"
                >
                  Payment Complete
                </Button>
              </div>
            )}

            {checkoutState === "success" && (
              <div className="flex flex-col items-center gap-4">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <p className="text-gray-600">Payment successful!</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SingleOrder;
