"use client";
import { Header, Footer } from "@/components/block/menu";
import { Button } from "@/components/ui/button";
import {
  Building2Icon,
  ChevronRightIcon,
  ThumbsUpIcon,
  Users2Icon,
  XIcon,
  ArchiveXIcon,
} from "lucide-react";
import React, { use, useEffect, useState } from "react";
import io from "socket.io-client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const LandingPage: React.FC = () => {
  const router = useRouter();

  const handleCardClick = (path: string) => {
    router.push(window.location + "/" + path);
  };

  const t = useTranslations();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Odoo-style purple header */}
      <Header />

      <main className="flex-1 py-4 bg-gray-100">
        <div className="flex w-full items-center justify-center p-4 md:p-4 bg-gray-100">
          {" "}
          <div className="bg-gray-100 p-4 min-h-vh">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {/* Checkout Box */}
              <div
                className="bg-white rounded shadow-sm overflow-hidden border border-gray-200 flex flex-col cursor-pointer transition-all duration-200 hover:shadow-md hover:border-teal-500"
                onClick={() => handleCardClick("app/checkout")}
              >
                <div className="p-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <Building2Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-xs text-gray-400">1</div>
                </div>
                <div className="p-2 pt-0">
                  <h3 className="text-sm font-bold text-gray-800">{t("boxes.checkout.name")}</h3>
                  <p className="text-xs text-gray-500 mt-1 h-8 overflow-hidden">
                  {t("boxes.checkout.description")}
                  </p>
                </div>
                <div className="mt-auto p-2 pt-0 flex items-center justify-end text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRightIcon className="h-4 w-4" />
                </div>
              </div>
   {/* Checkout Box */}
   <div
                className="bg-white rounded shadow-sm overflow-hidden border border-gray-200 flex flex-col cursor-pointer transition-all duration-200 hover:shadow-md hover:border-teal-500"
                onClick={() => handleCardClick("../../new-checkout")}
              >
                <div className="p-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <Building2Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-xs text-gray-400">1</div>
                </div>
                <div className="p-2 pt-0">
                  <h3 className="text-sm font-bold text-gray-800"> {"NEW " + t("boxes.checkout.name")}</h3>
                  <p className="text-xs text-gray-500 mt-1 h-8 overflow-hidden">
                  {t("boxes.checkout.description")}
                  </p>
                </div>
                <div className="mt-auto p-2 pt-0 flex items-center justify-end text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRightIcon className="h-4 w-4" />
                </div>
              </div>
              {/* Inventory Box */}
              <div
                className="bg-white rounded shadow-sm overflow-hidden border border-gray-200 flex flex-col cursor-pointer transition-all duration-200 hover:shadow-md hover:border-teal-500"
                onClick={() => handleCardClick("app/smart")}
              >
                <div className="p-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <Building2Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-xs text-gray-400">1</div>
                </div>
                <div className="p-2 pt-0">
                  <h3 className="text-sm font-bold text-gray-800">
                  {t("boxes.smart.name")}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 h-8 overflow-hidden">
                  {t("boxes.smart.description")}
                  </p>
                </div>
                <div className="mt-auto p-2 pt-0 flex items-center justify-end text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRightIcon className="h-4 w-4" />
                </div>
              </div>

              {/* Imports Box */}
              <div
                className="bg-white rounded shadow-sm overflow-hidden border border-gray-200 flex flex-col cursor-pointer transition-all duration-200 hover:shadow-md hover:border-teal-500"
                onClick={() => handleCardClick("/app/imports")}
              >
                <div className="p-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <Users2Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-xs text-gray-400">1</div>
                </div>
                <div className="p-2 pt-0">
                  <h3 className="text-sm font-bold text-gray-800">{t("boxes.imports.name")}</h3>
                  <p className="text-xs text-gray-500 mt-1 h-8 overflow-hidden">
                    {t("boxes.imports.description")}
                  </p>
                </div>
                <div className="mt-auto p-2 pt-0 flex items-center justify-end text-teal-600">
                  <ChevronRightIcon className="h-4 w-4" />
                </div>
              </div>

              {/* Inactive Box */}
              <div
                className="bg-white rounded shadow-sm overflow-hidden border border-gray-200 flex flex-col cursor-pointer transition-all duration-200 hover:shadow-md hover:border-teal-500"
                onClick={() => handleCardClick("/app/inactive")}
              >
                <div className="p-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <XIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-xs text-gray-400">1</div>
                </div>
                <div className="p-2 pt-0">
                  <h3 className="text-sm font-bold text-gray-800">
                    {t("boxes.inactive.name")}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 h-8 overflow-hidden">
                    {t("boxes.inactive.description")}
                  </p>
                </div>
                <div className="mt-auto p-2 pt-0 flex items-center justify-end text-teal-600">
                  <ChevronRightIcon className="h-4 w-4" />
                </div>
              </div>

              {/* Patient Box */}
              {/* <div
                className="bg-white rounded shadow-sm overflow-hidden border border-gray-200 flex flex-col cursor-pointer transition-all duration-200 hover:shadow-md hover:border-teal-500"
                onClick={() => handleCardClick("/app/patient")}
              >
                <div className="p-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <ThumbsUpIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-xs text-gray-400">1</div>
                </div>
                <div className="p-2 pt-0">
                  <h3 className="text-sm font-bold text-gray-800">{t("boxes.patient.name")}</h3>
                  <p className="text-xs text-gray-500 mt-1 h-8 overflow-hidden">
                    {t("boxes.patient.description")}
                  </p>
                </div>
                <div className="mt-auto p-2 pt-0 flex items-center justify-end text-teal-600">
                  <ChevronRightIcon className="h-4 w-4" />
                </div>
              </div> */}

              {/* Customer Box */}
              <div
                className="bg-white rounded shadow-sm overflow-hidden border border-gray-200 flex flex-col cursor-pointer transition-all duration-200 hover:shadow-md hover:border-teal-500"
                onClick={() => handleCardClick("/app/customer")}
              >
                <div className="p-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <Users2Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-xs text-gray-400">2</div>
                </div>
                <div className="p-2 pt-0">
                  <h3 className="text-sm font-bold text-gray-800">{t("boxes.customer.name")}</h3>
                  <p className="text-xs text-gray-500 mt-1 h-8 overflow-hidden">
                    {t("boxes.customer.description")}
                  </p>
                </div>
                <div className="mt-auto p-2 pt-0 flex items-center justify-end text-teal-600">
                  <ChevronRightIcon className="h-4 w-4" />
                </div>
              </div>

              {/* Cabinet Box */}
              <div
                className="bg-white rounded shadow-sm overflow-hidden border border-gray-200 flex flex-col cursor-pointer transition-all duration-200 hover:shadow-md hover:border-teal-500"
                onClick={() => handleCardClick("/app/cabinet")}
              >
                <div className="p-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <ArchiveXIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-xs text-gray-400">3</div>
                </div>
                <div className="p-2 pt-0">
                  <h3 className="text-sm font-bold text-gray-800">{t("boxes.cabinet.name")}</h3>
                  <p className="text-xs text-gray-500 mt-1 h-8 overflow-hidden">
                    {t("boxes.cabinet.description")}
                  </p>
                </div>
                <div className="mt-auto p-2 pt-0 flex items-center justify-end text-teal-600">
                  <ChevronRightIcon className="h-4 w-4" />
                </div>
              </div>

              {/* Add more placeholder boxes to fill the grid like Odoo */}
              {/* {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded shadow-sm overflow-hidden border border-gray-200 flex flex-col"
            >
              <div className="p-2 flex items-center justify-between">
                <div className="flex items-center">
                  <Building2Icon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="text-xs text-gray-400">1</div>
              </div>
              <div className="p-2 pt-0">
                <h3 className="text-sm font-medium text-gray-800">
                  App {index + 5}
                </h3>
                <p className="text-xs text-gray-500 mt-1 h-8 overflow-hidden">
                  Description for App {index + 5}
                </p>
              </div>
              <div className="mt-auto p-2 pt-0 flex flex-col space-y-1">
                <button className="bg-teal-500 text-white text-xs py-1 rounded">
                  Use
                </button>
                <button className="text-teal-600 text-xs py-1">
                  LEARN MORE
                </button>
              </div>
            </div>
          ))} */}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
