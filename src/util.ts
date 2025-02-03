import {FunctionDescriptor} from './types';


/**
 * Logs a debug message with a timestamp if debugging is enabled.
 * @param debug - Whether debugging is enabled.
 * @param args - The message parts to be logged.
 */
export function logDebugMessage(debug: boolean, ...args: any[]): void {
  if (!debug) return;
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const message = args.map(arg => String(arg)).join(' ');
  console.log(`\x1b[97m[\x1b[90m${timestamp}\x1b[97m]\x1b[90m ${message}\x1b[0m`);
}
/**
 * Recursively merges fields from source into target.
 * @param target - The object to merge into.
 * @param source - The object to merge from.
 */
export function mergeFields(target: any, source: any): void {
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const value = source[key];
      if (Array.isArray(value)) {
        // For arrays, replace the target's array with the source's array
        target[key] = value;
      } else if (typeof value === 'string') {
        // Initialize target[key] if undefined or not a string
        if (typeof target[key] !== 'string') {
          target[key] = '';
        }
        target[key] += value;
      } else if (value !== null && typeof value === 'object') {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        mergeFields(target[key], value);
      }
    }
  }
}

/**
 * Merges a response chunk into the final response object.
 * @param finalResponse - The accumulated response object.
 * @param delta - The new chunk to merge.
 */
export function mergeResponseChunk(finalResponse: Record<string, any>, delta: Record<string, any>): void {
  // Remove 'role' to prevent overwriting
  delete delta.role;

  // Handle 'tool_calls' separately
  if ('tool_calls' in delta) {
    if (!Array.isArray(finalResponse.tool_calls)) {
      finalResponse.tool_calls = [];
    }

    delta.tool_calls.forEach((deltaToolCall: any) => {
      const index = deltaToolCall.index;

      // Ensure the target tool_call exists
      if (!finalResponse.tool_calls[index]) {
        finalResponse.tool_calls[index] = {};
      }

      // Merge the 'id' and 'type' if they exist
      if ('id' in deltaToolCall) {
        finalResponse.tool_calls[index].id = deltaToolCall.id;
      }
      if ('type' in deltaToolCall) {
        finalResponse.tool_calls[index].type = deltaToolCall.type;
      }

      // Merge the 'function' fields
      if ('function' in deltaToolCall) {
        if (!finalResponse.tool_calls[index].function) {
          finalResponse.tool_calls[index].function = {};
        }
        mergeFields(finalResponse.tool_calls[index].function, deltaToolCall.function);
      }
    });
  }

  // Merge other fields
  const deltaWithoutToolCalls = { ...delta };
  delete deltaWithoutToolCalls.tool_calls;
  mergeFields(finalResponse, deltaWithoutToolCalls);
}

/**
 * Converts a function descriptor to a JSON representation for OpenAI API.
 * @param descriptor - The function descriptor to convert.
 * @returns The JSON representation of the function.
 */
export function functionDescriptorToJson(descriptor: FunctionDescriptor): Record<string, any> {
    return {
      type: 'function',
      function: {
        name: descriptor.name,
        description: descriptor.description,
        parameters: {
          type: 'object',
          properties: Object.keys(descriptor.parameters).reduce((acc: Record<string, any>, key) => {
            acc[key] = { type: descriptor.parameters[key].type, description: descriptor.parameters[key].description };
            return acc;
          }, {}),
          required: Object.keys(descriptor.parameters).filter(key => descriptor.parameters[key].required),
        },
      },
    };
  }

/**
 * Validates function arguments against the function descriptor.
 * @param args - The arguments to validate.
 * @param descriptor - The function descriptor to validate against.
 * @returns The validated arguments.
 * @throws Error if validation fails.
 */
export function validateFunctionArguments(
    args: any,
    descriptor: FunctionDescriptor
): Record<string, any> {
    const validatedArgs: Record<string, any> = {};

    for (const key in descriptor.parameters) {
        const param = descriptor.parameters[key];
        if (param.required && !(key in args)) {
            throw new Error(`Missing required parameter: ${key}`);
        }
        if (key in args) {
            const expectedType = param.type.toLowerCase();
            const actualType = typeof args[key];
            if (actualType !== expectedType) {
                throw new Error(`Invalid type for parameter '${key}': expected '${expectedType}', got '${actualType}'`);
            }
            validatedArgs[key] = args[key];
        }
    }

    return validatedArgs;
}
