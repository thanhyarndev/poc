"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { importProduct } from "@/hooks/api";


export function ImportProductForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dropdown options
  const categoryOptions = [
    "Thuốc",
    "Dụng cụ y tế",
    "Sách",
    "Trang sức",
    "Khác"
  ];
  
  const itemGroupOptions = [
    "Sản phẩm",
  ];
  
  const stockUomOptions = [
    "unit",
    "box",
    "bottle",
    "pack"
  ];
  
  // Form fields
  const [orgId, setOrgId] = useState("NW");
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState(categoryOptions[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [itemGroup, setItemGroup] = useState(itemGroupOptions[0]);
  const [standardSellingRate, setStandardSellingRate] = useState<number>(0);
  const [stockUom, setStockUom] = useState(stockUomOptions[0]);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);

  // Calculate subtotal based on price, discount and tax
  const calculateSubtotal = (price: number, discountPercent: number, taxPercent: number) => {
    const discountAmount = price * (discountPercent / 100);
    const priceAfterDiscount = price - discountAmount;
    const taxAmount = priceAfterDiscount * (taxPercent / 100);
    return priceAfterDiscount + taxAmount;
  };

  // Reset form function to clear all fields to initial values
  const resetForm = () => {
    setOrgId("UN");
    setItemCode("");
    setItemName("");
    setCategory(categoryOptions[0]);
    setCustomCategory("");
    setDescription("");
    setItemGroup(itemGroupOptions[0]);
    setStandardSellingRate(0);
    setStockUom(stockUomOptions[0]);
    setDiscount(0);
    setTax(0);
    setError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Prepare the payload
      const payload = {
        orgId,
        itemCode,
        itemName,
        category: category === "Khác" ? customCategory : category,
        description,
        itemGroup,
        standardSellingRate: calculateSubtotal(standardSellingRate, discount, tax),
        stockUom
      };
      
      // TODO: Add your API call here
      console.log("Submitting product:", payload);
      
      // Simulate API call
      const api = await importProduct(payload)
      if (api.statusCode === 200) {
        toast({
          title: "Imported successfully",
          description: "New product added successfully",
        });
      }
      
      // Reset form or redirect
      
      toast({
        title: "Successful",
        description: "New product is added!",
      })

      resetForm();
      
    } catch (err) {
      setError("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            New Product
          </CardTitle>
          <CardDescription>Fill in details to create a new product</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="orgId">Organization ID</Label>
                  <Input
                    id="orgId"
                    type="text"
                    value={orgId}
                    onChange={(e) => setOrgId(e.target.value)}
                    placeholder="Organization ID"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="itemCode">Item Code</Label>
                  <Input
                    id="itemCode"
                    type="text"
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    placeholder="Enter item code"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="itemName">Item Name</Label>
                  <Input
                    id="itemName"
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Enter item name"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem 
                          key={option} 
                          value={option}
                          className={option === "Khác" ? "border-t border-gray-200 mt-2 pt-2 text-gray-500 italic" : ""}
                        >
                          {option === "Khác" ? (
                            <div className="flex items-center gap-2">
                              <span>+</span>
                              <span>{option}</span>
                            </div>
                          ) : (
                            option
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {category === "Khác" && (
                  <>
                    <div></div>
                    <div className="grid gap-2">
                      <Input
                        id="customCategory"
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Enter custom category"
                        required
                      />
                    </div>
                  </>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="standardSellingRate">Base Price</Label>
                  <Input
                    id="standardSellingRate"
                    type="number"
                    value={standardSellingRate}
                    onChange={(e) => setStandardSellingRate(Number(e.target.value))}
                    placeholder="Enter base price"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    placeholder="Enter discount percentage"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tax">Tax (%)</Label>
                  <Input
                    id="tax"
                    type="number"
                    min="0"
                    max="100"
                    value={tax}
                    onChange={(e) => setTax(Number(e.target.value))}
                    placeholder="Enter tax percentage"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="finalPrice">Final Price</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="finalPrice"
                      type="number"
                      value={calculateSubtotal(standardSellingRate, discount, tax)}
                      readOnly
                      className="bg-gray-50"
                    />
                    <span className="text-sm text-gray-500">
                      (Base: {standardSellingRate} - Discount: {discount}% + Tax: {tax}%)
                    </span>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="stockUom">Stock UOM</Label>
                  <Select value={stockUom} onValueChange={setStockUom}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit of measure" />
                    </SelectTrigger>
                    <SelectContent>
                      {stockUomOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2 mt-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>
              
              <Button type="submit" className="w-full mt-4" disabled={loading}>
                {loading ? "Creating..." : "Create Product"}
              </Button>

              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
