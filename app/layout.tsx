import type { ReactNode } from 'react';

export const metadata = {
  title: 'App skeleton',
  description: 'Rename me — see INIT.md.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
