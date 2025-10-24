"use client";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getTagValue, getProductId, HOST as WS_HOST, getCabinetItems, searchProduct, updateCabinet } from "@/hooks/api";
import CabinetList from "@/components/page/cabinet-list";
import CabinetHistory from "@/components/page/cabinet-history";
import {
  mockEpcListNew,
  mockProductsNew,
} from "@/app/[locale]/(auth-blank)/app/cabinet/data/sample-data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Save, X, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import AvatarMe from "@/components/ui/avatar-me";
import { getDeviceHeaders, DEVICE_CONSTANTS } from "@/config/constants";

const TTL = 4000; 

export interface ProductInfo {
  _id: string;
  itemCode: string;
  itemName: string;
  itemGroup: string;
  description?: string;
  standardSellingRate: number;
}

export interface CabinetItem extends ProductInfo {
  epcs: Record<string, number>; // EPC -> lastSeen
  firstSeenMap: Record<string, number>; // EPC -> firstSeen
  expectedEpcs: Set<string>; // Set of expected EPCs for this product
}

export interface HistoryEntry {
  id: string;
  productId: string;
  productName: string;
  action: "added" | "removed";
  quantityChange: number;
  timestamp: number;
  epc?: string; // Add EPC to history for better tracking
}

function generateRandomId(): string {
  return (
    Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 8)
  );
}

interface CabinetDetailsProps {
  cabinetId: string;
}

