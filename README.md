# VibeCraft

PlanCraft 기획서 이후 구현 단계로 이어지는 바이브코딩 학습 코치 웹앱입니다.

## 실행

```bash
npm install
npm run dev
```

기본 주소는 `http://127.0.0.1:3000`입니다.

## 구현된 MVP

- 역할 선택: 학생, 선생님, 일반인
- 시작 방식 선택: PlanCraft 기획서 업로드 또는 아이디어 입력
- 추천 생성 API: `/api/analyze-plan`, `/api/idea-interview`
- 도구 선택: Codex, Claude, Antigravity
- 서비스 유형 선택: 웹, 모바일 최적화 웹앱, SW/자동화 도구
- 체크리스트 기반 실습 모드
- 용어 사전
- 프롬프트 템플릿
- 에러 해결 도우미
- 배포 전 최종 점검
- 데스크톱 우측 챗봇 패널, 모바일 전체화면 챗봇 시트

## 현재 AI 동작 방식

초기 MVP는 API 키 없이도 동작하도록 서버 라우트의 규칙 기반 추천 엔진을 사용합니다. 실제 AI 모델 연결 시 `/api/analyze-plan`, `/api/idea-interview`, `/api/chat`, `/api/solve-error` 내부에서 현재 추천 엔진을 모델 호출로 교체하면 됩니다.

## Neon DB

초기 화면 상태는 `localStorage`에 저장됩니다. Neon Postgres로 저장을 확장할 때 사용할 SQL 초안은 `db/schema.sql`에 있습니다.

필요한 환경변수 예시:

```bash
DATABASE_URL=
```
