"use client";
import * as React from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { getTagValue, getProductId, HOST as WS_HOST } from "@/hooks/api";
import { toast } from "@/hooks/use-toast";
import { setTags } from "@sentry/nextjs";
import AvatarMe from "@/components/ui/avatar-me";
import { useTranslations } from "next-intl";
import { getDeviceHeaders, DEVICE_CONSTANTS } from "@/config/constants";


const TTL = 60 * 1000; // 60s

interface TagInfo {
  epc: string;
  rssi: number;
  firstSeen: number;
  lastSeen: number;
}

interface CacheItem<T> {
  data: T;
  expiresAt: number;
}

export default function Page() {
  const [tagType, setTagType] = React.useState<string>("TAG_PRODUCT");
  const [minSignal, setMinSignal] = React.useState<number>(-40);
  const [isListen, setIsListen] = React.useState<boolean>(false);
  const [listTag, setListTag] = React.useState<TagInfo[]>([]);
  const [selectedItem, setSelectedItem] = React.useState<any>(null);
  const [productDict, setProductDict] = React.useState<Record<string, any>>({});
  const [countedTag, setCountedTag] = React.useState<any>([]);
  const [tagDict, setTagDict] = React.useState<Record<string, any>>({});
  const [allProduct, setAllProduct] = React.useState<string[]>([]);
  const socketRef = React.useRef<Socket | null>(null);

  const tagIdCache = React.useRef<Map<string, CacheItem<any>>>(new Map());
  const productIdCache = React.useRef<Map<string, CacheItem<any>>>(new Map());
  const t = useTranslations();

  const getOrFetchTagId = async (epc: string) => {
    const cache = tagIdCache.current.get(epc);
    if (cache && cache.expiresAt > Date.now()) return cache.data;
    const res = await getTagValue(epc);
    if (res.message === "TAG_NOT_FOUND") return null;
    const newData = {
      tagValue: res.tagValue,
      tagEPC: res.tagEPC,
      tagType: res.tagType,
    };
    tagIdCache.current.set(epc, { data: newData, expiresAt: Date.now() + TTL });
    return newData;
  };

  const getOrFetchProductId = async (productId: string) => {
    const cache = productIdCache.current.get(productId);
    if (cache && cache.expiresAt > Date.now()) return cache.data;
    const product = await getProductId(productId);
    const newData = {
      ...product,
      count: 1,
    };
    productIdCache.current.set(productId, {
      data: newData,
      expiresAt: Date.now() + TTL,
    });
    return newData;
  };

  React.useEffect(() => {
    const processTags = async () => {
      const newTagDict = { ...tagDict };
      const newProductDict = { ...productDict };
      const newAllProduct = new Set<string>();
      const newCountedTag = new Set(countedTag);
      const productCounts = new Map<string, number>();

      // First pass: count all product tags
      for (const tag of listTag) {
        const tagData = await getOrFetchTagId(tag.epc);
        if (!tagData || (tagData.tagType !== "TAG_PRODUCT" && tagData.tagType !== "TAG_MEDICAL")) continue;

        // Update tag dictionary
        if (!newTagDict[tag.epc]) {
          newTagDict[tag.epc] = { ...tagData, count: 1 };
        } else {
          newTagDict[tag.epc].count += 1;
        }

        const tagValue = tagData.tagValue;
        newAllProduct.add(tagValue);
        newCountedTag.add(tag.epc);

        // Count product tags
        productCounts.set(tagValue, (productCounts.get(tagValue) || 0) + 1);
      }

      // Second pass: update product information with accurate counts
      for (const [productId, count] of Array.from(productCounts.entries())) {
        const product = await getOrFetchProductId(productId);
        if (product) {
          newProductDict[product._id] = { ...product, count };
        }
      }

      // Update all states at once
      setTagDict(newTagDict);
      setProductDict(newProductDict);
      setAllProduct(Array.from(newAllProduct));
      setCountedTag(Array.from(newCountedTag));
    };

    processTags();
  }, [listTag]);

  React.useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_HOST, {
      path: "/socket.io",
      extraHeaders: getDeviceHeaders()
    });

    socket.on("connect", () => {
      console.log("✅ Connected to WebSocket server");
      console.log("Socket ID:", socket.id);
      console.log("Transport:", socket.io.engine.transport.name);
      console.log("Headers:", socket.io.opts.extraHeaders);
      
      toast({
        title: t("boxes.smart.toast.title"),
        description: t("boxes.smart.toast.description")
      });
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
      console.log("Error details:", {
        message: error.message,
        type: error.type,
        description: error.description
      });
    });
    socket.on("disconnect", () => console.log("🔌 Disconnected"));
    socket.on("error", (err) => console.error("WebSocket error:", err));

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [t]);

  React.useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handler = (data: any) => {
      let processedData = data;
      if (typeof data === 'string') {
        try {
          processedData = JSON.parse(data);
        } catch (error) {
          console.error("Error parsing data string:", error);
        }
      }
      if (processedData.rssi <= minSignal) return;
      const now = Date.now();
      setListTag((prev) => {
        const idx = prev.findIndex((t) => t.epc === processedData.epc);
        if (idx === -1) {
          return [
            ...prev,
            { epc: processedData.epc, rssi: processedData.rssi, firstSeen: now, lastSeen: now },
          ];
        } else {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], rssi: processedData.rssi, lastSeen: now };
          return updated;
        }
      });
    };

    if (isListen) {
      socket.on("dv-LAUNCHPAD", handler);
    } else {
      socket.off("dv-LAUNCHPAD", handler);
    }
    return () => {
      if (socket) socket.off("dv-LAUNCHPAD", handler);
    };  
  }, [isListen, minSignal]);

  React.useEffect(() => {
    
    const interval = setInterval(() => {
      
      if (!isListen) {
        return;
      }
      
      const now = Date.now();
      
      setListTag((prevListTag) => {
        
        const updatedList = prevListTag.filter(tag => {
          const age = now - tag.lastSeen;
          const shouldKeep = age <= 4000; // 4 seconds threshold
          
          if (!shouldKeep) {
          }
          return shouldKeep;
        });
        
        const removedCount = prevListTag.length - updatedList.length;
        if (removedCount > 0) {
        }
        
        // Get removed EPCs
        const removedEPCs = prevListTag
          .filter(tag => now - tag.lastSeen > 4000)
          .map(tag => tag.epc);

        if (removedEPCs.length > 0) {
          // Update countedTag
          setCountedTag((prevCounted: any) =>
            prevCounted.filter((epc: string) => !removedEPCs.includes(epc))
          );

          // Update product counts
          setProductDict((prevDict) => {
            const updatedDict = { ...prevDict };
            removedEPCs.forEach((epc) => {
              const tagInfo = tagDict[epc];
              if (!tagInfo) return;

              const productId = tagInfo.tagValue;
              if (updatedDict[productId]) {
                updatedDict[productId].count = Math.max(0, updatedDict[productId].count - 1);
                // If count becomes 0, remove the product
                if (updatedDict[productId].count === 0) {
                  delete updatedDict[productId];
                }
              }
            });
            return updatedDict;
          });

          // Clean up allProduct
          setAllProduct((prevAllProduct) => 
            prevAllProduct.filter((productId) => {
              const product = productDict[productId];
              return product && product.count > 0;
            })
          );
        }

        return updatedList;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isListen]);

  const sortedTags = React.useMemo(
    () => [...listTag].sort((a, b) => a.firstSeen - b.firstSeen),
    [listTag]
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">RFID Listener</h1>
              <p className="mt-2 text-gray-600">Monitor and track RFID tags in real-time</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isListen ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-sm text-gray-600">{isListen ? 'Listening' : 'Stopped'}</span>
              </div>
              <Button
                onClick={() => setIsListen((prev) => !prev)}
                variant={isListen ? "destructive" : "default"}
                className="px-6"
              >
                {isListen ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Stop Listening
                  </div>
                ) : (
                  'Start Listening'
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Signal Strength
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="-100"
                      max="0"
                      value={minSignal}
                      onChange={(e) => setMinSignal(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>-100 dBm</span>
                      <span>{minSignal} dBm</span>
                      <span>0 dBm</span>
                    </div>
                  </div>
                </div>
                
                {/* Summary Stats */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Active Tags:</span>
                      <span className="font-medium">{listTag.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Unique Products:</span>
                      <span className="font-medium">{allProduct.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Active Tags Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Active Tags</h2>
              </div>
              <div className="max-h-[40vh] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-200 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EPC</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Seen</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedTags.map((t, i) => (
                      <tr key={t.epc} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{i + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{t.epc}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${t.rssi > -60 ? 'bg-green-500' : t.rssi > -80 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                            <span>{t.rssi} dBm</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(t.firstSeen).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(t.lastSeen).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                    {sortedTags.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center text-gray-500">
                            <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm">No tags detected</p>
                            <p className="text-xs mt-1">Start listening to detect RFID tags</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Detected Products</h2>
              </div>  
              <div className="max-h-[40vh] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-200 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allProduct.map((t, i) => (
                      <tr key={productDict[t]._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <AvatarMe
                            source={productDict[t].image}
                            alt={productDict[t].itemName}
                            className="w-10 h-10 rounded-lg"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {productDict[t].itemName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {productDict[t].count}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {productDict[t].standardSellingRate.toLocaleString("vi-VN")} ₫
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {(productDict[t].standardSellingRate * productDict[t].count).toLocaleString("vi-VN")} ₫
                        </td>
                      </tr>
                    ))}
                    {allProduct.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center text-gray-500">
                            <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <p className="text-sm">No products detected</p>
                            <p className="text-xs mt-1">Start listening to detect products</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

