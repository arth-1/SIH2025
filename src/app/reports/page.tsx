import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight text-white">
        Reports
      </h1>
      <Card className="bg-oxford_blue/90 backdrop-blur-sm border-gray-600">
        <CardHeader>
          <CardTitle className="text-white">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300">
            This section will provide detailed reports and analytics on verification activities.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
