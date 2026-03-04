import { escapeHtml } from '@/utils/sanitize';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'highest' | 'high' | 'medium' | 'low' | 'lowest';
  status: 'todo' | 'inProgress' | 'done';
  assignee?: string;
  tags: string[];
  dueDate?: string;
  storyPoints?: number;
  createdAt: number;
  updatedAt: number;
}

export class ProductivityTopBar {
  private element: HTMLElement;
  private kanbanTasks: Task[] = [];
  private stopwatchInterval: number | null = null;
  private stopwatchSeconds: number = 0;
  private draggedTaskId: string | null = null;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'productivity-top-bar';
    this.element.style.display = 'flex';
    this.element.style.gap = '20px';
    this.element.style.padding = '15px';
    this.element.style.margin = '10px 10px 0 10px';
    this.element.style.background = 'var(--panel-bg, #1a1a1a)';
    this.element.style.border = '1px solid var(--panel-border, #333)';
    this.element.style.borderRadius = '8px';
    this.element.style.color = 'var(--text-primary, #fff)';
    
    this.loadState();
    this.render();
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  private saveState(): void {
    localStorage.setItem('wm_productivity_kanban', JSON.stringify(this.kanbanTasks));
    localStorage.setItem('wm_productivity_stopwatch', this.stopwatchSeconds.toString());
  }

  private loadState(): void {
    const kanbanData = localStorage.getItem('wm_productivity_kanban');
    if (kanbanData) {
      try {
        this.kanbanTasks = JSON.parse(kanbanData);
      } catch (e) {
        console.error('Failed to load kanban tasks', e);
      }
    }
    const stopwatchData = localStorage.getItem('wm_productivity_stopwatch');
    if (stopwatchData) {
      this.stopwatchSeconds = parseInt(stopwatchData, 10) || 0;
    }
  }

