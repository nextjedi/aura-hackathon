// Image Storage Service for AURA
// Manages generated images in localStorage and provides download functionality

export class ImageStorageService {
  static STORAGE_KEY = 'aura_generated_images';
  static MAX_IMAGES = 20; // Keep last 20 images

  // Save generated image
  static saveImage(imageData) {
    try {
      const savedImages = this.getAllImages();
      
      const newImage = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        imageUrl: imageData.imageUrl, // data:image/png;base64,... format
        imageData: imageData.imageData, // raw base64 string
        prompt: imageData.prompt,
        context: imageData.context || {},
        mimeType: imageData.mimeType || 'image/png',
        metadata: {
          success: imageData.success || true,
          description: imageData.description,
          error: imageData.error
        }
      };

      // Add to beginning of array (newest first)
      const updatedImages = [newImage, ...savedImages.slice(0, this.MAX_IMAGES - 1)];
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedImages));
      console.log('✅ Image saved to storage:', newImage.id);
      
      return newImage.id;
    } catch (error) {
      console.error('❌ Failed to save image:', error);
      return null;
    }
  }

  // Get all saved images
  static getAllImages() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('❌ Failed to load images:', error);
      return [];
    }
  }

  // Get image by ID
  static getImageById(id) {
    const images = this.getAllImages();
    return images.find(img => img.id === id);
  }

  // Delete image by ID
  static deleteImage(id) {
    try {
      const images = this.getAllImages();
      const updatedImages = images.filter(img => img.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedImages));
      console.log('🗑️ Image deleted:', id);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete image:', error);
      return false;
    }
  }

  // Download image as file
  static downloadImage(imageId, filename = null) {
    try {
      const image = this.getImageById(imageId);
      if (!image) {
        throw new Error('Image not found');
      }

      // Convert data URL to blob
      const [header, base64Data] = image.imageUrl.split(',');
      const mimeType = header.match(/data:([^;]+)/)[1];
      
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `aura_outfit_${imageId}.png`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      console.log('📁 Image downloaded:', a.download);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to download image:', error);
      return false;
    }
  }

  // Clear all saved images
  static clearAllImages() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ All images cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear images:', error);
      return false;
    }
  }

  // Get storage usage info
  static getStorageInfo() {
    try {
      const images = this.getAllImages();
      const totalSize = JSON.stringify(images).length;
      
      return {
        count: images.length,
        totalSize: totalSize,
        formattedSize: this.formatBytes(totalSize),
        lastUpdated: images[0]?.timestamp || null
      };
    } catch (error) {
      return {
        count: 0,
        totalSize: 0,
        formattedSize: '0 B',
        lastUpdated: null
      };
    }
  }

  // Format bytes to human readable
  static formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Export images as JSON backup
  static exportImages() {
    try {
      const images = this.getAllImages();
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        images: images,
        count: images.length
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aura_images_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      console.log('📁 Images exported');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to export images:', error);
      return false;
    }
  }
}