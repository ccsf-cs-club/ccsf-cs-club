---
layout: ../../layouts/BlogPage.astro
title: "Field Notes from AWS: What Nobody Teaches You About Production AI"
date: "2025-08-05"
author: "John Chen, Jacky Choi"
description: "What we learned at AWS Builder Loft that nobody teaches in class—and why it matters for your next hackathon project."
tags: ["field-notes", "ai", "production", "career-development", "industry-insights"]
---

*What we learned at AWS Builder Loft that nobody teaches in class—and why it matters for your next hackathon project.*

Remember your last AI project? The one that worked perfectly on your laptop but crashed when your friends tried it? That's the exact problem billion-dollar companies are facing, just at a different scale.

## The Reality Check

At AWS Builder Loft last week, CrewAI revealed an uncomfortable truth: after running 300 million agent workflows, they found that every fully autonomous AI system failed in production. Not 90%. Not 99%. All of them.

This isn't about bad code or weak models. AI systems fail in ways you can't predict. Your ChatGPT wrapper might give a perfectly reasonable answer that's completely wrong for the context, and traditional debugging won't catch it.

## What This Means for Your Projects (And Your Resume)

While we learn to fine-tune models and optimize prompts, companies desperately need engineers who can answer one question: "Why did my AI agent just give completely wrong advice?"

Here's a real example: An e-commerce chatbot confidently told customers that a $200 headset was "perfect for underwater photography." The bot wasn't hallucinating—it correctly identified that the headset was waterproof and that the customer mentioned photography. But it missed the context that headphones can't take pictures.

This is called the observability problem. Unlike traditional code where you can trace through logic step-by-step, AI agents make decisions based on probability. When something goes wrong, you need to see the entire decision chain—not just what went wrong, but why the AI thought it was right.

Compare these approaches:

- **Your hackathon chatbot**: Returns an answer. Done.
- **Production AI agent**: Makes 12+ API calls, consults 3 tools, evaluates 5 possible paths, then returns an answer. Any step could fail.

## The Skill Nobody's Teaching (That Everyone Needs)

Companies like Arize are building entire platforms around one idea: you can't fix what you can't see. Their approach is simple but powerful:

1. **Trace everything** - Not just the final output, but every decision point
2. **Evaluate continuously** - Use AI to evaluate AI
3. **Build in guardrails** - Human checkpoints for critical decisions

## Try This Weekend: Your First Observable AI Project

You can start building observable systems now. This adds to your data structures knowledge—a skill that makes existing projects stand out.

Here's how to upgrade your next project:

### Prerequisites

If you've never built an AI agent, start with [LangChain's quickstart](https://python.langchain.com/docs/get_started/quickstart).

### The Upgrade (2 hours)

1. **Install Phoenix** (Arize's free tool):
   
   ```bash
   pip install arize-phoenix
   phoenix serve
   ```
2. **Add tracking to your existing project**:
   
   ```python
   from phoenix.trace import TracingContext
   
   with TracingContext():
       # Your existing agent code
       response = agent.chat("Your query")
   ```
3. **Open localhost:6006** and watch your agent's decision tree in real-time
4. Ask your agent something ambiguous like "What's the best programming language?" You'll see 6-8 internal decisions you never knew about.

### What to Build

Don't just make another chatbot. Build something that shows you understand production challenges:

- A study buddy that traces why it recommended certain resources

## What to Put on Your Resume

Skip "Built AI chatbot using OpenAI API." Everyone has that. Instead:

- "Implemented observability for multi-step agent workflows using Phoenix"
- "Reduced agent failure rate by X% through traced decision analysis"
- "Built evaluation pipeline for autonomous agent reliability"

These phrases signal you understand the difference between demos and production.

## Why This Actually Matters for New Grads

Your professors teach you how AI works. Industry needs people who understand how AI fails. That gap holds the most interesting problems.

**Reality check**: Most entry-level positions won't require deep observability knowledge. But understanding production thinking gives you an edge when companies ask debugging questions that go beyond fix the prompt.

When companies spend $1M+ monthly evaluating their AI systems, they're not being wasteful—they're being careful. Every uncaught edge case threatens a PR disaster. The engineer who can reduce that spend while maintaining reliability gets hired.

This isn't instead of learning algorithms—it's adding production thinking to what you're building.

## Your Action Plan

**This Weekend (2-3 hours):**

1. Take an existing AI project (or build simple "hello world")
2. Add Phoenix tracing (20 minutes)
3. Run 10 prompts and study traces
4. Find one surprising decision
5. Document findings in README

**Next Month:**

1. Add observability to one class project
2. Track costs
3. Add one guardrail (detect low confidence)
4. Document your approach

**For Interviews:**
Be ready to discuss:

- "Tell me about a time you debugged something non-deterministic"
- "How would you test an AI system?"
- "What's the difference between a system working and a system being reliable?"

These questions appear in new grad interviews because companies learned "AI works on my laptop" ≠ "AI works for customers."

## Resources to Actually Use

- **Start Here**: [Phoenix quickstart](https://docs.arize.com/phoenix) - 20 minutes to your first trace
- **Level Up**: [LangSmith tutorials](https://www.langchain.com/langsmith) - Production-grade tracing
- **Deep Dive**: [Weights & Biases AI course](https://wandb.ai/) - Free with student email
- **Context**: [CrewAI Documentation](https://docs.crewai.com/) - See real-world agent orchestration patterns

The companies investing in agent observability today will define how AI gets built tomorrow.

*The best way to learn observability is watching your first agent trace. Even "Hello world" becomes fascinating when you see its decision process.*

---

*Thanks to the AWS Builder Loft team, Arize, and CrewAI for sharing production insights with students. If you're in the Bay Area, their [event calendar](https://aws.amazon.com/startups/loft/sf-loft/) is worth following.*