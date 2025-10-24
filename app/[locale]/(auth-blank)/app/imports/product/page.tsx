import { ImportProductForm } from "@/components/page/import-product-form"

export default function Page() {
    return(
        <div className="flex min-h-full w-full items-center justify-center p-6 md:p-10 bg-gray-100">
        <div className="w-full max-w-md">
          <ImportProductForm />
        </div>
      </div>
    )
} 