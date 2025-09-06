"use client"

import { useState } from "react"
import { StarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  maxStars?: number
  size?: "sm" | "md" | "lg"
}

export function StarRating({ value, onChange, maxStars = 5, size = "md" }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0)

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1
        const isActive = starValue <= (hoverValue || value)

        return (
          <button
            key={i}
            type="button"
            className={cn(
              "transition-all duration-200 hover:scale-110",
              isActive ? "text-yellow-400" : "text-gray-300 hover:text-yellow-200",
            )}
            onMouseEnter={() => setHoverValue(starValue)}
            onMouseLeave={() => setHoverValue(0)}
            onClick={() => onChange(starValue)}
          >
            <StarIcon className={cn(sizeClasses[size], isActive ? "fill-current" : "")} />
          </button>
        )
      })}
      <span className="ml-2 text-sm text-muted-foreground">{value > 0 ? `${value}/5` : "Not rated"}</span>
    </div>
  )
}
