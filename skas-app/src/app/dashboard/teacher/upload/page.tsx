import { UploadForm } from "@/components/teacher/upload-form";

export default function UploadPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Muat Naik Sijil</h1>
        <p className="text-gray-500 text-sm mt-1">
          AI akan mengekstrak maklumat daripada sijil anda secara automatik
        </p>
      </div>
      <UploadForm />
    </div>
  );
}
