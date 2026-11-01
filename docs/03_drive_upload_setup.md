# Google Drive 자동 업로드 설정 가이드 (약 10분)

구조: Claude(클라우드) → **내 구글 계정의 Apps Script 웹앱** → 내 드라이브 `AMPLE:N アメブロ連載` 폴더
(Google Cloud 콘솔·결제 설정 불필요. 파일 소유자는 본인 계정)

## 1. 스크립트 만들기
1. PC에서 https://script.google.com 접속 → **새 프로젝트**
2. 프로젝트 이름: `AMPLE:N Drive Uploader`
3. `Code.gs` 내용을 전부 지우고, 이 저장소의 `apps_script/Code.gs` 내용을 붙여넣기 → 저장
4. 왼쪽 **서비스(＋)** → `Drive API` 추가 (본문을 구글 문서로 변환할 때 사용)

## 2. 설정값 저장 (스크립트 속성)
왼쪽 ⚙️**프로젝트 설정** → 아래 **스크립트 속성** → 속성 추가
| 속성 | 값 |
|---|---|
| `ROOT_FOLDER_ID` | `1xW61r7RXsvBaRpwGglnWLNi5MWKCzEPX` (이미 만든 `AMPLE:N アメブロ連載` 폴더) |
| `UPLOAD_TOKEN` | 아무도 모르는 긴 문자열 (예: 비밀번호 생성기로 32자리) |

## 3. 웹앱으로 배포
1. 오른쪽 위 **배포 → 새 배포** → 유형 ⚙️ **웹 앱**
2. 실행 사용자: **나**, 액세스 권한: **모든 사용자**
3. **배포** → 구글 권한 승인 (“확인되지 않은 앱” 경고가 나오면 고급 → 이동. 본인이 만든 스크립트라 정상)
4. 표시되는 **웹 앱 URL** (`https://script.google.com/macros/s/.../exec`) 복사

> 액세스가 “모든 사용자”여도 `UPLOAD_TOKEN`을 모르면 업로드 불가. URL·토큰은 채팅에 붙여넣지 말 것.

## 4. Claude 클라우드 환경에 등록
세션 상단 제목줄의 **클라우드 환경 메뉴 → Edit(편집)** → 환경변수(또는 Network secrets/API credentials)에 추가:
```
DRIVE_UPLOAD_URL=https://script.google.com/macros/s/xxxx/exec
DRIVE_UPLOAD_TOKEN=(2번에서 만든 토큰)
```
저장 후 **새 세션**부터 적용됨. (선택) 라쿠텐 어필리에이트를 쓰기로 하면 `RAKUTEN_AFFILIATE_ID`도 같은 곳에 추가.

## 5. 동작 (설정 후 Claude가 실행)
```
node scripts/build_post.js   content/ampoules/02_peptide.json output/posts/02_peptide
node scripts/render_cards.js content/ampoules/02_peptide.json output/posts/02_peptide/images
node scripts/upload_to_drive.js output/posts/02_peptide "No.02_ペプチドショット2X"
```
→ 드라이브에 `No.02_ペプチドショット2X/` 폴더 + 본문 구글문서 + 이미지 PNG 생성

## 문제 해결
- `unauthorized` → 토큰 불일치
- 응답이 HTML(로그인 페이지) → 배포 액세스가 “모든 사용자”가 아님
- 코드 수정 후엔 **배포 관리 → 편집 → 새 버전**으로 재배포해야 반영
