import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { chatbot } from "./chatbot";
import { 
  insertClubSchema, 
  insertPositionSchema, 
  insertElectionSchema, 
  insertCandidateSchema,
  insertVoteSchema 
} from "@shared/schema";

export function registerRoutes(app: Express): Server {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Elections endpoints
  app.get("/api/elections/active", async (req, res) => {
    try {
      const activeElections = await storage.getActiveElections();
      
      // Add voting status for authenticated users
      const electionsWithStatus = await Promise.all(
        activeElections.map(async (election) => {
          if (!req.isAuthenticated()) {
            return { ...election, userVotes: {} };
          }

          const userVotes: Record<string, boolean> = {};
          for (const position of election.positions) {
            const hasVoted = await storage.hasUserVoted(
              req.user!.id,
              election.id,
              position.id
            );
            userVotes[position.id] = hasVoted;
          }

          return { ...election, userVotes };
        })
      );

      res.json(electionsWithStatus);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active elections" });
    }
  });

  app.get("/api/elections/:id/candidates", async (req, res) => {
    try {
      const candidates = await storage.getCandidatesByElection(req.params.id);
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch candidates" });
    }
  });

  // Voting endpoint
  app.post("/api/vote", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const voteData = insertVoteSchema.parse({
        ...req.body,
        voterId: req.user!.id,
      });

      // Check if user has already voted for this position in this election
      const hasVoted = await storage.hasUserVoted(
        voteData.voterId,
        voteData.electionId,
        voteData.positionId
      );

      if (hasVoted) {
        return res.status(400).json({ message: "You have already voted for this position" });
      }

      const vote = await storage.castVote(voteData);
      res.status(201).json(vote);
    } catch (error) {
      console.error("Vote submission error:", error);
      res.status(500).json({ message: "Failed to submit vote" });
    }
  });

  // Admin endpoints
  app.get("/api/admin/stats", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.post("/api/admin/clubs", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const clubData = insertClubSchema.parse(req.body);
      const club = await storage.createClub(clubData);
      res.status(201).json(club);
    } catch (error) {
      res.status(500).json({ message: "Failed to create club" });
    }
  });

  app.post("/api/admin/positions", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const positionData = insertPositionSchema.parse(req.body);
      const position = await storage.createPosition(positionData);
      res.status(201).json(position);
    } catch (error) {
      res.status(500).json({ message: "Failed to create position" });
    }
  });

  app.post("/api/admin/elections", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const electionData = insertElectionSchema.parse(req.body);
      const election = await storage.createElection(electionData);
      res.status(201).json(election);
    } catch (error) {
      res.status(500).json({ message: "Failed to create election" });
    }
  });

  app.get("/api/admin/elections/:id/results", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const results = await storage.getElectionResults(req.params.id);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch election results" });
    }
  });

  // Clubs endpoint
  app.get("/api/clubs", async (req, res) => {
    try {
      const clubs = await storage.getClubs();
      res.json(clubs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clubs" });
    }
  });

  // Chatbot endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      const response = chatbot.processMessage(message);
      res.json(response);
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  app.get("/api/chat/welcome", async (req, res) => {
    try {
      const welcomeMessage = chatbot.getWelcomeMessage();
      res.json(welcomeMessage);
    } catch (error) {
      console.error("Welcome message error:", error);
      res.status(500).json({ error: "Failed to get welcome message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
