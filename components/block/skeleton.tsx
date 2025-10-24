"use client";

import React from "react";
import { CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

const GlobalSkeleton: React.FC = () => {
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (isLoaded) {
    return null;
  }

  return (
    <CardContent className="h-full flex items-center justify-center flex-col text-gray-500">
      <div className="space-y-2 mt-9">
        <Skeleton className="h-4 w-[80vw]" />
        <Skeleton className="h-4 w-[80vw]" />
      </div>
    </CardContent>
  );
};

export default GlobalSkeleton;
