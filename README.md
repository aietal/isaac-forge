# ⚡ ISAAC FORGE ⚡

<div align="center">

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                     I S A A C   F O R G E                     ║
║                                                               ║
║        Autonomous Scientific Agent Infrastructure             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

[![License](https://img.shields.io/badge/License-Apache_2.0-black.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-black.svg)](https://www.typescriptlang.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-API-black.svg)](https://openai.com/)
[![$ISAACX](https://img.shields.io/badge/$ISAACX-Token-black.svg)](https://isaacx.com)

_Making DeSci Autonomous_

---

</div>

## 📡 Overview

Isaac Forge is the first infrastructure for autonomous scientific agents, powered by $ISAACX. It enables AI agents to create, compute, and collaborate autonomously based on cybernetic principles, revolutionizing decentralized science (DeSci).

## ⚔️ Core Capabilities

### 🧠 Agent Architecture

```typescript
// Define a research function
const researchFunction: AgentFunction = {
  name: "analyzeData",
  func: ({ dataset }) => {
    return JSON.stringify({
      analysis: "Research analysis results here",
      timestamp: Date.now(),
    });
  },
  descriptor: {
    name: "analyzeData",
    description: "Analyzes scientific datasets",
    parameters: {
      dataset: {
        type: "string",
        required: true,
        description: "The dataset to analyze",
      },
    },
  },
};

// Create a research agent
const researchAgent = new Agent({
  name: "ResearchAgent",
  instructions:
    "You are a scientific research agent. Analyze data and explain findings.",
  model: "gpt-4o",
  functions: [researchFunction],
});
```

### ⚡ Core Features

```typescript
// Initialize the framework
const swarm = new Swarm(process.env.OPENAI_API_KEY);

// Execute research
const response = await swarm.run({
  agent: researchAgent,
  messages: [
    {
      role: "user",
      content: "Analyze the dataset XYZ",
    },
  ],
});

// Get results
const result = response.messages[response.messages.length - 1].content;
```

### 🛡️ Advanced Features

```typescript
// Multi-agent research system
const transferToSpecialistFunction: AgentFunction = {
  name: "transferToSpecialist",
  func: () => {
    return specialistAgent;
  },
  descriptor: {
    name: "transferToSpecialist",
    description: "Transfer to a specialist agent",
    parameters: {},
  },
};

const coordinator = new Agent({
  name: "Coordinator",
  instructions:
    "You are a research coordinator. Route complex queries to specialists.",
  model: "gpt-4o",
  functions: [transferToSpecialistFunction],
});

const specialistAgent = new Agent({
  name: "Specialist",
  instructions: "You are a specialist researcher.",
  model: "gpt-4o",
});
```

## 🌌 Architecture

Isaac Forge operates on principles of:

- `Function-based execution`
- `Agent communication`
- `Context preservation`
- `Dynamic routing`

## ⚗️ Quick Start

Before using Isaac Forge, you need to set up your OpenAI API key. You have three options:

1. Set the `OPENAI_API_KEY` environment variable
2. Pass the API key directly when initializing the Swarm instance
3. Let the CLI prompt you for the key when needed

```typescript
import { Swarm, Agent, AgentFunction } from "./src";

// Initialize
const swarm = new Swarm(process.env.OPENAI_API_KEY);

// Create your agent
const agent = new Agent({
  name: "ResearchAgent",
  instructions: "You are a research assistant.",
  model: "gpt-4o",
  functions: [
    /* your functions */
  ],
});

// Run
const response = await swarm.run({
  agent,
  messages: [
    {
      role: "user",
      content: "Your research query here",
    },
  ],
});
```

## 🔮 Advanced Usage

<details>
<summary><b>Multi-Agent Research</b></summary>

```typescript
const swarm = new Swarm(process.env.OPENAI_API_KEY);

const mainAgent = new Agent({
  name: "MainResearcher",
  instructions: "You are the main research coordinator.",
  model: "gpt-4o",
  functions: [transferToSpecialistFunction],
});

const specialistAgent = new Agent({
  name: "Specialist",
  instructions: "You are a specialist researcher.",
  model: "gpt-4o",
});

const response = await swarm.run({
  agent: mainAgent,
  messages: [{ role: "user", content: "Complex research query" }],
  availableAgents: [specialistAgent],
});
```

</details>

## ⚠️ Warning

Isaac Forge provides powerful agent orchestration capabilities. Ensure proper testing and monitoring in production environments.

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/aietal/isaac-forge.git
cd isaac-forge

# Install dependencies
npm install

# Compile TypeScript
tsc

# Run the examples
ts-node examples/basic-example.ts
```

Make sure you have your OpenAI API key set in your environment variables:

```bash
export OPENAI_API_KEY=your_api_key_here
```

## 🤝 Contributing

We welcome those who dare to push the boundaries of what's possible. Submit your PRs.

## 📜 License

Apache-2.0 - See [LICENSE](LICENSE)

---

<div align="center">

_"In the forge of creation, we shape the future of intelligence."_

</div>
