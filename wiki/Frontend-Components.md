# Frontend Components

This guide covers the React component architecture, patterns, and usage in the EnglishAI Master frontend application built with Next.js 14.

## 🏗️ Component Architecture

The frontend follows a modern React component architecture with TypeScript, organized into logical feature-based modules.

### Directory Structure
```
src/components/
├── auth/                      # Authentication components
│   ├── LoginForm.tsx         # Login form with validation
│   └── SocialLoginButtons.tsx # OAuth login buttons
├── conversation/              # Chat and voice conversation
│   ├── AIConversation.tsx    # Text-based AI chat interface
│   ├── SimpleAIChat.tsx      # Simplified chat component
│   ├── SimpleVoiceDemo.tsx   # Voice conversation demo
│   ├── UnifiedLessonConversation.tsx # Complete lesson chat
│   └── VoiceConversation.tsx # Real-time voice interface
├── dashboard/                 # Dashboard and overview
│   └── TeacherHero.tsx       # Teacher profile showcase
├── lesson/                    # Lesson-specific components
│   ├── PostLessonTeacherSuggestions.tsx # Post-lesson feedback
│   └── PreLessonModal.tsx    # Pre-lesson preparation
├── navigation/                # Navigation and routing
│   ├── Navbar.tsx            # Main navigation bar
│   └── TeacherSelector.tsx   # AI teacher selection
├── settings/                  # User preferences
│   └── TeacherProfileSettings.tsx # Teacher customization
└── ui/                        # Reusable UI components
    └── AuthButtons.tsx       # Authentication action buttons
```

## 🔐 Authentication Components

### LoginForm Component
Email/password authentication with comprehensive validation.

```typescript
// apps/web/src/components/auth/LoginForm.tsx
interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function LoginForm({ onSuccess, redirectTo }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form validation and submission logic
  // Integration with NextAuth.js signIn
}
```

**Features:**
- Real-time form validation
- Error handling with user feedback
- Loading states during authentication
- Redirect handling after successful login
- Integration with NextAuth.js

**Usage:**
```jsx
<LoginForm 
  onSuccess={() => router.push('/dashboard')}
  redirectTo="/learning"
/>
```

### SocialLoginButtons Component
OAuth authentication with multiple providers.

```typescript
// Support for Google, Microsoft, Apple OAuth
interface SocialLoginButtonsProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}
```

**Features:**
- Google OAuth integration
- Microsoft OAuth integration
- Apple OAuth (future implementation)
- Consistent styling and branding
- Error handling for OAuth failures

## 💬 Conversation Components

### UnifiedLessonConversation Component
The primary conversation interface for lesson-based learning.

**Key Features:**
- Real-time AI conversation
- Voice recognition and synthesis
- Progress tracking within lessons
- Teacher personality integration
- Grammar and vocabulary corrections
- Learning objective tracking

**Props Interface:**
```typescript
interface UnifiedLessonConversationProps {
  lessonData: {
    id: string;
    title: string;
    scenarioType: string;
    learningObjectives: string[];
    vocabulary: Record<string, string>;
    grammarFocus: string[];
  };
  teacherProfile?: TeacherProfile;
  onProgress?: (progress: LessonProgress) => void;
}
```

**Core Functionality:**
```typescript
const UnifiedLessonConversation: React.FC<Props> = ({ 
  lessonData, 
  teacherProfile,
  onProgress 
}) => {
  // State management for conversation
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState(teacherProfile);
  
  // Voice recognition hook
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true
  });
  
  // AI conversation logic
  const sendMessage = async (message: string) => {
    // Add user message
    // Call API for AI response
    // Handle voice synthesis
    // Update progress tracking
  };
  
  return (
    <div className="conversation-container">
      <TeacherHeader teacher={currentTeacher} />
      <MessageList messages={messages} />
      <VoiceControls 
        isListening={isListening}
        onStartListening={startListening}
        onStopListening={stopListening}
      />
      <MessageInput onSend={sendMessage} />
      <ProgressIndicator lesson={lessonData} />
    </div>
  );
};
```

### SimpleVoiceDemo Component
Demonstration component for voice conversation capabilities.

**Features:**
- Simplified voice interface
- Real-time speech recognition
- Text-to-speech synthesis
- Audio visualization
- Connection status indicators

### VoiceConversation Component
Advanced real-time voice conversation with WebSocket integration.

**Key Features:**
- WebSocket-based real-time communication
- Streaming audio processing
- Parallel sentence generation and audio synthesis
- Connection management and error recovery
- Audio playback queue management

## 🎯 Lesson Components

### PreLessonModal Component
Modal dialog for lesson preparation and teacher selection.

```typescript
interface PreLessonModalProps {
  lesson: Lesson;
  isOpen: boolean;
  onClose: () => void;
  onStart: (config: LessonConfig) => void;
}
```

**Features:**
- Lesson overview and objectives
- Teacher selection interface
- Voice settings configuration
- Learning goals review
- Progress indicators

### PostLessonTeacherSuggestions Component
Post-lesson feedback and improvement suggestions.

**Features:**
- Performance analysis display
- Personalized improvement suggestions
- Progress tracking visualization
- Next lesson recommendations
- Achievement celebrations

