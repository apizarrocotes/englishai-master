# API Documentation

EnglishAI Master provides a comprehensive REST API for managing authentication, learning paths, AI conversations, teacher profiles, and voice processing. The API is built with Express.js, TypeScript, and includes WebSocket support for real-time features.

## 📖 Overview

- **Base URL**: `http://localhost:3001/api` (development) / `https://api.englishai.com/api` (production)
- **Authentication**: Bearer JWT tokens
- **Content Type**: `application/json`
- **Rate Limiting**: 100 requests per 15 minutes (production)
- **API Version**: v1 (current)

## 🔐 Authentication

All API endpoints require authentication unless specified otherwise. Include the JWT token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

### Token Structure
- **Access Token**: 7-day expiry, used for API authentication
- **Refresh Token**: 30-day expiry, used for token renewal

## 📚 Authentication Endpoints (`/api/auth`)

### Register User
Create a new user account with email and password.

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Validation Rules:**
- Email: Valid email format
- Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
- Name: Required, non-empty string

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "cuid_user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": null,
    "subscriptionTier": "free"
  },
  "tokens": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "expiresAt": "2024-08-07T12:00:00.000Z"
  }
}
```

### Login User
Authenticate with email and password.

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "cuid_user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": null,
    "subscriptionTier": "free"
  },
  "tokens": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "expiresAt": "2024-08-07T12:00:00.000Z"
  }
}
```

### OAuth Authentication
Authenticate using third-party OAuth providers.

```http
POST /api/auth/callback/google
Content-Type: application/json

{
  "token": "google_oauth_token"
}
```

```http
POST /api/auth/callback/microsoft
Content-Type: application/json

{
  "token": "microsoft_oauth_token"
}
```

### Refresh Token
Refresh access token using refresh token.

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "jwt_refresh_token"
}
```

### Get Current User
Get current authenticated user information.

```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "cuid_user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": null,
    "subscriptionTier": "free"
  }
}
```

### Logout
Revoke current session token.

```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

## 📖 Learning System (`/api/learning`)

### Get Learning Paths
Retrieve all available learning paths with optional user progress.

```http
GET /api/learning/paths
Authorization: Bearer <access_token> (optional)
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "path_cuid",
      "name": "Business English Fundamentals",
      "description": "Essential English for professional settings",
      "levelRange": "B1-B2",
      "category": "Business",
      "totalLessons": 12,
      "estimatedHours": 20,
      "isActive": true,
      "lessons": [
        {
          "id": "lesson_cuid",
          "title": "Job Interview Preparation",
          "orderIndex": 1,
          "difficultyLevel": 2,
          "estimatedDuration": 30,
          "userProgress": {
            "id": "progress_cuid",
            "status": "completed",
            "score": 85,
            "timeSpent": 25,
            "completedAt": "2024-07-30T10:00:00.000Z"
          }
        }
      ]
    }
  ],
  "message": "Learning paths retrieved successfully"
}
```

### Get Learning Path Details
Get detailed information for a specific learning path.

```http
GET /api/learning/paths/:pathId
Authorization: Bearer <access_token> (optional)
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "path_cuid",
    "name": "Business English Fundamentals",
    "description": "Essential English for professional settings",
    "levelRange": "B1-B2",
    "category": "Business",
    "totalLessons": 12,
    "estimatedHours": 20,
    "lessons": [
      {
        "id": "lesson_cuid",
        "title": "Job Interview Preparation",
        "description": "Learn key phrases and strategies for job interviews",
        "scenarioType": "interview",
        "learningObjectives": [
          "Master interview vocabulary",
          "Practice common interview questions",
          "Develop confident responses"
        ],
        "vocabulary": {
          "qualification": "a skill or ability that makes you suitable for a job",
          "experience": "knowledge or skill gained from doing a job",
          "strength": "a good quality or ability"
        },
        "grammarFocus": ["Present perfect", "Modal verbs"],
        "difficultyLevel": 2,
        "estimatedDuration": 30,
        "conversationScenarios": [
          {
            "id": "scenario_cuid",
            "name": "Mock Job Interview",
            "context": "Practice a realistic job interview scenario"
          }
        ],
        "userProgress": null
      }
    ]
  }
}
```

### Get Lesson Details
Get detailed information for a specific lesson.

```http
GET /api/learning/lessons/:lessonId
Authorization: Bearer <access_token> (optional)
```

