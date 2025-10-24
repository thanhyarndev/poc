"use client";

import { useFormik } from "formik";
import * as Yup from "yup"; // Import Yup
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import rehypeSanitize from "rehype-sanitize";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Briefcase,
  CheckCircle,
  Plus,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { createPost, patchPost, getPostsById } from "@/hooks/api";
import { toast } from "@/hooks/use-toast";
import { LocationCombobox } from "../ui/location";

const MarkdownEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
});

export default function FullScreenJobListingForm() {
  const t = useTranslations();
  const [mode, setMode] = useState("create");
  const [postId, setPostId] = useState("");
  interface PostData {
    title: string;
    location: string;
    description: string;
    category: string;
    openFor: string;
    isPublic: boolean;
    isLGBT: boolean;
    withFriends: boolean;
    tags: string[];
    questions: string[];
  }

  const [initialData, setInitialData] = useState<PostData | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("postId");
    const mode = urlParams.get("mode");
    setPostId(postId || "");
    setMode(mode || "create");
    if (mode === "edit" && postId) {
      getPostsById(postId).then((data) => {
        if (data._id) {
          setInitialData({
            title: data.title,
            location: data.location,
            description: data.description,
            category: data.category,
            openFor: data.openFor,
            isPublic: data.isPublic,
            isLGBT: data.isLGBT,
            withFriends: data.withFriends,
            tags: data.tags,
            questions: data.questions,
          });
          setTags(data.tags);
          setQuestions(data.questions);
        } else {
          toast({ description: t(data.message) });
        }
      });
    }
  }, [t]);

  const formik = useFormik({
    initialValues: initialData || {
      title: "",
      location: "",
      description: `Here is the template for the job listing description:
### **About me**
### **About the Role**  
I'm seeking a passionate, kind, and adventurous individual to fill the position of Romantic Partner. This role requires someone who thrives on building meaningful connections, values shared experiences, and is committed to creating a strong and fulfilling relationship. If you’re ready to join a partnership rooted in trust, laughter, and mutual growth, we’d love to meet you.  

### **Key Responsibilities**  
- Build and maintain a foundation of trust, communication, and mutual respect.  
- Collaborate on creating shared goals and dreams for the future.  
- Enjoy quality time together through travel, hobbies, and everyday moments.  
- Support each other emotionally, intellectually, and spiritually.  
- Handle challenges with patience, compassion, and teamwork.  


### **Qualifications**  
- Strong emotional intelligence and effective communication skills.  
- A sense of humor and an optimistic outlook on life.  
- Openness to trying new things and embracing growth together.  
- Passion for building a long-term, meaningful partnership.  
- Bonus: Enjoys cozy nights in, outdoor adventures, or experimenting in the kitchen.  


### **Nice-to-Have**  
- Shared interests in fitness, animals, or creative pursuits.  
- A knack for making ordinary moments extraordinary.  
- A love for exploring food, culture, and new experiences.  
- The ability to balance independence with togetherness.  
- Enthusiasm for Netflix marathons or random karaoke nights!  


### **Why Join This Team?**  
- A relationship built on love, laughter, and mutual support.  
- Opportunities to grow together personally and as a team.  
- Unforgettable adventures and cherished memories.  
- A judgment-free space to be your authentic self.  
- A partnership that celebrates every milestone—big or small.  


### **Hiring Process**  
**Step 1:** Submit your “application” by starting a conversation. Share something unique about yourself—what makes you laugh, your dream vacation, or your favorite way to spend a Sunday.  
**Step 2:** Let’s connect over messages or a virtual “screening call” to get to know each other better.  
**Step 3:** Schedule a first “interview” (a.k.a. a date!) to explore our chemistry and compatibility.  
**Step 4:** If we’re aligned, let’s make it official and start building our dream partnership!  

**Application Deadline:** None—this position will remain open until the perfect match is found. ❤️  `,
      category: "",
      openFor: "",
      isPublic: true,
      isLGBT: false,
      withFriends: false,
      tags: [],
      questions: [],
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      title: Yup.string()
        .required(t("jobListing.form.fields.title.errors.required"))
        .min(5, t("jobListing.form.fields.title.errors.min")),
      location: Yup.string().required(
        t("jobListing.form.fields.location.errors.required")
      ),
      description: Yup.string()
        .required(t("jobListing.form.fields.description.errors.required"))
        .test(
          "len",
          t("jobListing.form.fields.description.errors.max"),
          (val) => val.length <= 5192
        ),
      category: Yup.string().required(
        t("jobListing.form.fields.category.errors.required")
      ),
      openFor: Yup.string().required(
        t("jobListing.form.fields.openFor.errors.required")
      ),
      tags: Yup.array().of(Yup.string()),
      questions: Yup.array().of(Yup.string()),
      isPublic: Yup.boolean(),
    }),
    onSubmit: (values) => {
      if (mode === "edit") {
        patchPost(postId, values).then((data) => {
          if (data.statusCode == 200) {
            toast({ description: t(data.message) });
            setIsSuccessful(true);

            if (postId) {
              setLink(`https://nextwaves.vn/en/posts/${postId}`);
            }
          } else {
            toast({ description: t(data.message) });
          }
        });
      } else {
        createPost(values).then((data) => {
          if (data.statusCode !== 200) {
            toast({ description: t(data.message) });
          } else {
            toast({ description: t(data.message) });
            setIsSuccessful(true);

            if (data.data._id) {
              setLink(`https://nextwaves.vn/en/posts/${data.data._id}`);
            }
          }
        });
      }
    },
  });

  const categoryOptions = [
    {
      label: "Relationship",
      icon: Briefcase,
      description: t(
        "jobListing.form.fields.category.descriptions.relationship"
      ),
    },
    {
      label: "Friends",
      icon: Users,
      description: t("jobListing.form.fields.category.descriptions.friends"),
    },
    {
      label: "Activity",
      icon: User,
      description: t("jobListing.form.fields.category.descriptions.activity"),
    },
  ];
  const openForOptions = [
    {
      label: "Male",
      icon: User,
      description: t("jobListing.form.fields.openFor.descriptions.male"),
    },
    {
      label: "Female",
      icon: User,
      description: t("jobListing.form.fields.openFor.descriptions.female"),
    },
    {
      label: "All",
      icon: Users,
      description: t("jobListing.form.fields.openFor.descriptions.all"),
    },
  ];

  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [link, setLink] = useState("");
  const [location, setLocation] = useState("");
  useEffect(() => {
    formik.setFieldValue("location", location);
  }, [location]);
  const copyToClipboard = () => {
    navigator.clipboard.writeText(link);
    toast({ description: "Link copied to clipboard" });
  };

  const addTag = () => {
    if (newTag.trim()) {
      setTags([...tags, newTag]);
      formik.setFieldValue("tags", [...tags, newTag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(updatedTags);
    formik.setFieldValue("tags", updatedTags);
  };

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setQuestions([...questions, newQuestion]);
      formik.setFieldValue("questions", [...questions, newQuestion]);
      setNewQuestion("");
    }
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
    formik.setFieldValue("questions", updatedQuestions);
  };

  return isSuccessful ? (
    <div className="w-screen h-auto flex flex-col">
      <div className="w-full flex-1 flex items-center justify-center">
        <div className="w-full max-w-[80dvw] mx-auto p-8 space-y-10">
          <div className="flex flex-col items-center gap-4">
            <CheckCircle size={48} className="text-green-500" />
            <h1 className="text-xl font-semibold">
              {t("jobListing.form.successTitle")}
            </h1>
            <p className="text-lg text-center">
              {t("jobListing.form.successMessage")}
            </p>
            <div className="flex items-center space-x-2">
              <Input
                value={link}
                readOnly
                className="flex-1"
                placeholder="Link to copy"
              />
              <Button onClick={copyToClipboard}>Copy</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="w-screen h-auto flex flex-col">
      <div className="w-full py-6 border-b bg-white text-center">
        <h1 className="text-4xl font-extrabold text-gray-800">
          {t("jobListing.form.title")}
        </h1>
        <p className="text-gray-500 text-lg mt-2">
          {t("jobListing.form.subtitle")}
        </p>
      </div>
      <form
        onSubmit={formik.handleSubmit}
        className="flex-1 flex flex-col justify-start items-center p-8 space-y-10 w-full max-w-[80dvw] mx-auto"
      >
        {/* Title Field */}
        <div className="w-full space-y-2">
          <Label htmlFor="title" className="text-lg font-semibold">
            {t("jobListing.form.fields.title.label")}
          </Label>
          <p className="text-sm text-gray-500">
            {t("jobListing.form.fields.title.description")}
          </p>
          <Input
            id="title"
            name="title"
            placeholder={t("jobListing.form.fields.title.placeholder")}
            value={formik.values.title}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full"
          />
          {formik.touched.title && formik.errors.title ? (
            <div className="text-red-500 text-sm mt-1">
              {formik.errors.title}
            </div>
          ) : null}
        </div>
        {/* Location Field */}
        <div className="w-full space-y-2">
          <Label htmlFor="location" className="text-lg font-semibold">
            {t("jobListing.form.fields.location.label")}
          </Label>
          <p className="text-sm text-gray-500">
            {t("jobListing.form.fields.location.description")}
          </p>
          <LocationCombobox
            currentCities={formik.values.location}
            returnCities={setLocation}
          />
          {/* <Input
            id="location"
            name="location"
            placeholder={t("jobListing.form.fields.location.placeholder")}
            value={formik.values.location}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full"
          /> */}
          {formik.touched.location && formik.errors.location ? (
            <div className="text-red-500 text-sm mt-1">
              {formik.errors.location}
            </div>
          ) : null}
        </div>
        {/* Category Field */}
        <div className="w-full space-y-2">
          <Label className="text-lg font-semibold">
            {t("jobListing.form.fields.category.label")}
          </Label>
          <p className="text-sm text-gray-500">
            {t("jobListing.form.fields.category.description")}
          </p>
          <div className="flex flex-col mt-4 gap-6">
            {categoryOptions.map(({ label, icon: Icon, description }) => (
              <div
                key={label}
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer shadow-sm ${
                  formik.values.category === label
                    ? "bg-gray-50 border-gray-400"
                    : "border-gray-200"
                }`}
                onClick={() => formik.setFieldValue("category", label)}
              >
                <div>
                  <p className="text-xl font-medium text-gray-800">
                    {t(
                      `jobListing.form.fields.category.options.${label.toLowerCase()}`
                    )}
                  </p>
                  <p className="text-sm mt-2 text-gray-600">{description}</p>
                </div>
                <Icon className="w-8 h-8 text-gray-600" />
              </div>
            ))}
          </div>
          {formik.touched.category && formik.errors.category ? (
            <div className="text-red-500 text-sm mt-1">
              {formik.errors.category}
            </div>
          ) : null}
        </div>
        {/* Open For Field */}
        <div className="w-full space-y-2">
          <Label className="text-lg font-semibold">
            {t("jobListing.form.fields.openFor.label")}
          </Label>
          {/* is LGBT Switch */}
          <div className="w-full flex items-center space-x-4">
            <Label htmlFor="isLGBT" className="text-md font-regular">
              {t("jobListing.form.fields.isLGBT.label")}
            </Label>
            <Switch
              id="isLGBT"
              checked={formik.values.isLGBT}
              onCheckedChange={(checked) =>
                formik.setFieldValue("isLGBT", checked)
              }
            />
          </div>
          <p className="text-sm text-gray-500">
            {t("jobListing.form.fields.openFor.description")}
          </p>
          <div className="flex flex-col mt-4 gap-6">
            {openForOptions.map(({ label, icon: Icon, description }) => (
              <div
                key={label}
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer shadow-sm ${
                  formik.values.openFor === label
                    ? "bg-gray-50 border-gray-400"
                    : "border-gray-200"
                }`}
                onClick={() => formik.setFieldValue("openFor", label)}
              >
                <div>
                  <p className="text-xl font-medium text-gray-800">
                    {t(
                      `jobListing.form.fields.openFor.options.${label.toLowerCase()}`
                    )}
                  </p>
                  <p className="text-sm mt-2 text-gray-600">{description}</p>
                </div>
                <Icon className="w-8 h-8 text-gray-600" />
              </div>
            ))}
          </div>
          {formik.touched.openFor && formik.errors.openFor ? (
            <div className="text-red-500 text-sm mt-1">
              {formik.errors.openFor}
            </div>
          ) : null}
        </div>

        {/* Public Switch */}
        <div className="w-full flex items-center space-x-4">
          <Label htmlFor="isPublic" className="text-lg font-semibold">
            {t("jobListing.form.fields.isPublic.label")}
          </Label>
          <Switch
            id="isPublic"
            checked={formik.values.isPublic}
            onCheckedChange={(checked) =>
              formik.setFieldValue("isPublic", checked)
            }
          />
        </div>
        {/* Description Field */}
        <div className="w-full space-y-2">
          <Label htmlFor="description" className="text-lg font-semibold">
            {t("jobListing.form.fields.description.label")}
          </Label>
          <p className="text-sm text-gray-500">
            {t("jobListing.form.fields.description.description")}
          </p>
          <div
            className={`border rounded-md ${
              formik.touched.description && formik.errors.description
                ? "border-red-500"
                : "border-primary-500"
            }`}
            data-color-mode="light"
          >
            <MarkdownEditor
              value={formik.values.description}
              preview={
                typeof window !== "undefined" && window.innerWidth > 1024
                  ? "live"
                  : "edit"
              }
              onChange={(value) =>
                formik.setFieldValue("description", value || "")
              }
              previewOptions={{
                rehypePlugins: [[rehypeSanitize]],
              }}
              onBlur={() => formik.setFieldTouched("description", true)}
              className="w-full p-6 h-96 text-primary focus:outline-none bg-white"
              enableScroll={false}
              hideToolbar={true}
              height={`80vh`}
            />
          </div>
          {formik.touched.description && formik.errors.description ? (
            <div className="text-red-500 text-sm mt-1">
              {formik.errors.description}
            </div>
          ) : null}
        </div>
        {/* is LGBT Switch */}
        <div className="w-full flex items-center space-x-4">
          <Label htmlFor="withFriends" className="text-md font-regular">
            {t("jobListing.form.fields.withFriends.label")}
          </Label>
          <Switch
            id="withFriends"
            checked={formik.values.withFriends}
            onCheckedChange={(checked) =>
              formik.setFieldValue("withFriends", checked)
            }
          />
        </div>
        {/* Tags Field */}
        <div className="w-full space-y-2">
          <Label htmlFor="tags" className="text-lg font-semibold">
            {t("jobListing.form.fields.tags.label")}
          </Label>
          <p className="text-sm text-gray-500">
            {t("jobListing.form.fields.tags.description")}
          </p>
          <div className="flex items-center gap-2">
            <Input
              id="tags"
              name="tags"
              placeholder={t("jobListing.form.fields.tags.placeholder")}
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="flex-grow"
            />
            <Button
              type="button"
              onClick={addTag}
              className="bg-primary text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map((tag, index) => (
              <div
                key={index}
                className="px-3 py-1 bg-gray-200 rounded-full flex items-center gap-2"
              >
                <span>{tag}</span>
                <Trash2
                  className="w-4 h-4 cursor-pointer"
                  onClick={() => removeTag(tag)}
                />
              </div>
            ))}
          </div>
          {formik.touched.tags && formik.errors.tags ? (
            <div className="text-red-500 text-sm mt-1">
              {typeof formik.errors.tags === "string"
                ? formik.errors.tags
                : formik.errors.tags.join(", ")}
            </div>
          ) : null}
        </div>
        {/* Custom Questions Field */}
        <div className="w-full space-y-2">
          <Label htmlFor="questions" className="text-lg font-semibold">
            {t("jobListing.form.fields.customQuestions.label")}
          </Label>
          <p className="text-sm text-gray-500">
            {t("jobListing.form.fields.customQuestions.description")}
          </p>
          <div className="flex items-center gap-2">
            <Input
              id="questions"
              name="questions"
              placeholder={t(
                "jobListing.form.fields.customQuestions.placeholder"
              )}
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addQuestion();
                }
              }}
              className="flex-grow"
            />
            <Button
              type="button"
              onClick={addQuestion}
              className="bg-primary text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            {questions.map((question, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-100 rounded-md"
              >
                <span>{question}</span>
                <Trash2
                  className="w-5 h-5 cursor-pointer text-red-500"
                  onClick={() => removeQuestion(index)}
                />
              </div>
            ))}
          </div>
          {formik.touched.questions && formik.errors.questions ? (
            <div className="text-red-500 text-sm mt-1">
              {typeof formik.errors.questions === "string"
                ? formik.errors.questions
                : formik.errors.questions.join(", ")}
            </div>
          ) : null}
        </div>
        {/* Submit Button */}
        <span className="text-sm text-gray-500">
          By submitting this form, you agree to our{" "}
          <a href="/terms" className="text-primary">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-primary">
            Privacy Policy
          </a>
          .
        </span>
        <Button
          type="submit"
          variant="default"
          className="py-4 text-lg bg-primary text-white hover:bg-primary-dark"
        >
          {t("jobListing.form.submit")}
        </Button>
      </form>
    </div>
  );
}
