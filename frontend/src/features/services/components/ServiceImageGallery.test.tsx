import { fireEvent, render, screen } from '@testing-library/react';
import { ServiceImageGallery } from './ServiceImageGallery';

describe('ServiceImageGallery', () => {
  it('shows every uploaded image and allows selecting the main image', () => {
    const images = [
      'https://example.com/one.jpg',
      'https://example.com/two.jpg',
      'https://example.com/three.jpg',
    ];
    render(<ServiceImageGallery images={images} title="Marigold Courtyard" />);
    expect(screen.getAllByRole('button', { name: /View image/ })).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'View image 2 of 3' }));
    expect(screen.getByRole('img', { name: 'Marigold Courtyard — image 2 of 3' })).toHaveAttribute(
      'src',
      images[1],
    );
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });
});
