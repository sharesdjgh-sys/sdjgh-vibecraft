import type { Metadata } from "next";
import "@fontsource-variable/noto-sans-kr/wght.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "VibeCraft — 아이디어를 서비스로 만드는 프로젝트 코치",
    template: "%s | VibeCraft",
  },
  description:
    "기획서나 아이디어를 실행 가능한 다음 단계로 바꿔, 설계부터 제작과 배포까지 함께하는 프로젝트 코치입니다.",
  applicationName: "VibeCraft",
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
