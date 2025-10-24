"use client";
import * as React from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { SearchProduct } from "./SearchProduct";
import { assignTagBulk, assignTagToCustomer, HOST as WS_HOST } from "@/hooks/api";
import { toast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { setTags } from "@sentry/nextjs";
import { SearchCustomer } from "./SearchCustomer";
import { getDeviceHeaders, DEVICE_CONSTANTS } from "@/config/constants";

interface TagInfo {
  epc: string;
  rssi: number;
  firstSeen: number;
  lastSeen: number;
}

export default function Page() {
  const t = useTranslations();
  const [tagType, setTagType] = React.useState<string>("TAG_PRODUCT");
  const [minSignal, setMinSignal] = React.useState<number>(-40);
  const [isListen, setIsListen] = React.useState<boolean>(false);
  const [listTag, setListTag] = React.useState<TagInfo[]>([]);
  const socketRef = React.useRef<Socket | null>(null);
  const [selectedItem, setSelectedItem] = React.useState<any>(null);
  const [productId, setProductId] = React.useState<any>(null);
  const [tagDict, setTagDict] = React.useState<any>({});
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  /* 1. create socket once ----------------------------------------- */
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
    socket.on("disconnect", () => console.log("🔌 Disconnected"));
    socket.on("error", (err) => console.error("WebSocket error:", err));

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    }
  }, [t]);

  /* 2. add / remove dv‑BINH_ONG listener --------------------------- */
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
          // If parsing fails, processedData remains the original string.
          // You might want to return or handle this error more specifically.
        }
      }
      

      if (processedData.rssi <= minSignal) return; // ignore weak signals

      const now = Date.now();
      setListTag((prev) => {
        const idx = prev.findIndex((t) => t.epc === processedData.epc);
        if (idx === -1) {
          // New tag detected - auto-select for product import
          if (tagType === "TAG_PRODUCT") {
            setSelectedTags(prev => [...prev, processedData.epc]);
          }
          return [
            ...prev,
            { epc: processedData.epc, rssi: processedData.rssi, firstSeen: now, lastSeen: now },
          ];
        } else {
          // seen before – update RSSI + lastSeen
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
      socket.off("dv-LAUNCHPAD", handler);
    }
  }, [isListen, minSignal, tagType]);

  /* 3. prune tags older than 5 s ---------------------------------- */
  React.useEffect(() => {
    const id = setInterval(() => {
      if (isListen) {
        const now = Date.now();
        setListTag((prev) => {
          const updatedList = prev.filter((t) => now - t.lastSeen <= 2000);
          
          // Get removed EPCs
          const removedEPCs = prev
            .filter(t => now - t.lastSeen > 2000)
            .map(t => t.epc);

          // Remove inactive tags from selectedTags
          if (removedEPCs.length > 0) {
            setSelectedTags(prev => prev.filter(epc => !removedEPCs.includes(epc)));
          }

          return updatedList;
        });
      }
    }, 1000); // every second
    return () => clearInterval(id);
  }, [isListen]);

  /* 4. UI ---------------------------------------------------------- */
  const sortedTags = React.useMemo(
    () => [...listTag].sort((a, b) => a.firstSeen - b.firstSeen),
    [listTag]
  );

  const handleTagSelection = (epc: string) => {
    if (tagType === "TAG_PRODUCT") {
      setSelectedTags(prev => 
        prev.includes(epc) 
          ? prev.filter(tag => tag !== epc)
          : [...prev, epc]
      );
    } else {
      setSelectedTags([epc]);
    }
  };

  // Add select all/none functionality
  const handleSelectAll = () => {
    if (tagType === "TAG_PRODUCT") {
      setSelectedTags(prev => 
        prev.length === listTag.length 
          ? [] // If all are selected, deselect all
          : listTag.map(tag => tag.epc) // Otherwise select all
      );
    }
  };

  const importTag = () => {
    const importApi = async () => {
      if (!selectedItem) {
        toast({
          title: "Please select a customer",
          description: "Please select a customer to import",
        });
        return;
      }

      if (tagType === "TAG_CUSTOMER") {
        const tag = selectedTags[0];
        if (!tag) {
          toast({
            title: "No tag selected",
            description: "Please select a tag to import",
          });
          return;
        }
        try {
          const api = await assignTagToCustomer({
            tagType: "TAG_CUSTOMER",
            tagName: "DEFAULT",
            tagEPC: selectedTags[0],
            tagValue: selectedItem._id
          });
          if (api.statusCode === 200) {
            toast({
              title: "Imported successfully",
              description: "Tag assigned to customer successfully",
            });
            setListTag([]);
            setSelectedTags([]);
          }
        } catch (error: any) {
          if (error.message === "TAG_EXIST") {
            toast({
              title: "Tag already in use",
              description: "This tag is already linked to another customer",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Error",
              description: error.message || "Failed to assign tag",
              variant: "destructive"
            });
          }
        }
      } else {
        try {
          const api = await assignTagBulk({
            tags: selectedTags,
            tagType: tagType,
            tagValue: selectedItem._id
          });
          if (api.statusCode === 200) {
            toast({
              title: "Imported successfully",
              description: "Tags imported successfully",
            });
            setListTag([]);
            setSelectedTags([]);
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "Failed to import tags",
            variant: "destructive"
          });
        }
      }
    };
    setIsListen(false);
    importApi();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Import {tagType === "TAG_PRODUCT" ? "Products" : tagType === "TAG_CUSTOMER" ? "Customers" : "PPLs"}</h1>
              <p className="mt-2 text-gray-600">Scan and import RFID tags to {tagType === "TAG_PRODUCT" ? "products" : tagType === "TAG_CUSTOMER" ? "customers" : "PPLs"}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isListen ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-sm text-gray-600">{isListen ? 'Scanning' : 'Stopped'}</span>
              </div>
              <Button
                onClick={() => setIsListen((prev) => !prev)}
                variant={isListen ? "destructive" : "default"}
                className="px-6"
              >
                {isListen ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Stop Scanning
                  </div>
                ) : (
                  'Start Scanning'
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Import Settings</h2>
              
              <div className="space-y-6">
                {/* Import Mode Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Import Mode
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    onChange={(e) => {
                      setTagType(e.target.value);
                      setSelectedItem(null);
                      setSelectedTags([]);
                    }}
                    value={tagType}
                  >
                    <option value="TAG_PRODUCT">Product Import</option>
                    <option value="TAG_CUSTOMER">Customer Import</option>
                    <option value="TAG_PPL">PPL Import</option>
                  </select>
                </div>

                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Product
                  </label>
                  {tagType === "TAG_PRODUCT" && (
                    <SearchProduct
                      selectedItem={selectedItem}
                      setSelectedItem={setSelectedItem}
                    />
                  )}
                  {tagType === "TAG_CUSTOMER" && (
                    <SearchCustomer 
                      selectedItem={selectedItem}
                      setSelectedItem={setSelectedItem}
                    />
                  )}
                </div>

                {/* Signal Strength */}
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
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Scan Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tags Detected:</span>
                      <span className="font-medium">{listTag.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Selected Product:</span>
                      <span className="font-medium">{selectedItem ? selectedItem.itemName : 'None'}</span>
                    </div>
                  </div>
                </div>

                {/* Import Button */}
                <div className="pt-4">
                  <Button 
                    className="w-full" 
                    onClick={importTag}
                    disabled={!selectedItem || (tagType === "TAG_PRODUCT" ? selectedTags.length === 0 : selectedTags.length === 0)}
                  >
                    Import {selectedTags.length} {tagType === "TAG_PRODUCT" ? "Tags" : "Tag"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Detected Tags</h2>
                  {tagType === "TAG_PRODUCT" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedTags.length === listTag.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {tagType === "TAG_PRODUCT" ? "Select" : "Select"}
                      </th>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {tagType === "TAG_PRODUCT" ? (
                            <input
                              type="checkbox"
                              checked={selectedTags.includes(t.epc)}
                              onChange={() => handleTagSelection(t.epc)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          ) : (
                            <input
                              type="radio"
                              checked={selectedTags.includes(t.epc)}
                              onChange={() => handleTagSelection(t.epc)}
                              name="tag-selection"
                              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          )}
                        </td>
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
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center text-gray-500">
                            <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm">No tags detected</p>
                            <p className="text-xs mt-1">Start scanning to detect RFID tags</p>
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
