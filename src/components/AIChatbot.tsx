// Shauli AI Chatbot Component - PRODUCTION BUILD FIX v2.0
import React, { useState, useRef, useEffect } from 'react';
import pittsburghJewishKnowledgeBase from '../data/pittsburghJewishInfo';
import { OPENAI_CONFIG, SYSTEM_PROMPT } from '../config/openai';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface AIChatbotProps {
  language?: 'en' | 'he';
}

const chatbotStarters = {
  en: "Shalom! I'm Shauli. I made aliyah… in reverse 🤷‍♂️ — from Petach Tikva all the way to Pittsburgh. Fifteen years later, I know the community here like I know the price of cottage cheese back in Israel. Need to find a school, shul, kosher pizza, or just figure out how to survive a Pittsburgh winter without crying to your ima? Ask me anything—I'm here to help, with answers and maybe even a joke. 😄",
  he: "שלום! אני שאולי. עשיתי עלייה... הפוכה 🤷‍♂️ — מפתח תקווה עד פיטסבורג. אחרי חמש עשרה שנים, אני מכיר את הקהילה כאן כמו שאני מכיר את מחיר הגבינה הלבנה בישראל. צריך למצוא בית ספר, שול, פיצה כשרה, או פשוט להבין איך לשרוד חורף בפיטסבורג בלי לבכות לאמא? תשאלו אותי כל דבר—אני כאן לעזור, עם תשובות ואולי אפילו בדיחה. 😄"
};

const chatbotTranslations = {
  en: {
    howCouldIHelp: "How could I help?",
    title: "Shauli - Pittsburgh Jewish Assistant",
    poweredBy: "Powered by Lev Echad",
    askMeAbout: "Ask me about Jewish schools, synagogues, neighborhoods, kosher food, healthcare & more!",
    placeholder: "Ask about schools, synagogues, neighborhoods..."
  },
  he: {
    howCouldIHelp: "איך אני יכול לעזור?",
    title: "שאולי - עוזר יהודי בפיטסבורג",
    poweredBy: "מופעל על ידי לב אחד",
    askMeAbout: "שאל אותי על בתי ספר יהודיים, בתי כנסת, שכונות, אוכל כשר, בריאות ועוד!",
    placeholder: "שאל על בתי ספר, בתי כנסת, שכונות..."
  }
};

