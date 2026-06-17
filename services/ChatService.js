const db = require('../config/db');
const { AzureOpenAI } = require("openai");
const ApiError = require('../utils/ApiError');

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_KEY;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION;

const client = new AzureOpenAI({ endpoint, apiKey, apiVersion });
const embeddingDeploymentName = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME; 
const chatDeploymentName = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT_NAME;

class ChatService {
  static async handleChat(message) {
    if (!message) {
      throw new ApiError(400, 'Message is required');
    }

    // 1. Generate Embedding for the user's question
    const embeddingResponse = await client.embeddings.create({
      model: embeddingDeploymentName,
      input: message
    });
    const userEmbedding = embeddingResponse.data[0].embedding;
    const userEmbeddingStr = `[${userEmbedding.join(',')}]`;

    // 2. Search pgvector for relevant system context
    let searchResult;
    try {
      searchResult = await db.query(`
         SELECT content, 1 - (embedding <=> $1::vector) AS similarity 
         FROM system_knowledge 
         WHERE 1 - (embedding <=> $1::vector) > 0.3 
         ORDER BY similarity DESC 
         LIMIT 7
      `, [userEmbeddingStr]);
    } catch (error) {
      if (error.message && error.message.includes('relation "system_knowledge" does not exist')) {
        throw new ApiError(500, 'System knowledge table not found. Please create the system_knowledge pgvector table.');
      }
      throw error;
    }

    let combinedContext = "";
    if (searchResult && searchResult.rows && searchResult.rows.length > 0) {
      const contextTexts = searchResult.rows.map(row => row.content);
      combinedContext = contextTexts.join('\n\n');
    }

    // 3. Create the strict System Prompt
    const systemPrompt = `You are the CareSync system assistant. You ONLY answer questions related to CareSync.
If the user asks a question that is NOT related to CareSync or the provided context, you must reply: "I can only answer questions related to the CareSync platform."
Answer based ONLY on the following Context. If the context does not contain the answer, say "I don't have information on that."

IMPORTANT: Do NOT use any Markdown formatting (no asterisks **, no hashes #, etc.). Provide your response in pure plain text so it displays correctly on the frontend.

Context:
${combinedContext}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ];

    // 4. Generate the response from Azure OpenAI
    const chatResponse = await client.chat.completions.create({
      model: chatDeploymentName,
      messages: messages
    });
    const reply = chatResponse.choices[0].message.content;

    return { reply };
  }
}

module.exports = ChatService;
