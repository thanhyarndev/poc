"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { useAuth, User } from "@/contexts/AuthProvider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  patchNewAvatar,
  patchNewUserInformation,
  uploadFile,
} from "@/hooks/api";
import { Calendar } from "../ui/calendar";
import AvatarMe from "../ui/avatar-me";

const genders = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Other", value: "OTHER" },
];

export default function Component() {
  const [activeSection, setActiveSection] = useState("basicInfo");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const t = useTranslations();

  const basicInfoSchema = yup.object().shape({
    name: yup.string().required(t("Settings.validation.nameRequired")),
    bio: yup.string().required(t("Settings.validation.bioRequired")),
    gender: yup.string().required(t("Settings.validation.genderRequired")),
    dob: yup
      .date()
      .required(t("Settings.validation.dobRequired"))
      .test(
        "Settings.age",
        t("Settings.validation.ageRequirement"),
        function (value) {
          return (
            value &&
            new Date().getFullYear() - new Date(value).getFullYear() >= 18
          );
        }
      ),
  });

  const { getUser, getNewUserInformation } = useAuth();
  const basicInfoForm = useForm({
    resolver: yupResolver(basicInfoSchema),
    defaultValues: getUser() as any,
    mode: "onChange",
  });

  const avatarForm = useForm({
    defaultValues: { avatar: null },
    mode: "onChange",
  });

  const handleBasicInfoSubmit = async (data: any) => {
    const { name, bio, gender, dob } = data;
    const newData = { name, bio, gender, dob };
    const update = await patchNewUserInformation(newData);
    if (update) {
      toast({
        title: t("Settings.saved"),
        description: t("Settings.basicInfoUpdated"),
      });
      return;
    }
    toast({
      title: t("Settings.error"),
      description: t("Settings.basicInfoUpdateFailed"),
    });
  };

  const handleAvatarSubmit = async (data: any) => {
    console.log("Selected file:", data.avatar);
    if (!data.avatar) {
      toast({
        title: t("Settings.errorSelectSomeFile"),
        description: t("Settings.errorSelectSomeFile"),
      });
      return;
    }

    const file = await uploadFile(data.avatar);
    if (file.message && file.message === "FILE_UPLOADED") {
      const updated = await patchNewAvatar(file.filePath);
      await getNewUserInformation();
      toast({
        title: updated
          ? t("Settings.avatarSettings.updated")
          : t("Settings.someThingWentWrong"),
        description: updated
          ? t("Settings.avatarSettings.updated")
          : t(file.message),
      });
      return;
    }

    toast({
      title: t("Settings.error"),
      description: t("Settings.basicInfoUpdateFailed"),
    });
  };

  const handleAvatarChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setAvatarPreview(null);
    }
  };
  useEffect(() => {
    (async () => {
      getNewUserInformation();
    })();

    const nuser = getUser();
    if (nuser?.avatar) {
      setAvatarPreview(nuser.avatar);
      setUser(nuser);
    }
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case "basicInfo":
        return (
          <div className="flex gap-8 flex-col">
            <Card>
              <CardHeader>
                <CardTitle>{t("Settings.nameBio")}</CardTitle>
                <CardDescription>{t("Settings.nameBioDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...basicInfoForm}>
                  <form
                    onSubmit={basicInfoForm.handleSubmit(handleBasicInfoSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={basicInfoForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Settings.yourName")}</FormLabel>
                          <FormDescription>
                            {t("Settings.isPublic")}
                          </FormDescription>
                          <FormControl>
                            <Input
                              placeholder={t("Settings.yourName")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={basicInfoForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Settings.email")}</FormLabel>
                          <FormDescription>
                            {t("Settings.isPublicSpecific")}
                          </FormDescription>
                          <FormControl>
                            <Input
                              placeholder={t("Settings.email")}
                              {...field}
                              disabled
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={basicInfoForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Settings.phone")}</FormLabel>
                          <FormDescription>
                            {t("Settings.isPublicSpecific")}
                          </FormDescription>
                          <FormControl>
                            <Input
                              placeholder={t("Settings.phone")}
                              {...field}
                              disabled
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={basicInfoForm.control}
                      name="dob"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Settings.dob")}</FormLabel>
                          <FormDescription>
                            {t("Settings.isPublic")}
                          </FormDescription>
                          <FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-[240px] justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon />
                                  {field.value ? (
                                    <span>
                                      {new Date(
                                        field.value
                                      ).toLocaleDateString()}
                                    </span>
                                  ) : (
                                    <span>{t("Settings.pickDate")}</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  captionLayout="dropdown-buttons"
                                  fromYear={1960}
                                  toYear={2007}
                                  selected={
                                    field.value
                                      ? new Date(field.value)
                                      : undefined
                                  }
                                  onSelect={(date) =>
                                    field.onChange(date?.toISOString())
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={basicInfoForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Settings.bio")}</FormLabel>
                          <FormDescription>
                            {t("Settings.isPublic")}
                          </FormDescription>
                          <FormControl>
                            <Textarea
                              placeholder={t("Settings.bio")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={basicInfoForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem {...field}>
                          <FormLabel>{t("Settings.gender")}</FormLabel>
                          <FormControl>
                            <Select>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder={field.value} />
                              </SelectTrigger>
                              <SelectContent>
                                {genders.map((field) => (
                                  <SelectItem
                                    key={field.value}
                                    value={field.value}
                                  >
                                    {field.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">{t("Settings.save")}</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t("Settings.sidebarAvatar")}</CardTitle>
                <CardDescription>
                  {t("Settings.uploadAvatarDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...avatarForm}>
                  <form
                    onSubmit={avatarForm.handleSubmit(handleAvatarSubmit)}
                    className="space-y-4 grid grid-cols-2 md:grid-cols-4 gap-4"
                    encType="multipart/form-data"
                  >
                    <FormField
                      control={avatarForm.control}
                      name="avatar"
                      render={({ field: { onChange, ref } }) => (
                        <FormItem className="col-span-3">
                          <FormLabel>{t("Settings.sidebarAvatar")}</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              ref={ref}
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                onChange(file);
                                handleAvatarChange(file);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                          <Button type="submit">{t("Settings.upload")}</Button>
                        </FormItem>
                      )}
                    />
                    {avatarPreview && (
                      <div className="w-full md:flex md:justify-center col-span-1">
                        <AvatarMe
                          source={avatarPreview}
                          alt={user ? user.name : ""}
                          className="w-48 h-48 rounded-full object-cover mb-4 col-span-1"
                        />
                      </div>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        );

      case "goPro":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("Settings.goProTitle")}</CardTitle>
              <CardDescription>{t("Settings.goProDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {user?.subscription === "Free" ? (
                <p>{t("Settings.goProContent")}</p>
              ) : (
                <p>{t("Settings.alreadyPro")}</p>
              )}
            </CardContent>
            <CardFooter>
              <p>Coming Soon!</p>
              {/* 
              <Button>{t("Settings.upgrade")}</Button> */}
            </CardFooter>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      <main className="flex bg-gray-100/40 dark:bg-gray-800/40 min-h-[calc(100vh_-_theme(spacing.16))] lg:flex-row flex-col">
        <div className="py-8">
          <nav className="text-sm text-gray-500 dark:text-gray-400 grid gap-4 sm:gap-8 grid-cols-3 lg:grid-cols-1 lg:max-w-48 text-center lg:text-left">
            {[
              { id: "basicInfo", label: t("Settings.sidebarBasicInfo") },
              { id: "goPro", label: t("Settings.sidebarGoPro") },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center space-x-2 p-3 rounded-2xl font-semibold ${
                  activeSection === id
                    ? "text-gray-900 dark:text-gray-50 bg-slate-300"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <span className="w-full text-center lg:text-left">{label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="flex-1 flex flex-col gap-4 md:gap-8 md:p-10  w-full">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
