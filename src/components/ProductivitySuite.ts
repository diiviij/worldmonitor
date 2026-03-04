/**
 * Merged Productivity Suite - AI Day Planner + Kanban + Stopwatch
 * Adapts based on site variant
 */

import { ProductivityTopBar } from './ProductivityTopBar';
import { AIDayPlanner } from './AIDayPlanner';
import { SITE_VARIANT } from '@/config';

export class ProductivitySuite {
  private container: HTMLElement | null = null;
  private productivityBar: ProductivityTopBar | null = null;
  private dayPlanner: AIDayPlanner | null = null;

  mount(container: HTMLElement): void {
    this.container = container;
    this.render();
    
    if (SITE_VARIANT === 'productivity') {
      // Productivity variant: Show AI Day Planner + Kanban + Stopwatch
      // Mount AI Day Planner (Left Side)
      const dayPlannerMount = container.querySelector('#dayPlannerMount') as HTMLElement;
      if (dayPlannerMount) {
        this.dayPlanner = new AIDayPlanner();
        this.dayPlanner.mount(dayPlannerMount);
      }
      
      // Mount Productivity Top Bar (Right Side - Kanban + Stopwatch)
      const prodBarMount = container.querySelector('#productivityTopBarMount') as HTMLElement;
      if (prodBarMount) {
        this.productivityBar = new ProductivityTopBar();
        prodBarMount.appendChild(this.productivityBar.getElement());
      }
    } else {
      // Other variants (full, tech, finance, happy): DO NOT show AI Day Planner or Kanban
      // These components are now ONLY in the Productivity tab
      // This section intentionally left empty
    }
  }

  private render(): void {
    if (!this.container) return;

    if (SITE_VARIANT === 'productivity') {
      // Productivity variant: Split layout - AI Day Planner + Kanban+Stopwatch
      this.container.innerHTML = `
        <div class="merged-productivity-container productivity-mode">
          <!-- Left: AI Day Planner -->
          <div class="merged-day-planner" id="dayPlannerMount"></div>
          
          <!-- Right: Kanban Board + Stopwatch -->
          <div class="merged-kanban" id="productivityTopBarMount"></div>
        </div>
      `;
    } else {
      // Other variants: Hide the entire section (empty container)
      this.container.innerHTML = `
        <div class="merged-productivity-container hidden">
          <!-- Hidden in non-productivity variants -->
        </div>
      `;
    }
  }

  unmount(): void {
    if (this.productivityBar) {
      this.productivityBar = null;
    }
    if (this.dayPlanner) {
      this.dayPlanner.unmount();
      this.dayPlanner = null;
    }
    this.container = null;
  }
}
