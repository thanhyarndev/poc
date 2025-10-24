export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock?: number;
  preOrdered?: number;
}

export interface ProductInfo {
  productId: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  price: number;
}

export interface EpcItem {
  epc: string;
  productId: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string; // Added sku property
  totalQuantity?: number; // Total number of EPCs
  activeQuantity?: number; // Number of active EPCs
}

export const mockProducts: ProductInfo[] = [
  {
    productId: "prodA",
    sku: "CAB101",
    name: "RFID Access Card",
    category: "Security",
    description: "Used for entry authentication in cabinet system.",
    price: 250,
  },
  {
    productId: "prodB",
    sku: "CAB102",
    name: "Temperature Logger",
    category: "IoT Sensor",
    description: "Real-time environmental monitoring device.",
    price: 890,
  },
  {
    productId: "prodC",
    sku: "CAB103",
    name: "Medicine Pack",
    category: "Pharmacy",
    description: "Controlled medicine storage with RFID tracking.",
    price: 1500,
  },
  {
    productId: "prodD",
    sku: "CAB104",
    name: "Safety Equipment",
    category: "Industrial",
    description: "Equipment with embedded RFID for compliance.",
    price: 1290,
  },
  {
    productId: "prodE",
    sku: "CAB105",
    name: "Sterile Surgical Kit",
    category: "Medical",
    description: "Packaged kits tracked by RFID for clean usage.",
    price: 3200,
  },
];

export const mockEpcList: EpcItem[] = [
  { epc: "ABCD0112", productId: "prodA" },
  { epc: "ABCD0472", productId: "prodA" },
  { epc: "ABCD0483", productId: "prodB" },
  { epc: "ABCD0467", productId: "prodB" },
  { epc: "ABCD0469", productId: "prodC" },
  { epc: "ABCD0464", productId: "prodC" },
  { epc: "ABCD0461", productId: "prodD" },
  { epc: "ABCD0472", productId: "prodD" },
  { epc: "ABCD0080", productId: "prodE" },
  { epc: "ABCD0399", productId: "prodE" },
];
