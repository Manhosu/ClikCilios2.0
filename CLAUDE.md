# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development - runs both client and API server concurrently
npm run dev

# Individual services
npm run dev:client    # Vite dev server on port 3000
npm run dev:api       # Custom API server on port 3001

# Production build
npm run build         # TypeScript compilation + Vite build

# Code quality
npm run lint          # ESLint with TypeScript rules

# Preview production build
npm run preview

# Generate test users
npm run gerar:usuarios      # Generate default amount
npm run gerar:usuarios:50   # Generate 50 test users
```

## Architecture Overview

### Hybrid Full-Stack Architecture
This is a React + Vite frontend with a custom Express-like API server for development, designed for Vercel deployment:

- **Frontend**: React 18 + TypeScript + Vite (port 3000)
- **API Layer**: Custom Node.js server (`dev-server.js`) that simulates Vercel API routes (port 3001)  
- **Database**: Supabase with typed client and Row Level Security
- **Authentication**: Supabase Auth with JWT tokens
- **Deployment**: Vercel with API routes in `/api` folder

### Key Services Architecture

**AI Processing Pipeline**:
- `aiService.ts`: Main AI API integration with fallback to mock service
- `faceMeshService.ts`: MediaPipe face detection for precise eyelash placement
- `eyelashOverlayService.ts`: Canvas-based eyelash rendering
- Supports 6 eyelash styles: Volume Brasileiro D, Volume Russo D, Volume Egípcio 3D, etc.

**Business Logic Layer**:
- `hotmartService.ts`: Webhook integration for automated user creation
- `cuponsService.ts`: Partner commission tracking and management  
- `emailService.ts`: Automated email notifications
- `imageService.ts`: Supabase Storage integration for user images

**State Management**:
- `AuthContext.tsx`: Authentication state with Supabase integration
- `DataContext.tsx`: Global app state and user data
- `ThemeContext.tsx`: UI theming and preferences

### Database Schema

Primary tables with RLS policies:
- `users`: User profiles with admin flags and onboarding status
- `clientes`: Customer management for professionals  
- `configuracoes_usuario`: User settings and preferences with proper data types
- `cupons`: Partner discount codes with commission rates
- `usos_cupons`: Commission tracking with Hotmart transaction IDs
- `imagens_clientes`: Stored processed images with metadata (filename, size, dimensions, etc.)

### API Endpoints Structure

Development server (`dev-server.js`) proxies these API routes:
- `/api/save-client-image`: Image upload and AI processing
- `/api/list-images`: Fetch user's processed images
- `/api/test-*`: Development testing endpoints

Production deploys to Vercel API routes in `/pages/api/` or `/api/` folder.

### Environment Variables

Required for development:
```bash
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_AI_API_URL=https://ai-api-endpoint.com (optional - uses mock if missing)
VITE_AI_API_KEY=your-ai-key (optional)
VITE_HOTMART_WEBHOOK_SECRET=webhook-secret (for production)
```

### Component Architecture Patterns

- **Page Components**: Full-screen views in `/pages/` (Dashboard, LoginPage, etc.)
- **Composite Components**: Complex UI like `ImageUpload`, `ImageManager` with internal state
- **UI Components**: Reusable primitives in `/components/ui/` (Button, Input, Card)
- **Protected Routes**: `ProtectedRoute.tsx` wrapper for authenticated pages
- **Modal System**: `WelcomeModal.tsx` for guided onboarding flow

### Service Layer Architecture

- **Consolidated Services**: All image-related functionality unified in `imagensService.ts`
- **Typed Interfaces**: Full TypeScript support matching database schema
- **API Integration**: Consistent patterns for frontend-backend communication
- **Authentication**: Centralized token management and renewal

### Performance Optimizations

The app includes several performance utilities:
- `networkOptimizer.ts`: Adaptive image quality based on connection
- `performanceMonitor.ts`: Runtime performance tracking
- `supabaseOptimizer.ts`: Database query optimization
- `lazyLoader.ts`: Component lazy loading
- Vite chunk splitting for vendor libraries

### Testing Strategy

Multiple test utilities for different scenarios:
- `test-*.cjs` files: Database and API integration tests
- `create-test-*.cjs`: User and data generation for testing
- `verify-*.cjs`: Data validation scripts

Note: No formal test framework configured - uses manual Node.js scripts.

## Common Development Workflows

### Adding New Eyelash Styles
1. Update style constants in `aiService.ts`
2. Add new overlay assets and logic in `eyelashOverlayService.ts`  
3. Update UI dropdowns in `AplicarCiliosPage.tsx`

### Adding Admin Features
1. Check `useAdmin.ts` hook for permission patterns
2. Create protected route with admin check
3. Add to navigation in `Dashboard.tsx` with conditional rendering

### Database Changes
1. Update TypeScript types in `src/lib/supabase.ts` Database interface
2. Run manual SQL migrations (see `*.sql` files in root)
3. Update service layers that interact with new tables

### Hotmart Integration
1. Webhook endpoint: `/api/hotmart-webhook` (see `hotmartService.ts`)
2. HMAC signature validation required
3. Automatic user creation and commission tracking
4. Test with `HotmartAdminPage.tsx` admin interface

## Recent Major Fixes Applied

### Database Schema Corrections
1. **Fixed `configuracoes_usuario` table**: Resolved type conversion errors (boolean vs text)
2. **Enhanced `imagens_clientes` table**: Added missing columns (`filename`, `file_size`, `mime_type`, etc.)
3. **Updated TypeScript interfaces**: All database types now match actual schema

### Service Layer Consolidation
1. **Unified image services**: Merged `imageService.ts` into `imagensService.ts`
2. **Consistent type definitions**: `ImagemCliente` interface covers all use cases
3. **Centralized functionality**: Upload, list, delete, and utility functions in one service

### Build & Development
1. **Clean TypeScript compilation**: No compilation errors
2. **Updated component imports**: All references point to consolidated services  
3. **Verified API endpoints**: All endpoints responding correctly

## Troubleshooting Common Issues

### Database Issues
- If you see type conversion errors, check that manual SQL fixes were applied in Supabase Dashboard
- Run `test-after-fix.cjs` to verify database schema corrections
- Ensure RLS policies are properly configured for all tables

### Service Import Errors  
- All image-related imports should use `imagensService` from `'../services/imagensService'`
- Removed: `imageService.ts` (consolidated into `imagensService.ts`)
- Use consistent interfaces: `ImagemCliente` and `ImageListResponse`