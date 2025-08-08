# EveryTriv - Smart Trivia Platform with Custom Difficulty Levels

EveryTriv is an intelligent trivia platform that allows users to generate questions with both standard difficulty levels (Easy, Medium, Hard) and completely custom difficulty descriptions.

## 🌟 Key Features

### Standard Features
- **Dynamic Question Generation** - Powered by OpenAI and Anthropic LLMs
- **Multiple Difficulty Levels** - Easy, Medium, Hard
- **User Scoring System** - Track your progress and compete
- **Favorites System** - Save your preferred topic/difficulty combinations
- **Leaderboard** - See how you rank against other players
- **Statistics & Analytics** - Detailed performance tracking

### 🎨 Custom Difficulty Innovation
- **Custom Difficulty Descriptions** - Describe exactly the level you want
- **Smart Suggestions** - Get topic-specific difficulty recommendations  
- **Difficulty History** - Reuse your custom difficulty levels
- **Intelligent Validation** - Ensures meaningful difficulty descriptions
- **Examples of Custom Difficulties:**
  - "university level quantum physics"
  - "elementary school basic math"
  - "professional chef techniques"
  - "beginner yoga poses"
  - "expert wine knowledge"

## 🛠 Technology Stack

### Backend (NestJS)
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Caching**: Redis
- **LLM Providers**: OpenAI GPT-3.5-turbo, Anthropic Claude
- **Features**: Priority queue system, rate limiting, global error handling

### Frontend (React)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + Custom CSS with glassmorphism effects
- **Animations**: Framer Motion
- **State Management**: Redux Toolkit
- **Routing**: React Router

## 🚀 Installation & Setup

### Prerequisites
- Node.js 20+
- Docker and Docker Compose
- OpenAI API Key (required)
- Anthropic API Key (optional)

### Environment Setup

Create `.env.local` file in the root directory:

```env
# Database
POSTGRES_PASSWORD=your_password
POSTGRES_DB=everytriv_db
POSTGRES_USER=postgres

# LLM API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# JWT (optional)
JWT_SECRET=your_jwt_secret_key
```

### Quick Start with Docker

```bash
# Clone the repository
git clone <repository-url>
cd everytriv

# Start all services
docker-compose up -d

# Wait for services to be healthy, then visit:
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
```

### Manual Setup

#### Backend Setup
```bash
cd server
npm install
npm run start:dev
```

#### Frontend Setup
```bash
cd client
npm install
npm run dev
```

## 🎯 How to Use Custom Difficulty

### 1. Basic Usage
1. Select "Custom" from the difficulty dropdown
2. Enter your difficulty description in the text area
3. Use the suggestions for inspiration
4. Generate your trivia question

### 2. Writing Good Custom Difficulties

**✅ Good Examples:**
- "high school chemistry level"
- "professional sports analyst knowledge"
- "university undergraduate biology"
- "beginner home cooking skills"
- "expert classical music theory"

**❌ Avoid These:**
- "hard" (too vague)
- "impossible" (not constructive)
- Very short descriptions
- Inappropriate content

### 3. Smart Features

**Topic-Specific Suggestions**: When you enter a topic, get tailored difficulty suggestions.

**History Feature**: Reuse your previous custom difficulty levels from the history panel.

**Validation**: Real-time feedback ensures your descriptions will work well.

## 📊 API Endpoints

### Standard Endpoints
```http
POST /api/v1/trivia
GET /api/v1/trivia/leaderboard
GET /api/v1/trivia/score?userId={userId}
POST /api/v1/trivia/history
```

### Custom Difficulty Endpoints
```http
GET /api/v1/trivia/difficulty-stats?userId={userId}
GET /api/v1/trivia/custom-difficulty-suggestions?topic={topic}
```

### Example Custom Difficulty Request
```json
{
  "topic": "Physics",
  "difficulty": "custom:university level quantum mechanics",
  "userId": "user123"
}
```

## 🏗 Architecture

### Custom Difficulty Flow
1. **Frontend Validation** - Basic checks and suggestions
2. **Server Validation** - Content filtering and length validation
3. **LLM Processing** - Smart interpretation of custom descriptions
4. **Caching** - Efficient storage of generated questions
5. **Statistics** - Grouped tracking of custom difficulties

### Priority System
- **High Priority**: Expert/Professional/University level
- **Medium Priority**: Intermediate/High School level  
- **Low Priority**: Beginner/Elementary level

## 🔧 Development

### Adding New LLM Providers
1. Implement the `LLMProvider` interface
2. Add to the providers array in `TriviaService`
3. Update environment configuration

### Custom Difficulty Extensions
- Modify `getCustomDifficultySuggestions()` for new topic categories
- Update validation rules in `validateCustomDifficultyText()`
- Extend priority calculation logic

### Database Schema
```sql
-- Custom difficulties are stored with "custom:" prefix
CREATE TABLE trivia_history (
  id VARCHAR(36) PRIMARY KEY,
  topic VARCHAR(255) NOT NULL,
  difficulty VARCHAR(255) NOT NULL, -- Can be "easy", "medium", "hard", or "custom:description"
  -- ... other fields
);
```

## 🐛 Troubleshooting

### Common Issues

**Custom Difficulty Not Working?**
- Check API key configuration
- Verify description length (3-200 characters)
- Ensure appropriate content

**Questions Too Easy/Hard?**
- Be more specific in your description
- Include context like "university level" or "beginner"
- Use the suggestions for inspiration

**Performance Issues?**
- Check Redis connection
- Monitor LLM API rate limits
- Verify database connection

## 🚦 Testing

### Testing Custom Difficulties
```bash
# Backend tests
cd server
npm run test

# Frontend tests  
cd client
npm run test
```

### Manual Testing Scenarios
1. Test various custom difficulty descriptions
2. Verify suggestions work for different topics
3. Check history functionality
4. Test validation edge cases

## 📈 Future Enhancements

- **AI-Powered Difficulty Matching** - Learn from user performance
- **Collaborative Difficulties** - Share custom levels with community
- **Advanced Analytics** - Difficulty progression tracking
- **Multi-language Support** - Custom difficulties in different languages
- **Voice Input** - Speak your custom difficulty descriptions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Test custom difficulty functionality thoroughly

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support with custom difficulties or general issues:
1. Check the troubleshooting section
2. Review example custom difficulty formats
3. Open an issue with detailed description

---

**Ready to challenge yourself with custom difficulty levels? Start creating unique trivia experiences today!** 🎯