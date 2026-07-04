import Link from 'next/link';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">Đăng ký</h1>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        Form đăng ký sẽ được bổ sung theo nghiệp vụ BR-AUTH.
      </p>
      <Link href="/login" className="text-sm font-medium text-emerald-700 underline">
        Đã có tài khoản? Đăng nhập
      </Link>
    </main>
  );
}
