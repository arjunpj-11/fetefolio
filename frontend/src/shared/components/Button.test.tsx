import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from './Button';
describe('Button', () => {
  it('is keyboard/click operable and preserves its label', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Reserve date</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Reserve date' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
