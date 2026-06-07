// Root layout: passes through to [locale]/layout.tsx for actual layout
// This is required by Next.js App Router.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

export const metadata = {
  title: '归林山居 | Gui Lin Shan Ju',
  description: 'A mountain sanctuary in the clouds of Pu\'er, Yunnan.',
};
