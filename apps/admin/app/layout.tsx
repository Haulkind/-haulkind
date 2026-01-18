export const metadata = {
  title: 'Haulkind - Junk Removal & Labor Help',
  description: 'On-demand junk removal and labor services',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
