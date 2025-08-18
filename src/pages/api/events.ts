import type { APIRoute } from 'astro';

export interface Badge {
  type: 'luma' | 'date' | 'community' | 'online' | 'in-person';
  label: string;
  color: 'red' | 'blue' | 'yellow' | 'green';
}

export interface CallToAction {
  luma_url?: string;
  custom_url?: string;
  custom_label?: string;
  type?: 'luma' | 'custom' | 'none';
}

export interface Event {
  title: string;
  description: string;
  badge: Badge;
  illustration: string;
  call_to_action?: CallToAction;
  track: 'build-together' | 'hackathons' | 'community' | 'all';
  category: 'competition' | 'meeting' | 'social' | 'workshop';
}

export interface FeaturedEvent {
  title: string;
  description: string;
  badges: Array<{
    type: 'in-person' | 'community' | 'online' | 'policy' | 'luma';
    label: string;
  }>;
  call_to_action?: CallToAction;
  dateRange: string;
  illustration: string;
}

export interface CampusEvent {
  title: string;
  badge: {
    type: 'in-person' | 'online' | 'hybrid';
    label: string;
  };
  icon: string;
  schedule: string;
  description: string;
}

export interface EventsData {
  featured: FeaturedEvent;
  upcoming: Event[];
  campus: CampusEvent[];
}

const eventsData: EventsData = {
  featured: {
    title: "Fall 2025 General Meetings",
    description: "Hello CCSF! Join us for our weekly general meetings this semester! We'll showcase summer projects, do icebreakers with new members, plan recruitment materials, and organize Unity Day. Two consecutive weeks to kick off an amazing semester!",
    badges: [
      { type: 'in-person' as const, label: 'In-Person' },
      { type: 'community' as const, label: 'Weekly' }
    ],
    call_to_action: {
      custom_url: "https://ccsf-cs.club/events/headline/",
      custom_label: "View Poster",
      type: 'custom' as const
    },
    dateRange: "Fridays — 2:00 - 5:00 PM",
    illustration: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop&auto=format&q=80"
  },

  upcoming: [
    {
      title: "AWS AI Hack Day Micro Conference",
      description: "Join us for an exciting day of learning, hacking, networking, and innovation! Get hands-on with AI tech alongside industry experts, showcase your projects, and compete for prizes.",
      badge: { type: 'luma' as const, label: 'Aug 22', color: 'red' as const },
      illustration: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop&auto=format&q=80",
      call_to_action: {
        luma_url: "https://lu.ma/aws-08-22-25?tk=CMpRMy",
        type: 'luma' as const
      },
      track: 'hackathons' as const,
      category: 'competition' as const
    },
    {
      title: "Hack Night at GitHub",
      description: "Come back for another fun and exciting Hack Night at GitHub! We're shooting for an unforgettable event for the developer community. Explore AI tech, lightning talks, and collaborative building!",
      badge: { type: 'luma' as const, label: 'Sep 17', color: 'red' as const },
      illustration: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400&h=300&fit=crop&auto=format&q=80",
      call_to_action: {
        luma_url: "https://lu.ma/hacknight-at-github-09-17-25?tk=z1qrnU",
        type: 'luma' as const
      },
      track: 'hackathons' as const,
      category: 'competition' as const
    },
    {
      title: "SF Civic Tech Weekly Hack Night",
      description: "Join a welcoming community of developers, designers, data geeks, and citizen activists using creative technology to solve civic and social problems. All skill levels welcome!",
      badge: { type: 'online' as const, label: 'Wednesdays', color: 'yellow' as const },
      illustration: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=300&fit=crop&auto=format&q=80",
      call_to_action: {
        custom_url: "https://www.meetup.com/sfcivictech/",
        custom_label: "Join Meetup",
        type: 'custom' as const
      },
      track: 'community' as const,
      category: 'meeting' as const
    },
    {
      title: "Forage and Draw",
      description: "Join a community of creatives to connect with nature! Learn about edible and medicinal plants in Golden Gate Park while improving your sketching skills. Beginner-friendly and donation-based.",
      badge: { type: 'in-person' as const, label: 'Sep 7', color: 'green' as const },
      illustration: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&auto=format&q=80",
      call_to_action: {
        luma_url: "https://lu.ma/ue3hbx79?tk=Egbn7F",
        type: 'luma' as const
      },
      track: 'community' as const,
      category: 'social' as const
    },
    {
      title: "Work on Our Site with Us",
      description: "Join our open-source development sessions! Contribute to the CS Club website, learn modern web development, and collaborate with fellow students via Discord. All skill levels welcome!",
      badge: { type: 'online' as const, label: 'Ongoing', color: 'yellow' as const },
      illustration: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop&auto=format&q=80",
      call_to_action: {
        custom_url: "https://github.com/ccsf-cs-club/ccsf-cs-club",
        custom_label: "View Repo",
        type: 'custom' as const
      },
      track: 'build-together' as const,
      category: 'workshop' as const
    },
    {
      title: "Alemany Farm Volunteering",
      description: "Join hands-on community farming! Help with weeding, planting, composting, and maintaining this urban farm. Perfect for connecting with nature and sustainable agriculture. All skill levels welcome!",
      badge: { type: 'in-person' as const, label: 'Saturdays', color: 'green' as const },
      illustration: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&auto=format&q=80",
      call_to_action: {
        custom_url: "https://alemanyfarm.org/get-involved/",
        custom_label: "Learn More",
        type: 'custom' as const
      },
      track: 'community' as const,
      category: 'social' as const
    }
  ],

  campus: [
    {
      title: "Unity Day",
      badge: { type: 'in-person' as const, label: 'Campus-Wide' },
      icon: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=80&h=80&fit=crop&auto=format&q=80",
      schedule: "Fall 2025",
      description: "Campus-wide event for students to have fun, learn about clubs and resource programs, and get to know one another!"
    },
    {
      title: "Student Success Welcome Days",
      badge: { type: 'in-person' as const, label: 'Aug 26-27' },
      icon: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=80&h=80&fit=crop&auto=format&q=80",
      schedule: "12-3pm at SSC Courtyard",
      description: "Games! Food! Music! Pick up your game card and visit the programs to receive a prize."
    }
  ]
};

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(eventsData), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
};