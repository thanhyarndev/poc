"use client";
import * as React from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchCustomer } from "@/hooks/api";
import AvatarMe from "@/components/ui/avatar-me";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function SearchCustomer(props: {
  selectedItem: any;
  setSelectedItem: any;
}) {
  const { selectedItem, setSelectedItem } = props;
  const [commandInput, setCommandInput] = React.useState<string>("");
  const [results, setResults] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (commandInput !== "") {
      const fetchResults = async () => {
        const searchResults = await searchCustomer(commandInput);
        setResults(searchResults);
      };

      fetchResults();
    } else {
      setResults([]);
    }
  }, [commandInput]);

  return (
    <Command className="rounded-lg border shadow-sm" shouldFilter={false}>
      <CommandInput
        placeholder="Search for a customer..."
        value={commandInput}
        onValueChange={setCommandInput}
        className="h-10"
      />
      <CommandList>
        {!selectedItem && (
          <CommandEmpty>
            {commandInput === "" ? (
              <div className="flex flex-col items-center py-6 text-gray-500">
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm">Start typing to search customers</p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-gray-500">
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">No customers found</p>
                <p className="text-xs mt-1">Try different keywords</p>
              </div>
            )}
          </CommandEmpty>
        )}
        {selectedItem && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
                <Avatar className="ring-white shadow-lg">
                    <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        {selectedItem.name.charAt(0)}
                    </AvatarFallback>
                 </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{selectedItem.name}</p>
                <p className="text-sm text-gray-500">{selectedItem.orgId}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedItem(null);
                  setCommandInput("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>
        )}

        <CommandGroup>
          {results && results.map((result) => (
            <CommandItem 
              key={result._id} 
              value={result._id}
              className="p-2 hover:bg-gray-50 cursor-pointer"
            >
              <div
                onClick={() => {
                  setSelectedItem(result);
                  setCommandInput("");
                  setResults([]);
                }}
                className="flex items-center gap-3 w-full"
              >
                <Avatar className="ring-white shadow-lg">
                    <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        {result.name.charAt(0)}
                    </AvatarFallback>
                 </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{result.name}</p>
                  <p className="text-sm text-gray-500">{result.orgId}</p>
                </div>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
