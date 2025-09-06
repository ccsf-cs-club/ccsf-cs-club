import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Get all votes with detailed breakdown
    const allVotes = await sql`
      SELECT 
        voter_id,
        candidate_id,
        score
      FROM votes 
      WHERE score > 0
      ORDER BY voter_id, candidate_id
    `

    // Get vote totals for first round (scoring)
    const firstRoundResults = await sql`
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

    // Get total ballots and stars
    const totals = await sql`
      SELECT 
        COUNT(DISTINCT voter_id) as total_ballots,
        SUM(score) as total_stars
      FROM votes 
      WHERE score > 0
    `

    // Calculate STAR voting results
    const candidates = firstRoundResults.map((r) => r.candidate_id)
    const finalists = candidates.slice(0, 2) // Top 2 from first round

    // For runoff, count how many voters preferred each finalist
    let runoffResults = null
    if (finalists.length === 2) {
      const runoffData = await sql`
        SELECT 
          voter_id,
          candidate_id,
          score
        FROM votes 
        WHERE candidate_id IN (${finalists[0]}, ${finalists[1]})
        AND score > 0
        ORDER BY voter_id
      `

      // Group by voter and determine preference
      const voterPreferences = new Map()
      runoffData.forEach((vote) => {
        if (!voterPreferences.has(vote.voter_id)) {
          voterPreferences.set(vote.voter_id, {})
        }
        voterPreferences.get(vote.voter_id)[vote.candidate_id] = vote.score
      })

      let finalist1Wins = 0
      let finalist2Wins = 0
      let ties = 0

      voterPreferences.forEach((scores) => {
        const score1 = scores[finalists[0]] || 0
        const score2 = scores[finalists[1]] || 0

        if (score1 > score2) finalist1Wins++
        else if (score2 > score1) finalist2Wins++
        else ties++
      })

      runoffResults = {
        finalist1: { candidate: finalists[0], wins: finalist1Wins },
        finalist2: { candidate: finalists[1], wins: finalist2Wins },
        ties,
        winner: finalist1Wins > finalist2Wins ? finalists[0] : finalists[1],
      }
    }

    return NextResponse.json({
      firstRound: firstRoundResults,
      finalists,
      runoff: runoffResults,
      totals: totals[0],
      allVotes,
    })
  } catch (error) {
    console.error("Error fetching results:", error)
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 })
  }
}
