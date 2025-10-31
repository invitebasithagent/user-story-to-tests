# User Story to Tests - Setup Guide

## Environment Setup

1. Create a `.env` file in the root directory with these variables:

```env
# Backend Server
PORT=8081
CORS_ORIGIN=http://localhost:5173

# Jira Configuration
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token

# LLM Configuration
groq_API_BASE=https://api.groq.com/openai/v1
groq_API_KEY=your-groq-api-key
groq_MODEL=claude-sonnet-3.5  # or your preferred model
```

2. Generate a Jira API token:
   - Go to https://id.atlassian.com/manage-profile/security/api-tokens
   - Click "Create API token"
   - Name it (e.g., "User Story to Tests")
   - Copy the token to your .env file

## Development

Start the backend:
```bash
cd backend
npm install
npm run dev
```

Start the frontend:
```bash
cd frontend
npm install
npm run dev
```

## Troubleshooting

If you get "Failed to fetch":

1. Check the backend is running (http://localhost:8081/api/health)
2. Verify your .env variables
3. Check browser console for detailed error messages
4. Ensure Jira credentials are correct
5. Check your Jira domain is accessible

## Security Notes

- API tokens are stored in .env (not committed to git)
- CORS is configured for local development
- Requests have a 10s timeout
- Failed requests retry up to 3 times with backoff