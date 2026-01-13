# Qurilish Chiqimlari - Boshqaruv Paneli Setup Guide

## Project Overview
Premium dark mode admin dashboard for construction expense management built with Next.js 16, React 19, and Tailwind CSS v4.

## Key Features
✅ JWT-based authentication (username/password login)
✅ CEO Admin only access control
✅ Responsive dark theme design
✅ Real-time API integration
✅ CRUD operations for buildings, expenses, users
✅ Advanced filtering and analytics
✅ Beautiful sidebar navigation
✅ Uzbek language support

## Project Structure
```
.
├── app/
│   ├── (authenticated)/          # Protected routes with sidebar
│   │   ├── dashboard/
│   │   │   ├── page.tsx         # Dashboard with statistics
│   │   │   └── layout.tsx       # Authenticated layout
│   │   ├── buildings/
│   │   │   └── page.tsx         # Buildings CRUD
│   │   ├── expenses/
│   │   │   └── page.tsx         # Expenses tracking
│   │   ├── users/
│   │   │   └── page.tsx         # User management (CEO only)
│   │   └── layout.tsx           # Main auth layout with sidebar
│   ├── login/
│   │   ├── page.tsx             # Login form
│   │   └── layout.tsx           # Login layout (no sidebar)
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Root redirect
│   └── globals.css              # Dark theme styles
├── components/
│   ├── sidebar.tsx              # Navigation sidebar
│   ├── protected-route.tsx      # Auth protection wrapper
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── auth.ts                  # API & auth utilities
│   └── utils.ts                 # Tailwind utilities
├── tsconfig.json                # TypeScript config
├── next.config.mjs              # Next.js config
├── tailwindcss.config.js        # Tailwind v4 config
├── postcss.config.mjs           # PostCSS config
└── package.json                 # Dependencies
```

## Technology Stack
- **Frontend**: Next.js 16, React 19.2, TypeScript
- **UI**: shadcn/ui components, Tailwind CSS v4
- **Icons**: Lucide React
- **Forms**: React Hook Form, Zod validation
- **Charts**: Recharts
- **Backend**: Django REST API (http://localhost:8000)
- **Auth**: JWT tokens (localStorage)

## Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.8+ with Django backend running
- Backend API running at `http://localhost:8000`

### Steps

1. **Install Dependencies**
```bash
npm install
```

2. **Start Development Server**
```bash
npm run dev
```

3. **Open in Browser**
```
http://localhost:3000
```

4. **Ensure Backend is Running**
The backend Django server must be running on `http://localhost:8000`:
```bash
# In backend directory
python manage.py runserver 0.0.0.0:8000
```

## Authentication

### Login
- Navigate to `http://localhost:3000/login`
- Enter CEO Admin credentials
- Username and password are verified against Django `/api/token/` endpoint
- JWT tokens stored in localStorage
- Only `ceoadmin` role can access the dashboard
- Other roles are redirected to login

### Token Management
- Access token stored as `access_token` in localStorage
- Refresh token stored as `refresh_token` in localStorage
- User role stored as `user_role` in localStorage
- Automatic redirect to login if token is invalid

## Configuration Files

### tsconfig.json
```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "target": "ES6",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### next.config.mjs
```javascript
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true }
}
```

### tailwindcss.config.js (v4)
CSS variables are defined in `app/globals.css` with `@theme` directive

### globals.css - Dark Theme Colors
- **Primary**: #10b981 (Emerald Green)
- **Secondary**: #0f172a (Dark Navy)
- **Accent**: #06b6d4 (Cyan)
- **Background**: #0f172a
- **Foreground**: #f1f5f9 (Light Gray)
- **Card**: #1e293b
- **Border**: #334155

## API Endpoints Integration

### Endpoints Used
- `POST /api/token/` - Login
- `GET /api/dashboard/` - Dashboard statistics
- `GET /api/buildings/` - List buildings
- `POST /api/buildings/` - Create building
- `PUT /api/buildings/{id}/` - Update building
- `DELETE /api/buildings/{id}/` - Delete building
- `GET /api/expenses/` - List expenses (with filters)
- `POST /api/expenses/` - Create expense
- `PUT /api/expenses/{id}/` - Update expense
- `DELETE /api/expenses/{id}/` - Delete expense
- `GET /api/users/` - List users (CEO only)
- `POST /api/users/` - Create user (CEO only)
- `PUT /api/users/{id}/` - Update user (CEO only)
- `DELETE /api/users/{id}/` - Delete user (CEO only)

## Pages Overview

### 1. Login Page (`/login`)
- Username/password form
- JWT authentication
- Beautiful gradient background
- Error handling
- Loading states

### 2. Dashboard (`/dashboard`)
- Statistics cards (buildings, budget, spent, expenses)
- Recent expenses list
- Category breakdown
- Real-time data from API

### 3. Buildings (`/buildings`)
- List of all construction projects
- Progress bars showing budget usage
- Status badges (new/started/finished)
- CRUD operations (Add, Edit, Delete)
- Modal dialogs for forms

### 4. Expenses (`/expenses`)
- All project expenses with filtering
- Filter by building and category
- Search functionality
- Summary statistics
- Category color coding
- CRUD operations

### 5. Users (`/users`)
- User management (CEO Admin only)
- Role assignment
- Create/Edit/Delete users
- Protected route (non-CEO redirected)

### 6. Sidebar (`/components/sidebar.tsx`)
- Collapsible navigation
- Active route highlighting
- Logout button
- Responsive design
- Icon and text display modes

## Dark Mode Implementation

The entire application uses dark mode by default:
- Applied at root level in `app/layout.tsx` with `className="dark"`
- No toggle - always dark theme
- Optimized for night viewing
- Professional color scheme with emerald accents

## Styling Approach

### Color System (3-5 colors)
1. **Primary**: Emerald (#10b981) - Main brand color
2. **Accent**: Cyan (#06b6d4) - Secondary highlight
3. **Neutral 1**: Dark Navy (#0f172a) - Background
4. **Neutral 2**: Slate (#1e293b) - Cards
5. **Neutral 3**: Light Gray (#f1f5f9) - Text

### Design Tokens
- Glassmorphism effects with backdrop-blur
- Smooth animations (300ms transitions)
- Gradient overlays on cards
- Shadow effects for depth
- Rounded corners (0.625rem radius)

## Build & Deployment

### Build
```bash
npm run build
```

### Start Production
```bash
npm start
```

### Deploy to Vercel
```bash
# Option 1: Via CLI
vercel

# Option 2: Git push to connected repo
git push origin main
```

## Environment Variables

The frontend uses fixed API URL: `http://localhost:8000`

To change for production:
Edit `/lib/auth.ts`:
```typescript
export const API_URL = "https://your-production-api.com"
```

## Troubleshooting

### Sidebar Not Showing
- Ensure page is inside `(authenticated)` folder
- Check if user is authenticated
- Verify ProtectedRoute component is used

### API Calls Fail
- Check if Django backend is running on `http://localhost:8000`
- Verify CORS is enabled in Django settings
- Check authentication token in localStorage
- Look at browser console for error details

### Style Issues
- Clear `.next` cache: `rm -rf .next`
- Rebuild: `npm run build`
- Restart dev server: `npm run dev`

## Support
For issues or questions about the dashboard, check the implementation in the respective page files or contact the development team.

---

**Last Updated**: January 2026
**Dashboard Version**: 1.0.0
**Technology**: Next.js 16 + Django REST API
