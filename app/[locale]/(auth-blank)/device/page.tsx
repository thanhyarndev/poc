"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { FaceFrownIcon } from '@heroicons/react/24/outline';
import { getOnlineDevices } from "@/hooks/api";

interface Device {
  _id: string;
  deviceId: string;
  lastSeen: string | null;
  isHardware: boolean;
  isOnline: boolean;
}

export default function DevicePage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations();

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await getOnlineDevices();
        const data = res.data;
        setDevices(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching devices:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchDevices();

    // Set up interval
    const interval = setInterval(fetchDevices, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return format(new Date(dateString), 'MMM d, yyyy HH:mm:ss');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Active Devices</h1>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Online: {devices.filter(d => d.isOnline).length}
          </Badge>
          {/* <Badge variant="outline" className="bg-gray-50 text-gray-700">
            Total: {devices.length}
          </Badge> */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
            <FaceFrownIcon className="w-10 text-gray-400 mb-2"/>
            <div className="text-gray-500 text-lg mb-2">No devices connected</div>
            <div className="text-gray-400 text-sm">Devices will appear here when they come online</div>
          </div>
        ) : (
          devices.map((device) => (
            <Card key={device._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold">
                    {device.deviceId}
                  </CardTitle>
                  <Badge 
                    variant={device.isOnline ? "default" : "secondary"}
                    className={device.isOnline ? "bg-green-500" : "bg-gray-500"}
                  >
                    {device.isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Device ID:</span>
                    <span className="font-mono">{device._id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Seen:</span>
                    <span>{formatDate(device.lastSeen)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span>{device.isHardware ? 'Hardware' : 'Software'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}