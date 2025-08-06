---
layout: ../../layouts/BlogPage.astro
title: "What I Learned About Claude Code That Changed How I Think About My CS Career"
date: "2025-01-15"
author: "CS Club Member"
description: "Field notes from a BAML x HumanLayer context engineering webinar that got unexpectedly deep"
---

*Field notes from a BAML x HumanLayer context engineering webinar that got unexpectedly deep*

## The Setup

Last week I attended a webinar on context engineering hosted by BAML and HumanLayer—two companies building tools in the AI development space. What started as a technical deep-dive on "how Claude Code works under the hood" turned into a fascinating discussion about how AI coding tools are reshaping not just our workflows, but the entire structure of software development careers.

The session brought together developers who've been experimenting with Claude Code in production, and their insights went way beyond typical "here's how to write better prompts" advice. Shoutout to the BAML and HumanLayer teams for creating space for these deeper conversations about where this technology is headed.

## The TL;DR That Matters

If you're using Claude Code (or thinking about it), you're not just adopting a new tool—you're entering a landscape where the rules of software development are changing faster than anyone can keep up with. And some of those changes might not be great for your career trajectory.

## The "Everyone Does This" Trap

**What everyone's doing:** Writing giant prompts with all the specs, copy-pasting results, maybe turning it into markdown docs, then compacting the conversation when it gets too long.

**Why this doesn't scale:** Try running multiple Claude Code instances in parallel on different parts of your project (something several webinar participants mentioned experimenting with). Suddenly your "obvious" approach becomes a coordination nightmare. It's like the difference between riding a bike and directing traffic.

**The deeper problem:** We're all reinventing the same wheel, badly. As one participant noted, everyone reported completely different knowledge management systems, different MCPs, some using TDD, others eschewing tests entirely. There's no standard playbook yet, so everyone's developing their own quirky workflow that might not transfer to your next team.

## The New Job Market Reality

Here's what's happening that career counselors aren't talking about yet:

**The skill shift:** "Good engineer" increasingly means "writes specs that produce working code" rather than "writes working code." But here's the catch—traditional entry-level positions where you learn to write good specs are disappearing.

**The access problem:** Getting good at AI-assisted development requires practice, but not everyone has equal access to experiment. As the webinar discussion highlighted, there's a "privilege to practice this new instrument" that's creating new forms of technical inequality.

**The measurement crisis:** How do you prove you're good at this on a resume? GitHub contributions become misleading when AI wrote most of the code. Leetcode becomes irrelevant when the interview becomes "write a prompt that implements binary search and passes our coding standards."

## What Actually Works (So Far)

**Spec-driven development** emerged as the consensus approach from webinar participants, but nobody agrees what that means yet. Think of it like the early days of React—everyone knows it's important, but best practices are still forming.

**The context management game:** One of the key technical insights shared was that Claude Code uses about half its context window just for baseline behavior and scaffolding. The other half is your conversation. Getting good means learning to maximize that conversation space efficiently.

**Quality control is broken:** Multiple participants noted the lack of frameworks for evaluating AI-generated code at scale. Most teams are doing "yup, looks like code to me" reviews, which is... concerning. As one attendee put it, "any KPI we come up with gets gamed and becomes meaningless."

## The Uncomfortable Questions

**Speed vs. control:** AI coding feels like trading a reliable car for a motorcycle. Faster, but you might crash spectacularly. The webinar discussion included a great analogy about losing the Toyota Production System's clear part manifests in exchange for "floppy drive" capabilities.

**The metrics problem:** Any metric we create for measuring AI-assisted code quality gets gamed by the AI itself. It's like trying to grade a test where the student can see all the answers.

**The collaboration weirdness:** Instead of pair programming, you're basically playing a guessing game until you say the magic words that make Claude do what you want. As one participant noted, it feels less like collaboration and more like the AI is "interrogating and baiting the operator."

## What This Means for You

**If you're a student:** Don't just learn to code—learn to spec, design, and evaluate. The implementation might be automated, but someone still needs to know if it's good.

**If you're job hunting:** Start thinking about how to demonstrate design and specification skills, not just coding ability.

**If you're on a team:** Push for standards and shared practices. The Wild West phase won't last forever, and teams that establish good patterns early will have an advantage.

## The Bigger Picture

We might be recreating some problematic patterns from other industries—think credit rating agencies being paid by the companies they rate. When your AI assistant is optimized to make you feel productive rather than actually be productive, we might have a system-level problem.

But we're also seeing rapid innovation and genuine productivity gains. The CLI coding agent ecosystem is growing explosively, even if performance engineering practices haven't caught up yet. The trick is being intentional about which patterns we adopt and which we avoid.

## Tools Worth Watching

The webinar highlighted some emerging solutions to these challenges:

- **HumanLayer's CodeLayer** is working on automated context management (currently in closed beta due to scaling challenges)
- Various approaches to multiplexing Claude Code instances for parallel development
- Emerging frameworks for spec-driven development workflows

## Action Items for CS Club Members

1. **Experiment deliberately:** Try Claude Code on a side project, but document what works and what doesn't
2. **Practice specification:** Take a coding problem and write a spec that someone else (human or AI) could implement from
3. **Study the ecosystem:** Tools are emerging rapidly—stay aware of what's coming
4. **Discuss with peers:** What standards should we advocate for? What practices feel sustainable?

## Thanks & Next Steps

Big thanks to the BAML and HumanLayer teams for hosting such a thoughtful discussion and creating space for these deeper questions about where AI-assisted development is headed. The conversation went well beyond technical tips into the structural changes happening in our field.

The tools are evolving faster than our wisdom about how to use them. That's both an opportunity and a responsibility.

---

*Want to discuss this? Find me after the next meeting—I'm curious what patterns others are seeing and what we should be preparing for as this space evolves.*