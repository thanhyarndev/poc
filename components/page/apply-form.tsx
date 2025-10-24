"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Paperclip, Video, FileText, CheckCircle } from "lucide-react";
import { applyPost, getDetailPostById, uploadFile } from "@/hooks/api";
import { toast } from "@/hooks/use-toast";
import React from "react";
import { CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
interface FormValues {
  resume: File | null;
  coverLetter: File | null;
  coverLetterVideo: string;
  answers: string[];
}

export default function FullScreenJobApplicationForm({ id }: { id: string }) {
  const t = useTranslations();
  const [resumeFilePath, setResumeFilePath] = useState<string | null>(null);
  const [coverLetterFilePath, setCoverLetterFilePath] = useState<string | null>(
    null
  );
  const [questions, setQuestions] = useState<string[]>([]);
  const [customAnswers, setCustomAnswers] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [post, setPost] = useState<any>();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await getDetailPostById(id);
        setQuestions(data.questions);
        setCustomAnswers(Array(data.questions.length).fill(""));
        setPost(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchQuestions();
    setIsLoaded(true);
  }, [id]);

  const validationSchema = Yup.object().shape({
    resume: Yup.mixed()
      .required(t("jobApplication.form.validation.resume.required"))
      .test(
        "fileType",
        t("jobApplication.form.validation.resume.fileType"),
        (value) => value instanceof File && value.type === "application/pdf"
      ),
    coverLetter: Yup.mixed()
      .nullable()
      .test(
        "fileType",
        t("jobApplication.form.validation.coverLetter.fileType"),
        (value) => {
          if (!value) return true;
          return value instanceof File && value.type === "application/pdf";
        }
      ),
    coverLetterVideo: Yup.string()
      .url(t("jobApplication.form.validation.coverLetterVideo.invalid"))
      .nullable(),
  });

  const formik = useFormik<FormValues>({
    initialValues: {
      resume: null,
      coverLetter: null,
      coverLetterVideo: "",
      answers: [],
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      const result = await applyPost(id, {
        ...values,
        resume: resumeFilePath,
        coverLetter: coverLetterFilePath,
      });

      debugger;
      if (result.statusCode == 200) {
        toast({ description: t("jobApplication.form.submitSuccess") });
        setIsSuccess(true);
      } else {
        toast({ description: t("jobApplication.form.submitError") });
      }
    },
  });

  useEffect(() => {
    if (
      JSON.stringify(formik.values.answers) !== JSON.stringify(customAnswers)
    ) {
      formik.setFieldValue("answers", customAnswers);
    }
  }, [customAnswers, formik]);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0] || null;
    if (file) {
      if (file.type !== "application/pdf") {
        alert(t("jobApplication.form.uploadResumeError"));
        formik.setFieldValue("resume", null);
        return;
      }
      formik.setFieldValue("resume", file);
      const result = await uploadFile(file);
      if (result.message == "FILE_UPLOADED") {
        setResumeFilePath(result.filePath);
      } else {
        toast({
          description: t("jobApplication.form.uploadCoverLetterError"),
        });
      }
    }
  };

  const handleCoverLetterUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.currentTarget.files?.[0] || null;
    if (file) {
      if (file.type !== "application/pdf") {
        alert(t("jobApplication.form.uploadCoverLetterError"));
        formik.setFieldValue("coverLetter", null);
        return;
      }
      formik.setFieldValue("coverLetter", file);
      const result = await uploadFile(file);
      if (result.message == "FILE_UPLOADED") {
        setCoverLetterFilePath(result.filePath);
      } else {
        toast({ description: t("jobApplication.form.uploadCoverLetterError") });
      }
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    setCustomAnswers((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };
  if (!isLoaded) {
    return (
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
    );
  }
  return isSuccess ? (
    <div className="w-screen min-h-full flex flex-col">
      <div className="w-full flex-1 flex items-center justify-center">
        <div className="w-full max-w-[80dvw] mx-auto p-8 space-y-10">
          <div className="flex flex-col items-center gap-4">
            <CheckCircle size={48} className="text-green-500" />
            <h1 className="text-xl font-semibold">
              {t("jobApplication.form.successTitle")}
            </h1>
            <p className="text-lg text-center">
              {t("jobListing.form.successMessage")}
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="w-screen h-full flex flex-col">
      <div className="w-full py-6 border-b bg-white text-center">
        <h1 className="text-4xl font-extrabold text-gray-800">
          {t("jobApplication.form.title")}
        </h1>
        <p className="text-gray-500 text-lg mt-2">
          {t("jobApplication.form.subtitle")}
          {post?.title}
        </p>
      </div>
      <form
        onSubmit={formik.handleSubmit}
        className="flex-1 flex flex-col justify-start items-center p-8 space-y-10 w-full max-w-4xl mx-auto"
      >
        <div className="w-full space-y-2">
          <Label htmlFor="resume" className="text-lg font-semibold">
            {t("jobApplication.form.fields.resume.label")}
          </Label>
          <p className="text-sm text-gray-500">
            {t("jobApplication.form.fields.resume.description")}
          </p>
          <div className="flex items-center gap-2">
            <Input
              id="resume"
              name="resume"
              type="file"
              accept=".pdf"
              onChange={handleResumeUpload}
              onBlur={formik.handleBlur}
              className="flex-grow"
            />
            <Paperclip className="w-6 h-6 text-gray-600" />
          </div>
          {resumeFilePath && (
            <div className="mt-2 text-gray-700 text-sm">
              {t("jobApplication.form.fields.resume.selectedFile")}:{" "}
              <a
                href={resumeFilePath}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                {formik.values.resume?.name || "Resume.pdf"}
              </a>
            </div>
          )}
          {formik.touched.resume && formik.errors.resume && (
            <div className="text-red-500 text-sm">{formik.errors.resume}</div>
          )}
        </div>
        <div className="w-full space-y-2">
          <Label htmlFor="coverLetter" className="text-lg font-semibold">
            {t("jobApplication.form.fields.coverLetter.label")}
          </Label>
          <p className="text-sm text-gray-500">
            {t("jobApplication.form.fields.coverLetter.description")}
          </p>
          <div className="flex items-center gap-2">
            <Input
              id="coverLetter"
              name="coverLetter"
              type="file"
              accept=".pdf"
              onChange={handleCoverLetterUpload}
              onBlur={formik.handleBlur}
              className="flex-grow"
            />
            <FileText className="w-6 h-6 text-gray-600" />
          </div>
          {coverLetterFilePath && (
            <div className="mt-2 text-gray-700 text-sm">
              {t("jobApplication.form.fields.coverLetter.selectedFile")}:{" "}
              <a
                href={coverLetterFilePath}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                {formik.values.coverLetter?.name || "CoverLetter.pdf"}
              </a>
            </div>
          )}
          {formik.touched.coverLetter && formik.errors.coverLetter && (
            <div className="text-red-500 text-sm">
              {formik.errors.coverLetter}
            </div>
          )}
          <Label
            htmlFor="coverLetterVideo"
            className="text-lg font-semibold mt-4 block"
          >
            {t("jobApplication.form.fields.coverLetterVideo.label")}
          </Label>
          <p className="text-sm text-gray-500">
            {t("jobApplication.form.fields.coverLetterVideo.description")}
          </p>
          <div className="flex items-center gap-2">
            <Input
              id="coverLetterVideo"
              name="coverLetterVideo"
              placeholder={t(
                "jobApplication.form.fields.coverLetterVideo.placeholder"
              )}
              onChange={(e) => {
                formik.setFieldValue("coverLetterVideo", e.target.value);
              }}
              onBlur={formik.handleBlur}
              className="flex-grow"
            />
            <Video className="w-6 h-6 text-gray-600" />
          </div>
          {formik.touched.coverLetterVideo &&
            formik.errors.coverLetterVideo && (
              <div className="text-red-500 text-sm">
                {formik.errors.coverLetterVideo}
              </div>
            )}
        </div>
        <div className="w-full space-y-2">
          <Label htmlFor="answers" className="text-lg font-semibold">
            {t("jobApplication.form.fields.questions.label")}
          </Label>
          <p className="text-sm text-gray-500">
            {t("jobApplication.form.fields.questions.description")}
          </p>
          <div className="flex flex-col gap-6 mt-4">
            {questions.map((question, index) => (
              <div key={index} className="space-y-2">
                <p className="text-gray-800 font-medium">{question}</p>
                <textarea
                  id={`answers.${index}`}
                  name={`answers.${index}`}
                  className="border border-primary-500 rounded-md w-full p-4 h-32 text-primary focus:outline-none bg-white"
                  value={formik.values.answers[index] || ""}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  onBlur={formik.handleBlur}
                />
              </div>
            ))}
          </div>
        </div>
        <Button type="submit" variant="default">
          {t("jobApplication.form.submit")}
        </Button>
      </form>
    </div>
  );
}
