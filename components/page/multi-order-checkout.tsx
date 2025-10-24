"use client";

import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useTranslations } from "next-intl";
import { toast } from "@/hooks/use-toast";
import { Tag, X, Search, ShoppingCart, Plus, Trash, Zap, ShoppingBag } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getProductId, getTagValue } from "@/hooks/api";
import { getDeviceHeaders, DEVICE_CONSTANTS } from "@/config/constants";
import SingleOrder from "./single-order";
import {
  mockProducts,
  mockEpcList,
} from "@/app/[locale]/(auth-blank)/app/checkout/data/sample-data";

interface CartItem {
  itemCode: string;
  itemName: string;
  standardSellingRate: number;
  epcs: string[];
  activeEpcs?: string[];
}

interface Order {
  id: string;
  name: string;
  cartItems: CartItem[];
  searchTerm: string;
  scannedEpcList: string[];
}

function generateRandomId(): string {
  return (
    Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 8)
  );
}

const TTL = 2000;

export default function MultiOrderCheckout() {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: generateRandomId(),
      name: `Order #1`,
      cartItems: [],
      searchTerm: "",
      scannedEpcList: [],
    },
  ]);

  const [activeTab, setActiveTab] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const epcTimestamps = useRef<Map<string, Map<string, number>>>(new Map());
  
  useEffect(() => {
    if (!epcTimestamps.current.has(orders[0].id)) {
      epcTimestamps.current.set(orders[0].id, new Map());
    }
  }, [orders]);

  const currentOrder = orders[activeTab];

  const handleEpcScan = async (epc: string) => {
    const res = await getTagValue(epc);

    if(res.tagType !== "TAG_PRODUCT" && res.tagType !== "TAG_MEDICAL") return;

    const product = await getProductId(res.tagValue);

    const orderEpcMap = epcTimestamps.current.get(currentOrder.id) || new Map();
    orderEpcMap.set(epc, Date.now());
    epcTimestamps.current.set(currentOrder.id, orderEpcMap);

    setOrders((prev) =>
      prev.map((order, idx) => {
        if (idx !== activeTab) return order;
        
        const isEpcAlreadyScanned = order.scannedEpcList.includes(epc);
        const updatedScannedList = isEpcAlreadyScanned 
          ? order.scannedEpcList 
          : [...order.scannedEpcList, epc];

        const existingItemIndex = order.cartItems.findIndex(
          (item) => item.itemCode === product.itemCode
        );

        let updatedCart = [...order.cartItems];

        if (existingItemIndex >= 0) {
          const existingItem = updatedCart[existingItemIndex];
          if (!existingItem.epcs.includes(epc)) {
            updatedCart[existingItemIndex] = {
              ...existingItem,
              epcs: [...existingItem.epcs, epc],
              activeEpcs: [...existingItem.epcs, epc]
            };
          }
        } else {
          const newItem: CartItem = {
            itemCode: product.itemCode,
            itemName: product.itemName,
            standardSellingRate: product.standardSellingRate,
            epcs: [epc],
            activeEpcs: [epc]
          };
          updatedCart = [...updatedCart, newItem];
        }

        return {
          ...order,
          scannedEpcList: updatedScannedList,
          cartItems: updatedCart,
        };
      })
    );
  };

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_HOST, {
      path: "/socket.io",
      extraHeaders: getDeviceHeaders()
    });

    socket.on("connect", () => {
      console.log("✅ Connected");
      toast({
        title: "RFID Scanner Connected",
        description: "Ready to scan items."
      });
    });

    // socket.onAny((data: any) => {
    //   console.log("msg", data)
    // })
    
    socket.on("disconnect", () => console.log("🔌 Disconnected"));
    socket.on("error", (err) => console.error("WebSocket error:", err));

    socket.on("dv-LAUNCHPAD", (data: any) => {
      if (isListening) {
        let processedData = data;
        if (typeof data === 'string') {
          try {
            processedData = JSON.parse(data);
          } catch (error) {
            console.error("Error parsing data string:", error);
          }
        }

        //if(processedData.deviceId === "CABINET") return;

        handleEpcScan(processedData.epc);
      }
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [isListening, activeTab, orders]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setOrders((prevOrders) =>
        prevOrders.map((order, index) => {
          if (index !== activeTab) return order;

          const orderEpcMap = epcTimestamps.current.get(order.id) || new Map();
          
          const inactiveEpcs = order.scannedEpcList.filter((epc) => {
            const lastSeen = orderEpcMap.get(epc);
            return !lastSeen || now - lastSeen >= TTL;
          });

          const updatedEpcList = order.scannedEpcList.filter(
            (epc) => !inactiveEpcs.includes(epc)
          );

          const updatedCartItems = order.cartItems
            .map((item) => {
              const updatedEpcs = item.epcs.filter(
                (epc) => !inactiveEpcs.includes(epc)
              );
              
              return {
                ...item,
                epcs: updatedEpcs,
                activeEpcs: updatedEpcs
              };
            })
            .filter((item) => item.epcs.length > 0);

          return {
            ...order,
            scannedEpcList: updatedEpcList,
            cartItems: updatedCartItems,
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const handleAddOrder = () => {
    const newOrderId = generateRandomId();
    const newOrder: Order = {
      id: newOrderId,
      name: `Order #${orders.length + 1}`,
      cartItems: [],
      searchTerm: "",
      scannedEpcList: [],
    };
    
    epcTimestamps.current.set(newOrderId, new Map());
    
    setOrders([...orders, newOrder]);
    setActiveTab(orders.length);
  };

  const handleChangeTab = (index: number) => {
    setIsListening(false);
    setActiveTab(index);
  };

  const handleCloseOrder = (index: number) => {
    const orderToRemove = orders[index];
    
    if (orderToRemove) {
      epcTimestamps.current.delete(orderToRemove.id);
    }
    
    const updatedOrders = orders.filter((_, i) => i !== index);

    if (updatedOrders.length === 0) {
      const newOrderId = generateRandomId();
      const newOrder = {
        id: newOrderId,
        name: `Order #1`,
        cartItems: [],
        searchTerm: "",
        scannedEpcList: [],
      };
      
      epcTimestamps.current.set(newOrderId, new Map());
      
      setOrders([newOrder]);
      setActiveTab(0);
    } else {
      setOrders(updatedOrders);
      if (index <= activeTab && activeTab > 0) {
        setActiveTab(activeTab - 1);
      }
    }

    setIsListening(false);
  };

  const handleClearOrder = () => {
    const orderToClear = orders[activeTab];
    
    if (orderToClear) {
      epcTimestamps.current.set(orderToClear.id, new Map());
    }
    
    setOrders((prev) =>
      prev.map((order, idx) =>
        idx === activeTab
          ? { ...order, cartItems: [], scannedEpcList: [] }
          : order
      )
    );
    
    toast({
      title: "Order Cleared",
      description: `All items removed from ${currentOrder.name}`,
      variant: "destructive",
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setOrders((prev) =>
      prev.map((order, idx) => {
        if (idx !== activeTab) return order;

        const itemToRemove = order.cartItems.find(item => item.epcs[0] === itemId);
        if (!itemToRemove) return order;

        const updatedScannedEpcList = order.scannedEpcList.filter(
          epc => !itemToRemove.epcs.includes(epc)
        );

        const updatedCartItems = order.cartItems.filter(
          item => item.epcs[0] !== itemId
        );

        return {
          ...order,
          scannedEpcList: updatedScannedEpcList,
          cartItems: updatedCartItems,
        };
      })
    );

    toast({
      title: "Item Removed",
      description: "The item has been removed from the order",
    });
  };

  const subtotal =
    currentOrder?.cartItems?.reduce(
      (acc, item) => acc + item.standardSellingRate * item.epcs.length,
      0
    ) ?? 0;

  const discount = (subtotal * discountPercentage) / 100;
  const tax = ((subtotal - discount) * taxPercentage) / 100;
  const totalDue = subtotal - discount + tax;

  const handleTaxChange = (value: number) => {
    setTaxPercentage(value);
  };

  const handleDiscountChange = (value: number) => {
    setDiscountPercentage(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Multi-Order Checkout</h1>
              <p className="mt-2 text-gray-600">Manage multiple checkout orders with RFID scanning</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-sm text-gray-600">{isListening ? 'Scanning Active' : 'Scan Paused'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Management */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Order Management */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Orders</h2>
                <Button 
                  size="sm" 
                  className="text-xs px-2 py-1"
                >
                  + New Order
                </Button>
              </div>
              
              {/* Order Tabs */}
              <div className="space-y-2 mb-6">
                {orders.map((order, index) => (
                  <div
                    key={order.id}
                    className={`px-4 py-3 rounded-lg border cursor-pointer 
                      flex items-center justify-between transition-colors
                      ${index === activeTab
                        ? "bg-blue-50 border-blue-300 shadow-sm"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    onClick={() => handleChangeTab(index)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        index === activeTab ? "bg-blue-500" : "bg-gray-400"
                      }`}/>
                      <span className="font-medium">{order.name}</span>
                      <span className="text-xs text-gray-500">
                        ({order.cartItems.length} items)
                      </span>
                    </div>
                    <button
                      className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseOrder(index);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Scan Controls */}
              <div className="space-y-4 mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">Scanner Controls</h3>
                
                <Button
                  onClick={() => setIsListening(!isListening)}
                  variant={isListening ? "destructive" : "default"}
                  className="w-full justify-center"
                >
                  {isListening ? (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      Stop Scanning
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 8v8H5V8h10m-10 0a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2m0 0h4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h10Z"></path>
                      </svg>
                      Start Scanning
                    </div>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleClearOrder}
                  className="w-full justify-center"
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                    Clear Order
                  </div>
                </Button>
              </div>

              
              
              {/* Order Summary */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-medium">{currentOrder?.cartItems.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total items:</span>
                    <span className="font-medium">{currentOrder?.cartItems.reduce((acc, item) => acc + item.epcs.length, 0) || 0}</span>
                  </div>
                  {/* <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{subtotal.toLocaleString("vi-VN")} ₫</span>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Panel - Order Details & Checkout */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Current Order Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {currentOrder?.name || "Order Details"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {currentOrder?.cartItems.length 
                      ? `${currentOrder.cartItems.length} unique ${currentOrder.cartItems.length === 1 ? 'product' : 'products'}, ${currentOrder.cartItems.reduce((acc, item) => acc + item.epcs.length, 0)} total items`
                      : "No items added yet"}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs ${
                    isListening 
                      ? "bg-green-100 text-green-800" 
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {isListening ? "Scanning Active" : "Ready to Scan"}
                  </div>
                </div>
              </div>
              
              {/* Checkout Component */}
              {currentOrder && (
                <SingleOrder
                  order={{
                    cartItems: currentOrder.cartItems.map((item) => ({
                      id: item.epcs[0],
                      name: item.itemName,
                      sku: item.itemCode,
                      price: item.standardSellingRate,
                      quantity: item.epcs.length,
                    })),
                  }}
                  onSearchChange={() => {}}
                  onAddProduct={() => {}}
                  onIncrease={() => {}}
                  onDecrease={() => {}}
                  onRemove={handleRemoveItem}
                  onTaxChange={handleTaxChange}
                  onDiscountChange={handleDiscountChange}
                  subtotal={subtotal}
                  discount={discount}
                  tax={tax}
                  totalDue={totalDue}
                  taxPercentage={taxPercentage}
                  discountPercentage={discountPercentage}
                />
              )}
            </div>
            
            {/* RFID Tags Panel - Only visible when scanning */}
            {false && (
              <div className="bg-white rounded-xl shadow-sm mt-6 overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Active RFID Tags</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {currentOrder?.scannedEpcList.length || 0} active tags detected
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EPC</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Detected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentOrder?.scannedEpcList.map((epc, i) => {
                        const matchedEpc = mockEpcList.find((item) => item.epc === epc);
                        const product = matchedEpc ? mockProducts.find(p => p.productId === matchedEpc.productId) : null;
                        
                        return (
                          <tr key={epc} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{i + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{epc}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {product ? product.name : "Unknown Product"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(epcTimestamps.current.get(currentOrder.id)?.get(epc) || Date.now()).toLocaleTimeString()}
                            </td>
                          </tr>
                        );
                      })}
                      
                      {(!currentOrder?.scannedEpcList.length) && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center text-gray-500">
                              <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-sm">No active RFID tags detected</p>
                              <p className="text-xs mt-1">Move items within scanner range to detect them</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}