import "./globals.css";
import Providers from "./providers";
import ThemeToggle from "@/components/theme/ThemeToggle";

export const metadata = { title: "Econ Shop", description: "Data as products" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <Providers>
          <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
              <a href="/" className="font-semibold">Econ Shop</a>
              <ThemeToggle />
            </div>
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}

