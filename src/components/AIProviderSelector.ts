/**
 * AI Provider Selector Component
 * Integrated into header next to region selector
 */

import {
  getSelectedAIProvider,
  setSelectedAIProvider,
  AVAILABLE_PROVIDERS,
  type AIProvider,
} from '@/services/ai-provider-manager';
import { getSecretState, setSecretValue } from '@/services/runtime-config';

export class AIProviderSelector {
  private container: HTMLElement | null = null;
  private selectEl: HTMLSelectElement | null = null;
  private apiKeyInput: HTMLInputElement | null = null;
  private statusEl: HTMLElement | null = null;

  /**
   * Mount the AI provider selector to a container element
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.render();
    this.attachListeners();
    this.updateStatus();
    this.loadCurrentApiKey();
  }

  /**
   * Render the selector UI
   */
  private render(): void {
    if (!this.container) return;

    const selectedProvider = getSelectedAIProvider();
    const currentProvider = AVAILABLE_PROVIDERS.find(p => p.id === selectedProvider);
    
    this.container.innerHTML = `
      <div class="ai-provider-header-wrapper">
        <label class="ai-provider-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
            <path d="M12 8v4l3 3"/>
          </svg>
          <span>AI Provider</span>
        </label>
        <select class="ai-provider-select" id="aiProviderSelect">
          ${AVAILABLE_PROVIDERS.map(provider => {
            const isReady = this.checkProviderReady(provider.id);
            const statusIcon = isReady ? '✓' : '○';
            return `<option value="${provider.id}" ${provider.id === selectedProvider ? 'selected' : ''}>${statusIcon} ${provider.name}</option>`;
          }).join('')}
        </select>
        <div class="ai-provider-key-input-wrapper">
          <input 
            type="password" 
            class="ai-provider-api-key-input" 
            id="aiProviderApiKey"
            placeholder="${currentProvider ? `${currentProvider.name} API Key` : 'API Key'}"
            autocomplete="off"
            spellcheck="false"
          />
          <button class="ai-provider-save-key" id="aiProviderSaveKey" title="Save API Key">💾</button>
          <button class="ai-provider-toggle-vis" id="aiProviderToggleVis" title="Show/Hide Key">👁️</button>
        </div>
        <div class="ai-provider-status" id="aiProviderStatus"></div>
      </div>
    `;

    this.selectEl = this.container.querySelector('#aiProviderSelect');
    this.apiKeyInput = this.container.querySelector('#aiProviderApiKey');
    this.statusEl = this.container.querySelector('#aiProviderStatus');
  }

