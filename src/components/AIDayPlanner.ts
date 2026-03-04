/**
 * AI Day Planner Component
 * Full-width daily planning tool with AI assistance
 * Separate AI provider configuration from main app
 */

import { AVAILABLE_PROVIDERS, type AIProvider } from '@/services/ai-provider-manager';
import { escapeHtml } from '@/utils/sanitize';

interface DayPlanTask {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  aiGenerated?: boolean;
}

interface DayPlanNote {
  id: string;
  content: string;
  timestamp: number;
  aiGenerated?: boolean;
}

export class AIDayPlanner {
  private container: HTMLElement | null = null;
  private tasks: DayPlanTask[] = [];
  private notes: DayPlanNote[] = [];
  private selectedProvider: AIProvider = 'groq';
  private apiKeyInput: HTMLInputElement | null = null;
  private isGenerating: boolean = false;

  mount(container: HTMLElement): void {
    this.container = container;
    this.loadState();
    this.render();
    this.attachListeners();
    this.updateStatus();
  }

  private loadState(): void {
    try {
      const tasksData = localStorage.getItem('wm-dayplanner-tasks');
      const notesData = localStorage.getItem('wm-dayplanner-notes');
      const providerData = localStorage.getItem('wm-dayplanner-provider');

      if (tasksData) this.tasks = JSON.parse(tasksData);
      if (notesData) this.notes = JSON.parse(notesData);
      if (providerData && ['groq', 'openrouter', 'openai', 'gemini', 'ollama'].includes(providerData)) {
        this.selectedProvider = providerData as AIProvider;
      }
      // Note: API key loaded separately for security
    } catch (e) {
      console.error('[Day Planner] Failed to load state:', e);
    }
  }

  private saveState(): void {
    try {
      localStorage.setItem('wm-dayplanner-tasks', JSON.stringify(this.tasks));
      localStorage.setItem('wm-dayplanner-notes', JSON.stringify(this.notes));
      localStorage.setItem('wm-dayplanner-provider', this.selectedProvider);
    } catch (e) {
      console.error('[Day Planner] Failed to save state:', e);
    }
  }

  private render(): void {
    if (!this.container) return;

    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    this.container.innerHTML = `
      <div class="day-planner-container">
        <div class="day-planner-header">
          <div class="day-planner-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <h2>AI Day Planner - ${today}</h2>
          </div>
          
          <div class="day-planner-controls">
            <div class="ai-provider-selector-mini">
              <label class="mini-label">AI Provider:</label>
              <select class="mini-select" id="dayPlannerProviderSelect">
                ${AVAILABLE_PROVIDERS.map(provider => {
                  const isSelected = provider.id === this.selectedProvider;
                  return `<option value="${provider.id}" ${isSelected ? 'selected' : ''}>${provider.name}</option>`;
                }).join('')}
              </select>
            </div>
            
            <div class="api-key-input-wrapper">
              <input 
                type="password" 
                class="mini-api-key-input" 
                id="dayPlannerApiKey"
                placeholder="Enter API Key for Day Planner"
                autocomplete="off"
                spellcheck="false"
              />
              <button class="mini-save-btn" id="dayPlannerSaveKey" title="Save API Key">💾</button>
              <button class="mini-toggle-vis" id="dayPlannerToggleVis" title="Show/Hide Key">👁️</button>
            </div>
            
            <div class="ai-status-indicator" id="dayPlannerStatus"></div>
          </div>
        </div>

        <div class="day-planner-content">
          <!-- Tasks Section -->
          <div class="planner-section tasks-section">
            <div class="section-header">
              <h3>Today's Tasks</h3>
              <button class="ai-generate-btn" id="generateTasksBtn" ${this.isGenerating ? 'disabled' : ''}>
                ${this.isGenerating ? '⏳ Generating...' : '✨ AI Generate Tasks'}
              </button>
            </div>
            
            <div class="add-task-row">
              <input 
                type="text" 
                class="add-task-input" 
                id="addTaskInput"
                placeholder="Add a task..."
              />
              <button class="add-task-btn" id="addTaskBtn">+</button>
            </div>

            <div class="tasks-list" id="tasksList">
              ${this.tasks.map(task => `
                <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                  <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}/>
                  <span class="task-text">${escapeHtml(task.text)}</span>
                  <span class="task-priority priority-${task.priority}">${task.priority}</span>
                  ${task.aiGenerated ? '<span class="ai-badge">AI</span>' : ''}
                  <button class="delete-task-btn">×</button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Notes Section -->
          <div class="planner-section notes-section">
            <div class="section-header">
              <h3>Notes & Ideas</h3>
              <button class="ai-generate-btn secondary" id="generateNotesBtn" ${this.isGenerating ? 'disabled' : ''}>
                ${this.isGenerating ? '⏳ Generating...' : '✨ AI Generate Ideas'}
              </button>
            </div>
            
