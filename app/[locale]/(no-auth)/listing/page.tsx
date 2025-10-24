import ListingPage from "@/components/page/list-form";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Apply for company - nextwaves",
  description: "Apply company at nextwaves",
};
export default function Page() {
  return (
    <div className="flex w-full items-center justify-center p-2 pt-0 md:p-4">
      <div className="w-full ">
        <ListingPage />
      </div>
    </div>
  );
}
