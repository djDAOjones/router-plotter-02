/**
 * Collection of easing functions for smooth animations
 * All functions take a parameter t from 0 to 1 and return a value from 0 to 1
 */
export class Easing {
  static linear(t) {
    return t;
  }
  
  static easeInQuad(t) {
    return t * t;
  }
  
  static easeOutQuad(t) {
    return t * (2 - t);
  }
  
  static easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
  
  static easeInCubic(t) {
    return t * t * t;
  }
  
  static easeOutCubic(t) {
    return (--t) * t * t + 1;
  }
  
  static easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }
  
  static easeInSine(t) {
    return 1 - Math.cos((t * Math.PI) / 2);
  }
  
  static easeOutSine(t) {
    return Math.sin((t * Math.PI) / 2);
  }
  
  static easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }
}