### Create Learning Path
Create a new learning path (admin/content creator only).

```http
POST /api/learning/paths
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Advanced Business Communication",
  "description": "Master professional communication skills",
  "levelRange": "B2-C1",
  "category": "Business",
  "totalLessons": 15,
  "estimatedHours": 25
}
```

### Create Lesson
Create a new lesson within a learning path.

```http
POST /api/learning/lessons
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "pathId": "path_cuid",
  "title": "Networking Events",
  "description": "Learn to network effectively at professional events",
  "scenarioType": "networking",
  "learningObjectives": [
    "Introduce yourself professionally",
    "Ask engaging questions",
    "Exchange contact information"
  ],
  "vocabulary": {
    "networking": "building professional relationships",
    "colleague": "someone you work with",
    "industry": "a particular type of business or work"
  },
  "grammarFocus": ["Question formation", "Present simple"],
  "difficultyLevel": 2,
  "estimatedDuration": 25
}
```

### Get User Progress
Get user's learning progress across paths.

```http
GET /api/learning/progress?pathId=path_cuid
Authorization: Bearer <access_token>
```

### Update User Progress
Update user's progress for a specific lesson.

```http
POST /api/learning/progress
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "lessonId": "lesson_cuid",
  "status": "completed",
  "score": 85,
  "timeSpent": 1800
}
```

**Status Values:**
- `not_started`: Lesson not yet attempted
- `in_progress`: Lesson started but not completed
- `completed`: Lesson finished successfully

## 💬 Conversation System (`/api/conversations`)

### Start Conversation
Start a new AI conversation session for a lesson.

```http
POST /api/conversations/start
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "lessonId": "lesson_cuid",
  "scenarioId": "scenario_cuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "session_cuid",
      "userId": "user_cuid",
      "scenarioId": "scenario_cuid",
      "status": "active",
      "durationSeconds": 0,
      "messagesCount": 1,
      "startedAt": "2024-07-31T12:00:00.000Z",
      "scenario": {
        "id": "scenario_cuid",
        "name": "Job Interview Practice",
        "context": "Practice a realistic job interview scenario",
        "lesson": {
          "id": "lesson_cuid",
          "title": "Job Interview Preparation",
          "scenarioType": "interview",
          "learningObjectives": ["Master interview vocabulary"],
          "vocabulary": {},
          "grammarFocus": ["Present perfect"]
        }
      },
      "messages": [
        {
          "id": "message_cuid",
          "sender": "ai",
          "content": "Hello! I'm Sarah, and I'll be conducting your interview today. Let's start with a simple question - can you tell me a bit about yourself?",
          "timestamp": "2024-07-31T12:00:00.000Z"
        }
      ]
    }
  }
}
```

### Send Message
Send a message in an active conversation.

```http
POST /api/conversations/:sessionId/message
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "message": "Hello! I'm John Doe, and I'm excited about this opportunity. I have 5 years of experience in software development."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userMessage": {
      "id": "message_cuid",
      "sender": "user",
      "content": "Hello! I'm John Doe, and I'm excited about this opportunity. I have 5 years of experience in software development.",
      "timestamp": "2024-07-31T12:01:00.000Z",
      "corrections": [
        {
          "original": "excited about",
          "corrected": "enthusiastic about",
          "explanation": "Both are correct, but 'enthusiastic' sounds more professional in interviews",
          "type": "usage"
        }
      ]
    },
    "aiResponse": {
      "id": "message_cuid",
      "sender": "ai",
      "content": "That's wonderful, John! Five years of software development experience is impressive. What technologies have you worked with most frequently, and which projects are you most proud of?",
      "timestamp": "2024-07-31T12:01:05.000Z",
      "suggestions": [
        "Try mentioning specific programming languages",
        "Describe a challenging project you completed"
      ]
    },
    "session": {
      "id": "session_cuid",
      "messagesCount": 3,
      "durationSeconds": 65
    }
  }
}
```

### End Conversation
End conversation session and receive evaluation.

```http
POST /api/conversations/:sessionId/end
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "session_cuid",
      "status": "completed",
      "completedAt": "2024-07-31T12:15:00.000Z",
      "durationSeconds": 900,
      "messagesCount": 12,
      "score": {
        "overallScore": 85,
        "feedback": {
          "strengths": [
            "Good use of professional vocabulary",
            "Clear and confident responses",
            "Appropriate interview behavior"
          ],
          "improvements": [
            "Practice using more complex sentence structures",
            "Add more specific examples"
          ],
          "vocabularyUsage": 80,
          "grammarAccuracy": 90,
          "fluency": 85
        }
      }
    }
  }
}
```

