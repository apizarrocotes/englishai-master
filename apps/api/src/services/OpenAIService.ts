import OpenAI from 'openai';
import { logger } from '@/utils/logger';
import { TeacherProfile } from '@/types/TeacherProfile';
import TeacherProfileService from './TeacherProfileService';

interface TeacherPersona {
  id: string;
  name: string;
  role: string;
  personality: string;
  accent: string;
  specialties: string[];
  adaptability: number;
}

interface LessonContext {
  title: string;
  objectives: string[];
  vocabulary: Record<string, string>;
  grammarFocus: string[];
  difficultyLevel: number;
  scenarioType: string;
}

interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface AIResponse {
  message: string;
  corrections?: {
    original: string;
    corrected: string;
    explanation: string;
    type: 'grammar' | 'vocabulary' | 'pronunciation' | 'usage';
  }[];
  feedback?: {
    strengths: string[];
    improvements: string[];
    score: number;
  };
  suggestions?: string[];
}

export class OpenAIService {
  private client: OpenAI;
  private chatModel: string;
  private simpleModel: string;
  private whisperModel: string;
  private ttsModel: string;
  private ttsVoice: string;
  private teacherProfileService: TeacherProfileService;

  constructor() {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'test-key') {
      logger.warn('OpenAI API key not configured - using mock mode');
      this.client = new OpenAI({
        apiKey: 'test-key',
      });
    } else {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        organization: process.env.OPENAI_ORGANIZATION
      });
    }

    // Configure models from environment variables with fallbacks
    this.chatModel = process.env.OPENAI_CHAT_MODEL || 'gpt-4.1-2025-04-14';
    this.simpleModel = process.env.OPENAI_SIMPLE_MODEL || 'gpt-4.1-mini-2025-04-14';
    this.whisperModel = process.env.OPENAI_WHISPER_MODEL || 'whisper-1';
    this.ttsModel = process.env.OPENAI_TTS_MODEL || 'tts-1-hd';
    this.ttsVoice = process.env.OPENAI_TTS_VOICE || 'nova';
    
    // Initialize teacher profile service
    this.teacherProfileService = new TeacherProfileService();
  }

  /**
   * Generate system prompt for AI teacher based on teacher profile and lesson context
   */
  private generateSystemPromptFromProfile(teacherProfile: TeacherProfile, lessonContext: LessonContext): string {
    const { personality, teachingStyle, teachingFocus } = teacherProfile;
    
    // Use custom template if provided, otherwise generate dynamic one
    if (teacherProfile.systemPromptTemplate && teacherProfile.systemPromptTemplate.length > 100) {
      // Replace template variables in custom prompt
      return teacherProfile.systemPromptTemplate
        .replace(/\{lessonTitle\}/g, lessonContext.title)
        .replace(/\{difficultyLevel\}/g, lessonContext.difficultyLevel.toString())
        .replace(/\{scenarioType\}/g, lessonContext.scenarioType)
        .replace(/\{objectives\}/g, lessonContext.objectives.join(', '))
        .replace(/\{vocabulary\}/g, Object.entries(lessonContext.vocabulary).map(([word, def]) => `${word} (${def})`).join(', '))
        .replace(/\{grammarFocus\}/g, lessonContext.grammarFocus.join(', '));
    }

    // Generate dynamic system prompt based on profile configuration
    return `You are ${personality.name}, ${personality.title} ${personality.background}

PERSONALITY & STYLE:
- Teaching Personality: ${teachingStyle.personality} and ${teachingStyle.formality}
- Correction Style: ${teachingStyle.correctionStyle}
- Encouragement Level: ${teachingStyle.encouragementLevel}
- Adaptability: ${teachingStyle.adaptability}/10 (how much you adapt to student level)
- Specialties: ${personality.specialties.join(', ')}
- Motivational Style: ${personality.motivationalStyle}

LESSON CONTEXT:
- Title: ${lessonContext.title}
- Difficulty Level: ${lessonContext.difficultyLevel}/5
- Scenario: ${lessonContext.scenarioType}
- Learning Objectives: ${lessonContext.objectives.join(', ')}
- Key Vocabulary: ${Object.entries(lessonContext.vocabulary).map(([word, def]) => `${word} (${def})`).join(', ')}
- Grammar Focus: ${lessonContext.grammarFocus.join(', ')}

TEACHING APPROACH:
- Primary Focus: ${teachingFocus.primaryFocus}
${teachingFocus.secondaryFocus ? `- Secondary Focus: ${teachingFocus.secondaryFocus}` : ''}
- Detail Level: ${teachingFocus.detailLevel}
- Methodology: ${teachingFocus.methodology}

CHARACTERISTIC PHRASES:
Use these phrases naturally in conversation: ${personality.catchPhrases.map(phrase => `"${phrase}"`).join(', ')}

INSTRUCTIONS:
1. Stay in character as ${personality.name} throughout the conversation
2. Adapt your language complexity to level ${lessonContext.difficultyLevel}/5
3. Apply your correction style: ${teachingStyle.correctionStyle}
4. Use ${teachingStyle.encouragementLevel} level encouragement
5. Focus primarily on ${teachingFocus.primaryFocus}${teachingFocus.secondaryFocus ? ` and secondarily on ${teachingFocus.secondaryFocus}` : ''}
6. Guide conversation toward ${lessonContext.scenarioType} scenarios
7. Use your characteristic teaching personality: ${teachingStyle.personality}
8. Maintain ${teachingStyle.formality} formality level

Begin the conversation in character, greeting the student and introducing the lesson scenario according to your personality and teaching style.`;
  }

  /**
   * Generate system prompt for AI teacher based on lesson context and persona (legacy method)
   */
  private generateSystemPrompt(persona: TeacherPersona, lessonContext: LessonContext): string {
    return `You are ${persona.name}, an experienced English ${persona.role.toLowerCase()} with a ${persona.personality} personality. You speak with a ${persona.accent} accent and specialize in ${persona.specialties.join(', ')}.

LESSON CONTEXT:
- Title: ${lessonContext.title}
- Difficulty Level: ${lessonContext.difficultyLevel}/5
- Scenario: ${lessonContext.scenarioType}
- Learning Objectives: ${lessonContext.objectives.join(', ')}
- Key Vocabulary: ${Object.entries(lessonContext.vocabulary).map(([word, def]) => `${word} (${def})`).join(', ')}
- Grammar Focus: ${lessonContext.grammarFocus.join(', ')}

INSTRUCTIONS:
1. Stay in character as ${persona.name} throughout the conversation
2. Adapt your language complexity to level ${lessonContext.difficultyLevel}/5
3. Focus on the lesson objectives and encourage use of target vocabulary
4. Provide gentle corrections when needed, explaining grammar and usage errors
5. Keep the conversation natural and engaging while educational
6. Guide the conversation toward the lesson's scenario type (${lessonContext.scenarioType})
7. Ask follow-up questions to encourage practice
8. Celebrate progress and provide positive reinforcement

RESPONSE FORMAT:
Always respond with natural, conversational English appropriate for the lesson level. After your response, if the student made errors, provide helpful corrections in a supportive way.

Begin the conversation by greeting the student and introducing the lesson scenario in a friendly, encouraging manner.`;
  }

  /**
   * Generate AI teacher response using configurable teacher profile
   */
  async generateTeacherResponseWithProfile(
    userMessage: string,
    conversationHistory: ConversationMessage[],
    userId: string,
    lessonContext: LessonContext
  ): Promise<AIResponse> {
    try {
      // Get user's active teacher profile
      const teacherProfile = await this.teacherProfileService.getUserActiveTeacherProfile(userId);
      if (!teacherProfile) {
        throw new Error('No active teacher profile found for user');
      }

      // Prepare messages for OpenAI
      const systemPrompt = this.generateSystemPromptFromProfile(teacherProfile, lessonContext);
      
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ];

      // Generate main response using configured voice settings
      const completion = await this.client.chat.completions.create({
        model: this.chatModel,
        messages,
        max_tokens: 300,
        temperature: 0.7,
        presence_penalty: 0.3,
        frequency_penalty: 0.3,
      });

      const aiMessage = completion.choices[0]?.message?.content || 
        `I apologize, but I couldn't generate a response. Please try again.`;

      // Generate corrections and feedback based on teaching style
      const corrections = teacherProfile.teachingStyle.correctionStyle !== 'never_interrupt' 
        ? await this.analyzeAndCorrect(userMessage, lessonContext)
        : undefined;
      
      const suggestions = this.generateSuggestions(userMessage, lessonContext);

      logger.info('AI teacher response generated with profile', {
        userId,
        profileId: teacherProfile.id,
        profileName: teacherProfile.name,
        userMessage: userMessage.substring(0, 100),
        responseLength: aiMessage.length,
        correctionsCount: corrections?.length || 0
      });

      return {
        message: aiMessage,
        corrections: corrections && corrections.length > 0 ? corrections : undefined,
        suggestions
      };

    } catch (error) {
      logger.error('Error generating AI teacher response with profile', {
        error: (error as Error).message,
        userId,
        userMessage: userMessage.substring(0, 100)
      });
      
      // Fallback response
      return {
        message: `I'm sorry, I'm having trouble responding right now. Let's continue practicing - can you tell me more about ${lessonContext.title.toLowerCase()}?`,
        suggestions: ['Try rephrasing your message', 'Ask me about the lesson topic', 'Practice using the vocabulary words']
      };
    }
  }

  /**
   * Generate AI teacher response based on conversation history (legacy method for backward compatibility)
   */
  async generateTeacherResponse(
    userMessage: string,
    conversationHistory: ConversationMessage[],
    persona: TeacherPersona,
    lessonContext: LessonContext
  ): Promise<AIResponse> {
    try {
      // Prepare messages for OpenAI
      const systemPrompt = this.generateSystemPrompt(persona, lessonContext);
      
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ];

      // Generate main response
      const completion = await this.client.chat.completions.create({
        model: this.chatModel,
        messages,
        max_tokens: 300,
        temperature: 0.7,
        presence_penalty: 0.3,
        frequency_penalty: 0.3,
      });

      const aiMessage = completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';

      // Generate corrections and feedback if needed
      const corrections = await this.analyzeAndCorrect(userMessage, lessonContext);
      const suggestions = this.generateSuggestions(userMessage, lessonContext);

      logger.info('AI teacher response generated', {
        userMessage: userMessage.substring(0, 100),
        responseLength: aiMessage.length,
        correctionsCount: corrections?.length || 0
      });

      return {
        message: aiMessage,
        corrections: corrections && corrections.length > 0 ? corrections : undefined,
        suggestions
      };

    } catch (error) {
      logger.error('Error generating AI teacher response', {
        error: (error as Error).message,
        userMessage: userMessage.substring(0, 100)
      });
      
      // Fallback response
      return {
        message: `I'm sorry, I'm having trouble responding right now. Let's continue practicing - can you tell me more about ${lessonContext.title.toLowerCase()}?`,
        suggestions: ['Try rephrasing your message', 'Ask me about the lesson topic', 'Practice using the vocabulary words']
      };
    }
  }

  /**
   * Analyze user message and provide corrections
   */
  private async analyzeAndCorrect(
    userMessage: string, 
    lessonContext: LessonContext
  ): Promise<AIResponse['corrections']> {
    try {
      const correctionPrompt = `As an English teacher, analyze this student message for errors and provide corrections:

Student message: "${userMessage}"

Lesson context: ${lessonContext.title} (Level ${lessonContext.difficultyLevel}/5)
Grammar focus: ${lessonContext.grammarFocus.join(', ')}

Provide corrections in this JSON format:
{
  "corrections": [
    {
      "original": "incorrect phrase",
      "corrected": "correct phrase", 
      "explanation": "brief explanation",
      "type": "grammar|vocabulary|usage"
    }
  ]
}

Only include corrections if there are actual errors. If the message is correct, return empty corrections array.`;

      const completion = await this.client.chat.completions.create({
        model: this.simpleModel,
        messages: [{ role: 'user', content: correctionPrompt }],
        max_tokens: 200,
        temperature: 0.2,
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        try {
          const parsed = JSON.parse(response);
          return parsed.corrections || [];
        } catch {
          // If JSON parsing fails, return empty array
          return [];
        }
      }

      return [];
    } catch (error) {
      logger.error('Error analyzing message for corrections', { error: (error as Error).message });
      return [];
    }
  }

  /**
   * Generate helpful suggestions based on lesson context
   */
  private generateSuggestions(userMessage: string, lessonContext: LessonContext): string[] {
    const suggestions: string[] = [];
    
    // Check if user used target vocabulary
    const vocabularyWords = Object.keys(lessonContext.vocabulary);
    const usedVocabulary = vocabularyWords.filter(word => 
      userMessage.toLowerCase().includes(word.toLowerCase())
    );
    
    if (usedVocabulary.length === 0 && vocabularyWords.length > 0) {
      const randomWord = vocabularyWords[Math.floor(Math.random() * vocabularyWords.length)];
      suggestions.push(`Try using the word "${randomWord}" in your response`);
    }

    // Grammar suggestions based on lesson focus
    if (lessonContext.grammarFocus.includes('Present simple') && !userMessage.match(/\b(is|are|am|do|does|have|has)\b/i)) {
      suggestions.push('Practice using present simple tense in your response');
    }

    if (lessonContext.grammarFocus.includes('Past tense') && !userMessage.match(/\b(was|were|did|had|went|came|said)\b/i)) {
      suggestions.push('Try describing something that happened in the past');
    }

    // Scenario-specific suggestions
    if (lessonContext.scenarioType === 'interview' && !userMessage.includes('?')) {
      suggestions.push('In interviews, it\'s good to ask questions too!');
    }

    if (lessonContext.scenarioType === 'networking' && userMessage.length < 20) {
      suggestions.push('In networking, try to elaborate more on your background');
    }

    return suggestions.slice(0, 2); // Limit to 2 suggestions
  }

  /**
   * Generate conversation starter based on lesson scenario
   */
  async generateConversationStarter(
    persona: TeacherPersona,
    lessonContext: LessonContext
  ): Promise<string> {
    try {
      const starterPrompt = `You are ${persona.name}, starting a conversation practice session for the lesson "${lessonContext.title}".

Scenario: ${lessonContext.scenarioType}
Level: ${lessonContext.difficultyLevel}/5

Generate a natural, engaging opening message that:
1. Greets the student warmly
2. Introduces the practice scenario
3. Asks an opening question to start the conversation
4. Matches the difficulty level and scenario type

Keep it conversational and encouraging, maximum 2-3 sentences.`;

      const completion = await this.client.chat.completions.create({
        model: this.simpleModel,
        messages: [{ role: 'user', content: starterPrompt }],
        max_tokens: 150,
        temperature: 0.8,
      });

      return completion.choices[0]?.message?.content || 
        `Hello! I'm ${persona.name}, and I'm excited to practice ${lessonContext.title} with you today. Let's start with a simple question - how are you feeling about this lesson?`;

    } catch (error) {
      logger.error('Error generating conversation starter', { error: (error as Error).message });
      return `Hello! I'm ${persona.name}. Let's practice ${lessonContext.title} together. Are you ready to start?`;
    }
  }

  /**
   * Evaluate overall conversation performance
   */
  async evaluateConversation(
    messages: ConversationMessage[],
    lessonContext: LessonContext
  ): Promise<{
    overallScore: number;
    feedback: {
      strengths: string[];
      improvements: string[];
      vocabularyUsage: number;
      grammarAccuracy: number;
      fluency: number;
    };
  }> {
    try {
      const userMessages = messages.filter(msg => msg.role === 'user').map(msg => msg.content);
      
      const evaluationPrompt = `Evaluate this English conversation practice session:

Lesson: ${lessonContext.title} (Level ${lessonContext.difficultyLevel}/5)
Target vocabulary: ${Object.keys(lessonContext.vocabulary).join(', ')}
Grammar focus: ${lessonContext.grammarFocus.join(', ')}

Student messages:
${userMessages.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}

Provide evaluation in JSON format:
{
  "overallScore": 0-100,
  "feedback": {
    "strengths": ["positive aspects"],
    "improvements": ["areas to work on"],
    "vocabularyUsage": 0-100,
    "grammarAccuracy": 0-100,
    "fluency": 0-100
  }
}`;

      const completion = await this.client.chat.completions.create({
        model: this.simpleModel,
        messages: [{ role: 'user', content: evaluationPrompt }],
        max_tokens: 300,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        try {
          return JSON.parse(response);
        } catch {
          // Fallback evaluation
          return this.generateFallbackEvaluation(userMessages, lessonContext);
        }
      }

      return this.generateFallbackEvaluation(userMessages, lessonContext);

    } catch (error) {
      logger.error('Error evaluating conversation', { error: (error as Error).message });
      return this.generateFallbackEvaluation([], lessonContext);
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper
   */
  async transcribeAudio(audioBuffer: Buffer, format: string = 'webm'): Promise<{ text: string }> {
    try {
      // Check if we're in mock mode (no real API key)
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'test-key') {
        logger.warn('OpenAI API key not configured - using mock transcription');
        // Return a mock transcription for development
        const mockTranscriptions = [
          "Hello, I would like to order something to eat.",
          "Can I see the menu please?",
          "What do you recommend for today?",
          "I'll have the chicken sandwich.",
          "Could I get some water with that?",
          "Thank you very much!"
        ];
        const randomText = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
        return { text: randomText };
      }

      // Create a temporary file for the audio
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      
      const tempDir = os.tmpdir();
      const tempFileName = `audio_${Date.now()}.${format === 'webm' ? 'webm' : 'wav'}`;
      const tempFilePath = path.join(tempDir, tempFileName);
      
      // Write buffer to temporary file
      fs.writeFileSync(tempFilePath, audioBuffer);
      
      try {
        // Create a ReadStream for the file
        const audioFile = fs.createReadStream(tempFilePath);
        
        // Transcribe using OpenAI Whisper
        const transcription = await this.client.audio.transcriptions.create({
          file: audioFile,
          model: this.whisperModel,
          language: 'en', // Specify English for better accuracy
        });
        
        return { text: transcription.text || '' };
        
      } finally {
        // Clean up temporary file
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          logger.warn('Failed to cleanup temp audio file', { error: (cleanupError as Error).message });
        }
      }
      
    } catch (error) {
      logger.error('Error transcribing audio', { error: (error as Error).message });
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Generate simple AI response for voice conversations
   */
  async generateContextualResponse(userText: string, context: string): Promise<string> {
    try {
      // Check if we're in mock mode (no real API key)
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'test-key') {
        logger.warn('OpenAI API key not configured - using mock AI response');
        // Return a mock response for development
        const mockResponses = [
          "That's interesting! Can you tell me more about that?",
          "I understand. What would you like to talk about next?",
          "Great point! How do you feel about this topic?",
          "Thanks for sharing that with me. What else is on your mind?",
          "I see. Can you elaborate on that a bit more?",
          "That sounds good! What's your next question?"
        ];
        const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        return randomResponse;
      }

      // Generate contextual AI response using OpenAI with teacher profile
      const completion = await this.client.chat.completions.create({
        model: this.simpleModel,
        messages: [
          {
            role: 'system',
            content: context
          },
          {
            role: 'user',
            content: userText
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content?.trim();
      if (!response) {
        throw new Error('No response generated from OpenAI');
      }

      return response;
    } catch (error) {
      logger.error('Error generating contextual AI response', { 
        error: (error as Error).message,
        userText,
        context: context.substring(0, 200) + '...'
      });
      throw error;
    }
  }

  async generateSimpleResponse(userText: string): Promise<string> {
    try {
      // Check if we're in mock mode (no real API key)
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'test-key') {
        logger.warn('OpenAI API key not configured - using mock AI response');
        // Return a mock response for development
        const mockResponses = [
          "That's interesting! Can you tell me more about that?",
          "I understand. What would you like to talk about next?",
          "Great point! How do you feel about this topic?",
          "Thanks for sharing that with me. What else is on your mind?",
          "I see. Can you elaborate on that a bit more?",
          "That sounds good! What's your next question?"
        ];
        const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        return randomResponse;
      }

      // Generate real AI response using OpenAI
      const completion = await this.client.chat.completions.create({
        model: this.simpleModel,
        messages: [
          {
            role: 'system',
            content: `You are a friendly English conversation partner helping someone practice English. Keep your responses:
            - Natural and conversational
            - Appropriate for the context
            - Encouraging and supportive
            - 1-2 sentences long
            - Easy to understand
            
            Respond to what the user says in a helpful, engaging way.`
          },
          {
            role: 'user',
            content: userText
          }
        ],
        max_tokens: 100,
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0]?.message?.content || 
        "I'm sorry, I didn't quite understand that. Could you try saying it again?";

      logger.info('Simple AI response generated', {
        userText: userText.substring(0, 50),
        responseLength: aiResponse.length
      });

      return aiResponse;

    } catch (error) {
      logger.error('Error generating simple AI response', { 
        error: (error as Error).message,
        userText: userText.substring(0, 50)
      });
      
      // Fallback response
      return "I'm having trouble understanding right now. Could you please try again?";
    }
  }

  /**
   * Generate fallback evaluation when AI fails
   */
  private generateFallbackEvaluation(userMessages: string[], lessonContext: LessonContext) {
    const messageCount = userMessages.length;
    const totalWords = userMessages.join(' ').split(' ').length;
    const avgWordsPerMessage = messageCount > 0 ? totalWords / messageCount : 0;
    
    // Basic scoring based on participation
    let score = 60; // Base score
    if (messageCount >= 5) score += 20; // Good participation
    if (avgWordsPerMessage >= 10) score += 10; // Detailed responses
    if (totalWords >= 50) score += 10; // Overall engagement
    
    return {
      overallScore: Math.min(score, 100),
      feedback: {
        strengths: messageCount >= 5 ? ['Good participation in conversation'] : ['Engaged in the practice'],
        improvements: avgWordsPerMessage < 8 ? ['Try to elaborate more in your responses'] : ['Keep up the good work'],
        vocabularyUsage: 70,
        grammarAccuracy: 75,
        fluency: 65
      }
    };
  }
}