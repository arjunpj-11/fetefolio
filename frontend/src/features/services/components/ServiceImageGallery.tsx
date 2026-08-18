import { Images } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ServiceImageGallery({ images, title }: { images: string[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const availableImages = images.filter((image) => !failedImages.includes(image));
  useEffect(() => {
    if (activeIndex >= availableImages.length) setActiveIndex(0);
  }, [activeIndex, availableImages.length]);

  if (!availableImages.length)
    return (
      <div className="service-detail__image">
        <div className="service-image-placeholder service-image-fallback">
          <Images />
          <span>Photos coming soon</span>
        </div>
        <span className="detail-ticket-number">VERIFIED LISTING</span>
      </div>
    );

  return (
    <div className="service-detail__image service-gallery">
      <img
        className="service-gallery__main"
        src={availableImages[activeIndex]}
        alt={`${title} — image ${activeIndex + 1} of ${availableImages.length}`}
        onError={() => setFailedImages((current) => [...current, availableImages[activeIndex]])}
      />
      <span className="detail-ticket-number">VERIFIED LISTING</span>
      {availableImages.length > 1 && (
        <>
          <span className="service-gallery__count">
            <Images />
            {activeIndex + 1} / {availableImages.length}
          </span>
          <div className="service-gallery__thumbs" aria-label={`${title} image gallery`}>
            {availableImages.map((image, index) => (
              <button
                type="button"
                key={`${image}-${index}`}
                className={index === activeIndex ? 'is-active' : ''}
                onClick={() => setActiveIndex(index)}
                aria-label={`View image ${index + 1} of ${availableImages.length}`}
                aria-pressed={index === activeIndex}
              >
                <img
                  src={image}
                  alt=""
                  onError={() => setFailedImages((current) => [...current, image])}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
