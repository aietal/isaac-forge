import { AgentFunction, Agent, Swarm } from '../src';

// Define a basic calculation function
const calculateFunction: AgentFunction = {
    name: 'calculate',
    func: ({operation, a, b}) => {
        switch(operation) {
            case 'add': return (a + b).toString();
            case 'subtract': return (a - b).toString();
            default: throw new Error('Unsupported operation');
        }
    },
    descriptor: {
        name: 'calculate',
        description: 'Performs basic arithmetic operations.',
        parameters: {
            operation: { 
                type: 'string', 
                required: true, 
                description: 'The operation to perform (add/subtract).'
            },
            a: { type: 'number', required: true, description: 'First number.' },
            b: { type: 'number', required: true, description: 'Second number.' },
        },
    },
};

// Create a specialized agent
const mathAgent = new Agent({
    name: 'MathAgent',
    model: 'gpt-4',
    instructions: 'You are specialized in mathematical operations.',
});

// Create the main agent
const mainAgent = new Agent({
    name: 'MainAgent',
    model: 'gpt-4',
    instructions: 'You coordinate tasks and perform calculations.',
    functions: [calculateFunction]
});

// Initialize the framework
const swarm = new Swarm(process.env.OPENAI_API_KEY);

// Deploy and run
async function main() {
    try {
        const response = await swarm.run({
            agent: mainAgent,
            messages: [{
                role: 'user',
                content: 'Can you add 5 and 3?'
            }]
        });
        console.log('Response:', response);
    } catch (error) {
        console.error('Error running swarm:', error);
    }
}

main();