'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { verifyCertificateAction, type VerificationResult } from '@/app/actions';
import { VerificationResultDisplay } from './verification-result-display';

export function VerifyCertificateForm() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please upload a file smaller than 5MB.',
        });
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'application/pdf': [] },
    maxFiles: 1,
  });

  const handleRemoveFile = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please upload a certificate file to verify.',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('certificate', file);

    const verificationResult = await verifyCertificateAction(formData);
    
    setIsLoading(false);

    if (verificationResult.error) {
       toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: verificationResult.error,
      });
    } else {
      setResult(verificationResult);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!preview ? (
              <div
                {...getRootProps()}
                className={`flex justify-center rounded-lg border-2 border-dashed border-border p-12 text-center transition-colors ${
                  isDragActive ? 'border-primary bg-primary/10' : 'hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="space-y-2 text-muted-foreground">
                  <UploadCloud className="mx-auto h-12 w-12" />
                  <p className="text-lg font-semibold">
                    {isDragActive
                      ? 'Drop the file here...'
                      : 'Drag & drop a file here, or click to select'}
                  </p>
                  <p className="text-sm">PNG, JPG, or PDF (max. 5MB)</p>
                </div>
              </div>
            ) : (
              <div className="relative w-full max-w-sm mx-auto">
                <div className="rounded-lg border p-4 flex flex-col items-center gap-2">
                   {file?.type.startsWith('image/') ? (
                    <img src={preview} alt="Certificate preview" className="max-h-48 rounded-md" />
                  ) : (
                    <FileText className="h-24 w-24 text-muted-foreground" />
                  )}
                  <p className="text-sm font-medium truncate max-w-full">{file?.name}</p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-3 -right-3 h-7 w-7 rounded-full"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="flex justify-center">
              <Button type="submit" size="lg" disabled={!file || isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Verify Certificate'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {isLoading && (
        <div className="flex justify-center items-center flex-col gap-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-semibold">Performing AI Analysis...</p>
          <p className="text-muted-foreground">This may take a moment. Please wait.</p>
        </div>
      )}

      {result && <VerificationResultDisplay result={result} />}

    </div>
  );
}
