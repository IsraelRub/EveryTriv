# EveryTriv

EveryTriv is a smart trivia platform with custom difficulty levels, built with React, TypeScript, and NestJS.

## Features

- Custom difficulty levels with natural language processing
- Real-time trivia generation using LLM providers
- User progress tracking and achievements
- Leaderboard and social features
- Responsive and animated UI
- Multi-level caching system

## Documentation

- [Architecture Overview](docs/architecture.md)
- [API Reference](docs/api-reference.md)
- [Setup Instructions](docs/setup.md)
- [Entity Diagrams](docs/entity-diagrams.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guide](docs/contributing.md)

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/everytriv.git
cd everytriv
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development servers:
```bash
# Start backend
cd server
pnpm start:dev

# Start frontend (in a new terminal)
cd client
pnpm dev
```

4. Visit http://localhost:5173 in your browser

## Tech Stack

### Frontend
- React with TypeScript
- Redux Toolkit for state management
- Tailwind CSS for styling
- Framer Motion for animations
- Lucide React for icons

### Backend
- NestJS framework
- PostgreSQL database
- Redis for caching
- TypeORM for database access
- OpenAPI/Swagger for API docs

## Contributing

Please read our [Contributing Guide](docs/contributing.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.