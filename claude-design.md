# VibeCraft 디자인 가이드 (v1 — 방향 1b "선명한 진행감")

Next.js + TypeScript + Tailwind CSS 구현 기준. 이모지 대신 Lucide 아이콘 사용.

## 1. 무드

- 신뢰할 수 있는 개인 프로젝트 코치. 친절하지만 유치하지 않게.
- 차분한 쿨 그레이 배경 + 낮은 채도의 더스티 인디고 악센트.
- 각진 네모 금지: 카드 16–20px, 버튼 12–16px, 필 요소는 완전 라운드(999px).
- 화면당 강조 행동(Primary CTA)은 1개만.

## 2. 색상 토큰

| 토큰 | 값 | 용도 |
|---|---|---|
| `bg` | `#F4F5F9` | 페이지 배경 |
| `surface` | `#FFFFFF` | 카드, 상단 바 |
| `ink` | `#1A1C23` | 제목, 본문 강조, 다크 카드 |
| `ink-sub` | `#6A7080` | 보조 텍스트, 비활성 |
| `line` | `#E3E5EE` | 보더, 구분선 |
| `accent` | `#5661A6` | Primary 버튼, 선택 상태, 링크 |
| `accent-strong` | `#414B87` | hover, 강조 텍스트 |
| `accent-tint` | `#E7EAF4` | 선택 배경, 배지 배경, 아이콘 타일 |
| `success` | `#3E8E75` / tint `#E4F0EB` / text `#2A6B55` | 완료, 자동 저장 |
| `warn` | `#C98F45` / tint `#F6EEDF` / text `#8F6420` | 막힘(도움받기) |

규칙:
- 상태(대기/진행/완료/막힘)는 색상만으로 구분하지 않고 아이콘 + 문구를 항상 함께 표기.
- 채도 높은 원색 금지. 새 색이 필요하면 위 색과 같은 명도·채도 대역의 oklch로 파생.

## 3. 타이포그래피

- 폰트: **Pretendard Variable** (fallback: system-ui, sans-serif)
- `word-break: keep-all` 전역 적용 (한국어 단어 중간 줄바꿈 방지). 필/배지/버튼은 `white-space: nowrap`.

| 스타일 | 크기/굵기 | 용도 |
|---|---|---|
| Display | 28–32px / 800 / letter-spacing -0.02em / line-height 1.35 | 화면 제목 |
| Title | 16–17px / 800 | 카드 제목 |
| Subtitle | 15px / 600 | 소제목 |
| Body | 14px / 400 / line-height 1.65 | 본문 |
| Caption | 12–13px / 600–700 | 라벨, 보조 |

## 4. 레이아웃

- 데스크톱: 상단 앱 바(64px, 로고 + 중앙 필 스테퍼 + 자동 저장 표시) + 중앙 단일 컬럼(max-width 680–720px). "한 번에 하나"에 집중.
- 스테퍼: 시작 → 설계 → 만들기 → 공개. 현재 단계는 흰 필 + 그림자, 완료는 그린 체크, 잠김은 45% 투명.
- 모바일: 스테퍼를 상단 고정, 도움 도구는 바텀시트.
- 도움 도구: 우하단 플로팅 버튼(56px 원형, message-circle 아이콘) → 우측 드로어.

## 5. 컴포넌트

### 버튼
- Primary: 높이 44–56px, radius 12–16px, `accent` 배경, 흰 텍스트 700–800, 그림자 `0 8px 24px rgba(86,97,166,.35)`, hover `accent-strong`.
- Secondary: 흰 배경 + 1.5px `line` 보더, hover 시 보더/텍스트 `accent`.
- 최소 터치 영역 44px.

### 선택 카드 (시작 방식, 서비스 형태 등)
- radius 18–20px, 기본 1.5px `line` 보더.
- 선택됨: 2px `accent` 보더 + `0 12px 32px rgba(86,97,166,.14)` 그림자 + 우측 체크 원.
- hover: 보더 `accent`, `translateY(-2px)` + 그림자.
- AI 추천은 카드 안 배지(`✦ 코치 추천`, accent-tint 배경)로만 표시 — 사용자의 선택과 시각적으로 구분.

### 상태 배지
- radius 8px, 높이 28px: `○ 대기`(gray) / `▶ 진행 중`(accent) / `✓ 완료`(success) / `✋(hand 아이콘) 막힘 · 도움받기`(warn).

### 진행률
- 트랙 `line`, 채움 `accent`, radius 999px + 우측 % 또는 "n/전체 작업" 텍스트 병기.

### 입력 필드
- 높이 44px, radius 14px, 1.5px `line` 보더, focus 시 `accent` 보더 + 링.

## 6. 아이콘

- **Lucide** (`lucide-react`), stroke 2px, 이모지 사용 금지.
- 아이콘 타일: 48–52px, radius 14–16px, `accent-tint` 배경 + `accent` 스트로크 (보조는 `bg` 배경 + `ink-sub` 스트로크).
- 매핑 예: 학생 graduation-cap · 교사 presentation · 일반 briefcase · 아이디어 lightbulb · 기획서 file-text · 코치 message-circle · 모바일 웹 smartphone · 웹 monitor · 자동화 wrench · 난이도 sprout · AI 도구 bot · 막힘 hand.

## 7. 카피 톤

- 해요체, 친근한 코치 말투. 예: "어떤 걸 만들어 볼까요?", "좋아요, 다음으로 →", "✓ 방금 자동 저장됐어요".
- 개발 용어는 전면에 내세우지 않고 "몰라도 코치가 알려줘요" 식으로 보조 처리.
- 막힘은 실패가 아닌 도움 요청으로 표현: "막힘 · 도움받기".
- AI 결과에는 항상 편집 가능함을 명시: "코치가 정리했어요 — 마음에 안 들면 바로 고쳐요".

## 8. 접근성

- 명도 대비 WCAG AA 이상, 포커스 링 명확히, 키보드 탐색 지원.
- 상태는 색 + 아이콘 + 문구 3중 표기. 로딩/저장/오류는 `aria-live`로 전달.
