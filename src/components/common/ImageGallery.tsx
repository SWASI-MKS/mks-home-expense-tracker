import { useState } from 'react';
import { ImageAttachment } from '@/types';
import { Dialog, DialogContent } from './Dialog';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

interface ImageGalleryProps {
  images: ImageAttachment[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null) setSelectedIndex((selectedIndex + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null) setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
  };

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {images.map((img, idx) => (
          <div 
            key={img.id} 
            className="relative w-16 h-16 rounded-md overflow-hidden border border-border cursor-pointer group"
            onClick={() => setSelectedIndex(idx)}
          >
            <img 
              src={img.thumbnailUrl || img.url} 
              alt={img.fileName} 
              className="w-full h-full object-cover transition-transform group-hover:scale-110" 
              loading="lazy" 
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0 bg-black/95 border-none flex flex-col overflow-hidden">
          {selectedIndex !== null && (
            <>
              <div className="absolute top-4 right-4 z-50">
                <button 
                  onClick={() => setSelectedIndex(null)} 
                  className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 relative flex items-center justify-center w-full h-full p-4">
                <img 
                  src={images[selectedIndex].url} 
                  alt={images[selectedIndex].fileName}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {images.length > 1 && (
                <>
                  <button 
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-50"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-50"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              <div className="p-3 bg-black text-white text-xs text-center border-t border-white/10">
                {images[selectedIndex].fileName} • {(images[selectedIndex].size / 1024 / 1024).toFixed(2)} MB
                <br/>
                Uploaded by {images[selectedIndex].uploadedBy || 'System'}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
