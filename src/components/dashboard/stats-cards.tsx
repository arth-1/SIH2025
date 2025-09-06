import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock, Building } from 'lucide-react';

const stats = [
  {
    title: 'Total Verifications',
    value: '1,234',
    icon: CheckCircle2,
    color: 'text-green-500',
  },
  {
    title: 'Forged Certificates',
    value: '56',
    icon: XCircle,
    color: 'text-red-500',
  },
  {
    title: 'Pending Reviews',
    value: '12',
    icon: Clock,
    color: 'text-yellow-500',
  },
  {
    title: 'Verified Institutions',
    value: '89',
    icon: Building,
    color: 'text-blue-500',
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
