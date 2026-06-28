export const metadata = { title: "Ghost Dollars", description: "What NYC's capital data leaves out" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
