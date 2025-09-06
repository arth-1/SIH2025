'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

const chartData = [
  { month: 'January', authentic: 186, forged: 80 },
  { month: 'February', authentic: 305, forged: 200 },
  { month: 'March', authentic: 237, forged: 120 },
  { month: 'April', authentic: 73, forged: 190 },
  { month: 'May', authentic: 209, forged: 130 },
  { month: 'June', authentic: 214, forged: 140 },
];

const chartConfig = {
  authentic: {
    label: 'Authentic',
    color: 'hsl(var(--chart-1))',
  },
  forged: {
    label: 'Forged',
    color: 'hsl(var(--destructive))',
  },
} satisfies ChartConfig;

export function VerificationsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification Trends</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
             <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="authentic" fill="var(--color-authentic)" radius={4} />
            <Bar dataKey="forged" fill="var(--color-forged)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
