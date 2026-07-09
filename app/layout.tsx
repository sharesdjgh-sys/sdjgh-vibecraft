import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeCraft",
  description: "PlanCraft 이후 구현 단계로 이어지는 바이브코딩 학습 코치",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
