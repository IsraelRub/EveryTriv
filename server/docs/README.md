# EveryTriv Documentation

Welcome to the EveryTriv documentation. This directory contains comprehensive documentation for the application.

## Table of Contents

1. [Project Structure](./structure.md)
2. [Development Guidelines](./development.md)
3. [Features](./features/README.md)
4. [API Documentation](./api/README.md)
5. [Infrastructure](./infrastructure.md)

## Quick Start

1. **Installation**
   ```bash
   npm install
   ```

2. **Configuration**
   - Copy `.env.example` to `.env`
   - Update environment variables as needed

3. **Database Setup**
   ```bash
   npm run migration:run
   ```

4. **Running the Application**
   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

## Additional Resources

- [API Documentation](http://localhost:3000/api) (when running locally)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Deployment Guide](./deployment.md) 