import { Swarm } from "../core";
import { Agent, Response } from "../types";

/**
 * Runs an interactive CLI session for Isaac Forge.
 * @param agent - The primary agent for the session.
 * @param availableAgents - Array of available agents for dynamic switching.
 * @param contextVariables - Session context variables.
 * @param stream - Enable streaming mode for real-time responses.
 * @param debug - Enable debug logging.
 * @param apiKey - OpenAI API key.
 */
export async function runCLI(
  agent: Agent,
  availableAgents: Agent[],
  contextVariables: Record<string, any> = {},
  stream: boolean = false,
  debug: boolean = false,
  apiKey?: string
): Promise<void> {
  let swarm: Swarm;

  const initializeSwarm = async (): Promise<void> => {
    try {
      swarm = new Swarm(apiKey);
    } catch (error: unknown) {
      console.error(
        "Failed to initialize Isaac Forge:",
        error instanceof Error ? error.message : String(error)
      );
      if (!apiKey) {
        console.log("Enter your OpenAI API key to continue:");

        apiKey = await new Promise<string>((resolve) => {
          process.stdin.once("data", (data) => {
            resolve(data.toString().trim());
          });
        });

        try {
          swarm = new Swarm(apiKey);
        } catch (error: unknown) {
          console.error(
            "Invalid API key:",
            error instanceof Error ? error.message : String(error)
          );
          process.exit(1);
        }
      } else {
        console.error("Invalid API key configuration.");
        process.exit(1);
      }
    }
  };

  await initializeSwarm();

  const messages: any[] = [];

  console.log(`
    ╔══════════════════════════════════════════╗
    ║             ISAAC FORGE CLI              ║
    ║                                          ║
    ║      Autonomous Agent Orchestration      ║
    ╚══════════════════════════════════════════╝
  `);
  
  console.log('Session initialized with agent:', agent.name);
  console.log('Type your messages and press Enter. Type "exit" to end session.\n');

  process.stdin.setEncoding("utf8");

  const processResponse = async (response: Response | AsyncIterable<any>) => {
    if (stream && Symbol.asyncIterator in Object(response)) {
      let fullMessage = "";
      let currentLine = "";

      for await (const chunk of response as AsyncIterable<any>) {
        if (chunk.content) {
          currentLine += chunk.content;
          fullMessage += chunk.content;

          process.stdout.write("\r" + " ".repeat(process.stdout.columns));
          process.stdout.write("\r" + currentLine);

          if (chunk.content.endsWith("\n")) {
            console.log();
            currentLine = "";
          }
        }
        if (chunk.function) {
          console.log(
            `\n[${chunk.sender || "Agent"}] Executing: ${chunk.function.name}()`
          );
        }
        if (chunk.response) {
          agent = chunk.response.agent || agent;
          Object.assign(contextVariables, chunk.response.context_variables);
        }
      }
    } else {
      const completionResponse = response as Response;
      completionResponse.messages.forEach((msg) => {
        if (msg.role === "assistant") {
          console.log(`[${msg.sender || "Agent"}] ${msg.content}`);
          msg.tool_calls?.forEach((toolCall: any) => {
            console.log(
              `[${msg.sender || "Agent"}] Executing: ${toolCall.function.name}()`
            );
          });
        }
      });
      agent = completionResponse.agent || agent;
      Object.assign(contextVariables, completionResponse.context_variables);
    }
    console.log();
  };

  const handleUserInput = async (data: string) => {
    const userInput = data.trim();

    if (userInput.toLowerCase() === "exit") {
      console.log("\nTerminating Isaac Forge CLI session. Farewell.");
      process.exit(0);
    }

    messages.push({ role: "user", content: userInput });

    try {
      const response = await swarm.run({
        agent,
        messages,
        context_variables: contextVariables,
        stream,
        debug,
        availableAgents,
      });

      await processResponse(response);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : String(error));
    }

    process.stdout.write("> ");
  };

  process.stdin.on("data", handleUserInput);

  process.stdout.write("> ");
}
