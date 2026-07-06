import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';

// Initialize Gemini
// Assumes GEMINI_API_KEY is available in the environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Define the tools (Function Declarations) the AI can call
 */
const getDatabaseSchemaDeclaration: FunctionDeclaration = {
  name: 'get_database_schema',
  description: 'Fetches the table structure and columns for a given database table so the AI can learn the schema dynamically.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      tableName: {
        type: SchemaType.STRING,
        description: 'The name of the table to inspect (e.g., sports_match_results, users, etc.)',
      },
    },
    required: ['tableName'],
  },
};

const searchActiveMatchesDeclaration: FunctionDeclaration = {
  name: 'search_active_matches',
  description: 'Searches the database for live or upcoming sports matches based on a team name or keyword to find the exact match_id.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      query: {
        type: SchemaType.STRING,
        description: 'The team name or event keyword (e.g., "Arsenal", "Spain", "World Cup").',
      },
    },
    required: ['query'],
  },
};

const resolveSocialIdentityDeclaration: FunctionDeclaration = {
  name: 'resolve_social_identity',
  description: 'Checks if a social media handle belongs to a registered user and returns their wallet address, or indicates if a temporary vault is needed.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      platform: {
        type: SchemaType.STRING,
        description: 'The social platform: "twitter", "discord", or "telegram".',
      },
      handle: {
        type: SchemaType.STRING,
        description: 'The user\'s handle (e.g., "@john").',
      },
    },
    required: ['platform', 'handle'],
  },
};

// Map the tools to the model
const tools = [
  {
    functionDeclarations: [
      getDatabaseSchemaDeclaration,
      searchActiveMatchesDeclaration,
      resolveSocialIdentityDeclaration,
    ],
  },
];

// We use gemini-2.0-flash as it excels at tool calling
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  tools: tools,
});

/**
 * Mock Execution Implementations for the Tools
 * In production, these will query Supabase directly.
 */
async function executeTool(name: string, args: any): Promise<any> {
  console.log(`[AI TOOL EXECUTED]: ${name}`, args);
  
  if (name === 'get_database_schema') {
    // Mock response for sports_match_results
    return {
      table: args.tableName,
      columns: [
        { name: 'id', type: 'text', primaryKey: true },
        { name: 'home_team', type: 'text' },
        { name: 'away_team', type: 'text' },
        { name: 'status', type: 'text', description: 'notstarted | live | finished' },
        { name: 'winner_team', type: 'text' },
      ],
    };
  }

  if (name === 'search_active_matches') {
    // Mock database search
    return {
      matches: [
        { id: 'match_999', home_team: 'Arsenal', away_team: 'Chelsea', status: 'notstarted' }
      ]
    };
  }

  if (name === 'resolve_social_identity') {
    // Mock user registry lookup
    return {
      handle: args.handle,
      platform: args.platform,
      isRegistered: true,
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    };
  }

  return { error: 'Tool not found' };
}

/**
 * Main Agent Orchestrator
 * Parses a natural language message and returns a structured payload for the smart contract.
 */
export async function parseConditionalTip(message: string, platform: string, senderHandle: string) {
  const chat = model.startChat();

  const prompt = `
    You are the Tether Arena AI Agent. Your job is to parse natural language tips and convert them into conditional IOU payloads.
    You MUST output valid JSON representing the final transaction once you have gathered all necessary context.

    If you need to know what matches are active, use 'search_active_matches'.
    If you need to know recipient details, use 'resolve_social_identity'.
    If you want to understand table structures, use 'get_database_schema'.

    User Message: "${message}"
    Platform: "${platform}"
    Sender: "${senderHandle}"

    When you have all the information, your final response MUST be a valid JSON object matching this schema exactly:
    {
      "intent": "conditional_tip",
      "senderHandle": "@username",
      "recipientHandle": "@username",
      "recipientWallet": "0x...",
      "amount": 0,
      "token": "USDT",
      "condition": {
        "matchId": "string",
        "teamSelected": "string"
      }
    }
    Output ONLY the JSON object, no markdown blocks.
  `;

  try {
    let result = await chat.sendMessage(prompt);
    let calls = result.response.functionCalls();

    // Loop to handle multiple consecutive tool calls
    while (calls && calls.length > 0) {
      const toolResponses = [];
      
      for (const call of calls) {
        const toolResult = await executeTool(call.name, call.args);
        toolResponses.push({
          functionResponse: {
            name: call.name,
            response: toolResult,
          }
        });
      }

      // Send the tool results back to the model
      result = await chat.sendMessage(toolResponses);
      calls = result.response.functionCalls();
    }

    // Once there are no more tool calls, the model should give us the final JSON
    let textResponse = result.response.text().trim();
    if (textResponse.startsWith('\`\`\`json')) {
      textResponse = textResponse.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    }
    
    // Attempt to parse the final JSON
    const payload = JSON.parse(textResponse);
    return payload;

  } catch (error) {
    console.error('AI Agent Error:', error);
    throw new Error('Failed to parse tip due to an AI or tool error.');
  }
}
