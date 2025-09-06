"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { StarRating } from "@/components/star-rating"
import { CheckCircleIcon, LoaderIcon, BarChart3 } from "lucide-react"
import Link from "next/link"

interface Candidate {
  id: string
  title: string
  description: string
  relevance: string
}

interface Vote {
  candidateId: string
  score: number
}

const candidates: Candidate[] = [
  {
    id: "backend-systems",
    title: "Backend Systems & Architecture",
    description: "Databases, servers, APIs, and system design - the foundation that powers everything",
    relevance: "Core infrastructure skills",
  },
  {
    id: "frontend-user-experience",
    title: "Frontend Development & User Experience",
    description: "Building interfaces people love - from React to design principles and user psychology",
    relevance: "Visible impact skills",
  },
  {
    id: "devops-infrastructure",
    title: "DevOps & Cloud Infrastructure",
    description: "Deployment, monitoring, scaling - how software gets from your laptop to millions of users",
    relevance: "High-demand operations",
  },
  {
    id: "data-analytics",
    title: "Data Engineering & Analytics",
    description: "Turning raw data into insights - databases, processing pipelines, and business intelligence",
    relevance: "Growing field opportunity",
  },
  {
    id: "security-compliance",
    title: "Security & Compliance",
    description: "Protecting systems and data - especially critical in banking, healthcare, and enterprise",
    relevance: "Essential everywhere",
  },
  {
    id: "software-engineering-practices",
    title: "Software Engineering Practices",
    description: "Testing, code quality, collaboration, and workflows that make teams successful",
    relevance: "Professional foundation",
  },
]

export default function STARVotingForm() {
  const [votes, setVotes] = useState<Vote[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [voterId] = useState(() => `voter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

  const handleScoreChange = (candidateId: string, score: number) => {
    setVotes((prev) => {
      const existing = prev.find((v) => v.candidateId === candidateId)
      if (existing) {
        return prev.map((v) => (v.candidateId === candidateId ? { ...v, score } : v))
      }
      return [...prev, { candidateId, score }]
    })
  }

  const getScore = (candidateId: string) => {
    return votes.find((v) => v.candidateId === candidateId)?.score ?? 0
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votes, voterId }),
      })

      if (!response.ok) throw new Error("Failed to save votes")

      setSubmitted(true)
    } catch (error) {
      console.error("Error submitting vote:", error)
      alert("Failed to submit vote. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const allCandidatesVoted = candidates.every((candidate) => getScore(candidate.id) > 0)

  if (submitted) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <CheckCircleIcon className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Thank You for Voting!</h1>
            <p className="text-muted-foreground mb-6">Your voice matters in shaping our guest speaker series.</p>
            <Link href="/results">
              <Button variant="outline" className="gap-2 bg-transparent">
                <BarChart3 className="w-4 h-4" />
                View Live Results
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-foreground mb-4">CS Club Guest Speaker Vote</h1>
            <p className="text-lg text-muted-foreground mb-2">Help us choose which topics matter most to you!</p>
            <p className="text-sm text-muted-foreground">Rate each topic from 1-5 stars using STAR voting</p>
          </div>
          <Link href="/results">
            <Button variant="ghost" size="sm" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Results
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>How STAR Voting Works</CardTitle>
            <CardDescription>
              Rate each topic 1-5 stars based on your interest. The top 2 highest-scored topics become finalists, and
              the finalist with the higher total score wins!
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-6 mb-8">
          {candidates.map((candidate) => (
            <Card key={candidate.id} className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{candidate.title}</CardTitle>
                    <CardDescription className="mb-2">{candidate.description}</CardDescription>
                    <Badge variant="outline" className="text-xs">
                      {candidate.relevance}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rate this topic:</span>
                  </div>
                  <StarRating
                    value={getScore(candidate.id)}
                    onChange={(score) => handleScoreChange(candidate.id, score)}
                    size="lg"
                  />
                  <Progress value={(getScore(candidate.id) / 5) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              Progress: {votes.length} of {candidates.length} topics rated
            </p>
            <Progress value={(votes.length / candidates.length) * 100} className="max-w-md mx-auto" />
          </div>

          <Button onClick={handleSubmit} disabled={!allCandidatesVoted || loading} size="lg" className="px-8">
            {loading ? (
              <>
                <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                Submitting Vote...
              </>
            ) : allCandidatesVoted ? (
              "Submit Your Vote"
            ) : (
              `Rate ${candidates.length - votes.length} More Topics`
            )}
          </Button>

          {allCandidatesVoted && !loading && (
            <p className="text-sm text-muted-foreground mt-2">
              ✨ Every voice counts! Your input helps shape our community.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
