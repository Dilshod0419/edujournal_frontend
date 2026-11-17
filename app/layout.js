import "./globals.css";
import Providers from "@/components/shared/Providers";

export const metadata = {
  title: "EduJournal — Elektron jurnal",
  description: "Interaktiv onlayn elektron jurnal tizimi",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

// Sahifa chizilishidan oldin tema va tilni o'rnatadi (oq/qora "chaqnash" bo'lmasligi uchun)
const initScript = `
(function () {
  try {
    var theme = localStorage.getItem('theme');
    if (theme !== 'dark' && theme !== 'light') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.classList.toggle('dark', theme === 'dark');
    var lang = localStorage.getItem('lang');
    document.documentElement.lang = (lang === 'ru' || lang === 'en' || lang === 'uz') ? lang : 'uz';
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
      </head>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
