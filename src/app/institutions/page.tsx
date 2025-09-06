import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InstitutionsPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight">
        Institutions
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will allow management of participating institutions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
