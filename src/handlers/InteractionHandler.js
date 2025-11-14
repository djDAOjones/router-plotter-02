/**
 * InteractionHandler - Manages mouse, keyboard, and touch interactions
 * Handles canvas clicks, dragging, keyboard shortcuts, and drag & drop
 */

import { INTERACTION } from '../config/constants.js';

export class InteractionHandler {
  constructor(canvas, eventBus) {
    this.canvas = canvas;
    this.eventBus = eventBus;
    
    // Drag state
    this.isDragging = false;
    this.hasDragged = false;
    this.dragOffset = { x: 0, y: 0 };
    this.selectedWaypoint = null;
    
    // Bind methods
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleCanvasClick = this.handleCanvasClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    
    this.setupEventListeners();
  }
  
  /**
   * Set up all interaction event listeners
   */
  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('click', this.handleCanvasClick);
    
    // Touch events (for mobile support)
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Drag and drop for images
    this.canvas.addEventListener('dragover', this.handleDragOver);
    this.canvas.addEventListener('drop', this.handleDrop);
    
    // Context menu (right-click)
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.handleContextMenu(e);
    });
  }
  
  /**
   * Handle mouse down event
   */
  handleMouseDown(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if clicking on a waypoint
    this.eventBus.emit('waypoint:check-at-position', { x, y }, (waypoint) => {
      if (waypoint) {
        this.selectedWaypoint = waypoint;
        this.isDragging = true;
        this.hasDragged = false;
        
        // Calculate drag offset
        this.eventBus.emit('coordinate:image-to-canvas', 
          { imgX: waypoint.imgX, imgY: waypoint.imgY }, 
          (canvasPos) => {
            this.dragOffset.x = x - canvasPos.x;
            this.dragOffset.y = y - canvasPos.y;
          }
        );
        
        // Add dragging class to canvas
        this.canvas.classList.add('dragging');
        
        // Select the waypoint
        this.eventBus.emit('waypoint:selected', waypoint);
      }
    });
  }
  
  /**
   * Handle mouse move event
   */
  handleMouseMove(event) {
    if (this.isDragging && this.selectedWaypoint) {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Track that we actually moved
      this.hasDragged = true;
      
      // Calculate new position accounting for offset
      const newX = x - this.dragOffset.x;
      const newY = y - this.dragOffset.y;
      
      // Convert to image coordinates
      this.eventBus.emit('coordinate:canvas-to-image',
        { canvasX: newX, canvasY: newY },
        (imgPos) => {
          // Emit position change event
          this.eventBus.emit('waypoint:position-changed', {
            waypoint: this.selectedWaypoint,
            imgX: imgPos.x,
            imgY: imgPos.y,
            isDragging: true
          });
        }
      );
    }
  }
  
  /**
   * Handle mouse up event
   */
  handleMouseUp(event) {
    if (this.isDragging) {
      this.isDragging = false;
      this.canvas.classList.remove('dragging');
      
      // If we actually dragged, save the position
      if (this.hasDragged) {
        this.eventBus.emit('waypoint:drag-ended', this.selectedWaypoint);
      }
      
      this.selectedWaypoint = null;
      this.hasDragged = false;
    }
  }
  
  /**
   * Handle canvas click event
   */
  handleCanvasClick(event) {
    // Don't add waypoint if we actually dragged
    if (this.hasDragged) {
      this.hasDragged = false;
      return;
    }
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if clicking on existing waypoint
    this.eventBus.emit('waypoint:check-at-position', { x, y }, (waypoint) => {
      if (waypoint) {
        // Select existing waypoint
        this.eventBus.emit('waypoint:selected', waypoint);
      } else {
        // Add new waypoint
        const isMajor = !event.shiftKey; // Shift+click for minor waypoint
        
        // Convert to image coordinates
        this.eventBus.emit('coordinate:canvas-to-image',
          { canvasX: x, canvasY: y },
          (imgPos) => {
            this.eventBus.emit('waypoint:add', {
              imgX: imgPos.x,
              imgY: imgPos.y,
              isMajor: isMajor
            });
          }
        );
      }
    });
  }
  
  /**
   * Handle keyboard events
   */
  handleKeyDown(event) {
    // Don't interfere with input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }
    
    const key = event.key.toLowerCase();
    const shift = event.shiftKey;
    const ctrl = event.ctrlKey || event.metaKey;
    
    // Animation controls
    if (key === ' ') {
      event.preventDefault();
      this.eventBus.emit('ui:animation:toggle');
    } else if (key === 'arrowleft' && !shift) {
      event.preventDefault();
      this.eventBus.emit('ui:animation:skip-start');
    } else if (key === 'arrowright' && !shift) {
      event.preventDefault();
      this.eventBus.emit('ui:animation:skip-end');
    }
    
    // Playback speed controls (J/K/L keys)
    else if (key === 'j') {
      event.preventDefault();
      this.eventBus.emit('animation:speed-decrease');
    } else if (key === 'k') {
      event.preventDefault();
      this.eventBus.emit('animation:speed-reset');
    } else if (key === 'l') {
      event.preventDefault();
      this.eventBus.emit('animation:speed-increase');
    }
    
    // Waypoint movement (arrow keys with shift)
    else if (shift && this.selectedWaypoint) {
      const moveAmount = ctrl ? 10 : 1; // Ctrl for larger movements
      let dx = 0, dy = 0;
      
      switch (key) {
        case 'arrowup':
          dy = -moveAmount;
          break;
        case 'arrowdown':
          dy = moveAmount;
          break;
        case 'arrowleft':
          dx = -moveAmount;
          break;
        case 'arrowright':
          dx = moveAmount;
          break;
        default:
          return;
      }
      
      if (dx !== 0 || dy !== 0) {
        event.preventDefault();
        this.eventBus.emit('waypoint:move-by-pixels', {
          waypoint: this.selectedWaypoint,
          dx: dx,
          dy: dy
        });
      }
    }
    
    // Delete selected waypoint
    else if ((key === 'delete' || key === 'backspace') && this.selectedWaypoint) {
      event.preventDefault();
      this.eventBus.emit('waypoint:delete-selected');
    }
    
    // Select next/previous waypoint
    else if (key === 'tab') {
      event.preventDefault();
      const direction = shift ? 'previous' : 'next';
      this.eventBus.emit('waypoint:select-adjacent', direction);
    }
    
    // Toggle waypoint type
    else if (key === 't' && this.selectedWaypoint) {
      event.preventDefault();
      this.eventBus.emit('waypoint:toggle-type', this.selectedWaypoint);
    }
    
    // Undo/Redo (Ctrl+Z, Ctrl+Shift+Z)
    else if (ctrl && key === 'z') {
      event.preventDefault();
      if (shift) {
        this.eventBus.emit('history:redo');
      } else {
        this.eventBus.emit('history:undo');
      }
    }
    
    // Save (Ctrl+S)
    else if (ctrl && key === 's') {
      event.preventDefault();
      this.eventBus.emit('file:save');
    }
    
    // Help (?)
    else if (key === '?' || key === 'h') {
      event.preventDefault();
      this.eventBus.emit('help:toggle');
    }
  }
  
  /**
   * Handle touch start (mobile)
   */
  handleTouchStart(event) {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // Simulate mouse down
      this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    }
  }
  
  /**
   * Handle touch move (mobile)
   */
  handleTouchMove(event) {
    if (event.touches.length === 1 && this.isDragging) {
      event.preventDefault();
      const touch = event.touches[0];
      
      // Simulate mouse move
      this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }
  }
  
  /**
   * Handle touch end (mobile)
   */
  handleTouchEnd(event) {
    if (event.changedTouches.length === 1) {
      const touch = event.changedTouches[0];
      
      // Simulate mouse up
      this.handleMouseUp({ clientX: touch.clientX, clientY: touch.clientY });
      
      // If no drag occurred, treat as click
      if (!this.hasDragged) {
        this.handleCanvasClick({ 
          clientX: touch.clientX, 
          clientY: touch.clientY,
          shiftKey: false 
        });
      }
    }
  }
  
  /**
   * Handle drag over event (for image drop)
   */
  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    this.canvas.classList.add('drag-over');
  }
  
  /**
   * Handle drop event (for image drop)
   */
  handleDrop(event) {
    event.preventDefault();
    this.canvas.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        this.eventBus.emit('background:upload', file);
      }
    }
  }
  
  /**
   * Handle context menu (right-click)
   */
  handleContextMenu(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if right-clicking on a waypoint
    this.eventBus.emit('waypoint:check-at-position', { x, y }, (waypoint) => {
      if (waypoint) {
        // Show waypoint context menu
        this.eventBus.emit('waypoint:show-context-menu', {
          waypoint: waypoint,
          x: event.clientX,
          y: event.clientY
        });
      } else {
        // Show canvas context menu
        this.eventBus.emit('canvas:show-context-menu', {
          x: event.clientX,
          y: event.clientY,
          canvasX: x,
          canvasY: y
        });
      }
    });
  }
  
  /**
   * Set selected waypoint (for external updates)
   */
  setSelectedWaypoint(waypoint) {
    this.selectedWaypoint = waypoint;
  }
  
  /**
   * Clean up event listeners
   */
  destroy() {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('click', this.handleCanvasClick);
    document.removeEventListener('keydown', this.handleKeyDown);
    this.canvas.removeEventListener('dragover', this.handleDragOver);
    this.canvas.removeEventListener('drop', this.handleDrop);
  }
}
