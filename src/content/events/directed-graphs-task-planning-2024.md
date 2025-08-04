---
title: "Using Directed Graphs for Task Planning"
date: 2024-10-22
location: "CCSF Computer Science Lab"
description: "Ivan breaks down how theoretical graph concepts solved a practical project management challenge, bridging academic computer science with real-world applications."
featured: true
category: "build-logs"
author: "Ivan"
tags: ["algorithms", "data-structures", "project-management", "graphs", "automation"]
status: "completed"
learning_outcomes: [
  "Practical applications of directed acyclic graphs (DAGs)",
  "How to model dependencies in software projects",
  "Implementation strategies for task scheduling algorithms"
]
related_links: [
  {
    "title": "Topological Sorting Algorithm",
    "url": "https://en.wikipedia.org/wiki/Topological_sorting"
  },
  {
    "title": "GitHub Repository with Implementation",
    "url": "https://github.com/example/task-scheduler"
  }
]
---

## The Problem: Dependency Hell in Project Management

While working on a group project for CS 260 (Data Structures), our team kept running into a frustrating problem: we'd start working on features that depended on other incomplete features, leading to blockers, merge conflicts, and general chaos.

Traditional project management tools weren't cutting it. We needed something that could:
1. Model complex dependencies between tasks
2. Automatically determine optimal work order
3. Identify critical path bottlenecks
4. Handle dynamic changes to requirements

That's when I realized: **this is literally a directed acyclic graph (DAG) problem.**

## The "Aha!" Moment: Tasks as Nodes, Dependencies as Edges

```
Task A (Setup Database) 
    ↓
Task B (Create User Model) → Task D (Implement Auth)
    ↓                            ↓
Task C (User Registration) → Task E (Dashboard)
```

Each task becomes a node, and dependencies become directed edges. Suddenly, the "what should I work on next?" question becomes a graph traversal problem.

## The Implementation Journey

### Phase 1: Modeling the Graph
```javascript
class TaskGraph {
  constructor() {
    this.adjacencyList = new Map();
    this.inDegree = new Map();
    this.tasks = new Map();
  }
  
  addTask(id, data) {
    this.tasks.set(id, data);
    this.adjacencyList.set(id, []);
    this.inDegree.set(id, 0);
  }
  
  addDependency(dependentTask, prerequisiteTask) {
    this.adjacencyList.get(prerequisiteTask).push(dependentTask);
    this.inDegree.set(dependentTask, this.inDegree.get(dependentTask) + 1);
  }
}
```

### Phase 2: Topological Sort for Task Ordering
The breakthrough came when I implemented Kahn's algorithm for topological sorting:

```javascript
getNextAvailableTasks() {
  const available = [];
  
  for (let [taskId, degree] of this.inDegree) {
    if (degree === 0 && !this.isCompleted(taskId)) {
      available.push(this.tasks.get(taskId));
    }
  }
  
  return available.sort((a, b) => b.priority - a.priority);
}
```

### Phase 3: Critical Path Analysis
Using a modified version of the longest path algorithm:

```javascript
findCriticalPath() {
  const distances = new Map();
  const topologicalOrder = this.topologicalSort();
  
  // Initialize distances
  topologicalOrder.forEach(task => distances.set(task, 0));
  
  // Calculate longest path (critical path)
  topologicalOrder.forEach(task => {
    this.adjacencyList.get(task).forEach(dependent => {
      const newDistance = distances.get(task) + this.getTaskDuration(task);
      if (newDistance > distances.get(dependent)) {
        distances.set(dependent, newDistance);
      }
    });
  });
  
  return this.reconstructPath(distances);
}
```

## The Results: Theory Meets Practice

### Before the Graph Implementation:
- 3-4 blocked developers per week
- Average task completion time: 5.2 days
- 12 merge conflicts in one month
- Constant "what should I work on?" questions

### After the Graph Implementation:
- Near-zero blocking (only external dependencies)
- Average task completion time: 2.8 days
- 2 merge conflicts in two months
- Automatic task assignment based on availability and skills

## The Unexpected Benefits

1. **Onboarding New Team Members**: The graph visualization made project structure immediately clear
2. **Scope Change Management**: Adding/removing tasks just meant updating the graph
3. **Performance Insights**: We could identify bottleneck tasks and allocate resources accordingly
4. **Risk Assessment**: Critical path analysis showed us exactly where delays would impact deadlines

## Technical Deep Dive: Handling Edge Cases

### Circular Dependencies
```javascript
detectCycle() {
  const visited = new Set();
  const recursionStack = new Set();
  
  for (let node of this.tasks.keys()) {
    if (this.hasCycleDFS(node, visited, recursionStack)) {
      return true;
    }
  }
  return false;
}
```

### Dynamic Priority Updates
```javascript
updateTaskPriority(taskId, newPriority) {
  this.tasks.get(taskId).priority = newPriority;
  
  // Propagate priority changes through the graph
  this.propagatePriorityChanges(taskId, new Set());
  
  // Recompute available tasks
  this.refreshAvailableTasks();
}
```

## The Meta-Learning: Academic Concepts Are Everywhere

This project taught me that data structures and algorithms aren't just academic exercises—they're powerful tools for modeling real-world problems. The key is recognizing when a practical problem maps onto a theoretical framework you already know.

Now I find myself seeing graphs everywhere:
- Social media networks (obviously)
- Build systems and compilation dependencies
- Course prerequisites
- Even recipe instructions with prep dependencies

## Future Enhancements

1. **Machine Learning Integration**: Use historical data to predict task durations
2. **Resource Allocation**: Extend the graph to include developer skills and availability
3. **Real-time Collaboration**: WebSocket updates for live graph modifications
4. **Integration APIs**: Connect with GitHub Issues, Jira, etc.

The code is available on GitHub (link above), and I'm always happy to discuss graph applications in project management. Sometimes the best solutions come from remembering that Computer Science fundamentals are fundamentals for a reason.