const AIChatbot: React.FC<AIChatbotProps> = ({ language = 'en' }) => {

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: chatbotStarters[language],
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Update starter message when language changes
    setMessages([
      {
        id: '1',
        text: chatbotStarters[language],
        isUser: false,
        timestamp: new Date()
      }
    ]);
  }, [language]);

  const generateResponse = async (userQuestion: string): Promise<string> => {
    try {
      setError(null);
      // Debug logging
      console.log('Hostname:', window.location.hostname);
      console.log('API Key available:', !!OPENAI_CONFIG.apiKey);
      console.log('API Key length:', OPENAI_CONFIG.apiKey?.length || 0);
      
      // Use secure backend in production, direct call in development
      const isProd = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
      
      if (isProd) {
        // Production: use secure serverless function
        console.log('Using secure backend');
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: userQuestion }),
        });
        if (!response.ok) {
          throw new Error(`Chat API error: ${response.status}`);
        }
        const data = await response.json();
        return data.content || "I'm sorry, I couldn't generate a response.";
      }
      
      // Local development: direct OpenAI call
      if (OPENAI_CONFIG.apiKey && OPENAI_CONFIG.apiKey !== '') {
        console.log('Using direct OpenAI call locally');
        return await callOpenAI(userQuestion);
      }

      // Fallback to keyword-based responses if no API available
      return await callKeywordBasedResponse(userQuestion);
    } catch (error) {
      console.error('Error generating response:', error);
      setError('Connection issue - using fallback response');
      // Fallback to keyword-based response if OpenAI fails
      try {
        return await callKeywordBasedResponse(userQuestion);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        setError('System temporarily unavailable');
        return "I apologize, but I'm having trouble connecting right now. Please try again or contact Lev Echad directly for assistance.";
      }
    }
  };

  const callOpenAI = async (question: string): Promise<string> => {
    // Direct OpenAI call (works everywhere with VITE_ env vars)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_CONFIG.model,
        messages: [
          { role: 'system', content: `${SYSTEM_PROMPT}\n\nKNOWLEDGE BASE:\n${pittsburghJewishKnowledgeBase}` },
          { role: 'user', content: question },
        ],
        max_tokens: OPENAI_CONFIG.maxTokens,
        temperature: OPENAI_CONFIG.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
  };

  const callKeywordBasedResponse = async (question: string): Promise<string> => {
    // Fallback keyword-based response system
    
    const lowerQuestion = question.toLowerCase();
    
    // School-related questions
    if (lowerQuestion.includes('school') || lowerQuestion.includes('education') || lowerQuestion.includes('kindergarten') || lowerQuestion.includes('high school')) {
      return `Here are the Jewish schools in Pittsburgh:

**Schools with High School Programs:**
• **Hillel Academy** - Modern Orthodox, full K-12 program with separate boys'/girls' divisions from 4th grade
• **Yeshiva Schools** - Chabad philosophy, full boys' and girls' high school programs

**Elementary/Early Childhood Only:**
• **CDS (Community Day School)** - Pluralistic, ages 2 through grade 8, boys and girls together
• **JCC Early Childhood** - Jewish values-based preschool up to kindergarten
• **Beth Shalom Early Learning** - Conservative-affiliated, up to kindergarten

**Public Option:**
• **Colfax Public School** - Local Squirrel Hill elementary school attended by many Jewish families

Would you like detailed information about any specific school?`;
    }

    // Synagogue-related questions
    if (lowerQuestion.includes('synagogue') || lowerQuestion.includes('shul') || lowerQuestion.includes('orthodox') || lowerQuestion.includes('chabad') || lowerQuestion.includes('reform') || lowerQuestion.includes('conservative')) {
      return `Pittsburgh has excellent synagogue options:

**Chabad Centers:**
• **Lubavitch Center** - Main Chabad shul, very welcoming
• **Chabad of Squirrel Hill** - Perfect for Israeli families (Rabbi speaks Hebrew)
• **Baal Shem Tov Shul** - Small, intimate shtibel atmosphere

**Modern Orthodox:**
• **Shaare Torah** - Strong family atmosphere, daily minyanim
• **Poale Zedeck** - Cornerstone of Modern Orthodox community
• **Young Israel** - Warm, close-knit, welcoming to newcomers

**Conservative:**
• **Beth Shalom** - Large, historic presence

**Reform:**
• **Temple Sinai** - Focus on inclusivity and social justice
• **Rodef Shalom** - One of oldest Reform congregations in U.S.

Most synagogues offer Shabbat Kiddush after Saturday services - great for meeting people! Which type interests you?`;
    }

    // Neighborhood questions
    if (lowerQuestion.includes('neighborhood') || lowerQuestion.includes('where to live') || lowerQuestion.includes('housing') || lowerQuestion.includes('squirrel hill') || lowerQuestion.includes('greenfield')) {
      return `Here are the best neighborhoods for Jewish families:

**🏠 Squirrel Hill** - The heart of Jewish life
• Walking distance to synagogues, schools, kosher food
• Higher prices but most convenient for Jewish life
• Mix of apartments, duplexes, single-family homes

**💰 Greenfield** - Affordable alternative
• 5-10 minutes to Squirrel Hill by car/bus
• More affordable housing, mostly single-family homes
• Great option if you don't need to walk to shuls

**🎓 Shadyside** - For students/young professionals
• Close to UPMC hospitals and universities
• More expensive, limited Jewish infrastructure

**🌳 Regent Square/Edgewood** - Quiet suburban
• 10-15 minutes to Squirrel Hill
• More affordable, tree-lined streets
• Good for families wanting suburban feel

Which type of neighborhood appeals to you?`;
    }

    // Kosher food questions
    if (lowerQuestion.includes('kosher') || lowerQuestion.includes('restaurant') || lowerQuestion.includes('food') || lowerQuestion.includes('grocery')) {
      return `Pittsburgh has great kosher options:

**🥩 Restaurants:**
• **Eighteen** - Upscale meat restaurant with sushi (2028 Murray Ave)
• **Milky Way** - Dairy restaurant with pizza, pasta, falafel
• **Edge Catering** - Near CMU, great for students

**☕ Café:**
• **Bunny Bakes** - Kosher bakery-café with pastries and coffee (1926 Murray Ave, closed Saturdays)

**🛒 Grocery:**
• **Murray Avenue Kosher** - Full kosher supermarket with meat, deli, Israeli products

**🍷 Judaica:**
• **Pinsker's Judaica & Wines** - Large kosher wine selection

**Mainstream options:** Giant Eagle, Trader Joe's, Whole Foods, Costco have kosher sections (check labels).

What type of kosher food are you looking for?`;
    }

    // Healthcare questions
    if (lowerQuestion.includes('doctor') || lowerQuestion.includes('pediatrician') || lowerQuestion.includes('hospital') || lowerQuestion.includes('medical') || lowerQuestion.includes('healthcare')) {
      return `Healthcare options near Squirrel Hill:

**👶 Pediatricians:**
• **UPMC Children's Community Pediatrics (Bass Wolfson)** - Major pediatric provider in Squirrel Hill
• **Kids + Pediatrics** - Full pediatric care (note: no Sunday hours as of Oct 2025)
• **Squirrel Hill Primary Care (AHN)** - Family doctors including pediatrics

**🚑 Urgent Care:**
• **Steel Valley Express Care** - Walk-in care, open 7 days
• **AHN Urgent & Express Care** - Multiple locations

**🏥 Major Hospitals:**
• **UPMC Shadyside** - Large teaching hospital, very close
• **UPMC Magee-Womens** - Women's health specialist (300 Halket St)
• **UPMC Children's Hospital** - Pediatric specialist
• **West Penn Hospital** - Known for pregnancy/newborn services

Always check your insurance network! Need specific recommendations?`;
    }

    // Transportation questions
    if (lowerQuestion.includes('transportation') || lowerQuestion.includes('bus') || lowerQuestion.includes('parking') || lowerQuestion.includes('uber') || lowerQuestion.includes('car')) {
      return `Getting around Pittsburgh:

**🚌 Public Transit:**
• Port Authority buses - $2.75 per ride
• ConnectCard available at Giant Eagle service desk
• Transfers valid 3 hours

**🅿️ Parking in Squirrel Hill:**
• Metered parking on Murray/Forbes: $2/hr, Mon-Sat 8am-6pm
• FREE after 6pm and all day Sunday
• Watch for residential permit zones

**🚗 Ride-Share:**
• Uber and Lyft widely available
• Traditional taxis (zTrip, Yellow Cab) still operate

**🚲 Biking:**
• Safe with bike lanes, especially in Squirrel Hill/Greenfield
• Helmets recommended, be careful on hills!

What transportation questions do you have?`;
    }

    // About Lev Echad questions
    if (lowerQuestion.includes('lev echad') || lowerQuestion.includes('about') || lowerQuestion.includes('shosh') || lowerQuestion.includes('programs') || lowerQuestion.includes('help') || lowerQuestion.includes('shauli')) {
      return `**About Lev Echad (and me, Shauli!):**

So, Shosh Mash founded Lev Echad after arriving from Israel seven years ago with a baby, completely alone. Sound familiar? 😅 I did the same thing 15 years ago from Petach Tikva - let me tell you, those first Pittsburgh winters were... educational.

From that struggle came our mission: **to turn loneliness into belonging and isolation into community.**

**🏠 What we do:**
• **Weekly Shabbat Dinners** - Because everyone needs a place for Friday night (and good food!)
• **Relocation Support** - I'll help you figure out everything from schools to where to buy the best hummus
• **Medical Treatment Support** - When life gets complicated, we've got your back
• **Postpartum Support** - Home-cooked Israeli meals (yes, real Israeli food!)

Trust me, after 15 years here, I know which pizza is actually worth it and which shul has the best kiddush. 😄

What can I help you figure out about Pittsburgh?`;
    }

    // Immigration/relocation questions
    if (lowerQuestion.includes('dmv') || lowerQuestion.includes('license') || lowerQuestion.includes('social security') || lowerQuestion.includes('immigration') || lowerQuestion.includes('documents')) {
      return `**Immigration & Relocation Help:**

**🚗 Driver's License (PennDOT):**
• Location: 708 Smithfield Street, Pittsburgh
• Bring: Passport, I-94, Green Card/immigration docs, Social Security proof, 2 PA residency proofs
• Walk-in for most services, appointments for road tests

**📄 Social Security:**
• Location: 6117 Station Street, Pittsburgh (East Liberty)
• **Appointment required** - book online or by phone
• Bring: Passport, visa, I-94, I-20/DS-2019 if applicable, local address proof

**🏦 Banking:**
Multiple branches in Squirrel Hill: PNC, Dollar Bank, KeyBank, Citizens Bank, First National Bank

**📋 Tips:**
• All documents must be originals, not copies
• Start with Social Security appointment first
• Lev Echad can help guide you through the process!

Need help with any specific documents?`;
    }

    // Default response for unrecognized questions
    return `I'd be happy to help! I have comprehensive information about:

**🎓 Schools** - Jewish schools, public options, early childhood programs
**🕍 Synagogues** - Chabad, Orthodox, Conservative, Reform options  
**🏘️ Neighborhoods** - Where to live, housing costs, commute times
**🍽️ Kosher Food** - Restaurants, groceries, cafés
**🏥 Healthcare** - Doctors, hospitals, urgent care
**🚌 Transportation** - Public transit, parking, ride-share
**🏦 Banking** - Local branches and services
**📋 Immigration** - DMV, Social Security, required documents
**🎯 Attractions** - Museums, parks, family activities

Please ask me something specific, like:
• "Tell me about yourself" → Get Shauli's funny backstory
• "What Jewish schools have high school programs?"
• "Which neighborhoods are most affordable?"
• "Where can I find kosher meat restaurants?"
• "How do I get a Pennsylvania driver's license?"

What would you like to know about Jewish life in Pittsburgh?`;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    const response = await generateResponse(inputText);
    
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: response,
      isUser: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Error boundary for the component
  if (error && error === 'System temporarily unavailable') {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        {/* Error text */}
        <div className="mb-3 mr-2">
          <div className="bg-red-50 text-red-800 px-4 py-2 rounded-full shadow-lg border border-red-200 text-sm font-medium">
            Connection issue - Click to retry
          </div>
        </div>
        
        {/* Error button */}
        <button
          onClick={() => {
            setError(null);
            setIsOpen(true);
          }}
          className="bg-white hover:bg-red-50 text-red-600 p-6 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 border-2 border-red-200 hover:border-red-400"
          aria-label="Chat assistant (temporarily unavailable)"
        >
          <div className="relative">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </button>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        {/* Help text */}
        <div className="mb-3 mr-2">
          <div className="bg-white text-gray-800 px-4 py-2 rounded-full shadow-lg border border-gray-200 text-sm font-medium" dir={language === 'he' ? 'rtl' : 'ltr'}>
            {chatbotTranslations[language].howCouldIHelp}
          </div>
        </div>
        
        {/* Chat button */}
        <button
          onClick={() => setIsOpen(true)}
          className="bg-white hover:bg-gray-50 text-blue-600 p-6 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 border-2 border-blue-200 hover:border-blue-400"
          aria-label="Open chat assistant"
        >
          <div className="relative">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
            <img 
              src="./shauli.png" 
              alt={chatbotTranslations[language].title} 
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                // Fallback to emoji if image doesn't load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<span class="text-xl">👨‍💻</span>';
              }}
            />
          </div>
          <div>
            <h3 className="font-semibold" dir={language === 'he' ? 'rtl' : 'ltr'}>{chatbotTranslations[language].title}</h3>
            <p className="text-xs text-blue-100" dir={language === 'he' ? 'rtl' : 'ltr'}>
              {error ? `${error} - ${chatbotTranslations[language].poweredBy}` : chatbotTranslations[language].poweredBy}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-blue-100 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                message.isUser
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
              }`}
            >
              <div className="text-sm leading-relaxed">
                {message.isUser ? (
                  <div className="whitespace-pre-wrap">{message.text}</div>
                ) : (
                  <div className="whitespace-pre-wrap">
                    {/* Simple markdown replacement for now */}
                    {message.text
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                      .split('\n').map((line, index) => (
                        <div key={index} dangerouslySetInnerHTML={{ __html: line }} />
                      ))
                    }
                  </div>
                )}
              </div>
              <div className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-md">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={chatbotTranslations[language].placeholder}
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center" dir={language === 'he' ? 'rtl' : 'ltr'}>
          {chatbotTranslations[language].askMeAbout}
        </p>
      </div>
    </div>
  );
};

export default AIChatbot;
