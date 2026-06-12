import { redirect } from 'next/navigation';

/** Trang gốc — luôn vào đăng nhập (proxy.ts cũng redirect tương tự). */
export default function HomePage() {
  redirect('/login');
}
