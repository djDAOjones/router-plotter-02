/**
 * Service for handling coordinate transformations between different coordinate systems
 * Manages conversions between canvas, image, and normalized coordinates
 */
export class CoordinateTransform {
  constructor() {
    this.canvasWidth = 0;
    this.canvasHeight = 0;
    this.imageWidth = 0;
    this.imageHeight = 0;
    this.imageBounds = null;
    this.fitMode = 'fit'; // 'fit' or 'fill'
  }
  
  /**
   * Update canvas dimensions
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  setCanvasDimensions(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }
  
  /**
   * Update image dimensions and calculate display bounds
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {string} fitMode - How to fit image ('fit' or 'fill')
   */
  setImageDimensions(width, height, fitMode = 'fit') {
    this.imageWidth = width;
    this.imageHeight = height;
    this.fitMode = fitMode;
    this.calculateImageBounds();
  }
  
  /**
   * Calculate image display bounds based on fit mode
   * @private
   */
  calculateImageBounds() {
    if (!this.imageWidth || !this.imageHeight || !this.canvasWidth || !this.canvasHeight) {
      this.imageBounds = null;
      return;
    }
    
    const canvasAspect = this.canvasWidth / this.canvasHeight;
    const imageAspect = this.imageWidth / this.imageHeight;
    
    let scale, x, y, w, h;
    
    if (this.fitMode === 'fit') {
      // Scale image to fit within canvas
      if (imageAspect > canvasAspect) {
        // Image is wider - fit to width
        scale = this.canvasWidth / this.imageWidth;
      } else {
        // Image is taller - fit to height
        scale = this.canvasHeight / this.imageHeight;
      }
      
      w = this.imageWidth * scale;
      h = this.imageHeight * scale;
      x = (this.canvasWidth - w) / 2;
      y = (this.canvasHeight - h) / 2;
    } else {
      // Fill mode - scale image to cover canvas
      if (imageAspect > canvasAspect) {
        // Image is wider - fit to height
        scale = this.canvasHeight / this.imageHeight;
      } else {
        // Image is taller - fit to width
        scale = this.canvasWidth / this.imageWidth;
      }
      
      w = this.imageWidth * scale;
      h = this.imageHeight * scale;
      x = (this.canvasWidth - w) / 2;
      y = (this.canvasHeight - h) / 2;
    }
    
    this.imageBounds = { x, y, w, h, scale };
  }
  
  /**
   * Convert canvas coordinates to normalized image coordinates (0-1)
   * @param {number} canvasX - X coordinate on canvas
   * @param {number} canvasY - Y coordinate on canvas
   * @returns {Object} Normalized image coordinates {x, y}
   */
  canvasToImage(canvasX, canvasY) {
    if (!this.imageBounds || !this.imageWidth || !this.imageHeight) {
      // No image loaded, return normalized canvas coordinates
      return {
        x: this.canvasWidth > 0 ? canvasX / this.canvasWidth : 0,
        y: this.canvasHeight > 0 ? canvasY / this.canvasHeight : 0
      };
    }
    
    const bounds = this.imageBounds;
    
    if (this.fitMode === 'fit') {
      // In fit mode, convert from canvas to normalized image space
      const imageX = (canvasX - bounds.x) / bounds.w;
      const imageY = (canvasY - bounds.y) / bounds.h;
      // Clamp to 0-1 range for safety
      return { 
        x: Math.max(0, Math.min(1, imageX)), 
        y: Math.max(0, Math.min(1, imageY)) 
      };
    } else {
      // In fill mode, account for cropping
      const sw = this.canvasWidth / bounds.scale;
      const sh = this.canvasHeight / bounds.scale;
      const sx = (this.imageWidth - sw) / 2;
      const sy = (this.imageHeight - sh) / 2;
      
      const imageX = (canvasX / this.canvasWidth * sw + sx) / this.imageWidth;
      const imageY = (canvasY / this.canvasHeight * sh + sy) / this.imageHeight;
      // Clamp to 0-1 range for safety
      return { 
        x: Math.max(0, Math.min(1, imageX)), 
        y: Math.max(0, Math.min(1, imageY)) 
      };
    }
  }
  
  /**
   * Convert normalized image coordinates (0-1) to canvas coordinates
   * @param {number} imageX - Normalized X coordinate (0-1)
   * @param {number} imageY - Normalized Y coordinate (0-1)
   * @returns {Object} Canvas coordinates {x, y}
   */
  imageToCanvas(imageX, imageY) {
    if (!this.imageBounds || !this.imageWidth || !this.imageHeight) {
      // No image loaded, convert from normalized to canvas coordinates
      return {
        x: imageX * this.canvasWidth,
        y: imageY * this.canvasHeight
      };
    }
    
    const bounds = this.imageBounds;
    
    if (this.fitMode === 'fit') {
      // In fit mode, scale from normalized to canvas
      const canvasX = bounds.x + imageX * bounds.w;
      const canvasY = bounds.y + imageY * bounds.h;
      return { x: canvasX, y: canvasY };
    } else {
      // In fill mode, account for cropping
      const sw = this.canvasWidth / bounds.scale;
      const sh = this.canvasHeight / bounds.scale;
      const sx = (this.imageWidth - sw) / 2;
      const sy = (this.imageHeight - sh) / 2;
      
      const canvasX = ((imageX * this.imageWidth - sx) / sw) * this.canvasWidth;
      const canvasY = ((imageY * this.imageHeight - sy) / sh) * this.canvasHeight;
      return { x: canvasX, y: canvasY };
    }
  }
  
  /**
   * Check if a point is within the image bounds
   * @param {number} canvasX - X coordinate on canvas
   * @param {number} canvasY - Y coordinate on canvas
   * @returns {boolean} True if point is within image bounds
   */
  isWithinImageBounds(canvasX, canvasY) {
    if (!this.imageBounds) return false;
    
    const bounds = this.imageBounds;
    return canvasX >= bounds.x && 
           canvasX <= bounds.x + bounds.w &&
           canvasY >= bounds.y && 
           canvasY <= bounds.y + bounds.h;
  }
  
  /**
   * Get the current image bounds
   * @returns {Object|null} Image bounds {x, y, w, h, scale} or null
   */
  getImageBounds() {
    return this.imageBounds;
  }
  
  /**
   * Get display dimensions for the image
   * @returns {Object} Display dimensions {width, height}
   */
  getDisplayDimensions() {
    if (!this.imageBounds) {
      return { width: this.canvasWidth, height: this.canvasHeight };
    }
    return { width: this.imageBounds.w, height: this.imageBounds.h };
  }
  
  /**
   * Reset all transformations
   */
  reset() {
    this.canvasWidth = 0;
    this.canvasHeight = 0;
    this.imageWidth = 0;
    this.imageHeight = 0;
    this.imageBounds = null;
    this.fitMode = 'fit';
  }
}
