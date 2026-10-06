import type { Metadata, Viewport } from 'next';
import { AdminApp } from '@/components/admin/AdminApp';
import { AdminSWRegister } from '@/components/admin/AdminSWRegister';

export const metadata: Metadata = {
  title: "Admin — O'Snack",
  robots: { index: false, follow: false },
  manifest: '/admin-pwa/manifest.json',
  appleWebApp: {
    capable: true,
    title: "O'Snack Admin",
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/admin-pwa/icon-192.png',
    apple: '/admin-pwa/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

export default function AdminPage() {
  return (
    <>
      <AdminSWRegister />
      <AdminApp />
    </>
  );
}
