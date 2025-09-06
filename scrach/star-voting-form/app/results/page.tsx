"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Star } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface ResultsData {
  firstRound: Array<{
    candidate_id: string
    total_score: number
    vote_count: number
    average_score: number
  }>
  finalists: string[]
  runoff: {
    finalist1: { candidate: string; wins: number }
    finalist2: { candidate: string; wins: number }
    ties: number
    winner: string
  } | null
  totals: {
    total_ballots: number
    total_stars: number
  }
}

const candidateNames: Record<string, string> = {
  "backend-systems": "Backend Systems & Architecture",
  "frontend-user-experience": "Frontend Development & User Experience",
  "devops-infrastructure": "DevOps & Cloud Infrastructure",
  "data-analytics": "Data Engineering & Analytics",
  "security-compliance": "Security & Compliance",
  "software-engineering-practices": "Software Engineering Practices",
}

const candidateColors: Record<string, string> = {
  "backend-systems": "text-blue-500",
  "frontend-user-experience": "text-purple-500",
  "devops-infrastructure": "text-green-500",
  "data-analytics": "text-orange-500",
  "security-compliance": "text-red-500",
  "software-engineering-practices": "text-teal-500",
}

export default function ResultsPage() {
  const [results, setResults] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/results")
      .then((res) => res.json())
      .then((data) => {
        setResults(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch results:", err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <p className="text-red-600">Failed to load results</p>
      </div>
    )
  }

  const maxScore = Math.max(...results.firstRound.map((r) => r.total_score))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">STAR Results</h1>
            <p className="text-gray-600">CS Club Guest Speaker Topic Selection</p>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">
              Back to Voting
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Organic Star Visualization with Masonry */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visual Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="columns-2 gap-1 space-y-1">
                  {results.firstRound.map((candidate) => {
                    const starsToShow = Math.round((candidate.total_score / maxScore) * 24) // More stars for organic feel
                    return (
                      <div key={candidate.candidate_id} className="break-inside-avoid mb-2">
                        <div className="flex flex-wrap gap-0.5 mb-1">
                          {Array.from({ length: starsToShow }).map((_, starIndex) => (
                            <Star
                              key={starIndex}
                              className={`w-3 h-3 ${candidateColors[candidate.candidate_id]} fill-current`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 font-medium">
                          {candidateNames[candidate.candidate_id]?.split(" ")[0] || candidate.candidate_id}
                        </p>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  (One star above is approximately {Math.round(maxScore / 24)} stars allocated by voters)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Detailed Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Winner Declaration */}
            {results.runoff && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <span className="text-lg font-semibold text-green-900">STAR winner:</span>
                    <span className="text-lg font-bold text-green-900">
                      {candidateNames[results.runoff.winner] || results.runoff.winner}
                    </span>
                  </div>

                  <div className="mb-4">
                    <span className="font-medium text-green-800">Finalists: </span>
                    <span className="text-green-700">
                      {candidateNames[results.finalists[0]] || results.finalists[0]} vs{" "}
                      {candidateNames[results.finalists[1]] || results.finalists[1]}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-green-800">
                    <div>
                      <span className="font-medium">Runoff result:</span>
                    </div>
                    <div className="ml-4 space-y-1">
                      <div>
                        <span className="inline-block w-4 h-4 bg-green-500 rounded-sm mr-2"></span>
                        {candidateNames[results.runoff.finalist1.candidate] || results.runoff.finalist1.candidate}:{" "}
                        {results.runoff.finalist1.wins} votes (
                        {((results.runoff.finalist1.wins / results.totals.total_ballots) * 100).toFixed(1)}%)
                      </div>
                      <div>
                        <span className="inline-block w-4 h-4 bg-purple-500 rounded-sm mr-2"></span>
                        {candidateNames[results.runoff.finalist2.candidate] || results.runoff.finalist2.candidate}:{" "}
                        {results.runoff.finalist2.wins} votes (
                        {((results.runoff.finalist2.wins / results.totals.total_ballots) * 100).toFixed(1)}%)
                      </div>
                      {results.runoff.ties > 0 && (
                        <div>
                          No preference: {results.runoff.ties} votes (
                          {((results.runoff.ties / results.totals.total_ballots) * 100).toFixed(1)}%)
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-2xl font-bold">Total stars allocated: {results.totals.total_stars}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-2xl font-bold">Total ballots: {results.totals.total_ballots}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* First Round Results */}
            <Card>
              <CardHeader>
                <CardTitle>First round:</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-1">Rank</th>
                        <th className="text-left py-2 px-2">Candidate</th>
                        <th className="text-right py-2 px-2">Stars</th>
                        <th className="text-right py-2 px-2">Percentage</th>
                        <th className="text-right py-2 px-2">Voters</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.firstRound.map((candidate, index) => (
                        <tr key={candidate.candidate_id} className="border-b border-gray-100">
                          <td className="py-2 px-1">
                            <div className="flex items-center gap-2">
                              <Star className={`w-4 h-4 ${candidateColors[candidate.candidate_id]} fill-current`} />
                              <span className="font-medium">#{index + 1}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2 font-medium">
                            {candidateNames[candidate.candidate_id] || candidate.candidate_id}
                          </td>
                          <td className="py-2 px-2 text-right font-mono">{candidate.total_score}</td>
                          <td className="py-2 px-2 text-right text-gray-600">
                            {((candidate.total_score / results.totals.total_stars) * 100).toFixed(1)}%
                          </td>
                          <td className="py-2 px-2 text-right text-gray-600">
                            {results.totals.total_ballots} (100.0%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Finalists Section */}
            {results.runoff && (
              <Card>
                <CardHeader>
                  <CardTitle>Finalists:</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Star className={`w-5 h-5 ${candidateColors[results.runoff.finalist1.candidate]} fill-current`} />
                    <span>
                      {candidateNames[results.runoff.finalist1.candidate] || results.runoff.finalist1.candidate}
                    </span>
                    {results.runoff.winner === results.runoff.finalist1.candidate && (
                      <Badge className="bg-green-100 text-green-800">✓ winner</Badge>
                    )}
                    <span className="text-gray-600">
                      preferred by {results.runoff.finalist1.wins} of {results.totals.total_ballots} voters
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className={`w-5 h-5 ${candidateColors[results.runoff.finalist2.candidate]} fill-current`} />
                    <span>
                      {candidateNames[results.runoff.finalist2.candidate] || results.runoff.finalist2.candidate}
                    </span>
                    {results.runoff.winner === results.runoff.finalist2.candidate && (
                      <Badge className="bg-green-100 text-green-800">✓ winner</Badge>
                    )}
                    <span className="text-gray-600">
                      preferred by {results.runoff.finalist2.wins} of {results.totals.total_ballots} voters
                    </span>
                  </div>
                  {results.runoff.ties > 0 && (
                    <div className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-gray-400" />
                      <span>No preference between the finalists: {results.runoff.ties}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