            <div class="add-note-row">
              <textarea 
                class="add-note-textarea" 
                id="addNoteTextarea"
                placeholder="Add a note..."
                rows="2"
              ></textarea>
              <button class="add-note-btn" id="addNoteBtn">+</button>
            </div>

            <div class="notes-list" id="notesList">
              ${this.notes.map(note => `
                <div class="note-item ${note.aiGenerated ? 'ai-generated' : ''}" data-id="${note.id}">
                  <div class="note-content">${escapeHtml(note.content)}</div>
                  <div class="note-footer">
                    ${note.aiGenerated ? '<span class="ai-badge">AI</span>' : ''}
                    <span class="note-time">${new Date(note.timestamp).toLocaleTimeString()}</span>
                    <button class="delete-note-btn">×</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Capture element references
    this.apiKeyInput = this.container.querySelector('#dayPlannerApiKey');
  }

  private attachListeners(): void {
    if (!this.container) return;

    // Provider selection
    const providerSelect = this.container.querySelector('#dayPlannerProviderSelect');
    providerSelect?.addEventListener('change', (e) => {
      this.selectedProvider = (e.target as HTMLSelectElement).value as AIProvider;
      localStorage.setItem('wm-dayplanner-provider', this.selectedProvider);
      this.updateStatus();
    });

    // Save API key
    const saveBtn = this.container.querySelector('#dayPlannerSaveKey');
    saveBtn?.addEventListener('click', () => this.saveApiKey());

    // Toggle visibility
    const toggleBtn = this.container.querySelector('#dayPlannerToggleVis');
    toggleBtn?.addEventListener('click', () => {
      if (this.apiKeyInput) {
        this.apiKeyInput.type = this.apiKeyInput.type === 'password' ? 'text' : 'password';
      }
    });

    // Add task
    const addTaskInput = this.container.querySelector('#addTaskInput') as HTMLInputElement | null;
    const addTaskBtn = this.container.querySelector('#addTaskBtn');
    
    addTaskBtn?.addEventListener('click', () => this.addTask());
    addTaskInput?.addEventListener('keypress', (e: KeyboardEvent) => {
      if ((e as KeyboardEvent).key === 'Enter') this.addTask();
    });

    // Task checkbox toggle
    this.container.addEventListener('change', (e) => {
      if ((e.target as HTMLElement).classList.contains('task-checkbox')) {
        const taskItem = (e.target as HTMLElement).closest('.task-item');
        const taskId = taskItem?.getAttribute('data-id');
        if (taskId) {
          const task = this.tasks.find(t => t.id === taskId);
          if (task) {
            task.completed = (e.target as HTMLInputElement).checked;
            this.saveState();
          }
        }
      }
    });

    // Delete task
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('delete-task-btn')) {
        const taskItem = target.closest('.task-item');
        const taskId = taskItem?.getAttribute('data-id');
        if (taskId) {
          this.tasks = this.tasks.filter(t => t.id !== taskId);
          this.saveState();
          this.render();
        }
      }
    });

    // Generate AI tasks
    const generateTasksBtn = this.container.querySelector('#generateTasksBtn');
    generateTasksBtn?.addEventListener('click', () => this.generateAITasks());

    // Generate AI notes
    const generateNotesBtn = this.container.querySelector('#generateNotesBtn');
    generateNotesBtn?.addEventListener('click', () => this.generateAINotes());
  }

  private async saveApiKey(): Promise<void> {
    if (!this.apiKeyInput) return;

    const keyValue = this.apiKeyInput.value.trim();
    if (!keyValue) {
      alert('Please enter an API key');
      return;
    }

    try {
      // Store in localStorage specific to Day Planner
      localStorage.setItem('wm-dayplanner-apikey', keyValue);
      
      const statusEl = this.container?.querySelector('#dayPlannerStatus');
      if (statusEl) {
        statusEl.className = 'ai-status-indicator ok';
        statusEl.textContent = '✓ API key saved';
      }
      
      setTimeout(() => this.updateStatus(), 1500);
    } catch (error) {
      console.error('[Day Planner] Failed to save API key:', error);
      const statusEl = this.container?.querySelector('#dayPlannerStatus');
      if (statusEl) {
        statusEl.className = 'ai-status-indicator error';
        statusEl.textContent = '✗ Failed to save';
      }
    }
  }

  private updateStatus(): void {
    if (!this.container) return;

    const statusEl = this.container.querySelector('#dayPlannerStatus');
    if (!statusEl) return;

    const hasKey = localStorage.getItem('wm-dayplanner-apikey');
    
    if (hasKey) {
      statusEl.className = 'ai-status-indicator ok';
      statusEl.textContent = `✓ ${this.selectedProvider.charAt(0).toUpperCase() + this.selectedProvider.slice(1)} configured`;
    } else {
      statusEl.className = 'ai-status-indicator warn';
      statusEl.textContent = '○ Enter API key to use AI features';
    }
  }

  private addTask(): void {
    const input = this.container?.querySelector('#addTaskInput') as HTMLInputElement;
    if (!input || !input.value.trim()) return;

    const task: DayPlanTask = {
      id: Math.random().toString(36).substring(2, 9),
      text: input.value.trim(),
      priority: 'medium',
      completed: false,
    };

    this.tasks.push(task);
    this.saveState();
    this.render();
  }

  private async generateAITasks(): Promise<void> {
    if (this.isGenerating) return;
    
    const hasApiKey = localStorage.getItem('wm-dayplanner-apikey');
    if (!hasApiKey) {
      alert('Please enter your API key first to use AI generation');
      return;
    }

    this.isGenerating = true;
    this.render();

    try {
      // TODO: Implement actual AI call here
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Placeholder AI-generated tasks
      const aiTasks = [
        { id: 'ai1', text: 'Review project priorities', priority: 'high' as const, completed: false, aiGenerated: true },
        { id: 'ai2', text: 'Complete documentation', priority: 'medium' as const, completed: false, aiGenerated: true },
        { id: 'ai3', text: 'Team sync meeting', priority: 'high' as const, completed: false, aiGenerated: true },
      ];

      this.tasks = [...this.tasks, ...aiTasks];
      this.saveState();
      this.render();
    } catch (error) {
      console.error('[Day Planner] AI generation failed:', error);
      alert('Failed to generate AI tasks. Please check your API key.');
    } finally {
      this.isGenerating = false;
    }
  }

  private async generateAINotes(): Promise<void> {
    if (this.isGenerating) return;
    
    const hasApiKey = localStorage.getItem('wm-dayplanner-apikey');
    if (!hasApiKey) {
      alert('Please enter your API key first to use AI generation');
      return;
    }

    this.isGenerating = true;
    this.render();

    try {
      // TODO: Implement actual AI call here
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Placeholder AI-generated note
      const aiNote: DayPlanNote = {
        id: Math.random().toString(36).substring(2, 9),
        content: 'Consider focusing on high-impact tasks first. Break complex projects into smaller, manageable steps.',
        timestamp: Date.now(),
        aiGenerated: true,
      };

      this.notes.push(aiNote);
      this.saveState();
      this.render();
    } catch (error) {
      console.error('[Day Planner] AI generation failed:', error);
      alert('Failed to generate AI notes. Please check your API key.');
    } finally {
      this.isGenerating = false;
    }
  }

  unmount(): void {
    this.container = null;
    this.apiKeyInput = null;
  }
}
