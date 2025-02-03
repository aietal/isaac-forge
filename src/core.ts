// core.ts

import { OpenAI} from 'openai';
import { cloneDeep } from 'es-toolkit/object';
import { functionDescriptorToJson, logDebugMessage, mergeResponseChunk, validateFunctionArguments } from './util';
import {
    Agent,
    AgentFunction,
    ToolFunction as ToolFunction,
    Response,
    Result,
} from './types';
import { ChatCompletion, ChatCompletionMessageToolCall, ChatCompletionChunk } from 'openai/resources';
import { Stream } from 'openai/streaming';

const CTX_VARS_NAME = 'context_variables';

interface SwarmRunOptions {
    agent: Agent;
    messages: Array<any>;
    context_variables?: Record<string, any>;
    model_override?: string;
    stream?: boolean;
    debug?: boolean;
    max_turns?: number;
    execute_tools?: boolean;
    availableAgents?: Agent[];
}

export class Swarm {
    private client: OpenAI;

    constructor(apiKey?: string) {
        if (!apiKey && !process.env.OPENAI_API_KEY) {
            throw new Error(
                'OpenAI API key not found. Please provide it as an argument to the Swarm constructor ' +
                'or set it as the OPENAI_API_KEY environment variable.'
            );
        }

        this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
    }

    private shouldSwitchAgent(message: string, currentAgent: Agent, availableAgents: Agent[]): Agent | null {
        // Implement logic to determine if we should switch agents
        // This is a simple example; you might want to use more sophisticated logic
        for (const agent of availableAgents) {
          if (agent !== currentAgent && this.isAgentSuitable(agent,message)) {
            return agent;
          }
        }
        return null;
      }
      
    private isAgentSuitable(agent: Agent, message: string): boolean {
        // Resolve instructions to a string
        const instructions = typeof agent.instructions === 'function' 
          ? agent.instructions({}) 
          : agent.instructions;
      
        if (!instructions) return false;
      
        // Convert both instructions and message to lowercase once
        const lowerInstructions = instructions.toLowerCase();
        const lowerMessage = message.toLowerCase();
      
        // Define a set of keywords for faster lookup
        const keywords = new Set(lowerInstructions.split(/\s+/));
      
        // Check for at least one keyword match
        for (const keyword of keywords) {
          if (lowerMessage.includes(keyword)) {
            return true;
          }
        }
      
        return false;
      }

    private getChatCompletion(
        agent: Agent,
        history: Array<any>,
        context_variables: Record<string, any>,
        model_override?: string,
        stream?: false,
        debug?: boolean
    ): Promise<ChatCompletion>;
    
    private getChatCompletion(
        agent: Agent,
        history: Array<any>,
        context_variables: Record<string, any>,
        model_override?: string,
        stream?: true,
        debug?: boolean
    ): Promise<Stream<ChatCompletionChunk>>;
    
    private getChatCompletion(
        agent: Agent,
        history: Array<any>,
        context_variables: Record<string, any>,
        model_override = '',
        stream = false,
        debug = false
    ): Promise<ChatCompletion | Stream<ChatCompletionChunk>> {
        const ctxVars = { ...context_variables };
        const instructions = typeof agent.instructions === 'function' ? agent.instructions(ctxVars) : agent.instructions;
        const messages = [
            { role: 'system', content: instructions },
            ...history,
        ];
        logDebugMessage(debug, 'Getting chat completion for...', messages);

        const tools = agent.functions.map(func => functionDescriptorToJson(func.descriptor));
        // Hide context_variables from model
        tools.forEach(tool => {
            delete tool.function.parameters.properties[CTX_VARS_NAME];
            const requiredIndex = tool.function.parameters.required.indexOf(CTX_VARS_NAME);
            if (requiredIndex !== -1) {
                tool.function.parameters.required.splice(requiredIndex, 1);
            }
        });

        const createParams: any = {
            model: model_override || agent.model,
            messages,
            tools: tools.length > 0 ? tools : undefined,
            tool_choice: agent.tool_choice,
            stream,
        };

        if (tools.length > 0) {
            createParams.parallel_tool_calls = agent.parallel_tool_calls;
        }

        return this.client.chat.completions.create(createParams);
    }

