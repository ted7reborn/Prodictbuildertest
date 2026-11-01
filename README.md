# AMPLE:N × Ameba Blog 자동화

코리아나화장품 AMPLE:N 앰플을 일본 스킨케어 루틴 기준으로 소개하는 아메바 블로그 연재 자동화 프로젝트.

- `docs/01_research_amplen.md` — 제품 리서치 및 일본 게재 규정 체크
- `docs/02_series_plan.md` — 연재 운영안(주 3회, 13회 구성)
- `content/ampoules/*.json` — 앰플별 원고 데이터
- `scripts/render_cards.js` — 손글씨 성분 이미지 생성 (`node scripts/render_cards.js content/ampoules/01_hyaluron.json output/posts/01_hyaluron/images`)
- `output/posts/` — 회차별 본문 + 이미지 패키지
