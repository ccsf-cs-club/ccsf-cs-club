---
layout: ../../layouts/BlogPage.astro
title: "Field Notes from AWS: What Nobody Teaches You About Production AI"
date: "2025-08-05"
author: "John Chen, Jacky Choi"
description: "What we learned at AWS Builder Loft that nobody teaches in class—and why it matters for your next hackathon project."
tags: ["field-notes", "ai", "production", "career-development", "industry-insights"]
---

*What we learned at AWS Builder Loft that nobody teaches in class—and why it matters for your next hackathon project.*

Remember your last AI project? The one that worked perfectly on your laptop but crashed when your friends tried it? 

Billion-dollar companies have the same problem, just at scale. At AWS Builder Loft, CrewAI dropped a bombshell: after running 300 million agent workflows, **every single autonomous AI system failed in production**. Not 95%. Not 99%. All of them.

Here's why: AI systems don't break like normal code. Your ChatGPT wrapper might give a perfectly reasonable answer that's completely wrong for the situation. Traditional debugging can't catch this because the AI isn't broken—it's just being AI.

## The Career Opportunity

While you're learning to fine-tune models, companies are desperate for engineers who can answer: **"Why did my AI just give terrible advice?"**

Real example: An e-commerce bot told customers a $200 headset was "perfect for underwater photography." The bot correctly identified: headset = waterproof, customer mentioned photography. But missed: headphones ≠ cameras.

This is the observability problem. Normal code: trace logic step-by-step. AI agents: decisions based on probability clouds. When things break, you need the entire decision chain—not just what broke, but why the AI thought it was right.

**Your hackathon chatbot**: Input → Output. Done.

**Production AI agent**: Input → 12 API calls → 3 tools → 5 decision paths → Output. Any step can fail invisibly.

## The Missing Skill

Companies like Arize built entire platforms around one insight: **you can't fix what you can't see**. 

The solution has three parts:
1. **Trace everything** - Every decision, not just final answers
2. **Evaluate continuously** - Use AI to judge AI performance  
3. **Add guardrails** - Human checkpoints for critical decisions

This is what separates demos from production systems.

## Your Weekend Project: Observable Multi-Agent Systems

Instead of building another chatbot, let's build something that shows you understand production AI: **a fully observable multi-agent workflow**.

We'll use CrewAI (for multi-agent orchestration) + Phoenix (for observability). This combination shows you understand both agent coordination and production debugging.

### Setup

