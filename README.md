# Restaurant AI Assistant Chatbot

A modern, AI-powered restaurant management assistant built with Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui. This application provides intelligent insights and recommendations for restaurant operations through a conversational interface.

## Features

### 🤖 AI Assistant
- Natural language conversation interface
- Intelligent responses for restaurant management queries
- Real-time insights and actionable recommendations

### 🔐 Authentication
- Supabase Auth integration
- Email/password authentication
- Google OAuth login
- Protected routes with automatic redirection

### 📊 Restaurant Insights
- **Sales Analytics**: Daily sales tracking, revenue analysis, top-performing items
- **Staff Management**: Scheduling insights, labor cost monitoring via 7Shifts integration
- **Task Management**: Training tasks, compliance tracking via Jolt integration
- **Financial Metrics**: Cost analysis, profit margins via Restaurant365 integration
- **Inventory Management**: Stock levels, reorder alerts
- **Customer Satisfaction**: Review monitoring and feedback analysis

### 🎨 Modern UI/UX
- Beautiful chat interface with message bubbles
- Responsive sidebar with real-time metrics
- Dark/light mode support with system preference detection
- Smooth animations and transitions using Framer Motion
- Professional design with shadcn/ui components

### 🔧 System Integrations
- **Toast POS**: Sales data and transaction insights
- **Square/Clover**: Alternative POS system support
- **7Shifts**: Staff scheduling and labor management
- **Jolt**: Task management and training compliance
- **Restaurant365**: Financial management and reporting

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Supabase Auth
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Database**: Supabase (ready for future data storage)

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm
- Supabase account and project

### Environment Setup

1. Create a `.env.local` file in the root directory:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Set up Supabase:
   - Create a new Supabase project
   - Enable Authentication
   - Configure Google OAuth (optional)
   - Copy your project URL and anon key to the environment file

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd restaurant-ai-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Authentication
1. Navigate to `/login` to access the authentication page
2. Sign up with email/password or use Google OAuth
3. Upon successful login, you'll be redirected to the main chat interface

### Chat Interface
1. Use the chat input to ask questions about your restaurant operations
2. Try example queries like:
   - "Why are sales down this week?"
   - "Show me today's staff schedule"
   - "What tasks are overdue?"
   - "What's our labor cost percentage?"

### Sidebar Features
- View real-time metrics and KPIs
- Monitor system connection status
- Access user profile and logout
- Toggle between light/dark themes

## Example Conversations

**User**: "Why are sales lower this week compared to last?"  
**AI**: "Sales dropped 12% due to slower weekday traffic. Toast POS data shows lower lunch orders. Suggestion: run a weekday lunch promo. Would you like me to draft one?"

**User**: "What training tasks are overdue?"  
**AI**: "3 tasks are overdue: Food Safety Training (2 days), Inventory Count (1 day), Equipment Maintenance Log (due today). Prioritize food safety training immediately."

## Project Structure

```
src/
├── app/
│   ├── login/          # Authentication page
│   ├── layout.tsx      # Root layout with providers
│   └── page.tsx        # Main chat interface
├── components/
│   ├── ui/             # shadcn/ui components
│   ├── AuthProvider.tsx
│   ├── LoginForm.tsx
│   ├── ChatWindow.tsx
│   ├── ChatInput.tsx
│   ├── MessageBubble.tsx
│   ├── Sidebar.tsx
│   ├── ProtectedRoute.tsx
│   ├── ThemeProvider.tsx
│   └── ThemeToggle.tsx
└── lib/
    ├── supabase.ts     # Supabase client
    ├── auth.ts         # Authentication utilities
    ├── ai-responses.ts # Mock AI response logic
    └── utils.ts        # Utility functions
```

## Customization

### Adding New Integrations
1. Update the mock data in `src/lib/ai-responses.ts`
2. Add new response patterns for your specific use cases
3. Extend the sidebar metrics in `src/components/Sidebar.tsx`

### Styling
- Modify Tailwind classes for custom styling
- Update the theme configuration in `src/components/ThemeProvider.tsx`
- Customize shadcn/ui components in `src/components/ui/`

## Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Add environment variables in the Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- Ensure Node.js 18+ support
- Set environment variables
- Build with `npm run build`
- Serve the `out` directory

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the example conversations for usage patterns
