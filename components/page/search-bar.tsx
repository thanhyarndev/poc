"use client";

import { FC, ChangeEvent, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import type {
  CartItem,
  Product,
} from "@/app/[locale]/(auth-blank)/app/checkout/data/sample-data";
import { useTranslations } from "next-intl";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddProduct: (product: CartItem) => void;
  productList?: Product[]; // ⚠️ optional để tránh undefined
}

const SearchBar: FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onAddProduct,
  productList = [], // ✅ fallback rỗng nếu không có dữ liệu
}) => {
  const t = useTranslations("Checkout");

  // Xử lý thay đổi nội dung tìm kiếm
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  // Lọc danh sách theo từ khóa
  const filteredProducts = productList.filter((prod) => {
    const query = searchTerm.toLowerCase();
    return (
      prod.name.toLowerCase().includes(query) ||
      prod.sku.toLowerCase().includes(query)
    );
  });

  // Khi chọn sản phẩm
  const handleProductClick = (prod: Product) => {
    onAddProduct({
      id: prod.id,
      sku: prod.sku,
      name: prod.name,
      price: prod.price,
      quantity: 1,
    });
    onSearchChange(""); // clear
  };

  // Nhấn Enter → chọn sản phẩm đầu tiên nếu có
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredProducts.length > 0) {
      handleProductClick(filteredProducts[0]);
    }
  };

  return (
    <div className="space-y-2 relative">
      {/* Thanh tìm kiếm */}
      <Input
        placeholder={t("searchPlaceholder")}
        value={searchTerm}
        onChange={handleSearchChange}
        onKeyDown={handleKeyDown}
      />

      {/* Danh sách kết quả */}
      {searchTerm && (
        <div
          className="
            absolute 
            top-full 
            left-0 
            w-full 
            z-50 
            bg-white 
            shadow 
            rounded 
            mt-1 
            max-h-60 
            overflow-auto
          "
        >
          {filteredProducts.length === 0 ? (
            <p className="text-sm text-gray-500 p-2">{t("notFound")}</p>
          ) : (
            filteredProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => handleProductClick(prod)}
                className="
                  flex 
                  flex-col 
                  gap-1 
                  px-3 
                  py-2 
                  border-b 
                  last:border-b-0 
                  cursor-pointer
                  hover:bg-gray-50
                "
              >
                <span className="font-medium">{prod.name}</span>
                <span className="text-sm text-gray-500">{prod.sku}</span>
                <span className="text-xs text-gray-400">
                  {t("stockPreOrder", {
                    stock: prod.stock ?? 0,
                    preOrdered: prod.preOrdered ?? 0,
                  })}
                </span>
                <span className="text-blue-600 font-semibold">
                  {prod.price.toLocaleString("vi-VN")} ₫
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
