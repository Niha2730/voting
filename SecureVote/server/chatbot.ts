interface ChatMessage {
  message: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatResponse {
  response: string;
  suggestions?: string[];
}

class VotingChatbot {
  private responses: Map<string, ChatResponse> = new Map();
  private patterns: Array<{ pattern: RegExp; response: string; suggestions?: string[] }> = [];

  constructor() {
    this.initializeResponses();
    this.initializePatterns();
  }

  private initializeResponses() {
    // Election information
    this.responses.set("how to vote", {
      response: "To vote in VoteEd: 1) Log in to your account, 2) View active elections on your dashboard, 3) Click 'Vote Now' on any election, 4) Select candidates for each position, 5) Submit your votes. You can only vote once per position per election.",
      suggestions: ["What elections are active?", "Can I change my vote?", "Who can vote?"]
    });

    this.responses.set("active elections", {
      response: "You can view all active elections on your dashboard. Active elections are shown with their end dates and voting status. Elections remain active until their end date passes.",
      suggestions: ["How to vote", "Election results", "Candidate information"]
    });

    this.responses.set("voting eligibility", {
      response: "All registered students can vote in elections. You need to create an account with your college email to participate. Admin users can manage elections but also vote as students.",
      suggestions: ["How to register", "Student verification", "Role differences"]
    });

    this.responses.set("election results", {
      response: "Election results are automatically calculated when elections end. Admins can view real-time results during elections. Final results are published after the election end date.",
      suggestions: ["Live vote counts", "Result publication", "Winner declaration"]
    });

    this.responses.set("candidate registration", {
      response: "Students can register as candidates for specific positions. Candidate registration requires admin approval. Once approved, candidates appear on voting ballots for their registered positions.",
      suggestions: ["How to become candidate", "Candidate approval", "Campaign guidelines"]
    });

    this.responses.set("security measures", {
      response: "VoteEd ensures vote security through: encrypted data storage, anonymous voting (votes not linked to voter identity), session-based authentication, one vote per person per position, and tamper-proof vote recording.",
      suggestions: ["Vote privacy", "Data protection", "Authentication methods"]
    });

    this.responses.set("technical issues", {
      response: "If you experience technical issues: 1) Refresh your browser, 2) Clear browser cache, 3) Try a different browser, 4) Check your internet connection, 5) Contact system administrators if problems persist.",
      suggestions: ["Login problems", "Voting errors", "Browser compatibility"]
    });

    this.responses.set("election timeline", {
      response: "Elections have specific start and end dates set by administrators. You can only vote during the active election period. Check the dashboard for election deadlines and plan accordingly.",
      suggestions: ["Election schedule", "Voting deadline", "Important dates"]
    });
  }

  private initializePatterns() {
    this.patterns = [
      // Voting questions
      { pattern: /how.*vote|voting.*process|cast.*vote/i, response: "how to vote" },
      { pattern: /active.*election|current.*election|ongoing.*election/i, response: "active elections" },
      { pattern: /who.*vote|eligibility|qualified.*vote/i, response: "voting eligibility" },
      { pattern: /result|winner|outcome|who.*won/i, response: "election results" },
      
      // Candidate questions
      { pattern: /candidate.*register|become.*candidate|run.*election/i, response: "candidate registration" },
      
      // Security questions
      { pattern: /secure|security|safe|privacy|anonymous/i, response: "security measures" },
      
      // Technical questions
      { pattern: /problem|error|issue|not.*work|technical/i, response: "technical issues" },
      
      // Timeline questions
      { pattern: /when.*election|deadline|schedule|timeline|end.*date/i, response: "election timeline" },
      
      // Greetings
      { pattern: /hello|hi|hey|good.*morning|good.*afternoon|good.*evening/i, response: "Hello! I'm your VoteEd assistant. I can help you with questions about voting, elections, candidates, and system features. What would you like to know?", suggestions: ["How to vote", "Active elections", "Security measures"] },
      
      // Help
      { pattern: /help|assist|support|what.*you.*do/i, response: "I can help you with: voting procedures, election information, candidate details, security features, technical support, and general questions about the VoteEd system. What specific topic interests you?", suggestions: ["Voting process", "Election results", "Technical issues"] },
      
      // Thanks
      { pattern: /thank|thanks|appreciate/i, response: "You're welcome! Feel free to ask if you have any other questions about the voting system. Happy voting! 🗳️" }
    ];
  }

  processMessage(message: string): ChatResponse {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Check for exact matches first
    if (this.responses.has(normalizedMessage)) {
      return this.responses.get(normalizedMessage)!;
    }

    // Check patterns
    for (const { pattern, response, suggestions } of this.patterns) {
      if (pattern.test(normalizedMessage)) {
        const responseData = this.responses.get(response);
        if (responseData) {
          return responseData;
        }
        return { response, suggestions };
      }
    }

    // Default response
    return {
      response: "I'm here to help with voting and election questions. Could you please rephrase your question or try asking about: voting procedures, active elections, candidate information, or technical support?",
      suggestions: ["How to vote", "Active elections", "Security measures", "Technical help"]
    };
  }

  getWelcomeMessage(): ChatResponse {
    return {
      response: "Welcome to VoteEd! I'm your voting assistant. I can help you with voting procedures, election information, candidate details, and answer any questions about our secure voting system. How can I assist you today?",
      suggestions: ["How do I vote?", "What elections are active?", "Is voting secure?", "Technical support"]
    };
  }
}

export const chatbot = new VotingChatbot();