## 🧭 Navigation Components

### Navbar Component
Main application navigation with responsive design.

**Features:**
- Responsive navigation menu
- User authentication status
- Active route highlighting
- Mobile-friendly hamburger menu
- Quick access to key features

```typescript
const Navbar: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Logo />
        <NavLinks session={session} />
        <UserMenu session={session} />
        <MobileMenuToggle />
      </div>
    </nav>
  );
};
```

### TeacherSelector Component
Interface for selecting and customizing AI teacher profiles.

**Features:**
- Teacher profile gallery
- Personality customization
- Voice configuration options
- Preview functionality
- Responsive card layout

## ⚙️ Settings Components

### TeacherProfileSettings Component
Comprehensive teacher customization interface.

**Configuration Options:**
- **Personality Settings**: Formality, encouragement level, correction style
- **Voice Configuration**: Voice selection, speed, accent preferences
- **Teaching Focus**: Primary/secondary focus areas, detail level
- **Learning Methodology**: Academic, communicative, task-based approaches

```typescript
interface TeacherProfileSettingsProps {
  profile: TeacherProfile;
  onSave: (updates: Partial<TeacherProfile>) => void;
  onCancel: () => void;
}
```

## 🎨 UI Components

### Reusable Component Library
Base UI components following consistent design patterns.

**Button Components:**
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

**Form Components:**
- Input fields with validation
- Select dropdowns with search
- Checkbox and radio groups
- File upload components
- Form validation display

**Layout Components:**
- Container and grid systems
- Card and panel layouts
- Modal and drawer components
- Loading and skeleton states

## 🔗 Custom Hooks

### useSpeechRecognition Hook
Comprehensive speech recognition and synthesis functionality.

```typescript
interface SpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
}

export function useSpeechRecognition(options?: SpeechRecognitionOptions) {
  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Text-to-speech functionality
  const speak = useCallback((text: string, options?: TTSOptions) => {
    // Implementation
  }, []);
  
  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    speak,
    stopSpeaking
  };
}
```

### useActiveTeacher Hook
State management for active teacher profile.

```typescript
export function useActiveTeacher() {
  const [activeTeacher, setActiveTeacher] = useState<TeacherProfile | null>(null);
  
  const switchTeacher = useCallback(async (teacherId: string) => {
    // API call to update active teacher
    // Update local state
  }, []);
  
  return {
    activeTeacher,
    switchTeacher,
    isLoading
  };
}
```

### useSocket Hook
WebSocket connection management for real-time features.

```typescript
export function useSocket(url: string, options?: SocketOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Connection management
  // Event handling
  // Error recovery
  
  return {
    socket,
    isConnected,
    emit,
    on,
    off
  };
}
```

## 🎨 Styling and Theming

### Tailwind CSS Integration
Utility-first CSS framework with custom configuration.

**Color Palette:**
```typescript
// Primary brand colors
primary: {
  50: '#eff6ff',
  500: '#3b82f6',
  900: '#1e3a8a'
}

// Accent colors for teacher personalities
accent: {
  professor: '#2563eb',
  casual: '#10b981',
  business: '#6366f1'
}
```

**Component Styling Patterns:**
```typescript
// Consistent button styling
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-primary-600 text-white hover:bg-primary-700",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200"
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4",
        lg: "h-11 px-8"
      }
    }
  }
);
```

### Responsive Design
Mobile-first approach with breakpoint-specific styles.

```typescript
// Responsive breakpoints
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px'
};
```

## ⚡ Performance Optimization

### Code Splitting
Automatic route-based and manual component splitting.

```typescript
// Dynamic imports for heavy components
const VoiceConversation = dynamic(
  () => import('./VoiceConversation'),
  { 
    loading: () => <LoadingSkeleton />,
    ssr: false 
  }
);
```

### Memoization
Strategic use of React.memo, useMemo, and useCallback.

```typescript
// Memoized expensive calculations
const conversationAnalysis = useMemo(() => {
  return analyzeConversationProgress(messages);
}, [messages]);

// Memoized event handlers
const handleMessageSend = useCallback((message: string) => {
  sendMessage(message);
}, [sendMessage]);
```

### State Management
Efficient state updates and minimal re-renders.

```typescript
// Zustand store for global state
interface ConversationStore {
  messages: Message[];
  isLoading: boolean;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
}
```

## 🧪 Testing Components

### Component Testing Strategy
```typescript
// React Testing Library example
describe('LoginForm', () => {
  it('validates email format', async () => {
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();
  });
});
```

### E2E Testing
```typescript
// Playwright example
test('complete conversation flow', async ({ page }) => {
  await page.goto('/learning/business-path/lesson/interview-prep');
  
  // Start conversation
  await page.click('[data-testid="start-conversation"]');
  
  // Send message
  await page.fill('[data-testid="message-input"]', 'Hello, I want to practice');
  await page.click('[data-testid="send-message"]');
  
  // Verify AI response
  await expect(page.locator('[data-testid="ai-message"]')).toBeVisible();
});
```

This comprehensive component documentation provides developers with detailed information about the frontend architecture, component usage, and implementation patterns in the EnglishAI Master application.