### Get Conversation History
Get conversation session details and message history.

```http
GET /api/conversations/:sessionId
Authorization: Bearer <access_token>
```

### Get User Conversations
Get user's conversation history.

```http
GET /api/conversations/history/user?limit=10
Authorization: Bearer <access_token>
```

## 🗣️ Voice Processing (`/api/voice`)

### Text-to-Speech
Convert text to speech using OpenAI TTS.

```http
POST /api/voice/tts
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "text": "Hello! How are you today?",
  "voice": "nova",
  "speed": 1.0
}
```

**Voice Options:**
- `alloy`: Neutral, balanced voice
- `echo`: Male, clear articulation
- `fable`: Female, warm tone
- `onyx`: Male, deep voice
- `nova`: Female, young and vibrant
- `shimmer`: Female, soft and gentle

**Response (200):**
```json
{
  "success": true,
  "data": {
    "audio": "base64_encoded_mp3_audio_data",
    "format": "mp3"
  }
}
```

### Speech-to-Text
Convert speech to text using OpenAI Whisper.

```http
POST /api/voice/stt
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "audio": "base64_encoded_audio_data",
  "format": "webm"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "text": "Hello, I would like to practice my English pronunciation.",
    "confidence": 0.95
  }
}
```

### Lesson Chat
AI chat endpoint for lesson-specific conversations with voice support.

```http
POST /api/voice/lesson-chat
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "message": "I want to practice ordering food at a restaurant.",
  "lessonData": {
    "title": "Restaurant Ordering",
    "scenarioType": "restaurant",
    "learningObjectives": ["Order food politely", "Ask about menu items"],
    "vocabulary": {
      "appetizer": "small dish served before main course",
      "entrée": "main course of a meal"
    },
    "grammarFocus": ["Polite requests", "Modal verbs"]
  },
  "conversationHistory": [],
  "teacherProfile": {
    "name": "Sarah",
    "personality": {
      "title": "Restaurant Manager",
      "catchPhrases": ["Welcome to our restaurant!", "Excellent choice!"]
    }
  },
  "isVoiceTranscription": false
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "text": "Welcome to our restaurant! I'm Sarah, and I'll be helping you today. Here's our menu - we have some wonderful appetizers and entrées. What catches your eye?",
    "sentences": [
      "Welcome to our restaurant!",
      "I'm Sarah, and I'll be helping you today.",
      "Here's our menu - we have some wonderful appetizers and entrées.",
      "What catches your eye?"
    ],
    "corrections": [],
    "suggestions": [
      "Try using the word 'appetizer' in your next response."
    ]
  }
}
```

## 👨‍🏫 Teacher Profiles (`/api/teacher-profiles`)

### Get Available Teachers
Get all available teacher profiles for the authenticated user.

```http
GET /api/teacher-profiles
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "profile_cuid",
      "name": "Professor Hamilton",
      "description": "Distinguished academic with expertise in business English and professional communication",
      "isSystemProfile": true,
      "personality": {
        "name": "Professor Hamilton",
        "title": "Business English Professor",
        "background": "Oxford-educated with 20+ years experience",
        "specialties": ["Business English", "Academic Writing", "Professional Communication"],
        "catchPhrases": ["Excellent work!", "Let's refine that further", "Precision in language matters"],
        "motivationalStyle": "Encouraging yet demanding excellence",
        "avatarUrl": "/avatars/professor-hamilton.jpg",
        "bannerColor": "#2563eb"
      },
      "voiceConfig": {
        "voice": "onyx",
        "speed": 0.9,
        "accent": "british"
      },
      "teachingStyle": {
        "personality": "professional",
        "formality": "formal",
        "correctionStyle": "detailed",
        "encouragementLevel": "moderate",
        "adaptability": 8
      },
      "teachingFocus": {
        "primaryFocus": "grammar",
        "secondaryFocus": "vocabulary",
        "detailLevel": "advanced",
        "methodology": "academic"
      },
      "isActive": true
    }
  ]
}
```

### Get User Teacher Preferences
Get user's current teacher preferences.

```http
GET /api/teacher-profiles/user-preferences
Authorization: Bearer <access_token>
```