New to CrewAI? Start with their [quickstart](https://docs.crewai.com/getting-started/start-here). You need basic multi-agent workflow understanding.

### Step 1: Install and Run (10 minutes)

```bash
pip install arize-phoenix crewai
phoenix serve  # Opens localhost:6006
```

### Step 2: Create Observable Multi-Agent Workflow (30 minutes)

```python
from crewai import Agent, Task, Crew
from phoenix.trace import TracingContext

# Two agents: researcher finds info, writer makes it readable
researcher = Agent(
    role='Researcher',
    goal='Find accurate information', 
    backstory='Expert at finding reliable sources'
)

writer = Agent(
    role='Writer',
    goal='Write clear summaries',
    backstory='Skilled at technical writing' 
)

# Task that requires both agents
task = Task(
    description='Research and write about Python vs JavaScript',
    agent=researcher
)

# The magic: wrap everything in TracingContext
with TracingContext():
    crew = Crew(agents=[researcher, writer], tasks=[task])
    result = crew.kickoff()
```
### Step 3: Watch Your Agents Think (The "Aha" Moment)

Open **localhost:6006** while your crew runs. You'll see:
- Researcher agent making 6-8 decisions you never knew about
- Handoff to writer agent with context preservation  
- Each tool call, each reasoning step, each failure point

**The revelation**: Imagine debugging "why did my research agent ignore recent data?" without seeing this decision tree. Impossible.

### Projects That Impress Recruiters

Don't stop at the tutorial. Build workflows that show you understand production complexity:

**Research Pipeline**: Gatherer agent → fact-checker agent → summary writer agent  
**Code Review System**: Analyzer agent → test checker agent → improvement suggester agent  
**Content Factory**: Researcher → writer → editor with full decision tracing

Each handoff between agents is traceable. Each decision is debuggable. This is what production AI looks like.

## Resume Impact

**Don't write**: "Built AI chatbot using OpenAI API" (everyone has this)

**Do write**: 
- "Implemented observability for multi-agent workflows using Phoenix"
- "Built traceable AI systems with decision chain analysis" 
- "Developed production-ready agent evaluation pipelines"

These phrases tell recruiters: **"I understand how AI fails in production."**

## Why This Matters Now

**School teaches**: How AI works  
**Industry needs**: People who understand how AI fails

**Reality check**: Entry-level jobs won't require deep observability skills. But when they ask "How would you debug an AI system that works 95% of the time?"—you'll have an answer.

Companies spend $1M+ monthly just evaluating AI systems. Not wasteful—careful. Every invisible failure becomes a PR disaster. The engineer who can make AI reliable gets hired.

This isn't replacing your algorithms knowledge. It's adding **production thinking** to whatever you build.

## Your Next Steps

**This Weekend:**
1. Set up CrewAI + Phoenix (follow steps above)
2. Run 5 different multi-agent tasks
3. Study agent handoffs in Phoenix dashboard  
4. Find one surprising decision, document it
5. Add to GitHub with observable systems tag

**Next Month:**
1. Add observability to one class project  
2. Track costs (every API call adds up)
3. Add guardrails (detect low confidence responses)
4. Document your approach for portfolio

**Interview Prep:**
- "How would you debug an AI system that works 95% of the time?"
- "What's the difference between a system working and being reliable?"
- "Tell me about debugging something non-deterministic"

These questions are showing up because companies learned: **"works on my laptop" ≠ "works for customers"**

## Quick Links

**Essential**: [Phoenix quickstart](https://docs.arize.com/phoenix) (20 min to first trace) + [CrewAI quickstart](https://docs.crewai.com/getting-started/start-here) (multi-agent setup)

**Advanced**: OpenAI GPT OSS 120B on Bedrock (see below) + [LangSmith tutorials](https://www.langchain.com/langsmith) (production-grade)

**Extra**: [W&B AI course](https://wandb.ai/) (free with .edu email)

## Access OpenAI GPT OSS 120B on AWS Bedrock Today

Want to use cutting-edge models in your CrewAI workflows? AWS now provides access to OpenAI's GPT OSS 120B model through Bedrock:

**Quick Setup:**
1. **AWS Account**: Sign up for AWS if you don't have an account
2. **Request Access**: Go to AWS Bedrock console and request model access for OpenAI GPT OSS 120B
3. **Configure CrewAI**: Update your CrewAI agents to use Bedrock as the LLM provider

```python
import boto3
from crewai import Agent
from langchain_aws import BedrockLLM

# Configure Bedrock client
bedrock = boto3.client(
    service_name='bedrock-runtime',
    region_name='us-east-1'  # or your preferred region
)

# Use with CrewAI
llm = BedrockLLM(
    model_id="openai.gpt-oss-120b-v1",
    client=bedrock
)

researcher = Agent(
    role='Researcher',
    goal='Find accurate information',
    backstory='Expert researcher',
    llm=llm  # Use the 120B model
)
```

**Why This Matters:**
- **120B parameters** vs typical 7B-70B models
- **Better reasoning** for complex multi-agent workflows
- **Enterprise-grade** infrastructure through AWS
- **Cost predictability** vs OpenAI API pricing

This combination (CrewAI + Phoenix + 120B on Bedrock) gives you production-scale multi-agent systems with full observability.

**Bottom line**: The companies building agent observability today will define how AI gets built tomorrow. Understanding their challenges now = career advantage.

*Start simple: watch one agent trace. Even \"Hello world\" becomes fascinating when you see its hidden decision process.*

---

*Thanks to the AWS Builder Loft team, Arize, and CrewAI for sharing production insights with students. If you're in the Bay Area, their [event calendar](https://aws.amazon.com/startups/loft/sf-loft/) is worth following.*