  /**
   * Attach event listeners
   */
  private attachListeners(): void {
    if (!this.selectEl) return;

    // Provider selection change
    this.selectEl.addEventListener('change', (e) => {
      const newProvider = (e.target as HTMLSelectElement).value as AIProvider;
      setSelectedAIProvider(newProvider);
      this.updateStatus();
      this.loadCurrentApiKey();
      
      // Dispatch custom event for other components to listen to
      window.dispatchEvent(new CustomEvent('ai-provider-changed', { 
        detail: { provider: newProvider } 
      }));
    });

    // Save API key
    const saveBtn = this.container?.querySelector('#aiProviderSaveKey');
    if (saveBtn && this.apiKeyInput) {
      saveBtn.addEventListener('click', () => this.saveApiKey());
    }

    // Toggle visibility
    const toggleBtn = this.container?.querySelector('#aiProviderToggleVis');
    if (toggleBtn && this.apiKeyInput) {
      toggleBtn.addEventListener('click', () => {
        this.apiKeyInput!.type = this.apiKeyInput!.type === 'password' ? 'text' : 'password';
      });
    }

    // Enter key to save
    if (this.apiKeyInput) {
      this.apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.saveApiKey();
      });
    }
  }

  /**
   * Load current API key for selected provider (masked)
   */
  private loadCurrentApiKey(): void {
    if (!this.apiKeyInput || !this.selectEl) return;

    const selectedProvider = this.selectEl.value as AIProvider;
    const providerSecretMap: Record<AIProvider, 'GROQ_API_KEY' | 'OPENROUTER_API_KEY' | 'OPENAI_API_KEY' | 'GEMINI_API_KEY' | 'OLLAMA_API_URL'> = {
      groq: 'GROQ_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
      openai: 'OPENAI_API_KEY',
      gemini: 'GEMINI_API_KEY',
      ollama: 'OLLAMA_API_URL',
    };

    const secretKey = providerSecretMap[selectedProvider];
    const snapshot = (window as any).worldmonitorRuntimeConfig?.secrets || {};
    const secretState = snapshot[secretKey];
    
    if (secretState && secretState.value) {
      this.apiKeyInput.value = secretState.value;
      this.apiKeyInput.type = 'password';
    } else {
      this.apiKeyInput.value = '';
      this.apiKeyInput.type = 'password';
    }
  }

  /**
   * Save API key to runtime config
   */
  private async saveApiKey(): Promise<void> {
    if (!this.apiKeyInput || !this.selectEl) return;

    const selectedProvider = this.selectEl.value as AIProvider;
    const providerSecretMap: Record<AIProvider, 'GROQ_API_KEY' | 'OPENROUTER_API_KEY' | 'OPENAI_API_KEY' | 'GEMINI_API_KEY' | 'OLLAMA_API_URL'> = {
      groq: 'GROQ_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
      openai: 'OPENAI_API_KEY',
      gemini: 'GEMINI_API_KEY',
      ollama: 'OLLAMA_API_URL',
    };

    const secretKey = providerSecretMap[selectedProvider];
    const keyValue = this.apiKeyInput.value.trim();

    if (!keyValue) {
      this.statusEl!.className = 'ai-provider-status warn';
      this.statusEl!.textContent = 'Please enter an API key';
      return;
    }

    try {
      await setSecretValue(secretKey, keyValue);
      this.statusEl!.className = 'ai-provider-status ok';
      this.statusEl!.textContent = '✓ API key saved successfully';
      this.apiKeyInput!.type = 'password';
      
      // Refresh provider list to update status icons
      setTimeout(() => {
        this.render();
        this.attachListeners();
        this.updateStatus();
      }, 500);
    } catch (error) {
      this.statusEl!.className = 'ai-provider-status error';
      this.statusEl!.textContent = '✗ Failed to save API key';
      console.error('[AI Provider] Failed to save key:', error);
    }
  }

  /**
   * Update the status display
   */
  private updateStatus(): void {
    if (!this.statusEl || !this.selectEl) return;

    const selectedProvider = this.selectEl.value as AIProvider;
    const provider = AVAILABLE_PROVIDERS.find(p => p.id === selectedProvider);
    if (!provider) return;

    const isReady = this.checkProviderReady(selectedProvider);
    
    if (isReady) {
      this.statusEl.className = 'ai-provider-status ok';
      this.statusEl.textContent = `${provider.name} is configured`;
    } else {
      this.statusEl.className = 'ai-provider-status warn';
      this.statusEl.innerHTML = `${provider.name} needs API key <a href="${provider.signupUrl}" target="_blank" rel="noopener" class="ai-provider-get-key">Get Key</a>`;
    }
  }

  /**
   * Check if a provider has valid credentials
   */
  private checkProviderReady(providerId: AIProvider): boolean {
    const providerSecretMap: Record<AIProvider, 'GROQ_API_KEY' | 'OPENROUTER_API_KEY' | 'OPENAI_API_KEY' | 'GEMINI_API_KEY' | 'OLLAMA_API_URL'> = {
      groq: 'GROQ_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
      openai: 'OPENAI_API_KEY',
      gemini: 'GEMINI_API_KEY',
      ollama: 'OLLAMA_API_URL',
    };

    const secretKey = providerSecretMap[providerId];
    if (!secretKey) return false;

    try {
      const state = getSecretState(secretKey);
      return state.valid;
    } catch {
      return false;
    }
  }

  /**
   * Refresh the selector (e.g., after keys are updated)
   */
  refresh(): void {
    if (this.selectEl) {
      const currentSelection = this.selectEl.value;
      this.render();
      this.attachListeners();
      
      // Restore previous selection if still valid
      const newSelect = this.container?.querySelector('#aiProviderSelect') as HTMLSelectElement;
      if (newSelect && AVAILABLE_PROVIDERS.some(p => p.id === currentSelection)) {
        newSelect.value = currentSelection;
      }
      
      this.selectEl = newSelect || null;
      this.apiKeyInput = this.container?.querySelector('#aiProviderApiKey') || null;
      this.statusEl = this.container?.querySelector('#aiProviderStatus') || null;
      this.updateStatus();
      this.loadCurrentApiKey();
    }
  }

  /**
   * Unmount and cleanup
   */
  unmount(): void {
    this.container = null;
    this.selectEl = null;
    this.apiKeyInput = null;
    this.statusEl = null;
  }
}
