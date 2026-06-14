import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the Product Knowledge Graph homepage', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /product knowledge graph/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/relationship/i)).toBeInTheDocument();
  });
});
