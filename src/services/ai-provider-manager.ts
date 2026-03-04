/**
 * AI Provider Selection Manager
 * Handles user selection of AI API provider (Groq, OpenAI, Gemini, etc.)
 */

export type AIProvider = 'groq' | 'openrouter' | 'openai' | 'gemini' | 'ollama';

const PROVIDER_STORAGE_KEY = 'worldmonitor-ai-provider-selection';
const DEFAULT_PROVIDER: AIProvider = 'groq';

/**
 * Get the currently selected AI provider
 */
export function getSelectedAIProvider(): AIProvider {
  try {
    const stored = localStorage.getItem(PROVIDER_STORAGE_KEY);
    if (!stored) return DEFAULT_PROVIDER;
    
    const provider = stored as AIProvider;
    // Validate it's a known provider
    if (['groq', 'openrouter', 'openai', 'gemini', 'ollama'].includes(provider)) {
      return provider;
    }
    return DEFAULT_PROVIDER;
  } catch {
    return DEFAULT_PROVIDER;
  }
}

/**
 * Set the selected AI provider
 */
export function setSelectedAIProvider(provider: AIProvider): void {
  try {
    localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
    // Trigger storage event for cross-window sync
    localStorage.setItem('wm-ai-provider-updated', String(Date.now()));
  } catch {
    console.warn('[AI Provider] Failed to save provider selection');
  }
}

/**
 * Get available providers with their metadata
 */
export interface ProviderMetadata {
  id: AIProvider;
  name: string;
  description: string;
  signupUrl: string;
  secretKey: string;
}

export const AVAILABLE_PROVIDERS: ProviderMetadata[] = [
  {
    id: 'groq',
    name: 'Groq',
    description: 'Fast inference (14,400 req/day free)',
    signupUrl: 'https://console.groq.com/',
    secretKey: 'GROQ_API_KEY',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Multiple models (50 req/day free)',
    signupUrl: 'https://openrouter.ai/',
    secretKey: 'OPENROUTER_API_KEY',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4 and GPT-3.5 models',
    signupUrl: 'https://platform.openai.com/api-keys',
    secretKey: 'OPENAI_API_KEY',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini Pro models',
    signupUrl: 'https://makersuite.google.com/app/apikey',
    secretKey: 'GEMINI_API_KEY',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Run models locally',
    signupUrl: 'https://ollama.ai/',
    secretKey: 'OLLAMA_API_URL',
  },
];

/**
 * Check if the selected provider has valid credentials
 * Note: This function requires runtime-config to be imported by the caller
 */
export function checkProviderReady(provider: AIProvider, getSecretStateFn?: (key: string) => any): boolean {
  if (!getSecretStateFn) return false;
  
  const providerSecretMap: Record<AIProvider, string> = {
    groq: 'GROQ_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
    openai: 'OPENAI_API_KEY',
    gemini: 'GEMINI_API_KEY',
    ollama: 'OLLAMA_API_URL',
  };
  
  const secretKey = providerSecretMap[provider];
  if (!secretKey) return false;
  
  const state = getSecretStateFn(secretKey);
  return state?.valid || false;
}
