// profile-page.tsx
import ProfileForm from "@/components/page/profile-form";
import { getPublicProfile } from "@/hooks/api";
import Link from "next/link";
import { cookies } from "next/headers";

// export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: { id: string };
}) {
  let user;
  try {
    let userId = params.id;
    if (params.id === "me") {
      const cookieStore = await cookies();
      userId = cookieStore.get("userId")?.value || "";
    }
    user = await getPublicProfile(userId);
  } catch (error) {
    console.error("Failed to fetch public profile:", error);
    user = null; // or handle the error as needed
  }
  if (user == null) {
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

  return <ProfileForm user={user.data} />;
}