    private handleFunctionResult(result: any, debug: boolean): Result {
        if (result instanceof Result) {
            return result;
        } else if (result instanceof Agent) {
            return new Result({
                value: JSON.stringify({ assistant: result.name }),
                agent: result,
            });
        } else {
            try {
                return new Result({ value: String(result) });
            } catch (e: any) {
                const errorMessage = `Failed to cast response to string: ${result}. Make sure agent functions return a string or Result object. Error: ${e.message}`;
                logDebugMessage(debug, errorMessage);
                throw new TypeError(errorMessage);
            }
        }
    }

    private handleToolCalls(
        tool_calls: ChatCompletionMessageToolCall[],
        functions: AgentFunction[],
        context_variables: Record<string, any>,
        debug: boolean
    ): Response {
        const function_map: Record<string, AgentFunction> = {};
        functions.forEach(func => {
            function_map[func.name] = func;
        });

        const partialResponse = new Response({
            messages: [],
            agent: undefined,
            context_variables: {},
        });

        tool_calls.forEach(tool_call => {
            const name = tool_call.function.name;
            if (!(name in function_map)) {
                logDebugMessage(debug, `Tool ${name} not found in function map.`);
                partialResponse.messages.push({
                    role: 'tool',
                    tool_call_id: tool_call.id,
                    tool_name: name,
                    content: `Error: Tool ${name} not found.`,
                });
                return;
            }

            const args = JSON.parse(tool_call.function.arguments);
            console.log(args);
            logDebugMessage(debug, `Processing tool call: ${name} with arguments`, JSON.stringify(args));

            const func = function_map[name];
            // Pass context_variables to agent functions if required
            if (func.func.length > 0 && func.toString().includes(CTX_VARS_NAME)) {
                args[CTX_VARS_NAME] = context_variables;
            }

            let validatedArgs: any;
            try {
                validatedArgs = validateFunctionArguments(args, func.descriptor);
            } catch (e: any) {
                logDebugMessage(debug, `Argument validation failed for function ${name}: ${e.message}`);
                partialResponse.messages.push({
                    role: 'tool',
                    tool_call_id: tool_call.id,
                    tool_name: name,
                    content: `Error: ${e.message}`,
                });
                return;
            }

            logDebugMessage(debug, `Processing tool call: ${name} with arguments`, JSON.stringify(validatedArgs));

            // Invoke the function with the validated arguments
            const raw_result = func.func(validatedArgs);

            console.log(raw_result);

            // const raw_result = func.func(...Object.values(args));

            console.log(raw_result);

            const result: Result = this.handleFunctionResult(raw_result, debug);
            partialResponse.messages.push({
                role: 'tool',
                tool_call_id: tool_call.id,
                tool_name: name,
                content: result.value,
            });
            Object.assign(partialResponse.context_variables, result.context_variables);
            if (result.agent) {
                partialResponse.agent = result.agent;
            }
        });

        return partialResponse;
    }

    // async *runAndStream(options: SwarmRunOptions): AsyncIterable<any> {
    //     const {
    //         agent,
    //         messages,
    //         context_variables = {},
    //         model_override,
    //         debug = false,
    //         max_turns = Infinity,
    //         execute_tools = true,
    //     } = options;

    //     let active_agent = agent;
    //     const ctx_vars = cloneDeep(context_variables);
    //     const history = cloneDeep(messages);
    //     const init_len = history.length;

    //     while ((history.length - init_len) < max_turns) {
    //         const message: any = {
    //             content: '',
    //             sender: agent.name,
    //             role: 'assistant',
    //             function_call: null,
    //             tool_calls: {},
    //         };

    //         // Get completion with current history and agent
    //         const completion = await this.getChatCompletion(
    //             active_agent,
    //             history,
    //             ctx_vars,
    //             model_override,
    //             true,
    //             debug
    //         );

    //         yield { delim: 'start' };
    //         for await (const chunk of completion) {
    //             logDebugMessage(debug, 'Received chunk:', JSON.stringify(chunk));
    //             const delta = chunk.choices[0].delta;
    //             if (chunk.choices[0].delta.role === 'assistant') {
    //                 // @ts-ignore
    //                 delta.sender = active_agent.name;
    //             }
    //             yield delta;
    //             delete delta.role;
    //             // @ts-ignore
    //             delete delta.sender;
    //             mergeResponseChunk(message, delta);
    //         }
    //         yield { delim: 'end' };

