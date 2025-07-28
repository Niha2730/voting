import { 
  users, 
  clubs, 
  positions, 
  elections, 
  candidates, 
  votes,
  type User, 
  type InsertUser,
  type Club,
  type InsertClub,
  type Position,
  type InsertPosition,
  type Election,
  type InsertElection,
  type Candidate,
  type InsertCandidate,
  type Vote,
  type InsertVote
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Clubs
  getClubs(): Promise<Club[]>;
  getClub(id: string): Promise<Club | undefined>;
  createClub(club: InsertClub): Promise<Club>;
  
  // Positions
  getPositionsByClub(clubId: string): Promise<Position[]>;
  createPosition(position: InsertPosition): Promise<Position>;
  
  // Elections
  getActiveElections(): Promise<(Election & { club: Club; positions: Position[] })[]>;
  getElection(id: string): Promise<Election | undefined>;
  createElection(election: InsertElection): Promise<Election>;
  
  // Candidates
  getCandidatesByElection(electionId: string): Promise<(Candidate & { user: User; position: Position })[]>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  
  // Votes
  hasUserVoted(userId: string, electionId: string, positionId: string): Promise<boolean>;
  castVote(vote: InsertVote): Promise<Vote>;
  getVoteCount(candidateId: string): Promise<number>;
  getElectionResults(electionId: string): Promise<any[]>;
  
  // Admin stats
  getAdminStats(): Promise<{
    totalVotes: number;
    totalUsers: number;
    activeElections: number;
    totalCandidates: number;
  }>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getClubs(): Promise<Club[]> {
    return await db.select().from(clubs).orderBy(clubs.name);
  }

  async getClub(id: string): Promise<Club | undefined> {
    const [club] = await db.select().from(clubs).where(eq(clubs.id, id));
    return club || undefined;
  }

  async createClub(insertClub: InsertClub): Promise<Club> {
    const [club] = await db
      .insert(clubs)
      .values(insertClub)
      .returning();
    return club;
  }

  async getPositionsByClub(clubId: string): Promise<Position[]> {
    return await db.select().from(positions).where(eq(positions.clubId, clubId));
  }

  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    const [position] = await db
      .insert(positions)
      .values(insertPosition)
      .returning();
    return position;
  }

  async getActiveElections(): Promise<(Election & { club: Club; positions: Position[] })[]> {
    const activeElections = await db
      .select({
        election: elections,
        club: clubs,
      })
      .from(elections)
      .innerJoin(clubs, eq(elections.clubId, clubs.id))
      .where(and(
        eq(elections.isActive, true),
        sql`${elections.endDate} > now()`
      ))
      .orderBy(elections.endDate);

    const result = [];
    for (const { election, club } of activeElections) {
      const electionPositions = await this.getPositionsByClub(club.id);
      result.push({
        ...election,
        club,
        positions: electionPositions,
      });
    }

    return result;
  }

  async getElection(id: string): Promise<Election | undefined> {
    const [election] = await db.select().from(elections).where(eq(elections.id, id));
    return election || undefined;
  }

  async createElection(insertElection: InsertElection): Promise<Election> {
    const [election] = await db
      .insert(elections)
      .values(insertElection)
      .returning();
    return election;
  }

  async getCandidatesByElection(electionId: string): Promise<(Candidate & { user: User; position: Position })[]> {
    return await db
      .select({
        candidate: candidates,
        user: users,
        position: positions,
      })
      .from(candidates)
      .innerJoin(users, eq(candidates.userId, users.id))
      .innerJoin(positions, eq(candidates.positionId, positions.id))
      .where(and(
        eq(candidates.electionId, electionId),
        eq(candidates.isApproved, true)
      ))
      .then(results => results.map(({ candidate, user, position }) => ({
        ...candidate,
        user,
        position,
      })));
  }

  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const [candidate] = await db
      .insert(candidates)
      .values(insertCandidate)
      .returning();
    return candidate;
  }

  async hasUserVoted(userId: string, electionId: string, positionId: string): Promise<boolean> {
    const [result] = await db
      .select({ count: count() })
      .from(votes)
      .where(and(
        eq(votes.voterId, userId),
        eq(votes.electionId, electionId),
        eq(votes.positionId, positionId)
      ));
    
    return result.count > 0;
  }

  async castVote(insertVote: InsertVote): Promise<Vote> {
    const [vote] = await db
      .insert(votes)
      .values(insertVote)
      .returning();
    return vote;
  }

  async getVoteCount(candidateId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(votes)
      .where(eq(votes.candidateId, candidateId));
    
    return result.count;
  }

  async getElectionResults(electionId: string): Promise<any[]> {
    return await db
      .select({
        candidate: candidates,
        user: users,
        position: positions,
        voteCount: count(votes.id),
      })
      .from(candidates)
      .innerJoin(users, eq(candidates.userId, users.id))
      .innerJoin(positions, eq(candidates.positionId, positions.id))
      .leftJoin(votes, eq(votes.candidateId, candidates.id))
      .where(eq(candidates.electionId, electionId))
      .groupBy(candidates.id, users.id, positions.id)
      .orderBy(positions.name, desc(count(votes.id)));
  }

  async getAdminStats(): Promise<{
    totalVotes: number;
    totalUsers: number;
    activeElections: number;
    totalCandidates: number;
  }> {
    const [totalVotes] = await db.select({ count: count() }).from(votes);
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [activeElections] = await db
      .select({ count: count() })
      .from(elections)
      .where(and(
        eq(elections.isActive, true),
        sql`${elections.endDate} > now()`
      ));
    const [totalCandidates] = await db.select({ count: count() }).from(candidates);

    return {
      totalVotes: totalVotes.count,
      totalUsers: totalUsers.count,
      activeElections: activeElections.count,
      totalCandidates: totalCandidates.count,
    };
  }
}

export const storage = new DatabaseStorage();
