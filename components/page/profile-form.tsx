"use client";

import { useState, useEffect } from "react";
import AvatarMe from "@/components/ui/avatar-me";
import Link from "next/link";

interface ProfileFormProps {
  user: {
    _id: string;
    name: string;
    bio: string;
    avatar: string;
    dob: string;
    gender: string;
  };
}

const hashString = (str: string): number => {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash &= hash;
  }
  return Math.abs(hash);
};

const generatePastelColor = (hash: number): string => {
  const hue = hash % 360;

  const saturation = 70;
  const lightness = 80;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const generateMultiColorPastelGradient = (
  name: string,
  dob: string,
  gender: string,
  id: string,
  colorCount: number = 5
): string => {
  const combinedAttributes = `${name}-${dob}-${gender}-${id}`;
  const hash = hashString(combinedAttributes);

  const colors: string[] = [];

  for (let i = 0; i < colorCount; i++) {
    const modifiedHash = hash + i * 12345;
    const color = generatePastelColor(modifiedHash);
    colors.push(color);
  }

  return `linear-gradient(135deg, ${colors.join(", ")})`;
};

export default function ProfileForm({ user }: ProfileFormProps) {
  const [profileData, setProfileData] = useState(user);
  const [coverGradient, setCoverGradient] = useState<string>("");

  useEffect(() => {
    if (user && user._id && user.name && user.dob && user.gender) {
      const gradient = generateMultiColorPastelGradient(
        user.name,
        user.dob,
        user.gender,
        user._id,
        5
      );
      setCoverGradient(gradient);
      setProfileData(user);
    } else {
      console.warn("User data is incomplete. Using default gradient.");

      setCoverGradient(
        "linear-gradient(135deg, hsl(0, 70%, 80%), hsl(60, 70%, 80%), hsl(120, 70%, 80%), hsl(180, 70%, 80%), hsl(240, 70%, 80%))"
      );
    }
  }, [user]);

  if (!profileData) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-6xl font-bold tracking-tight text-foreground sm:text-7xl">
            404
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Oops, it looks like the page you&apos;re looking for doesn&apos;t
            exist.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              prefetch={false}
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-5xl mx-auto bg-white shadow-md rounded-md overflow-hidden">
        <div className="relative">
          <div
            className="w-full h-64"
            style={{
              background: coverGradient,
            }}
          ></div>
          {/* Profile Avatar */}
          <div className="absolute left-4 bottom-[-60px]">
            <AvatarMe
              source={profileData.avatar}
              alt={profileData.name}
              className="w-32 h-32 rounded-full border-4 border-white object-cover"
            />
          </div>
        </div>

        {/* User Information Section */}
        <div className="pt-20 px-4 pb-6">
          <h1 className="text-3xl font-semibold">{profileData.name}</h1>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">Gender:</span>{" "}
              {profileData.gender}
            </div>
            <div>
              <span className="font-semibold">Birthday:</span>{" "}
              {new Date(profileData.dob).toLocaleDateString()}
            </div>
          </div>

          {/* About Section using bio */}
          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-2">About</h2>
            <p className="text-gray-700">{profileData.bio}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
