import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

// Smoke test: verifies the Vitest + jsdom + React Testing Library toolchain runs.
// The Next.js guide's sample tests app/page.tsx, but Home is an async Server
// Component (unsupported by Vitest), so this renders a self-contained sync
// component instead to prove the runner works end to end.
function Heading() {
  return <h1>Home</h1>;
}

test('toolchain runs and renders a synchronous component', () => {
  render(<Heading />);
  expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeDefined();
});
