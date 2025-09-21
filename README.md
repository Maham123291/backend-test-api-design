# GitHub Contributors API

A TypeScript/Express.js API that analyzes new contributors for any GitHub repository by month or year.

## Features

- **Generic Design**: Works with any GitHub organization and repository
- **Smart Caching**: Intelligent caching with configurable TTL (24 hours default)
- **Rate Limit Management**: Handles GitHub API rate limits with retry logic
- **Production Ready**: Comprehensive error handling, validation, and monitoring
- **TypeScript**: Full type safety and modern async/await patterns

## Quick Start

### Prerequisites
- Node.js 16+
- GitHub Personal Access Token

### Installation

```bash
# Clone the repository
git clone https://github.com/turingtechPK/backend-test-api-design.git
cd backend-test-api-design

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Environment Setup

Create a `.env` file in the project root:

```bash
# GitHub API Configuration
GITHUB_TOKEN=your_github_token_here

# Server Configuration  
PORT=3000
NODE_ENV=development

# Rate Limiting
GITHUB_REQUESTS_PER_HOUR=5000

# Cache Configuration (seconds)
CACHE_TTL=86400
```

**Get your GitHub token:**
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select `public_repo` scope
4. Copy token to `.env` file

### Running the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Testing
npm test
```

## API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### Get Yearly Contributors
```http
GET /:org/:repo/:year
```

**Example:**
```bash
curl http://localhost:3000/microsoft/vscode/2024
```

**Response:**
```json
{
  "org": "microsoft",
  "repository": "vscode",
  "year": "2024", 
  "newContributors": 42
}
```

#### Get Monthly Contributors
```http
GET /:org/:repo/:year/:month
```

**Example:**
```bash
curl http://localhost:3000/airbnb/javascript/2023/6
```

**Response:**
```json
{
  "org": "airbnb",
  "repository": "javascript",
  "year": "2023",
  "month": "6",
  "newContributors": 8
}
```

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-21T18:00:00.000Z",
  "version": "1.0.0",
  "authentication": "configured",
  "rateLimit": "5000/hour"
}
```

#### Cache Statistics
```http
GET /cache/stats
```

**Response:**
```json
{
  "message": "Cache statistics",
  "keys": 5,
  "stats": {
    "hits": 12,
    "misses": 8,
    "keys": 5
  },
  "timestamp": "2025-09-21T18:00:00.000Z"
}
```

### Parameters

| Parameter | Type | Description | Validation |
|-----------|------|-------------|------------|
| `org` | string | GitHub organization name | 1-39 chars, alphanumeric + `-_.` |
| `repo` | string | Repository name | 1-100 chars, alphanumeric + `-_.` |
| `year` | integer | Target year | 2008 - current year |
| `month` | integer | Target month (optional) | 1-12 |

### Error Responses

```json
{
  "error": "Bad Request",
  "message": "Invalid year",
  "timestamp": "2025-09-21T18:00:00.000Z",
  "path": "/microsoft/vscode/2050"
}
```

**Common Error Codes:**
- `400` - Invalid parameters
- `404` - Repository not found
- `429` - Rate limit exceeded
- `500` - Server error

## Architecture

### Project Structure
```
src/
├── index.ts                 # Application entry point
├── routes/
│   └── contributors.ts      # API route definitions
├── services/
│   └── githubServices.ts    # GitHub API integration
├── middleware/
│   ├── errorHandler.ts      # Global error handling
│   └── validation.ts        # Request validation
└── __tests__/              # Test files
```

### Key Components

- **GitHubService**: Handles GitHub API communication, caching, and rate limiting
- **Contributors Router**: RESTful API endpoints with validation
- **Error Handler**: Centralized error processing and response formatting
- **Validation Middleware**: Request parameter validation and sanitization

### Caching Strategy

- **Repository Data**: Cached for efficiency
- **Commit Data**: Different TTL for recent vs historical data
- **Final Results**: Cached to prevent expensive recomputation
- **Cache Statistics**: Available for monitoring and debugging

### Rate Limiting

- **Self-imposed limits**: Prevent hitting GitHub's rate limits
- **Automatic retry**: Built-in retry logic for transient failures
- **Smart waiting**: Respects GitHub's rate limit reset times

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=githubServices
```

### Test Coverage
- Unit tests for GitHubService methods
- Integration tests for API endpoints
- Error scenario validation
- Mock GitHub API responses

## Deployment

### Environment Variables
Ensure all required environment variables are set:

```bash
GITHUB_TOKEN=<required>
PORT=3000
NODE_ENV=production
GITHUB_REQUESTS_PER_HOUR=5000
CACHE_TTL=86400
```

### Production Considerations

- **Rate Limiting**: Monitor GitHub API usage
- **Caching**: Consider Redis for distributed caching
- **Logging**: Implement structured logging
- **Monitoring**: Add metrics and health checks
- **Security**: Use environment-specific tokens

## Examples

### Analyze Facebook's React Repository

```bash
# Get yearly contributors for 2023
curl http://localhost:3000/facebook/react/2023

# Get contributors for March 2023
curl http://localhost:3000/facebook/react/2023/3
```

### Analyze Microsoft's TypeScript Repository

```bash
# Get yearly contributors for 2024
curl http://localhost:3000/microsoft/TypeScript/2024

# Get contributors for January 2024  
curl http://localhost:3000/microsoft/TypeScript/2024/1
```

## Implementation Notes

This solution implements the TuringTech backend API design test requirements:

- **Complete API**: All required endpoints implemented
- **Data Processing**: Efficient new contributor analysis
- **Error Handling**: Comprehensive GitHub API error management
- **Rate Limiting**: Smart GitHub API rate limit handling
- **Caching**: Intelligent caching strategy
- **Testing**: Full test coverage with mocked dependencies
- **Documentation**: Complete API documentation
- **TypeScript**: Full type safety implementation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## License

MIT