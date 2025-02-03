/**
 * Describes the structure of a function that can be called by an agent.
 */
export interface FunctionDescriptor {
  /** The name of the function */
  name: string;
  /** A brief description of what the function does */
  description: string;
  /** An object describing the parameters of the function */
  parameters: Record<string, {
    /** The data type of the parameter */
    type: string;
    /** Whether the parameter is required or optional */
    required: boolean;
    /** A brief description of the parameter */
    description: string
  }>;
}

/**
 * Represents a function that can be executed by an agent.
 */
export interface AgentFunction {
  /** The name of the function */
  name: string;
  /** The actual function to be executed */
  func: (args: Record<string, any>) => string | Agent | Record<string, any>;
  /** The descriptor providing metadata about the function */
  descriptor: FunctionDescriptor;
}

/**
 * Represents an agent interacting with the Swarm.
 */
export class Agent {
  /** The name of the agent */
  name: string;
  /** The model used by the agent (e.g., 'gpt-4') */
  model: string;
  /** Instructions for the agent, either as a string or a function that generates instructions */
  instructions: string | ((contextVariables: Record<string, any>) => string);
  /** An array of functions available to the agent */
  functions: AgentFunction[];
  /** Specifies which tool (function) the agent should use, if any */
  tool_choice?: string;
  /** Whether the agent can call multiple tools in parallel */
  parallel_tool_calls: boolean;

  constructor(params: Partial<Agent> = {}) {
    this.name = params.name || 'Agent';
    this.model = params.model || 'gpt-4o';
    this.instructions = params.instructions || 'You are a helpful agent.';
    this.functions = params.functions || [];
    this.tool_choice = params.tool_choice;
    this.parallel_tool_calls = params.parallel_tool_calls !== undefined ? params.parallel_tool_calls : true;
  }
}

/**
 * Represents the response from the Swarm.
 */
export class Response {
  /** An array of messages exchanged during the interaction */
  messages: Array<any>;
  /** The agent involved in the interaction, if applicable */
  agent?: Agent;
  /** Variables providing context for the interaction */
  context_variables: Record<string, any>;

  constructor(params: Partial<Response> = {}) {
    this.messages = params.messages || [];
    this.agent = params.agent;
    this.context_variables = params.context_variables || {};
  }
}

/**
 * Represents the result of an agent's action or computation.
 */
export class Result {
  /** The resulting value or output */
  value: string;
  /** The agent that produced the result, if applicable */
  agent?: Agent;
  /** Variables providing context for the result */
  context_variables: Record<string, any>;

  constructor(params: Partial<Result> = {}) {
    this.value = params.value || '';
    this.agent = params.agent;
    this.context_variables = params.context_variables || {};
  }
}

/**
 * Represents a function call made by an agent.
 */
export class ToolFunction {
  /** A JSON string containing the arguments for the function call */
  arguments: string;
  /** The name of the function being called */
  name: string;

  constructor(params: Partial<ToolFunction> = {}) {
    this.arguments = params.arguments || '';
    this.name = params.name || '';
  }
}
