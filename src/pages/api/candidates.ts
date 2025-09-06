import type { APIRoute } from 'astro';

export const prerender = false;

// Static candidate data for the CS club voting
const candidates = [
  {
    id: 'web-development',
    name: 'Web Development',
    description: 'Learn modern web technologies like React, Vue, and TypeScript for building responsive websites and web applications'
  },
  {
    id: 'artificial-intelligence',
    name: 'Artificial Intelligence',
    description: 'Explore machine learning, neural networks, and AI algorithms to build intelligent systems and applications'
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    description: 'Master security principles, ethical hacking, and defense strategies to protect digital systems and data'
  },
  {
    id: 'data-science',
    name: 'Data Science',
    description: 'Analyze big data, create visualizations, and extract insights using Python, R, and statistical methods'
  },
  {
    id: 'mobile-development',
    name: 'Mobile Development',
    description: 'Build iOS and Android apps using native frameworks or cross-platform solutions like React Native'
  },
  {
    id: 'game-development',
    name: 'Game Development',
    description: 'Create engaging games using engines like Unity or Unreal, covering graphics, physics, and gameplay mechanics'
  }
];

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const response = {
      success: true,
      candidates: candidates,
      total: candidates.length,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour since candidates are static
      }
    });

  } catch (error: any) {
    console.error('Candidates API error:', {
      error: error.message,
      stack: error.stack
    });

    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error. Please try again later.',
      candidates: candidates // Fallback to static data
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};