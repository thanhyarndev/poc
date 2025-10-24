"use client";

import { FC } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface HistoryEntry {
  id: string;
  productId: string;
  type: 'add' | 'remove' | 'update';
  quantity: number;
  timestamp: number;
  notes?: string;
}

interface CabinetHistoryProps {
  history: HistoryEntry[];
}

const CabinetHistory: FC<CabinetHistoryProps> = ({ history }) => {
  return (
    <Card className="shadow-sm border rounded-xl">
      <CardHeader className="border-b bg-gray-50/50">
        <CardTitle className="text-xl font-semibold text-gray-900">Activity History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto">
          <div className="divide-y divide-gray-200">
            {history.map((item, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.type === 'add' ? 'bg-red-100 text-red-800' :
                        item.type === 'remove' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.type.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{item.productId}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {item.type === 'add' ? 'Added' : item.type === 'remove' ? 'Removed' : 'Updated'} {item.quantity} items
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
                {item.notes && (
                  <p className="mt-2 text-sm text-gray-600">{item.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CabinetHistory;
