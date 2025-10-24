import DetailPage from "@/components/page/detail-form";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Apply for company - nextwaves",
  description: "Apply company at nextwaves",
};

export default function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  return (
    <div className="flex min-h-[calc(100dvh-10rem)] w-full items-center justify-center ">
      <div className="w-full ">
        <DetailPage id={id} />
      </div>
    </div>
  );
}
