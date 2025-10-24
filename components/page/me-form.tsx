"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Briefcase, PencilLineIcon, Frown, Eye } from "lucide-react";
import type { Job, Application } from "@/types";
import {
  listPostByMe,
  getDetailPostById,
  getAllApplicationPost,
  rejectApplication,
} from "@/hooks/api";
import React from "react";
import AvatarMe from "../ui/avatar-me";
import { Dialog, DialogFooter, DialogHeader } from "../ui/dialog";
import {
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "../ui/skeleton";
export default function JobsPage() {
  const t = useTranslations();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [listApplicants, setListApplicants] = useState<Application[] | null>(
    []
  );

  const [rejectFormOpen, setRejectFormOpen] = useState(false);
  const [detailApplicants, setDetailApplicants] = useState<Application | null>(
    null
  );
  const [rejectMessage, setRejectMessage] = useState(`Hi,

Thank you for your kind offer to get to know each other better. I truly appreciate your interest and the time you’ve taken.

After giving it some thought, I feel that we may not be the right match at this moment. You’re a wonderful person, and I’m confident you’ll find someone who aligns perfectly with you.

I’d like to leave you with a little story and some music to accompany it:

Imagine two travelers on a journey, each carrying their own map. Sometimes, the paths align, the scenery matches, and everything feels just right. Other times, the maps lead to different destinations, both equally beautiful but not on the same trail. We’re two travelers with maps that don’t align this time, but that doesn’t make the journey any less meaningful.

Here are a few songs to keep you company on your journey:

- "Someone Like You" by Adele – a song that reminds us of the beauty of meeting and parting.
- "Let Her Go" by Passenger – a gentle melody about cherishing moments.
- "Happier" by Ed Sheeran – a hopeful tune for brighter days ahead.

Wishing you all the best and happiness on your path forward!

Take care`);
  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const data = await listPostByMe(1, 20, ``);

      setJobs(data.data.items || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setJobsLoading(false);
    }
    setIsLoaded(true);
  };
  const sendReject = async () => {
    if (!detailApplicants) return;
    if (!listApplicants) return;
    rejectApplication(detailApplicants?._id, rejectMessage).then((data) => {
      setDetailApplicants(null);
      console.log(data);

      toast({ description: "Rejected!" });
      setRejectFormOpen(false);
      setListApplicants(
        listApplicants?.filter((item) => item !== detailApplicants)
      );
    });
  };
  useEffect(() => {
    if (selectedJob?._id && !selectedJob.detailsFetched) {
      (async () => {
        try {
          const details = await getDetailPostById(selectedJob._id);
          setSelectedJob((prevJob) => ({
            ...prevJob,
            ...details,
            detailsFetched: true,
          }));
          const listApplicantsData = await getAllApplicationPost(
            selectedJob._id
          );

          setListApplicants(listApplicantsData.data.items);
          setDetailApplicants(null);
          console.log("listApplicants", listApplicants);
        } catch (error) {
          console.error("Error fetching job details:", error);
        }
      })();
    }
  }, [selectedJob]);

  useEffect(() => {
    if (detailApplicants?._id && !detailApplicants.detailsFetched) {
      (async () => {
        try {
          const details = await getDetailPostById(detailApplicants._id);
          setSelectedJob((prevApplication) => ({
            ...prevApplication,
            ...details,
            detailsFetched: true,
          }));
        } catch (error) {
          console.error("Error fetching job details:", error);
        }
      })();
    }
  }, [detailApplicants]);

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <main>
      <Dialog open={rejectFormOpen}>
        <div className="container mx-auto p-4">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 mt-4">
              <h3 className="text-3xl font-bold"> Your posts</h3>
              <Separator className="my-4" />
            </div>
            <div className="col-span-12 md:col-span-2">
              <Card className="min-h-[calc(100vh)] overflow-y-auto">
                <CardContent className="p-0">
                  {jobsLoading ? (
                    <p className="w-full text-center p-8">Loading jobs...</p>
                  ) : (
                    jobs?.map((job: Job) => (
                      <div
                        key={job._id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedJob?._id === job._id
                            ? "bg-gray-100 border-black "
                            : ""
                        }`}
                        onClick={() => setSelectedJob(job)}
                      >
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2">{job.title}</h3>
                            <div className="flex gap-1 mt-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className="text-sm !p-0"
                                onClick={() =>
                                  window.open(
                                    `${window.location}/../post-listing/?mode=edit&postId=${job._id}`
                                  )
                                }
                              >
                                <PencilLineIcon className="w-5 h-5 p-1" />
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-sm !p-0"
                                onClick={() =>
                                  window.open(
                                    `${window.location}/../posts/${job._id}`
                                  )
                                }
                              >
                                <Eye className="w-5 h-5 p-1" />
                              </Badge>
                            </div>
                            <div className="flex justify-between flex-col mt-2 text-sm text-gray-600">
                              <span>
                                {job.numberOfParticipants}{" "}
                                {t("jobs.listing.applicants")}
                              </span>
                              <span>
                                {t("jobs.listing.postedDate", {
                                  date: new Intl.DateTimeFormat("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }).format(new Date(job.createdAt)),
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Separator className="mt-4" />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* <div className="col-span-12 md:col-span-8">
              <Card className="h-[calc(100vh-200px)] overflow-y-auto">
                {selectedJob ? (
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h2 className="text-2xl font-bold">
                            {selectedJob.title}
                          </h2>
                          <Button
                            variant="outline"
                            className="text-sm"
                            onClick={() =>
                              (window.location.href = `post-listing/?mode=edit&postId=${selectedJob._id}`)
                            }
                          >
                            <PencilLineIcon className="w-4 h-4 mr-2" />
                            {t("jobs.details.edit")}
                          </Button>
                        </div>

                        <div className="flex gap-2 mt-2 flex-wrap">
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
                    </section>
                  </CardContent>
                ) : (
                  <CardContent className="h-full flex items-center justify-center text-gray-500">
                    {t("jobs.details.selectOne")}
                  </CardContent>
                )}
              </Card>
            </div>
            <div className="col-span-12 mt-16">
              <h3 className="text-3xl font-bold"> Application</h3>
              <Separator className="my-4" />
            </div> */}

            {selectedJob ? (
              <>
                <div className="col-span-12 md:col-span-2">
                  <Card className="min-h-[calc(100vh)] overflow-y-auto">
                    <CardContent className="p-0">
                      {listApplicants == null ? (
                        <p className="w-full text-center p-8">
                          <p className="w-full text-center p-8">
                            <div className="flex items-center justify-center gap-2">
                              Select one...
                            </div>
                          </p>
                        </p>
                      ) : listApplicants.length === 0 ? (
                        <p className="w-full text-center p-8">
                          <div className="flex items-center justify-center flex-col gap-2">
                            <Frown />
                            No one has applied
                          </div>
                        </p>
                      ) : (
                        listApplicants.map((application: Application) => (
                          <div
                            key={application._id}
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                              detailApplicants?._id === application._id
                                ? "bg-gray-100 border-black "
                                : ""
                            }`}
                            onClick={() => setDetailApplicants(application)}
                          >
                            <div className="flex gap-4">
                              <AvatarMe
                                source={application.applyBy.avatar}
                                alt={application.applyBy.name}
                              />
                              <div className="flex-1">
                                <h3 className="font-semibold">
                                  {application.applyBy.name}
                                </h3>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                  {application.badges.map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant={
                                        tag === "PREMIUM"
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {tag}
                                    </Badge>
                                  ))}

                                  <span className="text-sm text-gray-600">
                                    {new Date(
                                      application.createdAt
                                    ).toLocaleString("vi-VN", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Separator className="mt-4" />
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="col-span-12 md:col-span-8">
                  <Card className="min-h-[calc(100vh)] overflow-y-auto">
                    {detailApplicants ? (
                      <CardContent className="p-6">
                        <div className="flex items-start gap-3 mb-6">
                          <div className="flex-1">
                            <div className="flex items-center justify-start gap-4">
                              <AvatarMe
                                source={detailApplicants.applyBy.avatar}
                                alt={detailApplicants.applyBy.name}
                              />
                              <h2 className="text-2xl font-bold">
                                {detailApplicants.applyBy.name}
                              </h2>
                              <div className="flex gap-2 flex-wrap">
                                <Badge variant="secondary">
                                  {detailApplicants.applyBy.gender}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex gap-2 mt-4 flex-wrap">
                              {detailApplicants.badges.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant={
                                    tag === "PREMIUM" ? "default" : "outline"
                                  }
                                >
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2 mt-4 flex-wrap">
                              <Badge variant="outline">
                                Email: {` `}
                                {detailApplicants.applyBy.email}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex gap-2 justify-end">
                              <DialogTrigger asChild>
                                <Button
                                  variant="default"
                                  onClick={() => {
                                    setRejectFormOpen(true);
                                  }}
                                >
                                  Reject
                                </Button>
                              </DialogTrigger>

                              {/* <Button
                              variant="default"
                              onClick={() => console.log("Shortlist clicked")}
                            >
                              Shortlist
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => console.log("Add Comment clicked")}
                            >
                              Add Comment
                            </Button> */}
                            </div>
                          </div>
                        </div>

                        <Separator className="my-6" />

                        <section className="space-y-6">
                          <div>
                            <h3 className="text-2xl font-bold">
                              {t("jobs.details.resume")}
                            </h3>

                            {detailApplicants.resume !== null ? (
                              <div
                                className="mt-4 p-4 border rounded shadow-sm flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() =>
                                  detailApplicants.resume &&
                                  window.open(detailApplicants.resume, "_blank")
                                }
                              >
                                <Briefcase className="w-4 h-4" />
                                <span>
                                  {t("jobs.details.viewResume", {
                                    name: detailApplicants.applyBy.name,
                                  })}
                                </span>
                              </div>
                            ) : (
                              ""
                            )}
                            <h3 className="mt-4 text-2xl font-bold">
                              {t("jobs.details.coverLetter")}
                            </h3>

                            {detailApplicants.coverLetter !== null ? (
                              <div
                                className="mt-4 p-4 border rounded shadow-sm flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() =>
                                  detailApplicants.coverLetter &&
                                  window.open(
                                    detailApplicants.coverLetter,
                                    "_blank"
                                  )
                                }
                              >
                                <Briefcase className="w-4 h-4" />
                                <span>
                                  {t("jobs.details.viewCoverLetter", {
                                    name: detailApplicants.applyBy.name,
                                  })}
                                </span>
                              </div>
                            ) : (
                              ""
                            )}
                            {detailApplicants.coverLetterVideo &&
                              (detailApplicants.coverLetterVideo.includes(
                                "youtu.be"
                              ) ||
                                detailApplicants.coverLetterVideo.includes(
                                  "youtube.com"
                                )) && (
                                <div className="mt-4 items-center flex justify-center">
                                  <iframe
                                    width="80%"
                                    height="400"
                                    src={`https://www.youtube.com/embed/${new URL(
                                      detailApplicants.coverLetterVideo
                                    ).searchParams.get("v")}`}
                                    title="YouTube video player"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  ></iframe>
                                </div>
                              )}
                          </div>

                          <div className="!mt-16">
                            <h3 className="text-2xl font-bold">
                              {t("jobs.details.customQuestions")}
                            </h3>
                            {selectedJob.questions.map(
                              (question: string, index: number) => {
                                return (
                                  <div className="my-4" key={index}>
                                    <h3 className="text-lg font-semibold">
                                      {index + 1}. {question}
                                    </h3>
                                    <p>
                                      {
                                        detailApplicants.customQuestionAnswers[
                                          index
                                        ]
                                      }
                                    </p>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </section>
                      </CardContent>
                    ) : (
                      <CardContent className="h-full flex items-center justify-center text-gray-500">
                        <p className="w-full text-center p-8">
                          <div className="flex items-center justify-center gap-2">
                            {t("jobs.details.selectOne")}
                          </div>
                        </p>
                      </CardContent>
                    )}
                  </Card>
                </div>
              </>
            ) : (
              ""
            )}
          </div>

          {/* <RejectForm detailApplicants={detailApplicants} /> */}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject this candidates?</DialogTitle>
              <DialogDescription>
                Are you sure you want to reject this candidates?
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="col-span-4">
                  Reject messages (Make it personal and kind, don&apos;t be rude
                  and don&apos;t use this template)
                </Label>
                <Textarea
                  id="name"
                  className="col-span-4 min-h-64"
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={sendReject}>
                Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </div>
      </Dialog>
    </main>
  );
}

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
