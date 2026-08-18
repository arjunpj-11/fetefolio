import axios from 'axios';
import { ImagePlus, LoaderCircle, Star, Trash2, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';
import { getApiMessage } from '../../../shared/api/axiosClient';
import { useUploadServiceImages } from '../hooks/useAdmin';

interface IServiceImageUploaderProps {
  images: string[];
  error?: string;
  onChange: (images: string[]) => void;
}
const maxImages = 8;
const maxBytes = 10 * 1024 * 1024;

const uploadErrorMessage = (error: unknown): string => {
  if (
    axios.isAxiosError<{ error?: { message?: string } }>(error) &&
    error.response?.data.error?.message
  )
    return error.response.data.error.message;
  return getApiMessage(error);
};

export function ServiceImageUploader({ images, error, onChange }: IServiceImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadServiceImages();
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState('');
  const addFiles = async (incoming: FileList | File[]) => {
    setLocalError('');
    const files = Array.from(incoming);
    if (images.length + files.length > maxImages) {
      setLocalError(`You can add up to ${maxImages} images.`);
      return;
    }
    if (files.some((file) => !file.type.startsWith('image/'))) {
      setLocalError('Only image files can be uploaded.');
      return;
    }
    if (files.some((file) => file.size > maxBytes)) {
      setLocalError('Each image must be 10 MB or smaller.');
      return;
    }
    try {
      onChange([...images, ...(await upload.mutateAsync(files))]);
    } catch (uploadError: unknown) {
      setLocalError(uploadErrorMessage(uploadError));
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="service-image-uploader">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files) void addFiles(event.target.files);
        }}
      />
      <button
        type="button"
        className={`service-image-dropzone ${dragging ? 'is-dragging' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void addFiles(event.dataTransfer.files);
        }}
        disabled={upload.isPending || images.length >= maxImages}
      >
        {upload.isPending ? <LoaderCircle className="is-spinning" /> : <UploadCloud />}
        <strong>
          {upload.isPending ? 'Uploading to Cloudinary…' : 'Drop images here or choose files'}
        </strong>
        <span>
          JPG, PNG, WebP or AVIF · up to 10 MB each · {images.length}/{maxImages} added
        </span>
      </button>
      {(localError || error) && (
        <p className="form-alert" role="alert">
          {localError || error}
        </p>
      )}
      {images.length > 0 ? (
        <div className="service-image-grid">
          {images.map((image, index) => (
            <div key={`${image}-${index}`}>
              <img src={image} alt={`Service upload ${index + 1}`} />
              {index === 0 && (
                <span>
                  <Star />
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => onChange(images.filter((_, imageIndex) => imageIndex !== index))}
                aria-label={`Remove image ${index + 1}`}
              >
                <Trash2 />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="service-image-empty">
          <ImagePlus />
          <span>No images uploaded yet. The first image will become the cover.</span>
        </div>
      )}
    </div>
  );
}
