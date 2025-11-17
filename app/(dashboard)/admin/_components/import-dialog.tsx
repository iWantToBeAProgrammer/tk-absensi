"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Download,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  teachers?: any[];
  message?: string;
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => Promise<any>;
  type: "students" | "teachers";
  templateUrl: string;
}

export function ImportDialog({
  open,
  onOpenChange,
  onImport,
  type,
  templateUrl,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typeLabels = {
    students: {
      title: "Impor Siswa",
      description: "Unggah file CSV berisi data siswa",
      template: "Template Data Siswa",
    },
    teachers: {
      title: "Impor Guru",
      description:
        "Unggah file CSV berisi data guru. Guru akan menerima email undangan untuk menyetel password.",
      template: "Template Data Guru",
    },
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Only allow CSV files for now
      if (!selectedFile.name.match(/\.(csv)$/i)) {
        toast.error("Format file harus CSV");
        return;
      }
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Pilih file terlebih dahulu");
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await onImport(file);
      setImportResult(result);

      if (result.success > 0) {
        if (type === "teachers" && result.success > 0) {
          toast.success(
            `${
              result.success
            } guru berhasil diimpor dan menerima undangan email${
              result.failed > 0 ? `, ${result.failed} gagal` : ""
            }`
          );
        } else {
          toast.success(
            `${result.success} data berhasil diimpor${
              result.failed > 0 ? `, ${result.failed} gagal` : ""
            }`
          );
        }
      }

      if (result.failed > 0 && result.errors?.length > 0) {
        // Show first error as toast
        const firstError = result.errors[0];
        if (result.success === 0) {
          toast.error(`Import gagal: ${firstError}`);
        } else {
          toast.warning(`${result.failed} data gagal diimpor`);
        }
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "Gagal mengimpor data");
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const link = document.createElement("a");
    link.href = templateUrl;
    link.download = `${typeLabels[type].template}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.name.match(/\.(csv)$/i)) {
        toast.error("Format file harus CSV");
        return;
      }
      setFile(droppedFile);
      setImportResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {typeLabels[type].title}
          </DialogTitle>
          <DialogDescription>{typeLabels[type].description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">Download Template</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Gunakan template ini untuk memastikan format data sesuai
                </p>
                {type === "teachers" && (
                  <p className="text-xs text-blue-600 mt-2">
                    📧 Kolom email diperlukan untuk mengirim undangan login
                  </p>
                )}
              </div>
              <Button
                onClick={downloadTemplate}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih File CSV</Label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!file ? (
                  <div className="space-y-2">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">
                      Seret file CSV ke sini atau klik untuk memilih
                    </p>
                    <p className="text-xs text-gray-500">
                      Hanya file CSV yang didukung
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReset();
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Import Button */}
            <Button
              onClick={handleImport}
              disabled={!file || isImporting}
              className="w-full gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengimpor...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Impor Data
                </>
              )}
            </Button>
          </div>

          {/* Import Results */}
          {importResult && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg ${
                  importResult.failed === 0
                    ? "bg-green-50 border border-green-200"
                    : importResult.success > 0
                    ? "bg-amber-50 border border-amber-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  {importResult.failed === 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  )}
                  <div>
                    <p className="font-medium">
                      {importResult.failed === 0
                        ? "Import Berhasil!"
                        : importResult.success > 0
                        ? "Import Selesai dengan Beberapa Error"
                        : "Import Gagal"}
                    </p>
                    <p className="text-sm mt-1">
                      {importResult.success} data berhasil,{" "}
                      {importResult.failed} gagal
                    </p>
                    {type === "teachers" && importResult.success > 0 && (
                      <p className="text-xs text-green-700 mt-1">
                        ✓ Guru yang berhasil diimpor akan menerima email
                        undangan
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Details */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-red-700">Detail Error:</Label>
                  <div className="max-h-48 overflow-y-auto border border-red-200 rounded-lg">
                    {importResult.errors.map((error, index) => (
                      <div
                        key={index}
                        className="p-3 border-b border-red-100 last:border-b-0 text-sm text-red-700 bg-red-50"
                      >
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Preview */}
              {importResult.teachers && importResult.teachers.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-green-700">
                    Guru yang Berhasil Diimpor:
                  </Label>
                  <div className="max-h-48 overflow-y-auto border border-green-200 rounded-lg">
                    {importResult.teachers
                      .slice(0, 10)
                      .map((teacher, index) => (
                        <div
                          key={teacher.id}
                          className="p-3 border-b border-green-100 last:border-b-0 text-sm text-green-700 bg-green-50"
                        >
                          <div className="font-medium">{teacher.name}</div>
                          <div className="text-xs opacity-75">
                            {teacher.email} • {teacher.phone}
                          </div>
                        </div>
                      ))}
                    {importResult.teachers.length > 10 && (
                      <div className="p-3 text-sm text-green-600 text-center bg-green-50">
                        ... dan {importResult.teachers.length - 10} guru lainnya
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex-1"
            disabled={isImporting}
          >
            {importResult ? "Tutup" : "Batal"}
          </Button>
          {importResult && importResult.failed > 0 && (
            <Button onClick={handleReset} variant="outline" className="flex-1">
              Coba Lagi
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
