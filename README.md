# Textile Image Generator

ComfyUI 워크플로우 기반 텍스타일 패턴 이미지 생성 관리 시스템

## 개요

디자이너를 위한 ComfyUI 워크플로우 관리 및 테스트 도구입니다. 다양한 텍스타일 패턴 워크플로우를 관리하고, 파라미터를 조정하여 이미지를 생성할 수 있습니다.

## 주요 기능

- **워크플로우 관리**: 패턴별 워크플로우 템플릿 생성, 수정, 복제
- **파라미터 편집**: 워크플로우별 편집 가능한 파라미터 설정
- **이미지 생성**: AWS SQS를 통한 비동기 이미지 생성 요청
- **히스토리 관리**: 생성 이력 및 결과 이미지 조회

## 기술 스택

- **Frontend**: Next.js 15, React 18, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **Database**: MySQL, Prisma ORM
- **Cloud**: AWS S3 (이미지 저장), AWS SQS (작업 큐)

## 지원 패턴

| 패턴 | 설명 |
|------|------|
| Floral | 꽃무늬 패턴 |
| Geometric | 기하학 패턴 |
| Abstract | 추상 패턴 |
| Animal | 동물 패턴 |
| Stripe | 줄무늬 패턴 |
| Dot | 도트 패턴 |
| Check | 체크 패턴 |
| Paisley | 페이즐리 패턴 |
| Tropical | 트로피컬 패턴 |
| Ethnic | 에스닉 패턴 |
| Camouflage | 카무플라주 패턴 |
| Tie-dye | 타이다이 패턴 |
| 기타 | Ditsy, Heart, Star, Natural, Traditional, Patchwork 등 |

## 시작하기

### 환경 변수 설정

환경 변수와 AWS PEM 키는 **Tips 프로젝트**에 저장되어 있습니다.

1. Tips 프로젝트에서 `.env` 파일과 AWS PEM 키를 다운로드
2. 프로젝트 루트에 `.env` 파일 복사
3. AWS PEM 키는 `~/.ssh/` 디렉토리에 저장

```bash
# Tips에서 환경 변수 파일 다운로드 후 프로젝트 루트에 복사
cp /path/to/tips/.env .env
```

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 데이터베이스 마이그레이션
npm run db:migrate

# Prisma 클라이언트 생성
npm run db:generate

# 시드 데이터 추가 (선택)
npm run db:seed

# 개발 서버 실행
npm run dev
```

### 빌드

```bash
npm run build
npm run start
```

## 프로젝트 구조

```
├── prisma/
│   ├── schema.prisma     # 데이터베이스 스키마
│   └── seed.ts           # 시드 데이터
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API 라우트
│   │   ├── history/      # 히스토리 페이지
│   │   └── workflows/    # 워크플로우 페이지
│   ├── components/       # React 컴포넌트
│   │   ├── ui/           # shadcn/ui 컴포넌트
│   │   ├── history/      # 히스토리 관련 컴포넌트
│   │   └── workflow/     # 워크플로우 관련 컴포넌트
│   ├── lib/              # 유틸리티
│   │   ├── db.ts         # Prisma 클라이언트
│   │   ├── s3.ts         # S3 클라이언트
│   │   ├── sqs.ts        # SQS 클라이언트
│   │   └── workflow-parser.ts  # 워크플로우 파서
│   └── types/            # TypeScript 타입 정의
└── workflows/            # ComfyUI 워크플로우 JSON 파일
```

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/workflows` | 워크플로우 목록 조회 |
| POST | `/api/workflows` | 새 워크플로우 생성 |
| GET | `/api/workflows/[id]` | 워크플로우 상세 조회 |
| PUT | `/api/workflows/[id]` | 워크플로우 수정 |
| DELETE | `/api/workflows/[id]` | 워크플로우 삭제 |
| POST | `/api/workflows/[id]/duplicate` | 워크플로우 복제 |
| POST | `/api/generate` | 이미지 생성 요청 |
| GET | `/api/history` | 히스토리 목록 조회 |
| GET | `/api/history/[id]` | 히스토리 상세 조회 |

## 라이선스

Private
