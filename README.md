# AbhiScript

AI-powered call transcription application with speaker diarization and analysis using OpenAI APIs.

**Built by Abhishek Jain for Branders**

## 🚀 Features

- **Accurate Transcription**: High-quality transcripts using OpenAI Whisper API
- **Speaker Diarization**: Identify and separate different speakers in recordings
- **AI Analysis**: Generate summaries, action items, and insights using GPT-4.1
- **Modern UI**: Beautiful React frontend with Tailwind CSS
- **Real-time Processing**: Track upload and processing status
- **Secure**: JWT authentication and rate limiting

## 🛠 Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for development and building
- Tailwind CSS for styling
- React Router for navigation
- React Query for data fetching
- Framer Motion for animations

### Backend
- Node.js with Express and TypeScript
- Prisma ORM with PostgreSQL/SQLite
- OpenAI API integration
- JWT authentication
- Winston logging
- Multer for file uploads

### AI Services
- OpenAI Whisper API for transcription
- OpenAI GPT-4.1 for analysis
- pyannote.audio for speaker diarization

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- OpenAI API key
- PostgreSQL database (or SQLite for development)

## 🔧 Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd abhiscript
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   DATABASE_URL=postgresql://username:password@localhost:5432/abhiscript_db
   JWT_SECRET=your_secure_jwt_secret_here
   ```

4. **Set up the database:**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```

## 🏃‍♂️ Development

Start both frontend and backend in development mode:

```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Individual Services

Start only the frontend:
```bash
npm run dev:frontend
```

Start only the backend:
```bash
npm run dev:backend
```

## 📁 Project Structure

```
abhiscript/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── package.json
├── data/                   # Data storage
│   ├── recordings/         # Uploaded audio files
│   └── processed/          # Processed files
├── uploads/                # Temporary upload directory
└── shared/                 # Shared utilities/types
```

## 🔐 Environment Variables

### Required
- `OPENAI_API_KEY`: Your OpenAI API key
- `DATABASE_URL`: Database connection string
- `JWT_SECRET`: Secret for JWT token signing (min 32 characters)

### Optional
- `PORT`: Backend port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `MAX_FILE_SIZE`: Maximum upload size (default: 500MB)
- `LOG_LEVEL`: Logging level (default: info)

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### File Upload
- `POST /api/upload` - Upload audio file
- `GET /api/upload/status/:id` - Check upload status

### Transcripts
- `GET /api/transcripts` - List transcripts
- `GET /api/transcripts/:id` - Get transcript details
- `DELETE /api/transcripts/:id` - Delete transcript

### Analysis
- `POST /api/analysis/summary/:transcriptId` - Generate summary
- `POST /api/analysis/action-items/:transcriptId` - Extract action items
- `POST /api/analysis/q-and-a/:transcriptId` - Q&A interface

## 🧪 Testing

Run tests for both frontend and backend:
```bash
npm test
```

## 🚀 Production Build

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```


## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or issues, please open an issue on GitHub.

## 👨‍💻 About

**AbhiScript** is built by **Abhishek Jain** for **Branders** to showcase advanced AI-powered transcription capabilities and modern full-stack development practices. 