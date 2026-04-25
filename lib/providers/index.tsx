import { QueryProvider } from './queryProvider';
import { ThemeProvider } from './themeProvider';
import { AuthProvider } from './authProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
