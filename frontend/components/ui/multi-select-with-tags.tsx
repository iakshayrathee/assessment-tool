"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface Option {
  value: string
  label: string
}

interface MultiSelectWithTagsProps {
  label: string
  options: Option[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function MultiSelectWithTags({
  label,
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Select options...",
  className,
  disabled = false,
}: MultiSelectWithTagsProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  const handleSelect = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter((item) => item !== value))
    } else {
      onSelectionChange([...selectedValues, value])
    }
  }

  const handleRemoveTag = (value: string) => {
    onSelectionChange(selectedValues.filter((item) => item !== value))
  }

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder
    }
    if (selectedValues.length === 1) {
      const option = options.find((opt) => opt.value === selectedValues[0])
      return option?.label || selectedValues[0]
    }
    return `${selectedValues.length} items selected`
  }

  const filteredOptions = options.filter((option) =>
    option.label?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="truncate">{getDisplayText()}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="p-2">
            <Input
              placeholder="Search options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-64 overflow-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">
                  No options found.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2 p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-sm"
                    onClick={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selectedValues.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <span className="text-sm">{option.label}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Tags display */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedValues.map((value) => {
            const option = options.find((opt) => opt.value === value)
            return (
              <Badge
                key={value}
                variant="secondary"
                className="flex items-center gap-1 px-2 py-1"
              >
                <span className="text-xs">{option?.label || value}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(value)}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}