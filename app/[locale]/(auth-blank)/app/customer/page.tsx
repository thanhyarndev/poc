"use client";

import * as React from "react";
import { io, Socket } from "socket.io-client";
import CustomerList, { Customer } from "@/components/page/customer-list";
import CustomerDetail from "@/components/page/customer-detail";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { toast } from "@/hooks/use-toast";
import { getCustomerId, getTagValue } from "@/hooks/api";
import { getDeviceHeaders, DEVICE_CONSTANTS } from "@/config/constants";


interface CustomerWithTime extends Customer {
  firstSeen: number;
  lastSeen: number;
}

export default function Page() {
  const [customers, setCustomers] = React.useState<CustomerWithTime[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const socketRef = React.useRef<Socket | null>(null);

  const t = useTranslations();

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

    socket.on("dv-LAUNCHPAD", async (data: any) => {
      let processedData = data;
      if (typeof data === 'string') {
        try {
          processedData = JSON.parse(data);
        } catch (error) {
          console.error("Error parsing data string:", error);
        }
      }
      //const epcPrefix = data.epc.substring(0, 8);

      try {
        const res = await getTagValue(processedData.epc);
      
      if(res.tagType !== "TAG_CUSTOMER") return;

      const customerResponse = await getCustomerId(res.tagValue);

      // Transform the API response to match the Employee interface
      const customer: Customer = {
        _id: customerResponse.data._id,
        orgId: customerResponse.data.orgId,
        name: customerResponse.data.name,
        owner: customerResponse.data.owner,
        creation: customerResponse.data.creation,
        modified: customerResponse.data.modified,
        modified_by: customerResponse.data.modified_by,
        customer_name: customerResponse.data.customer_name,
        customer_type: customerResponse.data.customer_type,
        language: customerResponse.data.language,
        docstatus: customerResponse.data.docstatus || 0,
        idx: customerResponse.data.idx || 0,
        naming_series: customerResponse.data.naming_series || '',
        is_internal_customer: customerResponse.data.is_internal_customer || 0,
        default_commission_rate: customerResponse.data.default_commission_rate || 0,
        so_required: customerResponse.data.so_required || 0,
        dn_required: customerResponse.data.dn_required || 0,
        email_id: customerResponse.data.email_id || '',
        is_frozen: customerResponse.data.is_frozen || 0,
        disabled: customerResponse.data.disabled || 0,
        doctype: customerResponse.data.doctype || '',
        credit_limits: customerResponse.data.credit_limits || [],
        accounts: customerResponse.data.accounts || [],
        sales_team: customerResponse.data.sales_team || [],
        portal_users: customerResponse.data.portal_users || [],
        companies: customerResponse.data.companies || [],
        createdAt: customerResponse.data.createdAt,
        updatedAt: customerResponse.data.updatedAt
      };

      const now = Date.now();
      setCustomers((prev) => {
        const idx = prev.findIndex((e) => e._id === customer._id);
        if (idx === -1) {
          return [...prev, { ...customer, firstSeen: now, lastSeen: now }];
        } else {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], lastSeen: now };
          return updated;
        }
        });
      }
      catch(err) {
        console.log("err: ", err);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [t]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCustomers((prev) => prev.filter((c) => now - c.lastSeen <= 5000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const selectedCustomer = customers.find((c) => c._id === selectedId) || null;

  return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Customer Tracking</h1>
                <p className="mt-2 text-gray-600">Real-time customer presence monitoring</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-gray-600">Connected</span>
                </div>
                <div className="text-sm text-gray-500">
                  {customers.length} customers present
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer List */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-12rem)] overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Present Customers</h2>
                <p className="text-sm text-gray-500 mt-1">Select a customer to view details</p>
              </div>
              {customers.length !== 0 && (
                <div className="flex-1 overflow-y-auto">
                  <CustomerList
                    customers={customers}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
                </div>
              )}
              {customers.length === 0 && (
                <div className="flex-1 flex items-center justify-center p-6 ">
                  <div className="text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-sm">No customers detected</p>
                    <p className="text-xs mt-1">Customers will appear here when detected</p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Customer Details */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-12rem)] overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Customer Details</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedCustomer ? "Viewing customer information" : "Select a customer to view details"}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {selectedCustomer ? (
                  <CustomerDetail customer={selectedCustomer} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="text-sm">No customer selected</p>
                      <p className="text-xs mt-1">Select a customer from the list to view details</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
