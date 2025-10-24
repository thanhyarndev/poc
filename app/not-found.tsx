import Link from 'next/link';
import { FaceFrownIcon } from '@heroicons/react/24/outline';
import { Header, Footer } from "@/components/block/menu";

export default function NotFound() {
  return (
    <>
    <Header />
      <main className="flex min-h-[83vh] h-full flex-col items-center justify-center gap-2">
        <FaceFrownIcon className="w-10 text-gray-400" />
        <h2 className="text-xl font-semibold">404 Not Found</h2>
        <p>Could not find the requested service.</p>
        <Link
          href="/"
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary-300"
        >
          Go Back
        </Link>
      </main>
      <Footer />
    </>
  );
}