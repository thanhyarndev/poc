"use client";

import { FC } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Customer {
  _id: string;
  orgId: string;
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  naming_series: string;
  email_id: string;
  customer_name: string;
  customer_type: string;
  is_internal_customer: number;
  language: string;
  default_commission_rate: number;
  so_required: number;
  dn_required: number;
  is_frozen: number;
  disabled: number;
  doctype: string;
  credit_limits: any[];
  accounts: any[];
  sales_team: any[];
  portal_users: any[];
  companies: any[];
  createdAt: string;
  updatedAt: string;
}

interface Props {
  customers: (Customer & { firstSeen: number; lastSeen: number })[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const CustomerList: FC<Props> = ({ customers, selectedId, onSelect }) => {
  const needsScrolling = customers.length > 5;
  
  const customerItems = (
    <div className="space-y-3 p-2">
      {customers.map((customer) => (
        <div
          key={customer._id}
          onClick={() => onSelect(customer._id)}
          className={`flex items-center gap-4 p-3 rounded-xl border transition hover:bg-gray-100 cursor-pointer ${
            selectedId === customer._id
              ? "border-blue-500 bg-blue-50"
              : "border-transparent"
          }`}
        >
          <Avatar className="w-12 h-12">
            <AvatarFallback>{customer.name?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-base font-medium text-gray-800">
              {customer.name || 'Unknown Customer'}
            </p>
            <p className="text-sm text-gray-500">
              {customer.customer_type} •{" "}
              {new Date(customer.firstSeen).toLocaleTimeString()}
            </p>
          </div>
          <span className="text-xs text-gray-600">
            {customer.language?.toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {needsScrolling ? (
        <ScrollArea className="h-[calc(100vh-200px)]">
          {customerItems}
        </ScrollArea>
      ) : (
        customerItems
      )}
    </div>
  );
};

export default CustomerList;