    //         message.tool_calls = Object.values(message.tool_calls);
    //         if (message.tool_calls.length === 0) {
    //             message.tool_calls = null;
    //         }
    //         logDebugMessage(debug, 'Received completion:', JSON.stringify(message));
    //         history.push(message);

    //         if (!message.tool_calls || !execute_tools) {
    //             logDebugMessage(debug, 'Ending turn.');
    //             break;
    //         }

    //         // Convert tool_calls to objects
    //         const tool_calls: ChatCompletionMessageToolCall[] = message.tool_calls.map((tc: any) => {
    //             const func = new ToolFunction({
    //                 arguments: tc.function.arguments,
    //                 name: tc.function.name,
    //             });
    //             return {
    //                 id: tc.id,
    //                 function: func,
    //                 type: tc.type,
    //             };
    //         });

    //         // Handle function calls, updating context_variables and switching agents
    //         const partial_response = this.handleToolCalls(tool_calls, active_agent.functions, ctx_vars, debug);
    //         history.push(...partial_response.messages);
    //         Object.assign(ctx_vars, partial_response.context_variables);
    //         if (partial_response.agent) {
    //             active_agent = partial_response.agent;
    //         }
    //     }

    //     yield {
    //         response: new Response({
    //             messages: history.slice(init_len),
    //             agent: active_agent,
    //             context_variables: ctx_vars,
    //         }),
    //     };
    // }
    
    // async run(
    //     options: SwarmRunOptions
    // ): Promise<Response | AsyncIterable<any>> {
    //     const {
    //         agent,
    //         messages,
    //         context_variables = {},
    //         model_override,
    //         stream = false,
    //         debug = false,
    //         max_turns = Infinity,
    //         execute_tools = true,
    //     } = options;

    //     if (stream) {
    //         return this.runAndStream({
    //             agent,
    //             messages,
    //             context_variables,
    //             model_override,
    //             debug,
    //             max_turns,
    //             execute_tools,
    //         });
    //     }

    //     let active_agent = agent;
    //     const ctx_vars = cloneDeep(context_variables);
    //     const history = cloneDeep(messages);
    //     const init_len = history.length;

    //     while ((history.length - init_len) < max_turns && active_agent) {
    //         // Get completion with current history and agent
    //         const completion: ChatCompletion = await this.getChatCompletion(
    //             active_agent,
    //             history,
    //             ctx_vars,
    //             model_override,
    //             false,
    //             debug
    //         );

    //         const messageData = completion.choices[0].message;
    //         logDebugMessage(debug, 'Received completion:', JSON.stringify(messageData));
    //         const message: any = { ...messageData, sender: active_agent.name };
    //         history.push(message); // Adjust as needed

    //         if (!message.tool_calls || !execute_tools) {
    //             logDebugMessage(debug, 'Ending turn.');
    //             break;
    //         }

    //         // Handle function calls, updating context_variables and switching agents
    //         const partial_response = this.handleToolCalls(
    //             message.tool_calls,
    //             active_agent.functions,
    //             ctx_vars,
    //             debug
    //         );
    //         history.push(...partial_response.messages);
    //         Object.assign(ctx_vars, partial_response.context_variables);
    //         if (partial_response.agent) {
    //             active_agent = partial_response.agent;
    //         }
    //     }

