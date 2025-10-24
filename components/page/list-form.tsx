"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Frown,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import remarkGfm from "remark-gfm";
import rehypeClassNames from "rehype-class-names";
import type { Job } from "@/types";
import { feedListing } from "@/hooks/api";
import { LocationCombobox } from "../ui/location";
import AvatarMe from "../ui/avatar-me";

export default function JobsPage() {
  const t = useTranslations();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    location: "",
  });
  const [cities, setCities] = useState<string>("");
  useEffect(() => {
    console.log(cities);
  });
  const [page, setPage] = useState(1);
  const limit = 5;

  const loadJobs = async () => {
    // convert object to query string
    const filtersEdit = {
      ...filters,
      q: filters.search,
      location: cities,
    } as any;
    filtersEdit.search = undefined;

    const filtersQuery = Object.entries(filtersEdit)
      .filter(([key, value]) => value !== "" && value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join(",");

    const data = await feedListing(page, limit, filtersQuery);

    if (!data.hasNext) {
      setHasMore(false);
    }

    const newJobs = [...data.items];
    const uniqueJobs = Array.from(new Set(newJobs.map((job) => job._id))).map(
      (id) => newJobs.find((job) => job._id === id)
    );

    setJobs(uniqueJobs.filter((job): job is Job => job !== undefined));
  };

  useEffect(() => {
    setPage(1);
    setJobs([]);
    loadJobs();
  }, []);

  const handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void = (
    e
  ) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const FilterSection = ({
    icon: Icon,
    label,
    children,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </Label>
      {children}
    </div>
  );

  return (
    <main className="min-h-full">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">{t("jobs.title")}</h1>

        <div className="grid grid-cols-12 gap-3">
          {/* Filters */}
          <div className="col-span-12">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 relative">
                  <div className="relative">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        {t("jobs.filters.search.label")}
                      </Label>
                      <Input
                        placeholder={t("jobs.filters.search.placeholder")}
                        value={filters.search}
                        onChange={handleSearchChange}
                      />
                    </div>
                  </div>

                  <FilterSection
                    icon={Briefcase}
                    label={t("jobs.filters.category.label")}
                  >
                    <Select
                      onValueChange={(value) =>
                        setFilters({ ...filters, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            `jobs.filters.category.${
                              filters.category || "placeholder"
                            }`
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {["Relationship", "Friends", "Activity"].map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`jobs.filters.category.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterSection>

                  <FilterSection
                    icon={MapPin}
                    label={t("jobs.filters.jobLocation.label")}
                  >
                    <LocationCombobox
                      currentCities={cities}
                      returnCities={setCities}
                    />
                  </FilterSection>
                  <div className="flex justify-center items-center right-0 pt-4 relative w-full">
                    <Button
                      variant="default"
                      className="w-24  p-4  text-large text-white"
                      onClick={() => loadJobs()}
                    >
                      {t("jobs.filters.apply")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Listings */}
          <div className="col-span-12 md:col-span-4">
            <Card className="min-h-[calc(100vh-25rem)] overflow-y-auto">
              <CardContent className="p-0 h-full">
                {jobs.map((job) => (
                  <div
                    key={job._id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors
                      ${selectedJob?._id === job._id ? "bg-gray-200" : ""}`}
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="flex gap-4">
                      <div className="w-12 h-12 relative flex-shrink-0 mr-3">
                        <AvatarMe
                          source={job.postedBy.avatar}
                          alt={job.postedBy.name}
                          className="w-16 h-16"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{job.title}</h3>

                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            {job.category}
                          </Badge>
                          <Badge variant="secondary">
                            <MapPin className="w-3 h-3 mr-1" />
                            {job.location}
                          </Badge>
                        </div>
                        <div className="flex justify-between mt-2 text-sm text-gray-600">
                          <span>
                            {job.numberOfParticipants}{" "}
                            {t("jobs.listing.applicants")}
                          </span>
                          <span>
                            {/* // convert to xxx ago */}
                            {t("jobs.listing.postedDate", {
                              date: new Date(
                                job.createdAt
                              ).toLocaleDateString(),
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {jobs.indexOf(job) !== jobs.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
                {jobs.length === 0 && (
                  <div className="w-full h-full p-4 py-8 text-center justify-center flex items-center">
                    <a className="text-gray-500 flex justify-center gap-4">
                      <Frown className="" /> No posts
                    </a>
                  </div>
                )}
              </CardContent>
              {hasMore && (
                <Button
                  variant="outline"
                  className="w-full p-4"
                  onClick={() => setPage((prevPage) => prevPage + 1)}
                >
                  {t("jobs.listing.loadMore")}
                </Button>
              )}
            </Card>
          </div>

          {/* Job Details */}
          <div className="col-span-12 md:col-span-8">
            <Card className="min-h-[calc(100vh-25rem)] overflow-y-auto">
              {selectedJob ? (
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 relative flex-shrink-0">
                      <AvatarMe
                        source={selectedJob.postedBy.avatar}
                        alt={selectedJob.postedBy.name}
                        className="w-16 h-16"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">
                          {selectedJob.title}
                        </h2>
                        <Button
                          variant="outline"
                          className="text-sm"
                          onClick={() =>
                            (window.location.href = `apply/${selectedJob._id}`)
                          }
                        >
                          <Briefcase className="w-4 h-4 mr-2" />
                          {t("jobs.details.apply")}
                        </Button>
                      </div>

                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary">
                          {selectedJob.category}
                        </Badge>
                        <Badge variant="secondary">
                          <MapPin className="w-4 h-4 mr-1" />
                          {selectedJob.location}
                        </Badge>
                      </div>
                      <div className="flex gap-2 mt-4 flex-wrap">
                        {selectedJob.tags.map((tag) => (
                          <Badge key={tag} variant="default">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
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
                            {selectedJob.description}
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
                      {selectedJob.postedBy && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div
                            key={selectedJob.postedBy.name}
                            className="flex items-center gap-4"
                          >
                            <Avatar>
                              <AvatarFallback>
                                {selectedJob.postedBy.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">
                                {selectedJob.postedBy.name}{" "}
                                {selectedJob.withFriends ? "and friends" : ""}
                              </h4>
                              <p className="text-sm text-gray-600"></p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </CardContent>
              ) : (
                <CardContent className="min-h-[calc(100vh-25rem)] flex items-center justify-center text-gray-500">
                  {t("jobs.details.selectOne")}
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
