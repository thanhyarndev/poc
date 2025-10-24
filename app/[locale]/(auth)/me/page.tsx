import JobsPage from "@/components/page/me-form";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "My post - nextwaves",
  description: "View my post - nextwaves",
};
export default function Page() {
  return (
    <div className=" min-h-[calc(100dvh-10rem)] w-full">
      <div className="w-full">
        <JobsPage />
      </div>
    </div>
  );
}
