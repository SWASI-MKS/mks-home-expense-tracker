import { useCallback } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { ImageAttachment } from '@/types';

interface ImageUploadProps {
  existingImages?: ImageAttachment[];
  newFiles: File[];
  onFilesChange: (files: File[]) => void;
  onRemoveExisting: (imageId: string) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export function ImageUpload({
  existingImages = [],
  newFiles = [],
  onFilesChange,
  onRemoveExisting,
  maxFiles = 5,
  maxSizeMB = 10
}: ImageUploadProps) {
  const totalImages = existingImages.length + newFiles.length;

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[IMAGE_DEBUG] handleFileChange triggered. Files:', e.target.files);
    if (!e.target.files?.length) return;
    
    const files = Array.from(e.target.files);
    const validFiles: File[] = [];
    
    for (const file of files) {
      console.log('[IMAGE_DEBUG] processing selected file:', file.name, 'type:', file.type, 'size:', file.size);
      if (validFiles.length + totalImages >= maxFiles) {
        console.warn('[IMAGE_DEBUG] Max files limit reached, skipping file:', file.name);
        break;
      }
      
      if (!file.type.startsWith('image/')) {
        console.warn('[IMAGE_DEBUG] File is not an image:', file.name, 'type:', file.type);
        continue;
      }
      
      if (file.size > maxSizeMB * 1024 * 1024) {
        console.warn('[IMAGE_DEBUG] File size exceeds limit:', file.name, 'size:', file.size, 'limit:', maxSizeMB * 1024 * 1024);
        continue; // Exceeds size
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      console.log('[IMAGE_DEBUG] Calling onFilesChange with:', [...newFiles, ...validFiles]);
      onFilesChange([...newFiles, ...validFiles]);
    }
    
    // Reset input
    e.target.value = '';
  }, [maxFiles, maxSizeMB, newFiles, onFilesChange, totalImages]);

  const removeNewFile = (index: number) => {
    const updated = [...newFiles];
    updated.splice(index, 1);
    onFilesChange(updated);
  };

  return (
    <div className="space-y-4">
      {totalImages < maxFiles && (
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground/70">
                PNG, JPG or WEBP (Max {maxSizeMB}MB, {maxFiles - totalImages} remaining)
              </p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              multiple 
              accept="image/png, image/jpeg, image/webp" 
              onChange={handleFileChange}
            />
          </label>
        </div>
      )}

      {totalImages > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* Existing Images */}
          {existingImages.map((img) => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden border border-border bg-card">
              <img src={img.thumbnailUrl || img.url} alt={img.fileName} className="w-full h-24 object-cover" />
              <button
                type="button"
                onClick={() => onRemoveExisting(img.id)}
                className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* New Files Preview */}
          {newFiles.map((file, idx) => {
            const objectUrl = URL.createObjectURL(file);
            return (
              <div key={`new-${idx}`} className="relative group rounded-lg overflow-hidden border border-border bg-card">
                <img 
                  src={objectUrl} 
                  alt={file.name} 
                  className="w-full h-24 object-cover" 
                  onLoad={() => {
                    // We don't revoke immediately here because re-renders might need it,
                    // but we can revoke when the image loads to free memory if needed,
                    // or let browser garbage collect it when objectUrl changes.
                  }}
                />
                <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5 text-[9px] text-white truncate text-center">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </div>
                <button
                  type="button"
                  onClick={() => removeNewFile(idx)}
                  className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
