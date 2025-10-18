"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ProfessionalDatePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  fromYear?: number;
  toYear?: number;
}

export const ProfessionalDatePicker = ({ 
  label, 
  value, 
  onChange, 
  error, 
  required = false,
  placeholder = "Select date",
  disabled = false,
  className = "",
  fromYear = 1900,
  toYear = 2030
}: ProfessionalDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [yearInput, setYearInput] = useState(value ? value.getFullYear().toString() : "");

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const year = e.target.value;
    setYearInput(year);
    
    if (year.length === 4 && !isNaN(Number(year))) {
      const newDate = new Date(currentMonth);
      newDate.setFullYear(Number(year));
      setCurrentMonth(newDate);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange(null);
    setYearInput("");
    setIsOpen(false);
  };

  const displayValue = value ? format(value, "dd/MM/yyyy") : "";

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label} {required && "*"}</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              error && "border-red-500"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayValue || placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            <div className="flex items-center gap-2">
              <Label htmlFor="year-input" className="text-sm font-medium">
                Year:
              </Label>
              <Input
                id="year-input"
                type="number"
                placeholder="YYYY"
                value={yearInput}
                onChange={handleYearChange}
                className="w-20 h-8 text-sm"
                min={fromYear}
                max={toYear}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 px-2 text-xs"
              >
                Clear
              </Button>
            </div>
          </div>
          <Calendar
            mode="single"
            selected={value || undefined}
            onSelect={handleDateSelect}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            initialFocus
            fromYear={fromYear}
            toYear={toYear}
            captionLayout="dropdown"
            className="rounded-md"
          />
        </PopoverContent>
      </Popover>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};