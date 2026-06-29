import "./globals.css";
import AppLayout from "../components/AppLayout";

export const metadata = {
  title: "Planr - The Last-Minute Life Saver",
  description: "AI-powered productivity companion that schedules, prioritizes, and reschedules your tasks dynamically.",
  manifest: "/manifest.json",
  appleMobileWebAppCapable: "yes",
  appleMobileWebAppStatusBarStyle: "default",
};

export const viewport = {
  themeColor: "#223044",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};


export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        {/* Inline script to prevent theme flash — runs before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'dark';
                if (theme === 'light') {
                  document.documentElement.classList.add('light-theme');
                }
              } catch (e) {}
            `,
          }}
        />
        {/* Service worker registration script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (let registration of registrations) {
                      registration.unregister().then(function(boolean) {
                        console.log('SW unregistered on localhost:', boolean);
                      });
                    }
                  });
                } else {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(function(reg) {
                      console.log('SW registered:', reg.scope);
                    }).catch(function(err) {
                      console.error('SW registration failed:', err);
                    });
                  });
                }
              }
            `,
          }}
        />
      </head>
      <body>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
