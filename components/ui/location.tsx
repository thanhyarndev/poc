import { useState, useRef } from "react";
import { ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { searchCities } from "@/hooks/api";

export function LocationCombobox({
  currentCities,
  returnCities,
}: {
  currentCities: string;
  returnCities: any;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<{ label: string; value: string }[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchCities = async (q: string) => {
    setIsLoaded(true);
    const results = await searchCities(q);

    const newCities = results.map((city: { city: any }) => ({
      value: city.city,
      label: city.city,
    }));

    setCities(newCities);
    setIsLoaded(false);
  };

  const handleInput = (value: string) => {
    setQuery(value);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      if (value.trim()) {
        if (value.length > 1) fetchCities(value);
      }
    }, 1000); // 300ms debounce delay
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between")}
        >
          {currentCities || "Select location"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <LocationCommand
          query={query}
          onInput={handleInput}
          cities={cities}
          isLoading={isLoaded}
          setCity={returnCities}
          setOpen={setOpen}
        />
      </PopoverContent>
    </Popover>
  );
}

function LocationCommand({
  query,
  onInput,
  cities,
  setOpen,
  isLoading,
  setCity,
}: {
  query: string;
  onInput: (value: string) => void;
  cities: Array<{ value: string; label: string }>;
  setOpen: (open: boolean) => void;
  isLoading: boolean;
  setCity: (city: string) => void;
}) {
  return (
    <Command>
      <CommandInput
        placeholder="Search location..."
        className="h-9"
        value={query}
        onInput={(e) => onInput(e.currentTarget.value)}
      />
      <CommandList>
        {isLoading ? (
          <div className="p-4">
            <p>Loading...</p>
          </div>
        ) : (
          <>
            <CommandEmpty>No location found.</CommandEmpty>
            <CommandGroup>
              {cities.map((city) => (
                <CommandItem
                  key={city.value}
                  value={city.label}
                  onSelect={() => {
                    setCity(city.value);
                    setOpen(false);
                  }}
                >
                  {city.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  );
}
