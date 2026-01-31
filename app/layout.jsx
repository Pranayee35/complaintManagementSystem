import "./globals.css";

export const metadata = {
  title: "Complaint Management System",
  description: "Campus complaint management - students, admins, super admins",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
