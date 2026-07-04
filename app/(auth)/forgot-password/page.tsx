import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">Quên mật khẩu</h1>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        Luồng OTP / đặt lại mật khẩu sẽ được triển khai theo BR-AUTH.
      </p>
      <Link href="/login" className="text-sm font-medium text-emerald-700 underline">
        Quay lại đăng nhập
      </Link>
    </main>
  );
}
