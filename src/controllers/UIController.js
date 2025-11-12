/**
 * UIController - Manages all UI interactions and updates
 * Handles waypoint list, editor controls, tabs, and animation controls
 */

import { RENDERING, ANIMATION } from '../config/constants.js';

export class UIController {
  constructor(elements, eventBus) {
    this.elements = elements;
    this.eventBus = eventBus;
    this.selectedWaypoint = null;
    
    // Bind methods
    this.updateWaypointList = this.updateWaypointList.bind(this);
    this.updateWaypointEditor = this.updateWaypointEditor.bind(this);
    this.syncAnimationControls = this.syncAnimationControls.bind(this);
    
    this.setupEventListeners();
  }
  
  /**
   * Set up all UI event listeners
   */
  setupEventListeners() {
    // Tab switching
    this.elements.tabBtns?.forEach(btn => {
      btn.addEventListener('click', (e) => this.handleTabSwitch(e));
    });
    
    // Background controls
    this.elements.bgUploadBtn?.addEventListener('click', () => {
      this.elements.bgUpload.click();
    });
    
    this.elements.bgUpload?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.eventBus.emit('background:upload', file);
      }
    });
    
    this.elements.bgOverlay?.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.elements.bgOverlayValue.textContent = value;
      this.eventBus.emit('background:overlay-change', value);
    });
    
    this.elements.bgFitToggle?.addEventListener('click', () => {
      const currentMode = this.elements.bgFitToggle.dataset.mode;
      const newMode = currentMode === 'fit' ? 'fill' : 'fit';
      this.elements.bgFitToggle.dataset.mode = newMode;
      this.elements.bgFitToggle.textContent = newMode === 'fit' ? 'Fit' : 'Fill';
      this.eventBus.emit('background:mode-change', newMode);
    });
    
    // Animation controls
    this.elements.playBtn?.addEventListener('click', () => {
      this.eventBus.emit('animation:play');
    });
    
    this.elements.pauseBtn?.addEventListener('click', () => {
      this.eventBus.emit('animation:pause');
    });
    
    this.elements.skipStartBtn?.addEventListener('click', () => {
      this.eventBus.emit('animation:skip-start');
    });
    
    this.elements.skipEndBtn?.addEventListener('click', () => {
      this.eventBus.emit('animation:skip-end');
    });
    
    this.elements.timelineSlider?.addEventListener('input', (e) => {
      const progress = e.target.value / ANIMATION.TIMELINE_RESOLUTION;
      this.eventBus.emit('animation:seek', progress);
    });
    
    this.elements.animationSpeed?.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value);
      const seconds = (1000 / speed).toFixed(1);
      this.elements.animationSpeedValue.textContent = `${seconds}s`;
      this.eventBus.emit('animation:speed-change', speed);
    });
    
    // Clear button
    this.elements.clearBtn?.addEventListener('click', () => {
      if (confirm('Clear all waypoints?')) {
        this.eventBus.emit('waypoints:clear-all');
      }
    });
    
    // Help button
    this.elements.helpBtn?.addEventListener('click', () => {
      this.showHelp();
    });
    
    // Waypoint editor controls
    this.setupWaypointEditorControls();
  }
  
  /**
   * Setup waypoint editor controls
   */
  setupWaypointEditorControls() {
    // Marker style
    this.elements.markerStyle?.addEventListener('change', (e) => {
      if (this.selectedWaypoint) {
        this.eventBus.emit('waypoint:style-changed', {
          waypoint: this.selectedWaypoint,
          property: 'markerStyle',
          value: e.target.value
        });
      }
    });
    
    // Dot color
    this.elements.dotColor?.addEventListener('input', (e) => {
      if (this.selectedWaypoint) {
        this.eventBus.emit('waypoint:style-changed', {
          waypoint: this.selectedWaypoint,
          property: 'dotColor',
          value: e.target.value
        });
      }
    });
    
    // Dot size
    this.elements.dotSize?.addEventListener('input', (e) => {
      const size = parseInt(e.target.value);
      this.elements.dotSizeValue.textContent = size;
      if (this.selectedWaypoint) {
        this.eventBus.emit('waypoint:style-changed', {
          waypoint: this.selectedWaypoint,
          property: 'dotSize',
          value: size
        });
      }
    });
    
    // Segment properties
    this.elements.segmentColor?.addEventListener('input', (e) => {
      if (this.selectedWaypoint) {
        this.eventBus.emit('waypoint:path-property-changed', {
          waypoint: this.selectedWaypoint,
          property: 'segmentColor',
          value: e.target.value
        });
      }
    });
    
    this.elements.segmentWidth?.addEventListener('input', (e) => {
      const width = parseInt(e.target.value);
      this.elements.segmentWidthValue.textContent = width;
      if (this.selectedWaypoint) {
        this.eventBus.emit('waypoint:path-property-changed', {
          waypoint: this.selectedWaypoint,
          property: 'segmentWidth',
          value: width
        });
      }
    });
    
    this.elements.segmentStyle?.addEventListener('change', (e) => {
      if (this.selectedWaypoint) {
        this.eventBus.emit('waypoint:path-property-changed', {
          waypoint: this.selectedWaypoint,
          property: 'segmentStyle',
          value: e.target.value
        });
      }
    });
    
    // Path shape
    this.elements.pathShape?.addEventListener('change', (e) => {
      if (this.selectedWaypoint) {
        this.eventBus.emit('waypoint:path-property-changed', {
          waypoint: this.selectedWaypoint,
          property: 'pathShape',
          value: e.target.value
        });
      }
    });
    
    // Beacon style
    this.elements.editorBeaconStyle?.addEventListener('change', (e) => {
      if (this.selectedWaypoint) {
        this.eventBus.emit('waypoint:style-changed', {
          waypoint: this.selectedWaypoint,
          property: 'beaconStyle',
          value: e.target.value
        });
      }
    });
    
    this.elements.editorBeaconColor?.addEventListener('input', (e) => {
      if (this.selectedWaypoint) {
        this.eventBus.emit('waypoint:style-changed', {
          waypoint: this.selectedWaypoint,
          property: 'beaconColor',
          value: e.target.value
        });
      }
    });
    
    // Label controls
    this.elements.waypointLabel?.addEventListener('input', (e) => {
      if (this.selectedWaypoint) {
        this.eventBus.emit('waypoint:style-changed', {
          waypoint: this.selectedWaypoint,
          property: 'label',
          value: e.target.value
        });
      }
    });
    
    this.elements.labelMode?.addEventListener('change', (e) => {
      if (this.selectedWaypoint) {
        this.eventBus.emit('waypoint:style-changed', {
          waypoint: this.selectedWaypoint,
          property: 'labelMode',
          value: e.target.value
        });
      }
    });
    
    this.elements.labelPosition?.addEventListener('change', (e) => {
      if (this.selectedWaypoint) {
        this.eventBus.emit('waypoint:style-changed', {
          waypoint: this.selectedWaypoint,
          property: 'labelPosition',
          value: e.target.value
        });
      }
    });
    
    // Pause time
    this.elements.waypointPauseTime?.addEventListener('input', (e) => {
      const time = parseFloat(e.target.value);
      this.elements.waypointPauseTimeValue.textContent = `${time}s`;
      if (this.selectedWaypoint) {
        this.eventBus.emit('waypoint:style-changed', {
          waypoint: this.selectedWaypoint,
          property: 'pauseTime',
          value: time * 1000 // Convert to ms
        });
      }
    });
    
    // Path head controls
    this.elements.pathHeadStyle?.addEventListener('change', (e) => {
      this.eventBus.emit('pathhead:style-changed', e.target.value);
    });
    
    this.elements.pathHeadColor?.addEventListener('input', (e) => {
      this.eventBus.emit('pathhead:color-changed', e.target.value);
    });
    
    this.elements.pathHeadSize?.addEventListener('input', (e) => {
      const size = parseInt(e.target.value);
      this.elements.pathHeadSizeValue.textContent = size;
      this.eventBus.emit('pathhead:size-changed', size);
    });
  }
  
  /**
   * Handle tab switching
   */
  handleTabSwitch(event) {
    const tabBtn = event.target;
    const tabName = tabBtn.dataset.tab;
    
    // Update button states
    this.elements.tabBtns.forEach(btn => btn.classList.remove('active'));
    tabBtn.classList.add('active');
    
    // Show corresponding tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    const tabContent = document.getElementById(`${tabName}-tab`);
    if (tabContent) {
      tabContent.classList.add('active');
    }
  }
  
  /**
   * Update waypoint list UI
   */
  updateWaypointList(waypoints) {
    if (!this.elements.waypointList) return;
    
    this.elements.waypointList.innerHTML = '';
    
    // Only show major waypoints in the list
    const majorWaypoints = waypoints.filter(wp => wp.isMajor);
    
    majorWaypoints.forEach((waypoint, index) => {
      const item = document.createElement('div');
      item.className = 'waypoint-item';
      item.draggable = true; // Enable drag and drop
      if (waypoint === this.selectedWaypoint) {
        item.classList.add('selected');
      }
      
      // Drag handle
      const handle = document.createElement('span');
      handle.className = 'waypoint-item-handle';
      handle.textContent = '☰';
      
      // Label
      const label = document.createElement('span');
      label.className = 'waypoint-item-label';
      label.textContent = waypoint.label || `Waypoint ${index + 1}`;
      
      // Delete button (simple × character for cleaner look)
      const delBtn = document.createElement('button');
      delBtn.className = 'waypoint-item-delete';
      delBtn.textContent = '×';
      delBtn.title = 'Delete waypoint';
      
      item.appendChild(handle);
      item.appendChild(label);
      item.appendChild(delBtn);
      
      // Click anywhere on item to select (original behavior)
      const selectWaypoint = (e) => {
        e.stopPropagation();
        this.eventBus.emit('waypoint:selected', waypoint);
      };
      
      label.addEventListener('click', selectWaypoint);
      handle.addEventListener('click', selectWaypoint);
      item.addEventListener('click', selectWaypoint);
      
      // Delete button
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete this waypoint?')) {
          this.eventBus.emit('waypoint:deleted', waypoint);
        }
      });
      
      // Drag and drop handlers
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
        item.classList.add('dragging');
      });
      
      item.addEventListener('dragend', (e) => {
        item.classList.remove('dragging');
      });
      
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const dragging = this.elements.waypointList.querySelector('.dragging');
        if (dragging && dragging !== item) {
          const rect = item.getBoundingClientRect();
          const midpoint = rect.top + rect.height / 2;
          
          if (e.clientY < midpoint) {
            item.parentNode.insertBefore(dragging, item);
          } else {
            item.parentNode.insertBefore(dragging, item.nextSibling);
          }
        }
      });
      
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        // Emit reorder event with new order
        const items = Array.from(this.elements.waypointList.children);
        const newOrder = items.map(el => {
          const idx = Array.from(el.parentElement.children).indexOf(el);
          return majorWaypoints[parseInt(el.dataset.originalIndex || idx)];
        });
        this.eventBus.emit('waypoints:reordered', newOrder);
      });
      
      // Store original index for reordering
      item.dataset.originalIndex = index;
      
      this.elements.waypointList.appendChild(item);
    });
  }
  
  /**
   * Update waypoint editor with selected waypoint data
   */
  updateWaypointEditor(waypoint) {
    this.selectedWaypoint = waypoint;
    
    if (!waypoint) {
      // Hide editor, show placeholder
      if (this.elements.waypointEditor) {
        this.elements.waypointEditor.style.display = 'none';
      }
      if (this.elements.waypointEditorPlaceholder) {
        this.elements.waypointEditorPlaceholder.style.display = 'flex';
      }
      return;
    }
    
    // Show editor, hide placeholder
    if (this.elements.waypointEditor) {
      this.elements.waypointEditor.style.display = 'block';
    }
    if (this.elements.waypointEditorPlaceholder) {
      this.elements.waypointEditorPlaceholder.style.display = 'none';
    }
    
    // Update controls with waypoint values
    if (this.elements.markerStyle) {
      this.elements.markerStyle.value = waypoint.markerStyle || 'dot';
    }
    
    if (this.elements.dotColor) {
      this.elements.dotColor.value = waypoint.dotColor || '#FF6B6B';
    }
    
    if (this.elements.dotSize) {
      this.elements.dotSize.value = waypoint.dotSize || 8;
      this.elements.dotSizeValue.textContent = waypoint.dotSize || 8;
    }
    
    if (this.elements.segmentColor) {
      this.elements.segmentColor.value = waypoint.segmentColor || '#FF6B6B';
    }
    
    if (this.elements.segmentWidth) {
      this.elements.segmentWidth.value = waypoint.segmentWidth || 3;
      this.elements.segmentWidthValue.textContent = waypoint.segmentWidth || 3;
    }
    
    if (this.elements.segmentStyle) {
      this.elements.segmentStyle.value = waypoint.segmentStyle || 'solid';
    }
    
    if (this.elements.pathShape) {
      this.elements.pathShape.value = waypoint.pathShape || 'line';
    }
    
    if (this.elements.editorBeaconStyle) {
      this.elements.editorBeaconStyle.value = waypoint.beaconStyle || 'pulse';
    }
    
    if (this.elements.editorBeaconColor) {
      this.elements.editorBeaconColor.value = waypoint.beaconColor || '#FF6B6B';
    }
    
    if (this.elements.waypointLabel) {
      this.elements.waypointLabel.value = waypoint.label || '';
    }
    
    if (this.elements.labelMode) {
      this.elements.labelMode.value = waypoint.labelMode || 'none';
    }
    
    if (this.elements.labelPosition) {
      this.elements.labelPosition.value = waypoint.labelPosition || 'auto';
    }
    
    if (this.elements.waypointPauseTime) {
      const pauseSeconds = (waypoint.pauseTime || 1500) / 1000;
      this.elements.waypointPauseTime.value = pauseSeconds;
      this.elements.waypointPauseTimeValue.textContent = `${pauseSeconds}s`;
    }
    
    // Update pause control visibility
    const pauseControl = this.elements.pauseTimeControl;
    if (pauseControl) {
      pauseControl.style.display = waypoint.isMajor ? 'block' : 'none';
    }
  }
  
  /**
   * Sync animation controls with animation state
   */
  syncAnimationControls(state) {
    // Toggle play/pause button visibility
    if (state.isPlaying) {
      if (this.elements.playBtn) this.elements.playBtn.style.display = 'none';
      if (this.elements.pauseBtn) this.elements.pauseBtn.style.display = 'inline-block';
    } else {
      if (this.elements.playBtn) this.elements.playBtn.style.display = 'inline-block';
      if (this.elements.pauseBtn) this.elements.pauseBtn.style.display = 'none';
    }
    
    // Update timeline
    if (this.elements.timelineSlider && !state.isDraggingTimeline) {
      this.elements.timelineSlider.value = Math.round(state.progress * ANIMATION.TIMELINE_RESOLUTION);
    }
    
    // Update time display
    this.updateTimeDisplay(state.currentTime, state.duration);
  }
  
  /**
   * Update time display
   */
  updateTimeDisplay(currentTime, duration) {
    const formatTime = (ms) => {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };
    
    if (this.elements.currentTime) {
      this.elements.currentTime.textContent = formatTime(currentTime);
    }
    if (this.elements.totalTime) {
      this.elements.totalTime.textContent = formatTime(duration);
    }
  }
  
  /**
   * Show help/splash screen
   */
  showHelp() {
    if (this.elements.splash) {
      this.elements.splash.style.display = 'flex';
    }
  }
  
  /**
   * Hide help/splash screen
   */
  hideHelp() {
    if (this.elements.splash) {
      this.elements.splash.style.display = 'none';
    }
  }
  
  /**
   * Make an announcement for screen readers
   */
  announce(message) {
    if (this.elements.announcer) {
      this.elements.announcer.textContent = message;
    }
  }
}
