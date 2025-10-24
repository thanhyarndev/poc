import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

const AvatarMe = ({
  source,
  alt,
  className,
}: {
  source: string;
  alt: string;
  className?: string;
}) => {
  return (
    <Avatar className={cn("h-10 w-10", className)}>
      <AvatarImage src={source} />
      <AvatarFallback>{alt.slice(0, 1)}</AvatarFallback>
    </Avatar>
  );
};

export default AvatarMe;
