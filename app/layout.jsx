import "./globals.css";

export const metadata = {
  title: "全国選挙比較",
  description:
    "全国の選挙・候補者の政策を比較し、自分の考えとの一致度を確認できるサービス"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
