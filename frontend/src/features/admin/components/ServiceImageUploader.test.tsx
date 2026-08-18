import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ServiceImageUploader } from './ServiceImageUploader';

const { uploadImages } = vi.hoisted(() => ({ uploadImages: vi.fn() }));
vi.mock('../hooks/useAdmin', () => ({
  useUploadServiceImages: () => ({ isPending: false, mutateAsync: uploadImages }),
}));

describe('ServiceImageUploader', () => {
  it('accepts dropped image files and returns Cloudinary URLs', async () => {
    uploadImages.mockResolvedValueOnce([
      'https://res.cloudinary.com/demo/image/upload/service.jpg',
    ]);
    const onChange = vi.fn();
    render(<ServiceImageUploader images={[]} onChange={onChange} />);
    const file = new File(['image'], 'service.jpg', { type: 'image/jpeg' });
    fireEvent.drop(screen.getByRole('button', { name: /Drop images here/i }), {
      dataTransfer: { files: [file] },
    });
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith([
        'https://res.cloudinary.com/demo/image/upload/service.jpg',
      ]),
    );
  });

  it('rejects non-image files before upload', () => {
    render(<ServiceImageUploader images={[]} onChange={vi.fn()} />);
    const file = new File(['document'], 'details.pdf', { type: 'application/pdf' });
    fireEvent.drop(screen.getByRole('button', { name: /Drop images here/i }), {
      dataTransfer: { files: [file] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Only image files can be uploaded.');
  });
});
