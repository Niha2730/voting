# VoteEd - Student Voting System

## Overview

VoteEd is a modern web application for managing student elections and voting processes. It's built as a full-stack application with a React frontend and Node.js/Express backend, designed to facilitate secure and transparent election management for educational institutions. The system now includes an integrated AI chatbot assistant that helps users with voting procedures, election information, and system navigation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and building

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy using session-based auth
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **Password Security**: Built-in crypto module with scrypt hashing

### Database Architecture
- **Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with schema-first approach
- **Migration Strategy**: Drizzle Kit for schema management
- **Connection**: WebSocket-enabled connection pooling

## Key Components

### Authentication System
- Session-based authentication using Passport.js
- Secure password hashing with salt using Node.js crypto
- Role-based access control (student, admin, candidate)
- Protected routes with authentication middleware

### Election Management
- Multi-club election support
- Position-based voting structure
- Time-bounded elections with start/end dates
- Real-time election status tracking

### Voting System
- Single vote per user per position enforcement
- Secure vote recording with user verification
- Vote status tracking to prevent duplicate voting
- Anonymous ballot storage

### User Interface
- Responsive design with mobile-first approach
- Modern component library (shadcn/ui) with Radix UI primitives
- Dark/light theme support via CSS variables
- Real-time UI updates using React Query

### AI Chatbot Assistant
- Free local chatbot implementation without external API dependencies
- Pattern-matching system for answering election and voting questions
- Contextual suggestions and real-time responses
- Floating widget accessible from all pages
- Pre-programmed knowledge base covering voting procedures, security features, and technical support

## Data Flow

### User Registration/Login
1. User submits credentials through React form
2. Frontend validates with Zod schemas
3. Backend authenticates via Passport.js local strategy
4. Session created and stored in PostgreSQL
5. User data cached in React Query

### Voting Process
1. User views active elections from `/api/elections/active`
2. System checks voting eligibility per position
3. User selects candidates through radio button interface
4. Vote submission triggers backend validation
5. Database records vote with referential integrity
6. UI updates to reflect voting status

### Election Administration
1. Admin creates elections with club/position associations
2. Candidates register for specific positions
3. System enforces election timing constraints
4. Real-time status updates via query invalidation

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI primitives
- **passport**: Authentication middleware
- **express-session**: Session management

### Development Tools
- **Vite**: Frontend build tool and dev server
- **TypeScript**: Type safety across full stack
- **Tailwind CSS**: Utility-first styling
- **Drizzle Kit**: Database schema management

### Validation and Forms
- **zod**: Runtime type validation
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Zod integration for forms

## Deployment Strategy

### Build Process
- Frontend: Vite builds optimized React bundle to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Shared schemas: TypeScript compilation for shared types

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Session security via `SESSION_SECRET` environment variable
- Development/production mode switching via `NODE_ENV`

### Production Deployment
- Single Node.js process serving both API and static files
- PostgreSQL database with connection pooling
- Session persistence in database for horizontal scaling
- Trust proxy configuration for production environments

### Development Workflow
- Hot module replacement via Vite dev server
- TypeScript checking across all modules
- Database schema push via Drizzle Kit
- Shared type definitions between client and server

The application follows a monorepo structure with clear separation between client, server, and shared code, enabling type safety across the full stack while maintaining development efficiency.