    async *runAndStream(options: SwarmRunOptions): AsyncIterable<any> {
        const {
            agent,
            messages,
            context_variables = {},
            model_override,
            debug = false,
            max_turns = Infinity,
            execute_tools = true,
            availableAgents = [],
        } = options;
    
        let active_agent = agent;
        const ctx_vars = cloneDeep(context_variables);
        const history = cloneDeep(messages);
        const init_len = history.length;
    
        while ((history.length - init_len) < max_turns) {
            // Check if we should switch agents
            if (history.length > 0) {
                const lastMessage = history[history.length - 1].content;
                const newAgent = this.shouldSwitchAgent(lastMessage, active_agent, availableAgents);
                if (newAgent) {
                    yield { agentSwitch: `Switching from ${active_agent.name} to ${newAgent.name}` };
                    active_agent = newAgent;
                }
            }
    
            const message: any = {
                content: '',
                sender: active_agent.name,
                role: 'assistant',
                function_call: null,
                tool_calls: {},
            };
    
            // Get completion with current history and agent
            const completion = await this.getChatCompletion(
                active_agent,
                history,
                ctx_vars,
                model_override,
                true,
                debug
            );
    
            yield { delim: 'start' };
            for await (const chunk of completion) {
                logDebugMessage(debug, 'Received chunk:', JSON.stringify(chunk));
                const delta = chunk.choices[0].delta;
                if (chunk.choices[0].delta.role === 'assistant') {
                    // @ts-ignore
                    delta.sender = active_agent.name;
                }
                yield delta;
                delete delta.role;
                // @ts-ignore
                delete delta.sender;
                mergeResponseChunk(message, delta);
            }
            yield { delim: 'end' };
    
            message.tool_calls = Object.values(message.tool_calls);
            if (message.tool_calls.length === 0) {
                message.tool_calls = null;
            }
            logDebugMessage(debug, 'Received completion:', JSON.stringify(message));
            history.push(message);
    
            if (!message.tool_calls || !execute_tools) {
                logDebugMessage(debug, 'Ending turn.');
                break;
            }
    
            // Convert tool_calls to objects
            const tool_calls: ChatCompletionMessageToolCall[] = message.tool_calls.map((tc: any) => {
                const func = new ToolFunction({
                    arguments: tc.function.arguments,
                    name: tc.function.name,
                });
                return {
                    id: tc.id,
                    function: func,
                    type: tc.type,
                };
            });
    
            // Handle function calls, updating context_variables and switching agents
            const partial_response = this.handleToolCalls(tool_calls, active_agent.functions, ctx_vars, debug);
            history.push(...partial_response.messages);
            Object.assign(ctx_vars, partial_response.context_variables);
            if (partial_response.agent) {
                active_agent = partial_response.agent;
            }
        }
    
        yield {
            response: new Response({
                messages: history.slice(init_len),
                agent: active_agent,
                context_variables: ctx_vars,
            }),
        };
    }
    
    async run(options: SwarmRunOptions): Promise<Response> {
        const {
            agent,
            messages,
            context_variables = {},
            model_override,
            debug = false,
            max_turns = Infinity,
            execute_tools = true,
            availableAgents = [],
        } = options;
    
        let active_agent = agent;
        const ctx_vars = cloneDeep(context_variables);
        const history = cloneDeep(messages);
        const init_len = history.length;
    
        while ((history.length - init_len) < max_turns && active_agent) {
            // Check if we should switch agents
            if (history.length > 0) {
                const lastMessage = history[history.length - 1].content;
                const newAgent = this.shouldSwitchAgent(lastMessage, active_agent, availableAgents);
                if (newAgent) {
                    logDebugMessage(debug, `Switching from ${active_agent.name} to ${newAgent.name}`);
                    active_agent = newAgent;
                }
            }
    
            // Get completion with current history and agent
            const completion: ChatCompletion = await this.getChatCompletion(
                active_agent,
                history,
                ctx_vars,
                model_override,
                false,
                debug
            );
    
            const messageData = completion.choices[0].message;
            logDebugMessage(debug, 'Received completion:', JSON.stringify(messageData));
            const message: any = { ...messageData, sender: active_agent.name };
            history.push(message);
    
            if (!message.tool_calls || !execute_tools) {
                logDebugMessage(debug, 'Ending turn.');
                break;
            }
    
            // Handle function calls, updating context_variables and switching agents
            const partial_response = this.handleToolCalls(
                message.tool_calls,
                active_agent.functions,
                ctx_vars,
                debug
            );
            history.push(...partial_response.messages);
            Object.assign(ctx_vars, partial_response.context_variables);
            if (partial_response.agent) {
                active_agent = partial_response.agent;
            }
        }
    
        return new Response({
            messages: history.slice(init_len),
            agent: active_agent,
            context_variables: ctx_vars,
        });
    }

        // return new Response({
        //     messages: history.slice(init_len),
        //     agent: active_agent,
        //     context_variables: ctx_vars,
        // });
    // }
}
