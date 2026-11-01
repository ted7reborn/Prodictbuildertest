# GitHub 개념 정리 (이 프로젝트 기준)

| 용어 | 비유 | 이 프로젝트에서 |
|---|---|---|
| 저장소(Repository) | 클라우드 프로젝트 폴더 | `ted7reborn/Prodictbuildertest` — 원고 데이터, 이미지 생성 스크립트, 결과물 보관 |
| 커밋(Commit) | "저장 + 메모" 스냅샷 | Claude가 작업 단위마다 저장 (예: "No.02 펩타이드 원고 추가") |
| 브랜치(Branch) | 작업용 사본 | `claude/ameba-blog-automation-608vk7` — Claude 작업 전용, main(원본)은 그대로 |
| 푸시(Push) | 내 작업 → GitHub 업로드 | Claude 클라우드 컨테이너 → GitHub (현재 이 단계가 권한 문제로 실패 중) |
| PR(Pull Request) | "이 변경을 원본에 합쳐도 될까요?" 요청 | 검토 후 main에 합치기(merge) |

## 왜 GitHub가 필요한가
- Claude 클라우드 세션의 작업 공간은 **임시**라 세션이 끝나면 사라짐 → GitHub에 올려야 다음 세션·PC에서 이어서 작업 가능
- PC에서 Claude Code를 쓰거나 파일을 직접 보고 싶을 때도 GitHub가 연결 고리

## 연동이 두 단계라는 점
1. **GitHub 계정 연결** (claude.ai ↔ 내 GitHub 계정) — 폰 앱에서 한 것
2. **Claude GitHub App 설치** (해당 저장소에 Claude가 쓰기 권한 갖기) — https://github.com/apps/claude/installations/select_target 에서 `ted7reborn` 계정 선택 → `Prodictbuildertest` 저장소 선택(또는 All repositories) → Install/Save
