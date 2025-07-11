"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Legend,
  Line, 
  LineChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  Pie,
  PieChart,
  Cell,
  Funnel,
  FunnelChart,
  LabelList
} from "recharts";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type ChartData = {
  name: string;
  value?: number;
  fill?: string;
  [key: string]: string | number | undefined;
};

export type ChartSeries = {
  name: string;
  key: string;
  color?: string;
};

type FormatterType = 'currency' | 'number' | 'percent' | 'default';

interface MetricsChartProps {
  title: string;
  description?: string;
  data: ChartData[];
  series: ChartSeries[];
  chartType?: "line" | "area" | "bar" | "pie" | "funnel";
  showLegend?: boolean;
  showGrid?: boolean;
  height?: number;
  formatterType?: FormatterType;
}

// FOMO Brand color palette for charts
const FOMO_COLORS = [
  "#FCCD12", // Signal Yellow
  "#f97316", // Orange 500
  "#0077B6", // Brilliant Blue
  "#310629", // Plum
  "#64748b", // Slate for additional data
  "#94a3b8", // Light slate
];

// FOMO funnel colors (gradient from Signal Yellow to Plum)
const FOMO_FUNNEL_COLORS = [
  "#FCCD12", // Signal Yellow
  "#f59e0b", // Amber 500
  "#f97316", // Orange 500
  "#0077B6", // Brilliant Blue
  "#1e3a8a", // Blue 800
  "#310629", // Plum
];

// Helper function to get the appropriate formatter based on type
const getFormatter = (type: FormatterType) => {
  switch (type) {
    case 'currency':
      return (value: number) => formatCurrency(value);
    case 'number':
      return (value: number) => formatNumber(value);
    case 'percent':
      return (value: number | string) => {
        const num = Number(value);
        return isNaN(num) ? `${value}` : formatPercent(num);
      }
    default:
      return (value: number | string) => `${value}`;
  }
};

// Custom Tooltip for Pie/Funnel Chart 
const CustomTooltipContent = ({ active, payload, formatter }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = formatter(data.value);
    // Show percentage relative to the first stage for funnel
    const initialValue = payload[0]?.payload?.payload?.[0]?.value ?? data.value; // Attempt to get first value
    const percentage = initialValue > 0 ? ((data.value / initialValue) * 100).toFixed(1) : 0;
    
    return (
      <div className="bg-background border shadow-sm rounded-lg p-2 text-sm">
         <p className="font-semibold">{`${data.name}: ${value}`}</p>
         {payload[0]?.chartType === 'funnel' && <p className="text-xs text-muted-foreground">({percentage}%)</p>} 
         {/* Pie chart tooltip shows percentage directly */} 
         {payload[0]?.chartType === 'pie' && <p className="text-xs text-muted-foreground">({data.value}%)</p>} 
      </div>
    );
  }
  return null;
};

export function MetricsChart({
  title,
  description,
  data,
  series,
  chartType = "line",
  showLegend = true,
  showGrid = true,
  height = 350,
  formatterType = 'default',
}: MetricsChartProps) {
  // Create the formatter function based on the type
  const yFormatter = getFormatter(formatterType);
  const tooltipFormatter = getFormatter(formatterType === 'percent' ? 'number' : formatterType); // Format tooltip value appropriately

  // Assign chartType to payload for tooltip customization
  const chartDataWithContext = data.map(item => ({ ...item, chartType }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={cn(chartType === 'funnel' && "pt-6")}>
        <ResponsiveContainer width="100%" height={height}>
          {chartType === "line" ? (
            <LineChart data={chartDataWithContext}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
              <XAxis 
                dataKey="name" 
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis 
                tickFormatter={yFormatter}
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <Tooltip 
                formatter={(value) => [yFormatter(Number(value)), ""]}
                labelStyle={{ fontSize: 12 }}
              />
              {showLegend && <Legend />}
              {series.map((serie) => (
                <Line
                  key={serie.key}
                  type="monotone"
                  dataKey={serie.key}
                  name={serie.name}
                  stroke={serie.color ?? FOMO_COLORS[0]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          ) : chartType === "area" ? (
            <AreaChart data={chartDataWithContext}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
              <XAxis 
                dataKey="name" 
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis 
                tickFormatter={yFormatter}
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <Tooltip 
                formatter={(value) => [yFormatter(Number(value)), ""]}
                labelStyle={{ fontSize: 12 }}
              />
              {showLegend && <Legend />}
              {series.map((serie) => (
                <Area
                  key={serie.key}
                  type="monotone"
                  dataKey={serie.key}
                  name={serie.name}
                  stroke={serie.color ?? FOMO_COLORS[0]}
                  fill={serie.color ?? FOMO_COLORS[0]}
                  fillOpacity={0.1}
                />
              ))}
            </AreaChart>
          ) : chartType === "bar" ? (
            <BarChart data={chartDataWithContext}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
              <XAxis 
                dataKey="name" 
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis 
                tickFormatter={yFormatter}
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <Tooltip 
                formatter={(value) => [yFormatter(Number(value)), ""]}
                labelStyle={{ fontSize: 12 }}
              />
              {showLegend && <Legend />}
              {series.map((serie) => (
                <Bar
                  key={serie.key}
                  dataKey={serie.key}
                  name={serie.name}
                  fill={serie.color ?? FOMO_COLORS[0]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          ) : chartType === "pie" ? (
             <PieChart>
               <Tooltip content={<CustomTooltipContent formatter={tooltipFormatter} />} />
               {showLegend && <Legend 
                 iconType="circle"
                 formatter={(value, entry) => (
                   <span className="text-sm text-muted-foreground">
                     <span style={{ color: entry.color }}>{value}</span> {entry.payload?.value}%
                   </span>
                 )}
               />}
              <Pie
                data={chartDataWithContext}
                dataKey={series[0]?.key ?? "value"}
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {chartDataWithContext.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill ?? "#8884d8"} />
                ))}
              </Pie>
            </PieChart>
          ) : chartType === "funnel" ? ( // Funnel Chart Implementation
            <FunnelChart > 
              <Tooltip content={<CustomTooltipContent formatter={tooltipFormatter} />} />
              <Funnel
                dataKey="value" 
                data={chartDataWithContext}
                isAnimationActive
              >
                 <LabelList 
                    position="center"
                    stroke="none" 
                    dataKey="name" 
                    className="fill-card-foreground font-medium"
                    formatter={(name: string, entry: any) => {
                      if (entry && typeof entry.value !== 'undefined') {
                        return `${name}: ${tooltipFormatter(entry.value)}`; 
                      } 
                      return name; // Fallback to just the name
                    }}
                 />
                 {chartDataWithContext.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={FOMO_FUNNEL_COLORS[index % FOMO_FUNNEL_COLORS.length]} />
                 ))} 
              </Funnel>
            </FunnelChart>
          ) : (<></>)}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
} 