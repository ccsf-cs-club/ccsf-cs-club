---
title: "Designing Distributed Systems: Notes from Gary Ow's Talk"
date: 2024-09-18
location: "CCSF Room 301"
description: "Learn about common architectures and how they factor into product management and organizational design from industry veteran Gary Ow's guest speaker session."
featured: true
category: "speaker-spotlight"
author: "CS Club"
tags: ["distributed-systems", "architecture", "guest-speaker", "industry", "scalability"]
status: "completed"
learning_outcomes: [
  "Understanding common distributed system patterns",
  "How technical architecture influences team organization",
  "Practical considerations for scaling systems and teams",
  "Real-world examples from industry experience"
]
related_links: [
  {
    "title": "Gary Ow's LinkedIn",
    "url": "https://linkedin.com/in/garyow"
  },
  {
    "title": "Microservices Architecture Guide",
    "url": "https://microservices.io/"
  }
]
---

## About the Speaker

Gary Ow is a Senior Principal Engineer with over 15 years of experience building scalable systems at companies ranging from startups to Fortune 500 enterprises. He's been through multiple scaling journeys, from single-server applications to distributed systems handling millions of requests per second.

## Key Insights from the Talk

### 1. "Architecture is Organizational Design in Disguise"

Gary's opening statement set the tone: **"Every technical decision you make is ultimately an organizational decision."** 

He illustrated this with Conway's Law: organizations design systems that mirror their communication structures. But the reverse is also true—your system architecture will influence how your teams communicate and collaborate.

**Real Example**: At his previous company, they initially built a monolithic application with a single development team. As the team grew to 15 people, deployments became a nightmare—too many merge conflicts, too much coordination overhead. The technical decision to break into microservices naturally led to smaller, autonomous teams.

### 2. The Three Pillars of Distributed Systems

Gary broke down distributed systems into three fundamental concerns:

#### Consistency
- **The Challenge**: Keeping data synchronized across multiple nodes
- **The Reality**: Perfect consistency is often impossible and always expensive
- **The Strategy**: Choose your consistency model based on business requirements

> *"Don't aim for ACID everywhere. Most business problems can tolerate eventual consistency if you design the user experience properly."*

#### Availability  
- **The Challenge**: Ensuring the system remains operational despite failures
- **The Reality**: Everything fails, all the time
- **The Strategy**: Design for degraded functionality, not perfect uptime

#### Partition Tolerance
- **The Challenge**: Operating when network connectivity is unreliable
- **The Reality**: Network partitions will happen
- **The Strategy**: Plan for split-brain scenarios from day one

### 3. Common Architecture Patterns (And When to Use Them)

#### Pattern 1: Event-Driven Architecture
**When to use**: When you need loose coupling and async processing
**When to avoid**: When you need immediate consistency or simple request-response flows

Gary showed how his team used event sourcing for a financial application:
```
User Action → Event Store → Multiple Service Handlers
```
This allowed them to rebuild any service's state from the event log and add new services without touching existing code.

#### Pattern 2: CQRS (Command Query Responsibility Segregation)
**When to use**: When read and write patterns are very different
**When to avoid**: For simple CRUD applications

> *"CQRS isn't about being clever—it's about acknowledging that reading data and writing data are fundamentally different operations with different optimization needs."*

#### Pattern 3: Saga Pattern
**When to use**: For distributed transactions across services
**When to avoid**: When you can use a traditional database transaction

Gary emphasized: **"Sagas are complex. Only use them when the business value clearly justifies the operational overhead."**

## The Scaling Journey: A Practical Timeline

Gary walked us through a typical scaling journey:

### Phase 1: Monolith (0-10 users/second)
- Single server, single database
- Focus: **Speed of development**
- Team size: 1-5 developers

### Phase 2: Scaled Monolith (10-100 users/second)  
- Load balancer + multiple app servers
- Read replicas for database
- Focus: **Operational simplicity**
- Team size: 5-15 developers

### Phase 3: Service-Oriented (100-1000 users/second)
- Break into services by business domain
- API gateway for external traffic
- Focus: **Team autonomy**
- Team size: 15-50 developers

### Phase 4: Distributed Systems (1000+ users/second)
- Microservices with proper service mesh
- Event-driven communication
- Focus: **Independent scaling**
- Team size: 50+ developers

**Key Insight**: *"Don't jump ahead. Each phase introduces complexity that's only justified by the problems of the previous phase."*

## Organizational Implications

### Team Structure Follows Architecture
- **Monolith**: Single team with shared codebase
- **Services**: Teams aligned with service boundaries  
- **Microservices**: Autonomous teams with end-to-end ownership

### Communication Patterns Change
- **Monolith**: Synchronous, in-person coordination
- **Services**: Well-defined APIs and contracts
- **Microservices**: Async communication, event-driven coordination

### Failure Modes Evolve
- **Monolith**: Single point of failure, but easy to debug
- **Services**: Cascading failures, network partitions
- **Microservices**: Complex distributed failure scenarios

## Practical Advice for Students

### 1. Start Simple
> *"Every successful distributed system I've seen started as a monolith. Don't over-engineer from day one."*

### 2. Understand the Business Context
- What are the actual scalability requirements?
- What's the cost of downtime?
- How complex can your operations team handle?

### 3. Measure Everything
Gary's team uses this monitoring hierarchy:
1. **Business metrics**: Revenue, user engagement
2. **Application metrics**: Response time, error rates  
3. **Infrastructure metrics**: CPU, memory, network

### 4. Design for Observability
> *"In a distributed system, debugging is archaeology. You need good artifacts to understand what happened."*

## Tools and Technologies Mentioned

### Essential Infrastructure
- **Service Mesh**: Istio or Linkerd for service-to-service communication
- **Message Queues**: Apache Kafka for event streaming
- **Monitoring**: Prometheus + Grafana
- **Tracing**: Jaeger for distributed tracing

### Development Practices
- **API-First Design**: Define contracts before implementation
- **Circuit Breakers**: Prevent cascading failures
- **Bulkhead Pattern**: Isolate resource pools

## Q&A Highlights

**Q**: "When should a startup consider microservices?"
**A**: *"When your engineering team can't deploy without coordinating with other teams. Usually around 15-20 developers."*

**Q**: "How do you handle distributed transactions?"
**A**: *"First, try to design them away. If you can't, use the Saga pattern, but understand that you're trading consistency for availability."*

**Q**: "What's the biggest mistake you see with distributed systems?"
**A**: *"Premature distribution. Students often build microservices for a class project that could be a single Python script."*

## Final Thoughts

Gary's talk reinforced that distributed systems aren't just a technical challenge—they're a holistic approach to building software that includes team organization, operational practices, and business alignment.

His parting advice: **"Focus on solving real problems, not building impressive architectures. The best system is the simplest one that meets your actual requirements."**

## Resources for Further Learning

Gary recommended these resources for students interested in distributed systems:
- "Designing Data-Intensive Applications" by Martin Kleppmann
- "Building Microservices" by Sam Newman  
- The AWS Architecture Center for real-world examples
- Practice with Docker and Kubernetes, but understand the problems they solve first

The session was recorded and will be available on our club's YouTube channel. Gary has also agreed to mentor interested students on distributed systems projects—reach out to the club officers if you're interested!