"use client";

import { FC } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  User,
  Briefcase,
  Building2,
  Mail,
  Phone,
  Tag as TagIcon,
  Globe,
  FileText,
  Shield,
  CheckCircle,
  XCircle,
  Info,
  AlertCircle,
} from "lucide-react";
import { Customer } from "@/components/page/customer-list";

interface Props {
  customer: (Customer & { firstSeen: number; lastSeen: number }) | null;
}

const CustomerDetail: FC<Props> = ({ customer }) => {
  if (!customer) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <p className="text-gray-400">No customer selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Profile Card */}
        <Card className="flex-1 bg-gradient-to-br from-white to-gray-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24 ring-4 ring-white shadow-lg">
                <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  {customer.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
                    <p className="text-gray-500 mt-1">{customer.customer_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={customer.is_frozen === 0 ? "default" : "destructive"}>
                      {customer.is_frozen === 0 ? "Active" : "Frozen"}
                    </Badge>
                    <Badge variant={customer.disabled === 0 ? "default" : "destructive"}>
                      {customer.disabled === 0 ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span className="text-sm">{customer.orgId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Globe className="w-4 h-4" />
                    <span className="text-sm">{customer.language?.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{customer.email_id}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Status Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                Status Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">Internal Customer</p>
                    <p className="font-medium">
                      {customer.is_internal_customer === 1 ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">SO Required</p>
                    <p className="font-medium">
                      {customer.so_required === 1 ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-500">DN Required</p>
                    <p className="font-medium">
                      {customer.dn_required === 1 ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-500">Naming Series</p>
                    <p className="font-medium">{customer.naming_series}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Created At</p>
                      <p className="font-medium">
                        {new Date(customer.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-500">Last Modified</p>
                      <p className="font-medium">
                        {new Date(customer.modified).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-indigo-500" />
                    <div>
                      <p className="text-sm text-gray-500">Modified By</p>
                      <p className="font-medium">{customer.modified_by}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Additional Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TagIcon className="w-5 h-5 text-purple-500" />
                Additional Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Document Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Doc Status</p>
                      <p className="font-medium">{customer.docstatus}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Index</p>
                      <p className="font-medium">{customer.idx}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Commission & Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Default Commission Rate</p>
                      <p className="font-medium">{customer.default_commission_rate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Document Type</p>
                      <p className="font-medium">{customer.doctype}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
