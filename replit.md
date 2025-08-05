# Overview

This is a full-stack security camera monitoring system built with React, Express, and PostgreSQL. The system provides real-time surveillance monitoring, AI-powered video analysis, intelligent search capabilities, and comprehensive alert management. It features a modern dark-themed dashboard for managing multiple camera locations, viewing live feeds, and analyzing security incidents.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **UI Framework**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom dark theme variables and responsive design
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js REST API server
- **Language**: TypeScript with ES modules for modern JavaScript features
- **API Design**: RESTful endpoints for CRUD operations on cameras, locations, alerts, and video searches
- **Real-time Communication**: WebSocket server for live notifications and updates
- **File Processing**: Multer middleware for video file uploads with 100MB size limits
- **Error Handling**: Centralized error middleware with structured error responses

## Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Design**: Normalized tables for users, locations, cameras, alerts, video searches, and activities
- **Connection**: Neon Database serverless PostgreSQL with connection pooling
- **Migrations**: Drizzle Kit for database schema migrations and version control
- **Session Storage**: PostgreSQL-based session storage with connect-pg-simple

## Authentication & Authorization
- **Session Management**: Express sessions with PostgreSQL session store
- **User System**: Role-based access control with user roles (admin, user)
- **Security**: CORS configuration and secure session cookies

## AI Integration
- **Video Analysis**: Google Gemini AI for intelligent video content analysis
- **Capabilities**: Person detection, vehicle identification, motion analysis, security incident recognition
- **Search**: Natural language video search with AI-powered content understanding
- **Image Processing**: Support for both video (MP4) and image (JPEG) analysis

## Real-time Features
- **WebSocket Server**: Live camera status updates, alert notifications, and system events
- **Event Broadcasting**: Real-time notifications for camera state changes and new alerts
- **Connection Management**: Automatic reconnection with configurable retry logic

## File Management
- **Upload Processing**: Dedicated upload directory for video files
- **Format Support**: MP4 video files and JPEG images for AI analysis
- **Storage Strategy**: Local file system with configurable paths

# External Dependencies

## Core Technologies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM with PostgreSQL dialect
- **@google/genai**: Google Gemini AI API for video and image analysis
- **@tanstack/react-query**: Server state management and data fetching
- **wouter**: Lightweight React router

## UI & Styling
- **@radix-ui/***: Comprehensive accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework with custom design system
- **class-variance-authority**: Utility for building variant-based component APIs
- **lucide-react**: Modern icon library with consistent design

## Development & Build
- **vite**: Modern build tool with fast HMR and optimized bundling
- **typescript**: Static type checking for JavaScript
- **@replit/vite-plugin-***: Replit-specific development tools and error handling

## Server Infrastructure
- **express**: Web application framework for Node.js
- **ws**: WebSocket implementation for real-time communication
- **multer**: Multipart form data handling for file uploads
- **connect-pg-simple**: PostgreSQL session store for Express sessions