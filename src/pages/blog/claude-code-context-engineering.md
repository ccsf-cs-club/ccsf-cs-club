---
layout: ../../layouts/BlogPage.astro
title: "AI Coding Tools Are Changing CS Careers: What Students Need to Know"
date: "2025-08-05"
author: "CS Club Member"
description: "Field notes from an industry webinar on how AI coding assistants are reshaping software development"
---

*Field notes from a BAML x HumanLayer industry webinar that got unexpectedly deep*

## The Setup

Last week I attended a webinar on AI-assisted development hosted by BAML and HumanLayer—two companies building tools that help developers work with AI coding assistants. What started as a technical session on "how Claude Code works" turned into a wake-up call about how these tools are reshaping software development careers.

The session brought together working developers who've been using Claude Code and similar tools in real projects. Their insights went way beyond "here's how to write better prompts"—they talked about fundamental changes happening in how we work, what skills matter, and what employers are looking for.

## The Reality Check

AI coding tools like Claude Code aren't just making development faster—they're fundamentally changing what it means to be a software engineer. For CS students, this shift is happening right as you're learning the foundations of the field.

## What Most People Are Doing Wrong

**The common approach:** Write a huge prompt describing everything you want, copy-paste the AI's response, maybe save it as documentation, then start over when the conversation gets too long.

**Why this fails at scale:** Imagine trying to use this approach on a team project with multiple developers working on different features. One webinar participant described it perfectly: "It's like the difference between riding a bike and directing traffic."

**The real problem:** Everyone is inventing their own workflow from scratch. Some people use Test-Driven Development (writing tests first), others skip tests entirely. Some have elaborate systems for managing conversation history, others just wing it. There's no standard approach yet, which means the workflow you develop in school might not work at your first job.

## How This Changes Your Career Path

Here's what career counselors aren't talking about yet:

**The skill shift:** Being a "good engineer" increasingly means being able to write clear specifications that produce working code, rather than writing all the code yourself. Think of it like being an architect who designs buildings versus a construction worker who lays every brick. But here's the problem: entry-level jobs where you learn to write good specifications are becoming rare.

**The practice gap:** Getting good at AI-assisted development requires experimentation time. Not every student has access to paid AI tools or the time to practice with them extensively. This creates an inequality where some students graduate with AI-assisted development experience and others don't.

**The portfolio problem:** How do you show potential employers you're skilled when AI wrote significant portions of your projects? Your GitHub activity becomes misleading. LeetCode practice becomes less relevant when interviews shift to "write a prompt that generates a binary search algorithm that passes our coding standards."

## What's Actually Working (So Far)

**Specification-first development:** The consensus from industry developers was to start with detailed specifications before generating any code. But nobody agrees on what that looks like yet. It's like the early days of React—everyone knows it's important, but best practices are still forming.

**Example:** Instead of asking "write me a shopping cart," you'd write: "Create a ShoppingCart class that stores items with quantities, calculates totals including tax, and throws specific errors for invalid operations like negative quantities."

**Managing conversation limits:** Claude Code can only remember so much of your conversation. About half its "memory" is used for basic instructions, leaving the other half for your actual work. Learning to work within these limits efficiently is becoming a key skill.

**Quality control is a mess:** Multiple participants noted that most teams are just eyeballing AI-generated code and saying "looks good to me." There aren't established frameworks for properly reviewing AI-generated code at scale, which should concern everyone.

## The Uncomfortable Questions

**Speed vs. control:** AI coding feels like trading a reliable car for a motorcycle. Faster, but you might crash spectacularly. The webinar discussion included a great analogy about losing the Toyota Production System's clear part manifests in exchange for "floppy drive" capabilities.

**The metrics problem:** Any metric we create for measuring AI-assisted code quality gets gamed by the AI itself. It's like trying to grade a test where the student can see all the answers.

**The collaboration weirdness:** Instead of pair programming, you're basically playing a guessing game until you say the magic words that make Claude do what you want. As one participant noted, it feels less like collaboration and more like the AI is "interrogating and baiting the operator."

## Practical Advice for CS Students

**Start practicing specifications now:** Take your next coding assignment and write a detailed specification before you code anything. Include data types, error conditions, performance requirements, and edge cases. Then try implementing it both with and without AI assistance.

**Build a hybrid portfolio:** Create projects that showcase both AI-assisted work and traditional coding. Be transparent about which parts used AI help. Document your decision-making process and how you verified the AI-generated code.

**Learn to evaluate code, not just write it:** Practice code review skills. Can you spot bugs, security issues, or performance problems in code you didn't write? This skill becomes critical when AI is generating first drafts.

**Experiment with AI tools deliberately:** Don't just use them to complete assignments faster. Try different approaches, document what works and what doesn't, and think about how they fit into larger development workflows.

## For Industry Mentors and Employers

**Update your interview process:** Consider how to evaluate candidates who've used AI assistance extensively. Focus on design thinking, problem decomposition, and code evaluation skills rather than just implementation ability.

**Provide AI tool access:** Consider giving interns and junior developers access to AI coding tools, but with structured learning objectives around specification writing and code review.

**Establish team standards:** Don't let everyone develop their own AI workflow. Invest in creating shared practices for AI-assisted development before the chaos gets worse.

## The Bigger Picture

We might be recreating some problematic patterns from other industries—think credit rating agencies being paid by the companies they rate. When your AI assistant is optimized to make you feel productive rather than actually be productive, we might have a system-level problem.

But we're also seeing rapid innovation and genuine productivity gains. The CLI coding agent ecosystem is growing explosively, even if performance engineering practices haven't caught up yet. The trick is being intentional about which patterns we adopt and which we avoid.

## Tools Worth Watching

The webinar highlighted some emerging solutions to these challenges:

- **HumanLayer's CodeLayer** is working on automated context management (currently in closed beta due to scaling challenges)
- Various approaches to multiplexing Claude Code instances for parallel development
- Emerging frameworks for spec-driven development workflows

## Next Steps for Our CS Club

1. **Workshop series:** Let's organize sessions where members practice writing specifications and then implement them with AI assistance
2. **Portfolio review:** Share projects and discuss how to document AI-assisted work honestly and effectively
3. **Industry connections:** Invite local developers to discuss how their teams are handling AI-assisted development
4. **Tool exploration:** Try different AI coding tools together and compare approaches
5. **Standard development:** Work together to develop best practices that we can take to our internships and first jobs

## Thanks & Next Steps

Big thanks to the BAML and HumanLayer teams for hosting such a thoughtful discussion and creating space for these deeper questions about where AI-assisted development is headed. The conversation went well beyond technical tips into the structural changes happening in our field.

The tools are evolving faster than our wisdom about how to use them. That's both an opportunity and a responsibility.