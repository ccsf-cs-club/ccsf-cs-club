import { Star } from "lucide-react"

interface StarDisplayProps {
  score: number
  maxScore: number
  size?: "sm" | "md" | "lg"
}

export function StarDisplay({ score, maxScore, size = "md" }: StarDisplayProps) {
  const percentage = (score / maxScore) * 100
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= Math.round((score / maxScore) * 5)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
      <span className="ml-2 text-sm text-muted-foreground">
        {score} stars ({percentage.toFixed(1)}%)
      </span>
    </div>
  )
}
