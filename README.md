# 잿빛 전리품

브라우저에서 바로 실행되는 싱글 플레이 파밍 RPG입니다.

## GitHub Pages 배포

1. GitHub에서 새 저장소를 만듭니다.
2. 이 폴더 안의 `index.html`, `.nojekyll`, `README.md`를 저장소 최상위에 업로드합니다.
3. 저장소의 **Settings → Pages**로 이동합니다.
4. **Build and deployment → Source**를 `Deploy from a branch`로 선택합니다.
5. Branch를 `main`, 폴더를 `/(root)`로 선택하고 저장합니다.

프로젝트 저장소 주소가 `https://github.com/USERNAME/ash-loot`라면 게임 주소는 보통 다음 형태입니다.

`https://USERNAME.github.io/ash-loot/`

## 저장 데이터

게임 진행 데이터는 브라우저의 localStorage에 저장됩니다.

- 사람마다 별도의 저장 데이터가 생성됩니다.
- 다른 브라우저나 다른 기기에는 자동으로 이어지지 않습니다.
- 브라우저 데이터를 삭제하면 저장이 사라질 수 있습니다.
- 게임 안의 세이브 파일 내보내기 기능으로 백업할 수 있습니다.

## 구성

- `index.html` — 전체 게임
- `.nojekyll` — GitHub Pages에서 정적 파일 그대로 배포
- `README.md` — 배포 안내
