import type { Metadata, Viewport } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
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
  openGraph: {
    title: "VibeCraft — 아이디어를 서비스로 만드는 프로젝트 코치",
    description: "기획을 멈추지 않고 실제 서비스로 완성하는 단계별 프로젝트 코치",
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f4ee",
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
