import { Header, Footer } from "@/components/block/menu";
import { Button } from "@/components/ui/button";
import {
  Building2Icon,
  ChevronRightIcon,
  ThumbsUpIcon,
  Users2Icon,
} from "lucide-react";
import React from "react";
const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow p-4 min-h-full">
        <div>
          <div className="container py-4 lg:py-32 md:max-w-[100vw]">
            {/* Announcement Banner */}
            <div className="flex justify-center ">
              <a
                className="inline-flex items-center gap-x-2 border text-sm p-1 ps-3 rounded-full transition"
                href="#"
              >
                nextwaves on beta!
                <span className="py-1.5 px-2.5 inline-flex justify-center items-center gap-x-2 rounded-full bg-muted-foreground/15 font-semibold text-sm">
                  <svg
                    className="flex-shrink-0 w-4 h-4"
                    xmlns="http://www.w3.org/2000/svg"
                    width={24}
                    height={24}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </span>
              </a>
            </div>
            {/* End Announcement Banner */}
            {/* Title */}
            <div className="mt-5 max-w-2xl text-center mx-auto">
              <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                nextwaves
              </h1>
            </div>
            {/* End Title */}

            {/* Buttons */}

            {/* End Buttons */}
          </div>
        </div>
        {/* End Hero */}
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
