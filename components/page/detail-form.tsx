"use client";
// types.ts

// page.tsx
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  MapPin,
  Clock,
  Building2,
  Briefcase,
  Users,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import remarkGfm from "remark-gfm";
import rehypeClassNames from "rehype-class-names";
import type { Job } from "@/types";
import { getDetailPostById } from "@/hooks/api";
import AvatarMe from "../ui/avatar-me";
import { Skeleton } from "../ui/skeleton";

export default function JobsPage({ id }: { id: string }) {
  const t = useTranslations();

  const [details, setDetails] = useState<Job>();
  useEffect(() => {
    getDetailPostById(id).then((data) => {
      setDetails(data);
    });
  }, [id]);
  return (
    <main className="min-h-screen">
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-12 gap-3">
          {/* Job Details */}

          <div className="col-span-12 md:col-span-12">
            <Card className="overflow-y-auto">
              {details && details.postedBy ? (
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-6 flex-col md:flex-row">
                    <div className="w-16 h-16 relative flex-shrink-0">
                      <AvatarMe
                        source={details.postedBy.avatar}
                        alt={details.postedBy.name}
                        className="w-16 h-16"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col">
                        <h2 className="text-2xl font-bold inline-block md:flex">
                          {details.title}
                        </h2>
                      </div>

                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary">
                          <Clock className="w-4 h-4 mr-1" />
                          {details.category}
                        </Badge>
                        <Badge variant="secondary">
                          <MapPin className="w-4 h-4 mr-1" />
                          {details.location}
                        </Badge>
                        <Badge variant="secondary">
                          <Users className="w-4 h-4 mr-1" /> Open for {` `}
                          {details.openFor}
                        </Badge>
                      </div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {details.tags.map((tags) => (
                          // eslint-disable-next-line react/jsx-key
                          <Badge variant="outline">#{tags}</Badge>
                        ))}
                      </div>
                      <Button
                        variant="default"
                        className="text-sm mt-4"
                        onClick={() =>
                          (window.location.href = `../apply/${id}`)
                        }
                      >
                        <Briefcase className="w-4 h-4 mr-2" />
                        {t("jobs.details.apply")}
                      </Button>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Description */}
                  <section className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {t("jobs.details.description")}
                      </h3>
                      <p className="mt-2 text-black">
                        {
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[
                              [
                                rehypeClassNames,
                                {
                                  h1: "text-2xl font-bold py-2",
                                  h2: "text-xl font-semibold py-2",
                                  h3: "text-lg font-medium py-2",
                                  p: "mt-2 text-black",
                                  ul: "list-disc list-inside mt-2 text-black",
                                  ol: "list-decimal list-inside mt-2 text-black",
                                  li: "mt-1",
                                  hr: "my-4 border-t border-gray-300",
                                },
                              ],
                            ]}
                          >
                            {details.description}
                          </ReactMarkdown>
                        }
                      </p>
                    </div>

                    {/* Hiring Team */}
                    <div>
                      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                        <Users className="w-4 h-4" />
                        {t("jobs.details.hiringListing")}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                          key={details.postedBy.name}
                          className="flex items-center gap-4"
                        >
                          <AvatarMe
                            source={details.postedBy.avatar}
                            alt={details.postedBy.name}
                          />
                          <div>
                            <h4 className="font-semibold">
                              {details.postedBy.name}{" "}
                              {details.withFriends ? "and friends" : ""}
                            </h4>
                            <p className="text-sm text-gray-600"></p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </CardContent>
              ) : (
                <CardContent className="h-full flex items-center justify-center flex-col text-gray-500">
                  <div className="pt-4 w-full flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[80vw]" />
                      <Skeleton className="h-4 w-[80vw]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[80vw]" />
                    <Skeleton className="h-4 w-[80vw]" />
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
