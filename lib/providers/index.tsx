import { QueryProvider } from './queryProvider';
import { RealtimeProvider } from './realtimeProvider';
import { ThemeProvider } from './themeProvider';
import { AuthProvider } from './authProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <RealtimeProvider>{children}</RealtimeProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
