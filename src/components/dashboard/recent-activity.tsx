import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const activities = [
  {
    id: 'CERT-846380',
    status: 'Authentic',
    date: '2024-05-23',
    verifier: 'Global Corp',
  },
  {
    id: 'CERT-912345',
    status: 'Forged',
    date: '2024-05-22',
    verifier: 'Innovate Inc.',
  },
  {
    id: 'CERT-583291',
    status: 'Pending',
    date: '2024-05-22',
    verifier: 'State University',
  },
  {
    id: 'CERT-109283',
    status: 'Authentic',
    date: '2024-05-21',
    verifier: 'Tech Solutions',
  },
  {
    id: 'CERT-784512',
    status: 'Authentic',
    date: '2024-05-20',
    verifier: 'Govt. Scholarship Dept.',
  },
];

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          A log of the most recent certificate verifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Certificate ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Verified By</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell className="font-medium">{activity.id}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      activity.status === 'Authentic'
                        ? 'default'
                        : activity.status === 'Forged'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className={
                        activity.status === 'Authentic' ? 'bg-green-500/20 text-green-700 border-green-500/30' : 
                        activity.status === 'Forged' ? 'bg-red-500/20 text-red-700 border-red-500/30' :
                        'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
                    }
                  >
                    {activity.status}
                  </Badge>
                </TableCell>
                <TableCell>{activity.date}</TableCell>
                <TableCell>{activity.verifier}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Generate Report</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