### Set Teacher Preferences
Set user's teacher profile preferences.

```http
POST /api/teacher-profiles/user-preferences
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "profileId": "profile_cuid",
  "customizations": {
    "voiceConfig": {
      "speed": 1.1
    },
    "teachingStyle": {
      "correctionStyle": "gentle"
    }
  }
}
```

### Get Active Teacher
Get user's currently active teacher profile.

```http
GET /api/teacher-profiles/active
Authorization: Bearer <access_token>
```

### Create Custom Teacher
Create a custom teacher profile.

```http
POST /api/teacher-profiles/custom
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "My Custom Teacher",
  "description": "A patient and encouraging teacher focused on conversation practice",
  "personality": {
    "name": "Ms. Johnson",
    "title": "Conversation Coach",
    "background": "Friendly conversation specialist",
    "specialties": ["Daily Conversation", "Pronunciation"],
    "catchPhrases": ["Great effort!", "Keep it up!", "You're improving!"],
    "motivationalStyle": "Very encouraging and patient"
  },
  "voiceConfig": {
    "voice": "nova",
    "speed": 1.0,
    "accent": "american"
  },
  "teachingStyle": {
    "personality": "friendly",
    "formality": "casual",
    "correctionStyle": "gentle",
    "encouragementLevel": "high",
    "adaptability": 9
  },
  "teachingFocus": {
    "primaryFocus": "conversation",
    "secondaryFocus": "pronunciation",
    "detailLevel": "intermediate",
    "methodology": "communicative"
  }
}
```

### Set Active Teacher
Set the active teacher profile for the user.

```http
POST /api/teacher-profiles/set-active
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "teacherId": "profile_cuid"
}
```

## 🔌 WebSocket API

### Real-time Voice Conversation
Connect to the voice WebSocket for real-time conversation.

**Connection URL:**
```
wss://api.englishai.com/api/voice/realtime?lessonId=lesson_id&token=jwt_token
```

**Message Types:**

#### Send Audio Data
```json
{
  "type": "audio_data",
  "audio": "base64_encoded_audio_chunk",
  "format": "webm"
}
```

#### End Audio Input
```json
{
  "type": "audio_end"
}
```

#### Send Text Message
```json
{
  "type": "text_message",
  "message": "Hello, I want to practice my English"
}
```

#### Receive Sentence Stream
```json
{
  "type": "sentence_stream",
  "text": "Hello! Welcome to today's lesson.",
  "index": 0,
  "total": 3,
  "isLast": false
}
```

#### Receive Sentence Audio
```json
{
  "type": "sentence_audio",
  "text": "Hello! Welcome to today's lesson.",
  "audio": "base64_encoded_mp3_data",
  "index": 0
}
```

#### Receive Transcription
```json
{
  "type": "transcription",
  "text": "Hello, I want to practice English"
}
```

#### Receive Error
```json
{
  "type": "error",
  "error": "Speech recognition failed"
}
```

## ❌ Error Handling

### Standard Error Response Format
```json
{
  "error": "Error message",
  "message": "Detailed error description",
  "statusCode": 400
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Validation Errors
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must contain at least 8 characters"
    }
  ]
}
```

## 🔧 Development & Testing

### Health Check
Check API server health.

```http
GET /health
```

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-07-31T12:00:00.000Z",
  "uptime": 86400,
  "version": "1.0.0"
}
```

### Debug Endpoints (Development Only)
```http
GET /api/debug/learning-request    # Debug learning requests
GET /api/learning/paths-direct     # Direct database access
```

### Mock Mode
When `OPENAI_API_KEY` is not configured, the API operates in mock mode:
- Mock transcriptions for speech-to-text
- Mock AI responses for conversations
- Fallback behavior for all OpenAI-dependent features

## 📊 Rate Limiting

Production API includes rate limiting:
- **General Endpoints**: 100 requests per 15 minutes per IP
- **Authentication**: 5 login attempts per 15 minutes per IP
- **Voice Processing**: 50 requests per 15 minutes per user
- **File Uploads**: 10 uploads per hour per user

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Parameterized queries via Prisma
- **CORS Protection**: Configured allowed origins
- **Rate Limiting**: Request throttling
- **Security Headers**: Helmet.js security headers
- **Password Hashing**: bcrypt with salt rounds

This comprehensive API documentation covers all endpoints, authentication methods, request/response formats, and integration details for the EnglishAI learning platform.