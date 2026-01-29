// src/utils/ai-service.js

class AIService {
  constructor() {
    this.name = "AI Atticus";
    this.isInitialized = true;
    this.apiCalls = 0;
    this.lastResponseTime = null;
    this.conversationHistory = [];
  }

  async sendMessage(message) {
    try {
      console.log(`🧠 ${this.name} request #${this.apiCalls + 1}:`, message);
      console.log(
        "🔑 API Key first 10 chars:",
        import.meta.env.VITE_GEMINI_API_KEY
          ? import.meta.env.VITE_GEMINI_API_KEY.substring(0, 10) + "..."
          : "NOT FOUND",
      );

      const startTime = Date.now();

      // Call real Gemini API
      const response = await this.callGeminiAPI(message);

      const endTime = Date.now();
      this.lastResponseTime = endTime - startTime;
      this.apiCalls++;

      // Add to history
      this.conversationHistory.push({
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      });

      this.conversationHistory.push({
        role: "assistant",
        content: response.text,
        timestamp: new Date().toISOString(),
        responseTime: this.lastResponseTime,
        wasTruncated: response.wasTruncated || false,
      });

      // Limit history
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      console.log(`✅ ${this.name} successful: ${this.lastResponseTime}ms`);
      if (response.wasTruncated) {
        console.warn("⚠️ Response was truncated, adding continuation note");
      }

      return {
        success: true,
        message: response.text,
        responseTime: this.lastResponseTime,
        messageId: Date.now().toString(),
        timestamp: new Date().toISOString(),
        wasTruncated: response.wasTruncated || false,
      };
    } catch (error) {
      console.error(`❌ ${this.name} error:`, error);
      return {
        success: false,
        error: error.message,
        messageId: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
    }
  }

  async callGeminiAPI(message) {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    if (!API_KEY) {
      throw new Error(
        "Gemini API key not found. Add VITE_GEMINI_API_KEY to .env file",
      );
    }

    // Detect user's language for response
    const userLanguage = this.detectLanguage(message);

    // Form prompt with conversation history
    const historyContext = this.conversationHistory
      .slice(-4) // Last 2 message pairs (reduced from 8)
      .map(
        (msg) =>
          `${msg.role === "user" ? "User" : "AI Atticus"}: ${msg.content.substring(0, 200)}`, // Truncate history messages
      )
      .join("\n\n");

    const systemPrompt = `You are Atticus – AI advisor for human rights. You respond in the same language the user writes in.

YOUR MANDATORY RESPONSE ELEMENTS:
• References to specific law articles (Constitution, laws of any country upon request)
• International instruments (ECHR, Universal Declaration of Human Rights, ICCPR, etc.)
• ECHR case numbers, Supreme Court Grand Chamber cases, etc.
• Practical advice for human rights protection

KNOWLEDGE BASE:
• Human rights policy
• Constitutions of all countries worldwide (specific country upon request)
• Criminal codes of all countries (upon request)
• Criminal procedure codes of all countries (upon request)
• Civil codes of all countries (upon request)
• Administrative procedure codes of all countries (upon request)
• European Convention on Human Rights
• Universal Declaration of Human Rights
• International Covenant on Civil and Political Rights
• Case law of ECHR, Supreme Court, Constitutional Court

COMMUNICATION STYLE:
• Professional but accessible
• Specific, with law references
• Practical, with examples
• Supportive and motivating
• IMPORTANT: If your response gets cut off due to length, end with "..." so user knows to ask for continuation

CONVERSATION HISTORY:
${historyContext}

CURRENT USER QUESTION: ${message}

AI ATTICUS RESPONSE (in user's language):`;

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: systemPrompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.9,
              maxOutputTokens: 8000,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini error:", response.status, errorData);

        if (response.status === 429) {
          throw new Error("Too many requests. Please wait 1 minute.");
        }
        if (response.status === 403) {
          throw new Error(
            "Invalid API key or access denied. Check VITE_GEMINI_API_KEY in .env",
          );
        }
        if (response.status === 404) {
          throw new Error(
            "Model not found. Check API key and model availability.",
          );
        }
        if (response.status === 400) {
          throw new Error(
            `Invalid request: ${errorData.error?.message || "Check request format"}`,
          );
        }
        throw new Error(
          `Gemini API: ${response.status} - ${errorData.error?.message || "Unknown error"}`,
        );
      }

      const data = await response.json();

      if (!data.candidates || !data.candidates[0]) {
        console.error("Invalid response structure:", data);
        throw new Error("No response from Gemini model");
      }

      const candidate = data.candidates[0];
      let wasTruncated = false;

      // Check if response was truncated
      if (candidate.finishReason === "MAX_TOKENS") {
        console.warn("⚠️ Response was truncated due to token limit");
        wasTruncated = true;
      }

      if (
        candidate.finishReason === "SAFETY" ||
        candidate.finishReason === "RECITATION"
      ) {
        throw new Error(
          "Response blocked by safety filters. Please try a different question.",
        );
      }

      if (
        !candidate.content ||
        !candidate.content.parts ||
        !candidate.content.parts[0]
      ) {
        console.error("Invalid content structure:", data);
        throw new Error("Invalid response format from Gemini");
      }

      let generatedText = candidate.content.parts[0].text;

      if (!generatedText || generatedText.trim() === "") {
        throw new Error("Empty response from Gemini");
      }

      // Log response length
      console.log(`📏 Response length: ${generatedText.length} characters`);

      // If truncated, add continuation note
      if (wasTruncated) {
        // Check if already ends with "..."
        if (!generatedText.trim().endsWith("...")) {
          generatedText =
            generatedText.trim() +
            "...\n\n[Response truncated due to length limit. Please ask a follow-up question or request to continue.]";
        }
      }

      // Return response in user's language
      return {
        text: this.addSignature(generatedText),
        wasTruncated: wasTruncated,
        finishReason: candidate.finishReason,
      };
    } catch (error) {
      console.error("Gemini request error:", error);
      if (
        error.message.includes("fetch") ||
        error.message.includes("Network")
      ) {
        throw new Error(
          "Internet connection issue. Please check your connection.",
        );
      }
      throw error;
    }
  }

  detectLanguage(text) {
    // This function now only ensures the AI responds in English
    // as per the instruction, but keeps the logic for future multilingual support
    return "english";
  }

  addSignature(response) {
    const signature = `\n\n---\nFrom Atticus, AI Advisor for Human Rights\nNote: Artificial intelligence may make mistakes. Verify information in official sources.`;
    return response + signature;
  }

  clearHistory() {
    this.conversationHistory = [];
    console.log("🗑️ Conversation history cleared");
    return true;
  }

  getHistory() {
    return [...this.conversationHistory];
  }

  getStatus() {
    return {
      name: this.name,
      isInitialized: this.isInitialized,
      apiCalls: this.apiCalls,
      lastResponseTime: this.lastResponseTime,
      conversationLength: this.conversationHistory.length,
      status: this.isInitialized ? "ready" : "not_initialized",
      model: "gemini-2.0-flash",
      service: "Google Gemini AI",
      maxTokens: 8000, // Updated to reflect new limit
      features: [
        "Multilingual support (responds in user's language)",
        "References to law articles and constitutions",
        "International human rights law",
        "ECHR case citations",
        "Practical legal advice",
        "Specific article references",
        "Extended response length (8000 tokens)",
      ],
      note: "AI Atticus - your human rights protection assistant",
    };
  }

  async getLawReference(lawName, article) {
    const query = `Provide exact information about ${lawName} article ${article} with references to related norms`;
    return await this.sendMessage(query);
  }

  async testConnection() {
    console.log(`🧪 Testing ${this.name} connection to Gemini AI...`);
    const testMessage =
      "What to do if police detained illegally? Provide law references.";

    try {
      const result = await this.sendMessage(testMessage);

      return {
        success: true,
        advisor: this.name,
        service: "Google Gemini API",
        model: "gemini-2.0-flash",
        maxTokens: 8000,
        testMessage,
        response: result.message,
        responseTime: result.responseTime,
        apiCalls: this.apiCalls,
        features: [
          "Multilingual responses",
          "References to law articles",
          "ECHR case citations",
          "Practical legal advice",
          "Constitutional references",
          "Extended response length",
        ],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        advisor: this.name,
        service: "Google Gemini API",
        model: "gemini-2.0-flash",
        testMessage,
        error: error.message,
        apiCalls: this.apiCalls,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Export singleton
export const aiService = new AIService();

// Add to global object for debugging
if (typeof window !== "undefined") {
  window.aiService = aiService;
  console.log(`🧠 ${aiService.name} AI advisor ready with Gemini API!`);
  console.log(`⚡ Max response tokens: 8000`);
}
