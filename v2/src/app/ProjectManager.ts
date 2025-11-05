import JSZip from 'jszip';
import { validateProject, migrateProject } from '../schemas/project';
import type { Project } from '../types';

/**
 * Manages project persistence and import/export
 */
export class ProjectManager {
  private dbName = 'routePlotterDB';
  private dbVersion = 1;
  private storeName = 'projects';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Save project to IndexedDB
   */
  async saveToStorage(project: Project): Promise<void> {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      // Update modified timestamp
      project.meta.modified = new Date().toISOString();
      
      // Save with fixed ID for autosave
      const request = store.put({ id: 'autosave', project });

      request.onsuccess = () => {
        console.log('Project saved to IndexedDB');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save project');
        reject(request.error);
      };
    });
  }

  /**
   * Load project from IndexedDB
   */
  async loadFromStorage(): Promise<Project | null> {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get('autosave');

      request.onsuccess = () => {
        if (request.result) {
          try {
            const project = migrateProject(request.result.project);
            resolve(project);
          } catch (error) {
            console.error('Failed to validate saved project:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Failed to load project');
        reject(request.error);
      };
    });
  }

  /**
   * Export project to ZIP file
   */
  async saveToFile(project: Project): Promise<void> {
    const zip = new JSZip();
    
    // Validate project
    try {
      validateProject(project);
    } catch (error) {
      throw new Error(`Project validation failed: ${error}`);
    }

    // Add project JSON
    zip.file('project.json', JSON.stringify(project, null, 2));

    // Add assets if any
    for (const asset of project.assets) {
      if (asset.path.startsWith('blob:') || asset.path.startsWith('data:')) {
        // Fetch and add binary assets
        try {
          const response = await fetch(asset.path);
          const blob = await response.blob();
          zip.file(`assets/${asset.name}`, blob);
        } catch (error) {
          console.warn(`Failed to include asset ${asset.name}:`, error);
        }
      }
    }

    // Generate and download ZIP
    const blob = await zip.generateAsync({ type: 'blob' });
    this.downloadBlob(blob, `route-plotter-${Date.now()}.zip`);
  }

  /**
   * Load project from ZIP file
   */
  async loadFromFile(file: File): Promise<Project> {
    const zip = await JSZip.loadAsync(file);
    
    // Load project JSON
    const projectFile = zip.file('project.json');
    if (!projectFile) {
      throw new Error('No project.json found in archive');
    }

    const projectText = await projectFile.async('text');
    const projectData = JSON.parse(projectText);
    
    // Migrate and validate
    const project = migrateProject(projectData);

    // Load assets
    const assetsFolder = zip.folder('assets');
    if (assetsFolder) {
      for (const asset of project.assets) {
        const assetFile = assetsFolder.file(asset.name);
        if (assetFile) {
          const blob = await assetFile.async('blob');
          const url = URL.createObjectURL(blob);
          asset.path = url;
        }
      }
    }

    return project;
  }

  /**
   * Export project as JSON (without assets)
   */
  exportJSON(project: Project): void {
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    this.downloadBlob(blob, `route-plotter-${Date.now()}.json`);
  }

  /**
   * Import project from JSON
   */
  async importJSON(file: File): Promise<Project> {
    const text = await file.text();
    const data = JSON.parse(text);
    return migrateProject(data);
  }

  /**
   * Helper to download a blob
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Clear all saved projects
   */
  async clearStorage(): Promise<void> {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('Storage cleared');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to clear storage');
        reject(request.error);
      };
    });
  }
}
