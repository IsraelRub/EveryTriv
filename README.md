# EveryTriv - Smart Trivia Platform

A modern, AI-powered trivia platform that generates dynamic questions using multiple LLM providers.

## 🚀 Features

- **Dynamic Trivia Generation**: Generate trivia questions on any topic and difficulty level
- **Multi-LLM Support**: Integrates with OpenAI and Anthropic for reliable question generation
- **Smart Caching**: Redis-based caching for improved performance
- **User Profiles**: Track user scores and progress
- **Leaderboard System**: Competitive scoring and rankings
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- **Real-time Updates**: Live score tracking and leaderboard updates

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Redux Toolkit
- **Backend**: NestJS + TypeScript + TypeORM
- **Database**: MariaDB
- **Cache**: Redis
- **LLM Providers**: OpenAI GPT, Anthropic Claude
- **Styling**: Tailwind CSS + Bootstrap

## 📁 Project Structure

```
EveryTriv/
├── client/                 # React frontend
│   ├── src/
│   │   ├── views/         # Main UI screens
│   │   ├── shared/        # Shared components & utilities
│   │   ├── redux/         # State management
│   │   └── ...
│   └── ...
├── server/                 # NestJS backend
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── entities/      # Database entities
│   │   ├── config/api/    # API modules
│   │   └── ...
│   └── ...
├── .cursor/               # Cursor IDE settings
└── docker-compose.yaml    # Docker orchestration
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- pnpm (for client)
- npm (for server)

### Environment Variables

The project uses multiple environment files for different deployment scenarios:

**Local Development** (`.env.local`):
```env
MYSQL_ROOT_PASSWORD=rootpass
MYSQL_DATABASE=everytriv_db
MYSQL_USER=ezuser
MYSQL_PASSWORD=ezpass
```

**Production** (`.env.prod`):
```env
MYSQL_ROOT_PASSWORD=rootpass
MYSQL_DATABASE=everytriv_db
MYSQL_USER=ezuser
MYSQL_PASSWORD=ezpass
```

**Default** (`.env` - copies from `.env.local`):
```env
MYSQL_ROOT_PASSWORD=rootpass
MYSQL_DATABASE=everytriv_db
MYSQL_USER=ezuser
MYSQL_PASSWORD=ezpass
```

**LLM API Keys** (add to `server/.env`):
```env
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

**Note**: The Docker Compose file automatically uses `.env.local` for database configuration.

### Quick Start

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd EveryTriv
   
   # Install client dependencies
   cd client && pnpm install && cd ..
   
   # Install server dependencies
   cd server && npm install && cd ..
   ```

2. **Environment Setup**
   ```bash
   # Copy environment files (already created)
   # .env.local - for local development
   # .env.prod - for production
   # .env - default (copies from .env.local)
   ```

3. **Start with Docker**
   ```bash
   docker-compose up -d
   ```

3. **Or Start Manually**
   ```bash
   # Start server
   cd server && npm run start:dev
   
   # Start client (in new terminal)
   cd client && pnpm dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## 🎮 Usage

1. **Generate Trivia Questions**
   - Select a topic and difficulty level
   - Click "Generate Question" to get a new trivia question
   - Answer the question to earn points

2. **Track Progress**
   - View your profile and score history
   - Check the leaderboard to see top performers
   - Monitor your ranking and improvement

3. **API Endpoints**
   - `POST /trivia` - Generate trivia question
   - `POST /trivia/history` - Save quiz history
   - `GET /trivia/score` - Get user score
   - `GET /trivia/leaderboard` - Get leaderboard
   - `GET /user/profile` - Get user profile
   - `POST /user/profile` - Update user profile

## 🔧 Development

### Client Development
```bash
cd client
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix linting issues
```

### Server Development
```bash
cd server
npm run start:dev     # Start development server
npm run build         # Build for production
npm run test          # Run tests
npm run test:e2e      # Run end-to-end tests
```

### Database
```bash
# Access MariaDB container
docker exec -it mariadb mysql -u ezuser -p everytriv_db

# Run migrations (if any)
npm run migration:run
```

## 🧪 Testing

- **Client**: Jest + React Testing Library
- **Server**: Jest + Supertest for e2e tests
- **API**: Automated API testing with Postman/Insomnia

## 📦 Deployment

### Docker Deployment
```bash
# Local development
docker-compose up --build -d

# Production (uses .env.prod)
docker-compose -f docker-compose.yaml --env-file .env.prod up --build -d

# Scale services
docker-compose up --scale server=3 -d
```

### Manual Deployment
1. Build client: `cd client && pnpm build`
2. Build server: `cd server && npm run build`
3. Set production environment variables
4. Start with PM2 or similar process manager

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `.cursor/` folder
- Review the API documentation

---

**EveryTriv** - Making trivia smarter with AI! 🧠✨ 