export default function CabinetDetails({ cabinetId }: CabinetDetailsProps) {
  const t = useTranslations();
  const [cabinetItems, setCabinetItems] = useState<CabinetItem[]>([]);
  const [expectedCounts, setExpectedCounts] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [status, setStatus] = useState<'online' | 'offline'>('online');
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleString());
  const [totalItems, setTotalItems] = useState<number>(0);
  const [outlierItems, setOutlierItems] = useState<CabinetItem[]>([]);
  const [validNames, setValidNames] = useState<Set<string>>(new Set());
  const [validSKUs, setValidSKUs] = useState<Set<string>>(new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  const [tempExpectedCounts, setTempExpectedCounts] = useState<Record<string, number>>({});
  const [tempCabinetItems, setTempCabinetItems] = useState<CabinetItem[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const validNamesRef = useRef<Set<string>>(new Set());
  const validSKUsRef = useRef<Set<string>>(new Set());

  interface CacheItem<T> {
    data: T;
    expiresAt: number;
  }

  const addHistoryRecord = (
    product: ProductInfo,
    action: "added" | "removed",
    qtyChange: number,
    epc?: string
  ) => {
    setHistory((prev) => {
      const entry: HistoryEntry = {
        id: generateRandomId(),
        productId: product._id,
        productName: product.itemName,
        action,
        quantityChange: qtyChange,
        timestamp: Date.now(),
        epc
      };
      return [entry, ...prev].slice(0, 10);
    });
  };

  // Hàm cập nhật kỳ vọng khi người dùng xác nhận thêm sản phẩm thừa.
  const handleConfirmAdjustExpected = (
    productId: string,
    newExpectedQty: number
  ) => {
    setExpectedCounts((prev) => {
      const newCounts = { ...prev };
      if (newExpectedQty === 0) {
        delete newCounts[productId];
      } else {
        newCounts[productId] = newExpectedQty;
      }
      return newCounts;
    });
  };

  const tagIdCache = React.useRef<Map<string, CacheItem<any>>>(new Map());
  const productIdCache = React.useRef<Map<string, CacheItem<any>>>(new Map());

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

  

  useEffect(() => {
    const initializeCabinetItems = async () => {
      const now = Date.now();
      const initialItems: CabinetItem[] = [];
      const expectedMap: Record<string, number> = {};
      const nameSet = new Set<string>();
      const skuSet = new Set<string>();
      
      try {
        // Get cabinet items from API
        const response = await getCabinetItems(cabinetId);
        
        if (!response || !response.epcList || !Array.isArray(response.epcList)) {
          console.error("Invalid response from getCabinetItems:", response);
          return;
        }

        // Create a map to group EPCs by product
        const epcToProductMap = new Map<string, string>();
        
        // First pass: Get all EPCs and map them to products
        for (const epc of response.epcList) {
          const tagValue = await getOrFetchTagId(epc);
          if (tagValue && (tagValue.tagType === "TAG_MEDICAL" || tagValue.tagType === "TAG_PRODUCT")) {
            epcToProductMap.set(epc, tagValue.tagValue);
          }
        }
        
        // Group EPCs by product
        const productEpcs = new Map<string, Set<string>>();
        Array.from(epcToProductMap.entries()).forEach(([epc, productId]) => {
          if (!productEpcs.has(productId)) {
            productEpcs.set(productId, new Set());
          }
          productEpcs.get(productId)?.add(epc);
        });
        
        // Create cabinet items for each product
        const productPromises = Array.from(productEpcs.entries()).map(async ([productId, epcs]) => {
          const product = await getOrFetchProductId(productId);
          if (product) {
            const epcsMap: Record<string, number> = {};
            const firstSeenMap: Record<string, number> = {};
            
            // Store expected count as the number of EPCs
            expectedMap[product._id] = epcs.size;
            
            // Initialize with empty maps since we don't have EPCs yet
            initialItems.push({
              _id: product._id,
              itemCode: product.itemCode,
              itemName: product.itemName,
              itemGroup: product.itemGroup,
              description: product.description || "",
              standardSellingRate: product.standardSellingRate,
              epcs: epcsMap,
              firstSeenMap: firstSeenMap,
              expectedEpcs: epcs
            });
            nameSet.add(product.itemName);
            skuSet.add(product.itemCode);
          }
        });

        // Wait for all product fetches to complete
        await Promise.all(productPromises);

        setCabinetItems(initialItems);
        setExpectedCounts(expectedMap);
        setValidNames(nameSet);
        setValidSKUs(skuSet);
        validNamesRef.current = nameSet;
        validSKUsRef.current = skuSet;
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing cabinet items:", error);
        toast({
          title: "Error",
          description: "Failed to initialize cabinet items",
          variant: "destructive",
        });
      }
    };

    initializeCabinetItems();
  }, []);

  useEffect(() => {
    if (!isInitialized) return; // Don't set up socket until initialization is complete

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
    
    socket.on("disconnect", () => {
      console.log("🔌 Disconnected");
      setStatus('offline');
    });
    
    socket.on("error", (err) => {
      console.error("WebSocket error:", err);
      setStatus('offline');
    });

    socket.on("dv-CABINET", async (data: any) => {
      if (isEditMode) return; // Skip processing if in edit mode
      
      // Parse the data if it's a string
      const messageData = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Extract EPC from the message
      const epc = messageData.epc;
      if (!epc) {
        console.error("No EPC in message:", messageData);
        return;
      }

      // console.log("Received message:", messageData);
      // console.log("Processing EPC:", epc);
      setLastUpdated(new Date().toLocaleString());

      const now = Date.now();

      const tagValue = await getOrFetchTagId(epc);
      if (!tagValue || (tagValue.tagType !== "TAG_MEDICAL" && tagValue.tagType !== "TAG_PRODUCT")) return;

      const product = await getOrFetchProductId(tagValue.tagValue);
      if (!product) return;

      const productInfo: ProductInfo = {
        _id: product._id,
        itemCode: product.itemCode,
        itemName: product.itemName,
        itemGroup: product.itemGroup,
        description: product.description || "",
        standardSellingRate: product.standardSellingRate,
      };

      // Find the cabinet item that has this EPC in its expectedEpcs
      console.log("cabinetItems", cabinetItems);
      const cabinetItem = cabinetItems.find(item => item.expectedEpcs.has(epc));
      console.log("cabinetItem", cabinetItem);
      
      if (cabinetItem) {
        // Belongs to cabinet
        setCabinetItems((prev) => {
          const index = prev.findIndex(
            (item) => item._id === productInfo._id
          );

          if (index !== -1) {
            const item = prev[index];
            const newEpcs = { ...item.epcs };
            const newFirstSeenMap = { ...item.firstSeenMap };

            if (!newEpcs[epc]) {
              newEpcs[epc] = now;
              newFirstSeenMap[epc] = now;
              addHistoryRecord(productInfo, "added", 1, epc);
            } else {
              newEpcs[epc] = now;
            }

            const updatedItem = {
              ...item,
              epcs: newEpcs,
              firstSeenMap: newFirstSeenMap,
            };
            return [
              ...prev.slice(0, index),
              updatedItem,
              ...prev.slice(index + 1),
            ];
          }
          return prev;
        });
      } else {
        // Outlier
        setOutlierItems((prev) => {
          const index = prev.findIndex((item) => item._id === productInfo._id);
          if (index !== -1) {
            const item = prev[index];
            const newEpcs = { ...item.epcs };
            const newFirstSeenMap = { ...item.firstSeenMap };

            if (!newEpcs[epc]) {
              newEpcs[epc] = now;
              newFirstSeenMap[epc] = now;
              addHistoryRecord(productInfo, "added", 1, epc);
            } else {
              newEpcs[epc] = now;
            }

            const updatedItem = {
              ...item,
              epcs: newEpcs,
              firstSeenMap: newFirstSeenMap,
            };
            return [
              ...prev.slice(0, index),
              updatedItem,
              ...prev.slice(index + 1),
            ];
          } else {
            addHistoryRecord(productInfo, "added", 1, epc);
            const newItem: CabinetItem = {
              ...productInfo,
              epcs: { [epc]: now },
              firstSeenMap: { [epc]: now },
              expectedEpcs: new Set()
            };
            return [...prev, newItem];
          }
        });
      }
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [isEditMode, isInitialized]);

  // Giữ việc tự động loại bỏ các EPC "chết" (không cập nhật sau 5s)
  useEffect(() => {
    if (isEditMode) return; // Skip cleanup if in edit mode
    
    const interval = setInterval(() => {
      const now = Date.now();
      setCabinetItems((prev) =>
        prev.map(item => {
          const newEpcs = Object.fromEntries(
            Object.entries(item.epcs).filter(([_, ts]) => now - ts <= TTL)
          );
          const newFirstSeenMap = Object.fromEntries(
            Object.entries(item.firstSeenMap).filter(([epc]) => epc in newEpcs)
          );
          const removed = Object.keys(item.epcs).length - Object.keys(newEpcs).length;
          if (removed > 0) addHistoryRecord(item, "removed", -removed);
          return { ...item, epcs: newEpcs, firstSeenMap: newFirstSeenMap };
        })
      );

      // Clean up outlier items
      setOutlierItems((prev) =>
        prev.map(item => {
          const newEpcs = Object.fromEntries(
            Object.entries(item.epcs).filter(([_, ts]) => now - ts <= TTL)
          );
          const newFirstSeenMap = Object.fromEntries(
            Object.entries(item.firstSeenMap).filter(([epc]) => epc in newEpcs)
          );
          const removed = Object.keys(item.epcs).length - Object.keys(newEpcs).length;
          if (removed > 0) addHistoryRecord(item, "removed", -removed);
          return { ...item, epcs: newEpcs, firstSeenMap: newFirstSeenMap };
        }).filter(item => Object.keys(item.epcs).length > 0)
      );
    }, 500);
    return () => clearInterval(interval);
  }, [isEditMode]);

  useEffect(() => {
    if (isEditMode) return; // Skip total count update if in edit mode
    setTotalItems(cabinetItems.length);
  }, [cabinetItems, isEditMode]);

  const handleEditClick = () => {
    setTempExpectedCounts({...expectedCounts});
    setTempCabinetItems([...cabinetItems]);
    setIsEditMode(true);
  };

  const handleSaveChanges = async () => {
    try {
      // Collect all EPCs from all products
      const allEpcs = tempCabinetItems.reduce((epcs: string[], item) => {
        return [...epcs, ...Array.from(item.expectedEpcs)];
      }, []);

      // Format the data according to API requirements
      const formattedProductList = tempCabinetItems.map(item => ({
        id: item._id,
        expect: tempExpectedCounts[item._id] || 0
      }));

      await updateCabinet(cabinetId, {
        // expect: formattedProductList.length,
        // productList: formattedProductList,
        epcList: allEpcs // Add the complete EPC list
      });

      // Update the local state after successful API call
      setExpectedCounts(tempExpectedCounts);
      setCabinetItems(tempCabinetItems);
      setIsEditMode(false);

      toast({
        title: "Changes saved",
        description: "Cabinet items and expected counts have been updated",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
  };

  const handleDiscardChanges = () => {
    setTempExpectedCounts(expectedCounts);
    setTempCabinetItems(cabinetItems);
    setIsEditMode(false);
  };

  const handleRemoveItem = (itemId: string) => {
    // Find the item being removed to get its name and SKU
    const itemToRemove = tempCabinetItems.find(item => item._id === itemId);
    if (itemToRemove) {
      // Remove from validation sets
      setValidNames(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(itemToRemove.itemName);
        return newSet;
      });
      setValidSKUs(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(itemToRemove.itemCode);
        return newSet;
      });
      validNamesRef.current.delete(itemToRemove.itemName);
      validSKUsRef.current.delete(itemToRemove.itemCode);
    }

    // Remove from cabinet items and expected counts
    setTempCabinetItems(prev => prev.filter(item => item._id !== itemId));
    setTempExpectedCounts(prev => {
      const newCounts = { ...prev };
      delete newCounts[itemId];
      return newCounts;
    });
  };

  const handleRemoveEpc = (itemId: string, epc: string) => {
    setTempCabinetItems(prev => {
      const updatedItems = prev.map(item => {
        if (item._id === itemId) {
          // Create a new Set without the specified EPC
          const newExpectedEpcs = new Set(Array.from(item.expectedEpcs));
          newExpectedEpcs.delete(epc);
          
          // Return the updated item
          return {
            ...item,
            expectedEpcs: newExpectedEpcs
          };
        }
        return item;
      });

      // Filter out items that have no EPCs left
      return updatedItems.filter(item => item.expectedEpcs.size > 0);
    });
    
    // Update expected counts
    setTempExpectedCounts(prev => {
      const newCounts = { ...prev };
      const item = tempCabinetItems.find(item => item._id === itemId);
      if (item) {
        const newCount = Math.max(0, (prev[itemId] || 0) - 1);
        if (newCount === 0) {
          delete newCounts[itemId];
        } else {
          newCounts[itemId] = newCount;
        }
      }
      return newCounts;
    });
  };

  const [newEpc, setNewEpc] = useState("");
  const [parsedEpcs, setParsedEpcs] = useState<string[]>([]);
  const [selectedProductForEpc, setSelectedProductForEpc] = useState<string | null>(null);
  const [showAddEpc, setShowAddEpc] = useState(false);

  const handleAddEpc = () => {
    setShowAddEpc(true);
    setNewEpc("");
    setParsedEpcs([]);
    setSelectedProductForEpc(null);
  };

  const parseEpcs = (input: string) => {
    // Split by whitespace and filter out empty strings
    const epcs = input.split(/\s+/).filter(epc => epc.trim().length > 0);
    setParsedEpcs(epcs);
  };

  const handleSubmitNewEpc = async () => {
    if (parsedEpcs.length === 0) return;
    
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const epc of parsedEpcs) {
        try {
          // Get tag info to determine the product it belongs to
          const tagInfo = await getOrFetchTagId(epc.trim());
          if (!tagInfo) {
            errorCount++;
            continue;
          }
          
          // Get product info
          const productId = tagInfo.tagValue;
          const product = await getOrFetchProductId(productId);
          
          if (!product) {
            errorCount++;
            continue;
          }
          
          // Check if product is already in cabinet
          const existingProductIndex = tempCabinetItems.findIndex(item => item._id === product._id);
          
          if (existingProductIndex !== -1) {
            // Product exists, add EPC to it
            setTempCabinetItems(prev => {
              return prev.map(item => {
                if (item._id === product._id) {
                  // Add the new EPC to the expected EPCs set
                  const newExpectedEpcs = new Set(Array.from(item.expectedEpcs));
                  newExpectedEpcs.add(epc.trim());
                  
                  // Return the updated item
                  return {
                    ...item,
                    expectedEpcs: newExpectedEpcs
                  };
                }
                return item;
              });
            });
            
            // Update expected counts
            setTempExpectedCounts(prev => {
              return {
                ...prev,
                [product._id]: (prev[product._id] || 0) + 1
              };
            });
            
            successCount++;
          } else {
            // Product doesn't exist in cabinet, create new item
            const newItem: CabinetItem = {
              _id: product._id,
              itemCode: product.itemCode,
              itemName: product.itemName,
              itemGroup: product.itemGroup,
              description: product.description || "",
              standardSellingRate: product.standardSellingRate,
              epcs: {},
              firstSeenMap: {},
              expectedEpcs: new Set([epc.trim()])
            };
            
            setTempCabinetItems(prev => [...prev, newItem]);
            setTempExpectedCounts(prev => ({
              ...prev,
              [product._id]: 1
            }));
            
            // Update validation sets
            setValidNames(prev => new Set([...Array.from(prev), product.itemName]));
            setValidSKUs(prev => new Set([...Array.from(prev), product.itemCode]));
            validNamesRef.current.add(product.itemName);
            validSKUsRef.current.add(product.itemCode);
            
            successCount++;
          }
        } catch (error) {
          console.error(`Error processing EPC ${epc}:`, error);
          errorCount++;
        }
      }
      
      toast({
        title: "EPCs Added",
        description: `Successfully added ${successCount} EPCs${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      });
      
      setShowAddEpc(false);
      setNewEpc("");
      setParsedEpcs([]);
    } catch (error) {
      console.error("Error adding EPCs:", error);
      toast({
        title: "Error",
        description: "Failed to add EPCs",
        variant: "destructive",
      });
    }
  };

  const handleAddProduct = async (product: any) => {
    const newItem: CabinetItem = {
      _id: product._id,
      itemCode: product.itemCode,
      itemName: product.itemName,
      itemGroup: product.itemGroup,
      description: product.description || "",
      standardSellingRate: product.standardSellingRate,
      epcs: {},
      firstSeenMap: {},
      expectedEpcs: new Set()
    };

    setTempCabinetItems(prev => [...prev, newItem]);
    setTempExpectedCounts(prev => ({
      ...prev,
      [newItem._id]: 0
    }));

    // Update validation sets
    setValidNames(prev => new Set([...Array.from(prev), product.itemName]));
    setValidSKUs(prev => new Set([...Array.from(prev), product.itemCode]));
    validNamesRef.current.add(product.itemName);
    validSKUsRef.current.add(product.itemCode);

    setShowAddProduct(false);
    setSearchInput("");
    setSearchResults([]);
  };

  const handleIncrementCount = (itemId: string) => {
    setTempExpectedCounts(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const handleDecrementCount = (itemId: string) => {
    setTempExpectedCounts(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) - 1)
    }));
  };

  React.useEffect(() => {
    if (searchInput !== "") {
      const fetchResults = async () => {
        const results = await searchProduct(searchInput);
        setSearchResults(results);
      };

      fetchResults();
    } else {
      setSearchResults([]);
    }
  }, [searchInput]);

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border rounded-xl">
        <CardHeader className="border-b bg-gray-50/50 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Cabinet Information</CardTitle>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                status === 'online' ? 'status-online' : 'status-offline'
              }`}>
                {status === 'online' ? 'Online' : 'Offline'}
              </span>
              {!isEditMode ? (
                <Button variant="outline" size="sm" onClick={handleEditClick}>
                  Edit Cabinet
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDiscardChanges}>
                    <X className="h-4 w-4 mr-1" />
                    Discard
                  </Button>
                  <Button size="sm" onClick={handleSaveChanges}>
                    <Save className="h-4 w-4 mr-1" />
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
            <div>
              <h3 className="text-xs font-medium text-gray-500">Cabinet ID</h3>
              <p className="mt-1 text-sm font-medium text-gray-900">{cabinetId}</p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500">Total Items</h3>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {cabinetItems.reduce((sum, item) => sum + item.expectedEpcs.size, 0)}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500">Last Updated</h3>
              <p className="mt-1 text-sm font-medium text-gray-900">{lastUpdated}</p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500">Active Tags</h3>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {cabinetItems.reduce((sum, item) => sum + Object.keys(item.epcs).length, 0) +
                 outlierItems.reduce((sum, item) => sum + Object.keys(item.epcs).length, 0)}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500">Status</h3>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {(() => {
                  const hasMissing = cabinetItems.some(item => {
                    const detected = Object.keys(item.epcs).length;
                    const expected = expectedCounts[item._id] || 0;
                    return detected < expected;
                  });
                  
                  const hasOverloaded = cabinetItems.some(item => {
                    const detected = Object.keys(item.epcs).length;
                    const expected = expectedCounts[item._id] || 0;
                    return detected > expected;
                  });

                  if (hasMissing) {
                    return (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-missing">
                        Missing
                      </span>
                    );
                  } else if (hasOverloaded) {
                    return (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-overloaded">
                        Overloaded
                      </span>
                    );
                  } else {
                    return (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-fulfilled">
                        Fulfilled
                      </span>
                    );
                  }
                })()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border rounded-xl overflow-hidden flex flex-col">
        <CardHeader className="border-b bg-gray-50/50 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Item Details</CardTitle>
            {isEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddEpc(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add EPC
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          <div className="card-content-height-md overflow-y-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="p-1 w-3/12 text-left">Product</th>
                  <th className="p-1 w-2/12 text-left hidden md:table-cell">Category</th>
                  <th className="p-1 w-2/12 text-center">Price</th>
                  <th className="p-1 w-2/12 text-center">EPCs</th>
                  <th className="p-1 w-2/12 text-center">Activity</th>
                  <th className="p-1 w-3/12 text-center">Status</th>
                  {isEditMode && <th className="p-1 w-1/12 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(isEditMode ? tempCabinetItems : cabinetItems)
                  .map((item) => {
                    const detected = Object.keys(item.epcs).length;
                    const expected = isEditMode ? tempExpectedCounts[item._id] || 0 : expectedCounts[item._id] || 0;
                    let status = "";

                    if (detected === expected) {
                      status = "Fullfilled";
                    } else if (detected < expected) {
                      status = "Missing";
                    } else {
                      status = "Overloaded";
                    }
                    
                    // Add sortOrder to each item for sorting
                    return {
                      ...item,
                      detected,
                      expected,
                      status,
                      sortOrder: status === "Missing" ? 0 : status === "Overloaded" ? 1 : 2
                    };
                  })
                  // Sort the items by sortOrder
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((item) => (
                    <tr key={item._id} className={`hover:bg-gray-50 text-xs ${item.status === "Missing" ? "bg-red-50" : ""}`}>
                      <td className="p-1">
                        <div className="font-medium text-gray-900">{item.itemName}</div>
                        <div className="text-[10px] text-gray-500">{item.itemCode}</div>
                      </td>
                      <td className="p-1 text-gray-600 hidden md:table-cell">{item.itemGroup}</td>
                      <td className="p-1 text-center">
                        <span className="font-medium text-gray-900">{item.standardSellingRate?.toLocaleString("vi-VN")} ₫</span>
                      </td>
                      <td className="p-1 text-center">
                      {Array.from(item.expectedEpcs).map((epc) => {
                            const isDetected = epc in item.epcs;
                            return (
                              <span
                                key={epc}
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mx-0.5 ${
                                  isDetected ? 'status-detected' : 'status-not-detected'
                                }`}
                                title={isDetected ? "Detected" : "Not Detected"}
                              >
                                {epc}
                                {isEditMode && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveEpc(item._id, epc);
                                    }}
                                    className="ml-1 text-gray-400 hover:text-red-500"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </span>
                            );
                          })}
                      </td>
                      <td className="p-1 text-center">
                        <div className="space-y-0.5">
                          <div className="text-gray-600 text-[10px]">F: {Object.keys(item.firstSeenMap)[0] ? new Date(item.firstSeenMap[Object.keys(item.firstSeenMap)[0]]).toLocaleTimeString() : '-'}</div>
                          <div className="text-gray-600 text-[10px]">L: {Object.keys(item.epcs)[0] ? new Date(item.epcs[Object.keys(item.epcs)[0]]).toLocaleTimeString() : '-'}</div>
                        </div>
                      </td>
                      <td className="p-1">
                        <div className="flex flex-wrap gap-1 justify-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
                          ${item.status === "Fullfilled" ? "bg-green-100 text-green-800"
                          : item.status === "Missing" ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"}
                        `}>
                          {item.status}
                        </span>
                        </div>
                      </td>
                      {isEditMode && (
                        <td className="p-1 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveItem(item._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Product to Cabinet</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddProduct(false);
                  setSearchInput("");
                  setSearchResults([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <Command className="rounded-lg border shadow-sm" shouldFilter={false}>
                <CommandInput
                  placeholder="Search for a product..."
                  value={searchInput}
                  onValueChange={setSearchInput}
                  className="h-10"
                />
                <CommandList>
                  <CommandEmpty>
                    {searchInput === "" ? (
                      <div className="flex flex-col items-center py-6 text-gray-500">
                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-sm">Start typing to search products</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-6 text-gray-500">
                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm">No products found</p>
                        <p className="text-xs mt-1">Try different keywords</p>
                      </div>
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {searchResults.map((result) => (
                      <CommandItem 
                        key={result._id} 
                        value={result._id}
                        className="p-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <div
                          onClick={() => handleAddProduct(result)}
                          className="flex items-center gap-3 w-full"
                        >
                          <AvatarMe 
                            source={result.image} 
                            alt={result.itemName}
                            className="w-10 h-10 rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{result.itemName}</p>
                            <p className="text-sm text-gray-500">{result.itemCode}</p>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          </div>
        </div>
      )}
      
      {showAddEpc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add EPCs to Cabinet</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddEpc(false);
                  setNewEpc("");
                  setParsedEpcs([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="epc-input" className="block text-sm font-medium text-gray-700 mb-1">
                  EPC Codes
                </label>
                <textarea
                  id="epc-input"
                  value={newEpc}
                  onChange={(e) => {
                    setNewEpc(e.target.value);
                    parseEpcs(e.target.value);
                  }}
                  placeholder="Enter EPC codes (separated by spaces)"
                  className="w-full h-32 p-2 border rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste multiple EPC codes separated by spaces. The system will automatically match each EPC to a product.
                </p>
              </div>
              
              {parsedEpcs.length > 0 && (
                <div className="border rounded-md p-3 bg-gray-50">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Parsed EPCs ({parsedEpcs.length})
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {parsedEpcs.map((epc, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white border"
                      >
                        {epc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitNewEpc}
                  disabled={parsedEpcs.length === 0}
                >
                  Add {parsedEpcs.length} EPC{parsedEpcs.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {outlierItems.length > 0 && (
        <Card className="shadow-sm border rounded-xl mt-4 overflow-hidden flex flex-col">
          <CardHeader className="border-b bg-gray-50/50 py-3 sticky top-0 z-10">
            <CardTitle className="text-lg font-semibold  text-red-700">Outlier Products</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden">
            <div className="card-content-height-sm overflow-y-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="p-1 w-3/12 text-left">Product</th>
                    <th className="p-1 w-2/12 text-left hidden md:table-cell">Category</th>
                    <th className="p-1 w-2/12 text-center">Price</th>
                    <th className="p-1 w-2/12 text-center">EPCs</th>
                    <th className="p-1 w-2/12 text-center">Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {outlierItems.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 text-xs">
                      <td className="p-1">
                        <div className="font-medium text-gray-900">{item.itemName}</div>
                        <div className="text-[10px] text-gray-500">{item.itemCode}</div>
                      </td>
                      <td className="p-1 text-gray-600 hidden md:table-cell">{item.itemGroup}</td>
                      <td className="p-1 text-center">
                        <span className="font-medium text-gray-900">{item.standardSellingRate?.toLocaleString("vi-VN")} ₫</span>
                      </td>
                      <td className="p-1 text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {Object.keys(item.epcs).map((epc) => (
                            <span
                              key={epc}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium status-is-outlier mx-0.5"
                              title="Detected"
                            >
                              {epc}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-1 text-center">
                        <div className="space-y-0.5">
                          <div className="text-gray-600 text-[10px]">F: {Object.keys(item.firstSeenMap)[0] ? new Date(item.firstSeenMap[Object.keys(item.firstSeenMap)[0]]).toLocaleTimeString() : '-'}</div>
                          <div className="text-gray-600 text-[10px]">L: {Object.keys(item.epcs)[0] ? new Date(item.epcs[Object.keys(item.epcs)[0]]).toLocaleTimeString() : '-'}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
