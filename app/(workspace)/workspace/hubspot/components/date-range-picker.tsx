'use client'

import * as React from 'react'
import { CalendarIcon } from 'lucide-react'
import { format, subDays, startOfMonth, startOfYear } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DateRange as DayPickerDateRange } from 'react-day-picker'
import type { DateRange, DatePreset } from '@/lib/hubspot-analytics-types'

interface DateRangePickerProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  className?: string
}

const presets: { value: DatePreset; label: string }[] = [
  { value: 'last30', label: 'Ultimos 30 dias' },
  { value: 'last90', label: 'Ultimos 90 dias' },
  { value: 'thisMonth', label: 'Este mes' },
  { value: 'thisYear', label: 'Este año' },
  { value: 'all', label: 'Todo el historial' },
]

function getDateRangeFromPreset(preset: DatePreset): DateRange {
  const today = new Date()

  switch (preset) {
    case 'last30':
      return { from: subDays(today, 30), to: today }
    case 'last90':
      return { from: subDays(today, 90), to: today }
    case 'thisMonth':
      return { from: startOfMonth(today), to: today }
    case 'thisYear':
      return { from: startOfYear(today), to: today }
    case 'all':
    default:
      return { from: undefined, to: undefined }
  }
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [selectedPreset, setSelectedPreset] = React.useState<DatePreset>('all')

  const handlePresetChange = (preset: DatePreset) => {
    setSelectedPreset(preset)
    onDateRangeChange(getDateRangeFromPreset(preset))
  }

  const handleCalendarSelect = (range: DayPickerDateRange | undefined) => {
    if (range?.from) {
      setSelectedPreset('all') // Clear preset when manually selecting
      onDateRangeChange({ from: range.from, to: range.to })
    }
  }

  const formatDateRange = () => {
    if (!dateRange.from && !dateRange.to) {
      return 'Todo el historial'
    }
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'dd MMM', { locale: es })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: es })}`
    }
    if (dateRange.from) {
      return `Desde ${format(dateRange.from, 'dd MMM yyyy', { locale: es })}`
    }
    return 'Seleccionar fechas'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
          Periodo
        </span>
        <Select value={selectedPreset} onValueChange={(v) => handlePresetChange(v as DatePreset)}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {presets.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
          Rango
        </span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[220px] h-9 justify-start text-left font-normal',
                !dateRange.from && !dateRange.to && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
              locale={es}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
