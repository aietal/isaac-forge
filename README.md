# ⚡ ISAAC FORGE ⚡

<div align="center">

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                     I S A A C   F O R G E                     ║
║                                                               ║
║          Autonomous Agent Orchestration Framework             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

[![License](https://img.shields.io/badge/License-Apache_2.0-black.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-black.svg)](https://www.typescriptlang.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-API-black.svg)](https://openai.com/)

_Forge the future of autonomous intelligence_

---

</div>

## 📡 Overview

Isaac Forge is an advanced TypeScript framework for orchestrating autonomous agent networks. It provides the foundation for building sophisticated multi-agent systems capable of complex reasoning and task execution.

## ⚔️ Core Capabilities

### 🧠 Agent Architecture

```typescript
// Define a research analysis function
const analyzeDatasetFunction: AgentFunction = {
  name: "analyzeDataset",
  func: ({ dataset, method }) => {
    // In a real app, you would perform actual statistical analysis
    return JSON.stringify({
      correlation: 0.87,
      significance: 0.001,
      method: "pearson",
      observations: 1000,
    });
  },
  descriptor: {
    name: "analyzeDataset",
    description: "Performs statistical analysis on research datasets",
    parameters: {
      dataset: {
        type: "string",
        required: true,
        description: "The name of the dataset to analyze",
      },
      method: {
        type: "string",
        required: true,
        description: "Statistical method to apply (e.g., 'pearson', 't-test')",
      },
    },
  },
};

// Create a specialized research agent
const researchAgent = new Agent({
  name: "ResearchAnalyst",
  instructions:
    "You are a research assistant specialized in statistical analysis. Analyze data and explain findings in scientific terms.",
  model: "gpt-4o",
  functions: [analyzeDatasetFunction],
});
```

- Custom analysis integration
- Specialized research agents
- Dynamic methodology selection
- Type-safe function definitions

### ⚡ High-Performance Core

```typescript
// Initialize the framework
const swarm = new Swarm(process.env.OPENAI_API_KEY);

// Execute research analysis
const response = await swarm.run({
  agent: researchAgent,
  messages: [
    {
      role: "user",
      content:
        "Analyze the correlation between temperature and reaction rate in dataset_001.",
    },
  ],
});

// Extract research findings
const result = response.messages[response.messages.length - 1].content;
```

- Efficient data processing
- Real-time analysis streaming
- Robust error handling
- Environment-aware configuration

### 🛡️ Framework Features

```typescript
// Multi-discipline research system
const transferToChemistryAgent: AgentFunction = {
  name: "transferToChemistryAgent",
  func: () => {
    return chemistryAgent;
  },
  descriptor: {
    name: "transferToChemistryAgent",
    description: "Transfer queries to the Chemistry specialist agent",
    parameters: {},
  },
};

const generalResearchAgent = new Agent({
  name: "Research Coordinator",
  instructions:
    "You are a research coordinator. Route chemistry-specific queries to the chemistry specialist.",
  model: "gpt-4o",
  functions: [transferToChemistryAgent],
});

const chemistryAgent = new Agent({
  name: "Chemistry Specialist",
  instructions:
    "You are a chemistry research specialist. Analyze chemical reactions and molecular properties.",
  model: "gpt-4o",
});
```

- Dynamic specialist routing
- Multi-discipline support
- Function-based methodology
- Context preservation

## 🌌 Architecture

Isaac Forge operates on principles of:

- `Function-based task execution`
- `Dynamic agent communication`
- `Context-aware processing`
- `Flexible routing system`

## ⚗️ Quick Start

Before using Isaac Forge, you need to set up your OpenAI API key. You have three options:

1. Set the `OPENAI_API_KEY` environment variable
2. Pass the API key directly when initializing the Swarm instance
3. Let the CLI prompt you for the key when needed

```typescript
import { NextRequest, NextResponse } from "next/server";
import { Swarm, Agent, AgentFunction } from "./src";

// Initialize with environment variable
const swarm = new Swarm(process.env.OPENAI_API_KEY);

// Create your research agent
const agent = new Agent({
  name: "ResearchAssistant",
  instructions:
    "You are a research assistant specialized in data analysis and scientific inquiry.",
  model: "gpt-4o",
  functions: [
    /* your research functions */
  ],
});

// Example API endpoint for research queries
export async function POST(request: NextRequest) {
  const { query } = await request.json();
  const messages = [{ role: "user", content: query }];

  try {
    const response = await swarm.run({
      agent,
      messages,
    });
    const result = response.messages[response.messages.length - 1].content;
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
```

## 🔮 Advanced Usage

<details>
<summary><b>Statistical Analysis Implementation</b></summary>

```typescript
// app/api/analysis/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Swarm, Agent, AgentFunction } from "./src";

const statisticalAnalysisFunction: AgentFunction = {
  name: "analyzeData",
  func: ({ dataset, test, parameters }) => {
    return JSON.stringify({
      result: "significant",
      pValue: 0.001,
      testStatistic: 4.85,
      degreesOfFreedom: 98,
    });
  },
  descriptor: {
    name: "analyzeData",
    description: "Performs statistical analysis on research data",
    parameters: {
      dataset: {
        type: "string",
        required: true,
        description: "The dataset identifier",
      },
      test: {
        type: "string",
        required: true,
        description: "Statistical test to perform",
      },
      parameters: {
        type: "object",
        required: false,
        description: "Additional test parameters",
      },
    },
  },
};

const statisticianAgent = new Agent({
  name: "StatisticianAgent",
  instructions:
    "You are a statistical analysis expert. Design and interpret statistical tests.",
  model: "gpt-4o",
  functions: [statisticalAnalysisFunction],
});

export async function POST(request: NextRequest) {
  const { query } = await request.json();
  const messages = [{ role: "user", content: query }];

  try {
    const response = await swarm.run({
      agent: statisticianAgent,
      messages,
    });
    return NextResponse.json({
      result: response.messages[response.messages.length - 1].content,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
```

</details>

<details>
<summary><b>Multi-Discipline Research</b></summary>

```typescript
// app/api/research/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Swarm, Agent, AgentFunction } from "./src";

const swarm = new Swarm(process.env.OPENAI_API_KEY);

const transferToSpecialistAgent: AgentFunction = {
  name: "transferToSpecialist",
  func: (field) => {
    const specialists = {
      chemistry: chemistrySpecialist,
      biology: biologySpecialist,
      physics: physicsSpecialist,
    };
    return specialists[field];
  },
  descriptor: {
    name: "transferToSpecialist",
    description: "Transfer research queries to the appropriate specialist",
    parameters: {
      field: {
        type: "string",
        required: true,
        description: "Research field (chemistry/biology/physics)",
      },
    },
  },
};

const researchCoordinator = new Agent({
  name: "Research Coordinator",
  instructions:
    "You are a research coordinator. Route queries to appropriate specialists based on the field.",
  model: "gpt-4o",
  functions: [transferToSpecialistAgent],
});

const chemistrySpecialist = new Agent({
  name: "Chemistry Specialist",
  instructions: "You are a chemistry research specialist.",
  model: "gpt-4o",
});

// ... other specialist definitions ...

export async function POST(request: NextRequest) {
  const { query } = await request.json();
  const messages = [{ role: "user", content: query }];

  try {
    const response = await swarm.run({
      agent: researchCoordinator,
      messages,
      availableAgents: [chemistrySpecialist /*, other specialists */],
    });
    return NextResponse.json({
      result: response.messages[response.messages.length - 1].content,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
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
