import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { votes, voterId } = await request.json()

    // Insert or update votes for this voter
    for (const vote of votes) {
      await sql`
        INSERT INTO votes (voter_id, candidate_id, score)
        VALUES (${voterId}, ${vote.candidateId}, ${vote.score})
        ON CONFLICT (voter_id, candidate_id)
        DO UPDATE SET score = ${vote.score}, created_at = NOW()
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving votes:", error)
    return NextResponse.json({ error: "Failed to save votes" }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get vote totals for each candidate
    const results = await sql`
      SELECT 
        candidate_id,
        SUM(score) as total_score,
        COUNT(*) as vote_count,
        AVG(score::float) as average_score
      FROM votes 
      WHERE score > 0
      GROUP BY candidate_id
      ORDER BY total_score DESC
    `

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error fetching results:", error)
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 })
  }
}
