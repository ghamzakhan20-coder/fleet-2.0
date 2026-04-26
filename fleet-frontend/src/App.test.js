import { render, screen } from '@testing-library/react';
import App from './App.jsx';

test('renders login page', () => {
  render(<App />);
  const heading = screen.getByText(/welcome back/i);
  expect(heading).toBeInTheDocument();
});
