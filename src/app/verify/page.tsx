import { VerifyCertificateForm } from '@/components/verify-certificate-form';

export default function VerifyPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Verify Certificate
        </h1>
        <p className="text-muted-foreground">
          Upload a certificate image to check its authenticity using AI-powered analysis.
        </p>
      </div>
      <VerifyCertificateForm />
    </div>
  );
}