  private getTasksByStatus(status: string): Task[] {
    return this.kanbanTasks.filter(task => task.status === status);
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="kanban-section" style="flex: 1; display: flex; gap: 15px; min-width: 0;">
        ${this.renderColumn('todo', 'To Do', '#2a2a2a')}
        ${this.renderColumn('inProgress', 'In Progress', '#2a3a4a')}
        ${this.renderColumn('done', 'Done', '#2a4a3a')}
      </div>
      <div class="stopwatch-section" style="flex: 0 0 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 20px;">
        <h4 style="margin: 0 0 10px 0; font-size: 1.1em; opacity: 0.8;">Stopwatch</h4>
        <div class="time-display" style="font-size: 2.5em; font-family: monospace; font-weight: bold; margin-bottom: 15px; letter-spacing: 2px;">
          ${this.formatTime(this.stopwatchSeconds)}
        </div>
        <div class="stopwatch-controls" style="display: flex; gap: 10px;">
          <button class="sw-btn start" style="padding: 8px 16px; background: #28a745; border: none; border-radius: 4px; color: white; cursor: pointer;">Start</button>
          <button class="sw-btn stop" style="padding: 8px 16px; background: #dc3545; border: none; border-radius: 4px; color: white; cursor: pointer;">Stop</button>
          <button class="sw-btn reset" style="padding: 8px 16px; background: #6c757d; border: none; border-radius: 4px; color: white; cursor: pointer;">Reset</button>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderColumn(_status: string, title: string, _bgColor: string): string {
    const tasks = this.getTasksByStatus(_status);
    
    const tasksHtml = tasks.map(task => `
      <div class="kanban-task-card" draggable="true" data-task-id="${task.id}">
        <div class="task-card-header">
          <span class="task-priority-badge priority-${task.priority}">${task.priority.toUpperCase()}</span>
          ${task.storyPoints ? `<span class="story-points">${task.storyPoints} pts</span>` : ''}
        </div>
        <div class="task-card-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-card-description">${escapeHtml(task.description.substring(0, 80))}${task.description.length > 80 ? '...' : ''}</div>` : ''}
        <div class="task-card-meta">
          ${task.assignee ? `<span class="task-assignee">👤 ${escapeHtml(task.assignee)}</span>` : ''}
          ${task.dueDate ? `<span class="task-due-date ${this.isOverdue(task.dueDate) ? 'overdue' : ''}">📅 ${this.formatDueDate(task.dueDate)}</span>` : ''}
        </div>
        ${task.tags && task.tags.length > 0 ? `<div class="task-tags">${task.tags.map(tag => `<span class="task-tag">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
        <div class="task-card-actions">
          <button class="edit-task-btn" data-task-id="${task.id}" title="Edit">✏️</button>
          <button class="delete-task-btn" data-task-id="${task.id}" title="Delete">×</button>
        </div>
      </div>
    `).join('');

    return `
      <div class="kanban-column" data-status="${status}">
        <div class="kanban-column-header">
          <h4 class="kanban-column-title">${title} <span class="task-count">${tasks.length}</span></h4>
          <button class="add-task-btn" data-status="${status}" title="Add Task">+</button>
        </div>
        <div class="kanban-task-list" data-status="${status}">
          ${tasksHtml}
        </div>
        ${status === 'todo' ? `
          <div class="quick-add-task">
            <input type="text" class="quick-add-input" placeholder="+ Add task or press Enter..." />
          </div>
        ` : ''}
      </div>
    `;
  }

  private isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  private formatDueDate(dueDate: string): string {
    const date = new Date(dueDate);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days <= 7) return `${days}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  private formatTime(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  }

  private showCreateTaskModal(status?: string, existingTask?: Task): void {
    const modal = document.createElement('div');
    modal.className = 'task-modal-overlay';
    modal.innerHTML = `
      <div class="task-modal">
        <div class="task-modal-header">
          <h3>${existingTask ? 'Edit Task' : 'Create New Task'}</h3>
          <button class="modal-close">×</button>
        </div>
        <div class="task-modal-body">
          <div class="form-group">
            <label>Title *</label>
            <input type="text" class="task-title-input" value="${existingTask ? escapeHtml(existingTask.title) : ''}" placeholder="Task title" required />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea class="task-description-input" rows="3" placeholder="Detailed description...">${existingTask ? escapeHtml(existingTask.description) : ''}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Priority</label>
              <select class="task-priority-select">
                <option value="lowest" ${existingTask?.priority === 'lowest' ? 'selected' : ''}>Lowest</option>
                <option value="low" ${existingTask?.priority === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${existingTask?.priority === 'medium' || !existingTask ? 'selected' : ''}>Medium</option>
                <option value="high" ${existingTask?.priority === 'high' ? 'selected' : ''}>High</option>
                <option value="highest" ${existingTask?.priority === 'highest' ? 'selected' : ''}>Highest</option>
              </select>
            </div>
            <div class="form-group">
              <label>Status</label>
              <select class="task-status-select">
                <option value="todo" ${!existingTask || existingTask.status === 'todo' ? 'selected' : ''}>To Do</option>
                <option value="inProgress" ${existingTask?.status === 'inProgress' ? 'selected' : ''}>In Progress</option>
                <option value="done" ${existingTask?.status === 'done' ? 'selected' : ''}>Done</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Assignee</label>
              <input type="text" class="task-assignee-input" value="${existingTask?.assignee || ''}" placeholder="Name" />
            </div>
            <div class="form-group">
              <label>Story Points</label>
              <input type="number" class="task-points-input" value="${existingTask?.storyPoints || ''}" min="0" max="100" placeholder="1-100" />
            </div>
            <div class="form-group">
              <label>Due Date</label>
              <input type="date" class="task-due-date-input" value="${existingTask?.dueDate || ''}" />
            </div>
          </div>
          <div class="form-group">
            <label>Tags (comma-separated)</label>
            <input type="text" class="task-tags-input" value="${existingTask?.tags ? escapeHtml(existingTask.tags.join(', ')) : ''}" placeholder="feature, bug, urgent" />
          </div>
        </div>
        <div class="task-modal-footer">
          <button class="btn-cancel">Cancel</button>
          <button class="btn-save">${existingTask ? 'Save Changes' : 'Create Task'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.btn-cancel');
    const saveBtn = modal.querySelector('.btn-save');

    closeBtn?.addEventListener('click', () => this.closeTaskModal(modal));
    cancelBtn?.addEventListener('click', () => this.closeTaskModal(modal));
    saveBtn?.addEventListener('click', () => this.saveTaskFromModal(modal, existingTask));

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeTaskModal(modal);
    });
  }

  private closeTaskModal(modal: HTMLElement): void {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }

  private saveTaskFromModal(modal: HTMLElement, existingTask?: Task): void {
    const titleInput = modal.querySelector('.task-title-input') as HTMLInputElement;
    const descriptionInput = modal.querySelector('.task-description-input') as HTMLTextAreaElement;
    const prioritySelect = modal.querySelector('.task-priority-select') as HTMLSelectElement;
    const statusSelect = modal.querySelector('.task-status-select') as HTMLSelectElement;
    const assigneeInput = modal.querySelector('.task-assignee-input') as HTMLInputElement;
    const pointsInput = modal.querySelector('.task-points-input') as HTMLInputElement;
    const dueDateInput = modal.querySelector('.task-due-date-input') as HTMLInputElement;
    const tagsInput = modal.querySelector('.task-tags-input') as HTMLInputElement;

    const title = titleInput?.value.trim();
    if (!title) {
      alert('Please enter a task title');
      titleInput?.focus();
      return;
    }

    const now = Date.now();
    
    if (existingTask) {
      // Update existing task
      const taskIndex = this.kanbanTasks.findIndex(t => t.id === existingTask.id);
      if (taskIndex > -1) {
        this.kanbanTasks[taskIndex] = {
          ...this.kanbanTasks[taskIndex],
          title,
          description: descriptionInput?.value.trim() || '',
          priority: prioritySelect?.value as Task['priority'],
          status: statusSelect?.value as Task['status'],
          assignee: assigneeInput?.value.trim() || undefined,
          storyPoints: pointsInput?.value ? parseInt(pointsInput.value, 10) : undefined,
          dueDate: dueDateInput?.value || undefined,
          tags: tagsInput?.value.split(',').map(t => t.trim()).filter(Boolean) || [],
          updatedAt: now
        } as Task;
      }
    } else {
      // Create new task
      const newTask: Task = {
        id: Math.random().toString(36).substring(2, 9),
        title,
        description: descriptionInput?.value.trim() || '',
        priority: prioritySelect?.value as Task['priority'] || 'medium',
        status: statusSelect?.value as Task['status'] || 'todo',
        assignee: assigneeInput?.value.trim(),
        storyPoints: pointsInput?.value ? parseInt(pointsInput.value, 10) : undefined,
        dueDate: dueDateInput?.value,
        tags: tagsInput?.value.split(',').map(t => t.trim()).filter(Boolean) || [],
        createdAt: now,
        updatedAt: now
      };
      this.kanbanTasks.push(newTask);
    }

    this.saveState();
    this.render();
    this.closeTaskModal(modal);
  }

  private attachEventListeners(): void {
    // Quick Add Task (Enter key)
    const quickAddInput = this.element.querySelector('.quick-add-input') as HTMLInputElement;
    quickAddInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
        const title = (e.target as HTMLInputElement).value.trim();
        const newTask: Task = {
          id: Math.random().toString(36).substring(2, 9),
          title,
          description: '',
          priority: 'medium',
          status: 'todo',
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        this.kanbanTasks.push(newTask);
        this.saveState();
        this.render();
      }
    });

    // Add Task Button
    this.element.querySelectorAll('.add-task-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const status = btn.getAttribute('data-status') as Task['status'];
        this.showCreateTaskModal(status || 'todo');
      });
    });

    // Edit Task
    this.element.querySelectorAll('.edit-task-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId = btn.getAttribute('data-task-id');
        const task = this.kanbanTasks.find(t => t.id === taskId);
        if (task) {
          this.showCreateTaskModal(undefined, task);
        }
      });
    });

    // Delete Task
    this.element.querySelectorAll('.delete-task-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId = btn.getAttribute('data-task-id');
        if (confirm('Are you sure you want to delete this task?')) {
          this.kanbanTasks = this.kanbanTasks.filter(t => t.id !== taskId);
          this.saveState();
          this.render();
        }
      });
    });

    // Drag & Drop
    this.element.querySelectorAll('.kanban-task-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        const taskId = card.getAttribute('data-task-id');
        if (taskId) {
          this.draggedTaskId = taskId;
          (e as DragEvent).dataTransfer?.setData('text/plain', taskId);
          (card as HTMLElement).style.opacity = '0.5';
        }
      });

      card.addEventListener('dragend', () => {
        this.draggedTaskId = null;
        (card as HTMLElement).style.opacity = '1';
      });
    });

    this.element.querySelectorAll('.kanban-task-list').forEach(list => {
      list.addEventListener('dragover', (e) => {
        e.preventDefault();
        (list as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)';
      });

      list.addEventListener('dragleave', () => {
        (list as HTMLElement).style.background = '';
      });

      list.addEventListener('drop', (e) => {
        e.preventDefault();
        (list as HTMLElement).style.background = '';
        
        const taskId = this.draggedTaskId;
        const newStatus = list.getAttribute('data-status') as Task['status'];
        
        if (taskId && newStatus) {
          const task = this.kanbanTasks.find(t => t.id === taskId);
          if (task && task.status !== newStatus) {
            task.status = newStatus;
            task.updatedAt = Date.now();
            this.saveState();
            this.render();
          }
        }
      });
    });

    // Stopwatch Controls
    const startBtn = this.element.querySelector('.sw-btn.start');
    const stopBtn = this.element.querySelector('.sw-btn.stop');
    const resetBtn = this.element.querySelector('.sw-btn.reset');

    startBtn?.addEventListener('click', () => {
      if (!this.stopwatchInterval) {
        this.stopwatchInterval = window.setInterval(() => {
          this.stopwatchSeconds++;
          const disp = this.element.querySelector('.time-display');
          if (disp) disp.textContent = this.formatTime(this.stopwatchSeconds);
          this.saveState();
        }, 1000);
      }
    });

    stopBtn?.addEventListener('click', () => {
      if (this.stopwatchInterval) {
        clearInterval(this.stopwatchInterval);
        this.stopwatchInterval = null;
      }
    });

    resetBtn?.addEventListener('click', () => {
      this.stopwatchSeconds = 0;
      const disp = this.element.querySelector('.time-display');
      if (disp) disp.textContent = this.formatTime(this.stopwatchSeconds);
      if (this.stopwatchInterval) {
        clearInterval(this.stopwatchInterval);
        this.stopwatchInterval = null;
      }
      this.saveState();
    });
  }
}
