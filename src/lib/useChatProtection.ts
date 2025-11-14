"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

interface MessageHistory {
  content: string;
  timestamp: number;
}

interface RateLimitState {
  messageCount: number;
  windowStart: number;
  isLimited: boolean;
  remainingTime: number;
}

interface SpamDetectionResult {
  isSpam: boolean;
  type: 'repeated' | 'caps' | 'excessive' | 'profanity' | 'generic' | null;
  reason?: string;
}

export function useChatProtection() {
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [showSpamModal, setShowSpamModal] = useState(false);
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    messageCount: 0,
    windowStart: Date.now(),
    isLimited: false,
    remainingTime: 0
  });
  const [spamMessage, setSpamMessage] = useState<string>('');
  const [spamType, setSpamType] = useState<'repeated' | 'caps' | 'excessive' | 'profanity' | 'generic'>('generic');

  // Message history for spam detection
  const messageHistoryRef = useRef<MessageHistory[]>([]);
  const lastMessageTimeRef = useRef<number>(0);

  // Rate limiting configuration - more generous for normal conversation
  const RATE_LIMIT = useMemo(() => ({
    maxMessages: 12, // messages per window (increased for normal conversation)
    windowMs: 60000, // 60 seconds (increased window)
    cooldownMs: 15000 // 15 seconds cooldown after limit
  }), []);

  // Spam detection configuration
  const SPAM_CONFIG = useMemo(() => ({
    maxRepeatedMessages: 4, // max identical messages in history (slightly more lenient)
    maxCapsPercentage: 0.8, // max percentage of caps in message (more lenient)
    minMessageLength: 1, // minimum message length (more lenient)
    maxMessageLength: 500, // maximum message length
    repeatedMessageWindowMs: 120000, // 2 minute window for repeated messages (longer)
    minTimeBetweenMessages: 500 // 0.5 second minimum between messages (faster)
  }), []);

  // Dynamic profanity loader
  const [profanityFilter, setProfanityFilter] = useState<any>(null);
  const [profanityLoading, setProfanityLoading] = useState(false);

  const loadProfanityFilter = useCallback(async () => {
    if (profanityFilter) return profanityFilter;
    if (profanityLoading) return null;

    console.log('🔧 Dynamically loading profanity filter...');
    setProfanityLoading(true);

    try {
      const { profanity } = await import('@2toad/profanity');
      console.log('✅ Profanity filter loaded successfully');
      setProfanityFilter(profanity);
      return profanity;
    } catch (error) {
      console.error('❌ Failed to load profanity filter:', error);
      return null;
    } finally {
      setProfanityLoading(false);
    }
  }, [profanityFilter, profanityLoading]);

  // Load data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('chatProtection');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        messageHistoryRef.current = data.messageHistory || [];
        setRateLimitState(data.rateLimitState || {
          messageCount: 0,
          windowStart: Date.now(),
          isLimited: false,
          remainingTime: 0
        });
        lastMessageTimeRef.current = data.lastMessageTime || 0;
      } catch (error) {
        console.warn('Failed to load chat protection data:', error);
      }
    }
  }, []);

  // Save data to localStorage
  const saveToStorage = useCallback(() => {
    const data = {
      messageHistory: messageHistoryRef.current,
      rateLimitState,
      lastMessageTime: lastMessageTimeRef.current
    };
    localStorage.setItem('chatProtection', JSON.stringify(data));
  }, [rateLimitState]);

  // Clean up old message history
  const cleanupHistory = useCallback(() => {
    const now = Date.now();
    messageHistoryRef.current = messageHistoryRef.current.filter(
      msg => now - msg.timestamp < SPAM_CONFIG.repeatedMessageWindowMs
    );
  }, [SPAM_CONFIG.repeatedMessageWindowMs]);

  // Check for profanity in message (async due to dynamic loading)
  const detectProfanity = useCallback(async (message: string): Promise<{ hasProfanity: boolean; word?: string }> => {
    try {
      console.log('🔍 Client-side profanity check for:', message);

      // Load profanity filter if not already loaded
      let filter = profanityFilter;
      if (!filter) {
        filter = await loadProfanityFilter();
        if (!filter) {
          console.log('⚠️ Profanity filter not available, skipping check');
          return { hasProfanity: false };
        }
      }

      // Use the profanity filter to check for bad words
      const hasProfanity = filter.exists(message);

      console.log('🔍 Profanity detected:', hasProfanity);

      if (hasProfanity) {
        console.log('🚫 Profanity found in message:', message);

        // Try to find the specific profane word(s) detected
        const censored = filter.censor(message);
        const originalWords = message.split(/\s+/);
        const censoredWords = censored.split(/\s+/);

        console.log('🔍 Censored message:', censored);

        // Find which word was censored
        for (let i = 0; i < originalWords.length; i++) {
          if (originalWords[i] !== censoredWords[i] && censoredWords[i].includes('*')) {
            console.log('🚫 Profane word found:', originalWords[i]);
            return { hasProfanity: true, word: originalWords[i] };
          }
        }

        return { hasProfanity: true, word: 'profanity' };
      }

      console.log('✅ No profanity detected');
      return { hasProfanity: false };
    } catch (error) {
      console.warn('Profanity detection error:', error);
      return { hasProfanity: false };
    }
  }, [profanityFilter, loadProfanityFilter]);

  // Check rate limit
  const checkRateLimit = useCallback((): { allowed: boolean; remainingTime: number } => {
    const now = Date.now();

    // Check if we're in cooldown
    if (rateLimitState.isLimited) {
      const timePassed = now - rateLimitState.windowStart;
      if (timePassed >= RATE_LIMIT.cooldownMs) {
        // Reset rate limit
        setRateLimitState({
          messageCount: 0,
          windowStart: now,
          isLimited: false,
          remainingTime: 0
        });
        return { allowed: true, remainingTime: 0 };
      } else {
        const remaining = Math.ceil((RATE_LIMIT.cooldownMs - timePassed) / 1000);
        return { allowed: false, remainingTime: remaining };
      }
    }

    // Check if window has expired
    if (now - rateLimitState.windowStart >= RATE_LIMIT.windowMs) {
      setRateLimitState({
        messageCount: 1,
        windowStart: now,
        isLimited: false,
        remainingTime: 0
      });
      return { allowed: true, remainingTime: 0 };
    }

    // Check message count
    if (rateLimitState.messageCount >= RATE_LIMIT.maxMessages) {
      // Enter cooldown
      setRateLimitState(prev => ({
        ...prev,
        isLimited: true,
        remainingTime: Math.ceil(RATE_LIMIT.cooldownMs / 1000)
      }));
      return { allowed: false, remainingTime: Math.ceil(RATE_LIMIT.cooldownMs / 1000) };
    }

    return { allowed: true, remainingTime: 0 };
  }, [rateLimitState, RATE_LIMIT.cooldownMs, RATE_LIMIT.maxMessages, RATE_LIMIT.windowMs]);

  // Detect spam (excluding profanity, which is handled separately)
  const detectSpam = useCallback((message: string): SpamDetectionResult => {
    if (!message || message.trim().length < SPAM_CONFIG.minMessageLength) {
      return { isSpam: true, type: 'generic', reason: 'Message too short' };
    }

    if (message.length > SPAM_CONFIG.maxMessageLength) {
      return { isSpam: true, type: 'generic', reason: 'Message too long' };
    }

    const now = Date.now();
    const timeSinceLastMessage = now - lastMessageTimeRef.current;

    // Check time between messages
    if (timeSinceLastMessage < SPAM_CONFIG.minTimeBetweenMessages) {
      return { isSpam: true, type: 'excessive', reason: 'Messages too frequent' };
    }

    // Check for excessive caps
    const capsCount = (message.match(/[A-Z]/g) || []).length;
    const totalLetters = (message.match(/[a-zA-Z]/g) || []).length;
    if (totalLetters > 5 && capsCount / totalLetters > SPAM_CONFIG.maxCapsPercentage) {
      return { isSpam: true, type: 'caps', reason: 'Too many capital letters' };
    }

    // Check for repeated messages
    const recentMessages = messageHistoryRef.current.filter(
      msg => now - msg.timestamp < SPAM_CONFIG.repeatedMessageWindowMs
    );
    const repeatedCount = recentMessages.filter(
      msg => msg.content.toLowerCase() === message.toLowerCase()
    ).length;

    if (repeatedCount >= SPAM_CONFIG.maxRepeatedMessages) {
      return { isSpam: true, type: 'repeated', reason: 'Message repeated too many times' };
    }

    return { isSpam: false, type: null };
  }, [
    SPAM_CONFIG.maxCapsPercentage,
    SPAM_CONFIG.maxMessageLength,
    SPAM_CONFIG.maxRepeatedMessages,
    SPAM_CONFIG.minMessageLength,
    SPAM_CONFIG.minTimeBetweenMessages,
    SPAM_CONFIG.repeatedMessageWindowMs
  ]);

  // Main validation function (async due to dynamic profanity loading)
  const validateMessage = useCallback(async (message: string): Promise<{ allowed: boolean; type?: 'rateLimit' | 'spam'; reason?: string }> => {
    console.log('🚀 Starting message validation for:', message);

    // First check rate limit
    const rateLimitResult = checkRateLimit();
    if (!rateLimitResult.allowed) {
      console.log('⏰ Rate limit exceeded');
      setRateLimitState(prev => ({ ...prev, remainingTime: rateLimitResult.remainingTime }));
      setShowRateLimitModal(true);
      return { allowed: false, type: 'rateLimit' };
    }

    // Check for profanity first (async)
    const profanityCheck = await detectProfanity(message);
    if (profanityCheck.hasProfanity) {
      console.log('🚫 Profanity validation failed:', profanityCheck);
      setSpamType('profanity');
      setSpamMessage(message);
      setShowSpamModal(true);
      return { allowed: false, type: 'spam', reason: `Contains inappropriate language: "${profanityCheck.word}"` };
    }

    // Then check for other spam patterns
    const spamResult = detectSpam(message);
    if (spamResult.isSpam && spamResult.type !== 'profanity') {
      console.log('🚫 Spam validation failed:', spamResult);
      setSpamType(spamResult.type!);
      setSpamMessage(message);
      setShowSpamModal(true);
      return { allowed: false, type: 'spam', reason: spamResult.reason };
    }

    console.log('✅ Message validation passed');
    return { allowed: true };
  }, [checkRateLimit, detectProfanity, detectSpam]);

  // Record successful message
  const recordMessage = useCallback((message: string) => {
    const now = Date.now();

    // Add to history
    messageHistoryRef.current.push({
      content: message,
      timestamp: now
    });

    // Update rate limit state
    setRateLimitState(prev => ({
      ...prev,
      messageCount: prev.messageCount + 1
    }));

    lastMessageTimeRef.current = now;

    // Cleanup old messages
    cleanupHistory();

    // Save to storage
    setTimeout(saveToStorage, 100);
  }, [cleanupHistory, saveToStorage]);

  // Close modals
  const closeRateLimitModal = useCallback(() => {
    setShowRateLimitModal(false);
  }, []);

  const closeSpamModal = useCallback(() => {
    setShowSpamModal(false);
  }, []);

  // Reset rate limit (for testing/debugging)
  const resetRateLimit = useCallback(() => {
    setRateLimitState({
      messageCount: 0,
      windowStart: Date.now(),
      isLimited: false,
      remainingTime: 0
    });
    saveToStorage();
  }, [saveToStorage]);

  return {
    validateMessage,
    recordMessage,
    showRateLimitModal,
    showSpamModal,
    rateLimitState,
    spamMessage,
    spamType,
    closeRateLimitModal,
    closeSpamModal,
    setSpamType,
    setSpamMessage,
    setShowSpamModal,
    resetRateLimit,
    profanityLoading
  };
}
