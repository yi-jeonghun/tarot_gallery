# 타로 카드 이미지 변환기

고흐 폴더에 있는 78개의 타로 카드 이미지를 다양한 해상도와 품질로 변환하는 Node.js 프로그램입니다.

## 기능

각 원본 이미지(예: `1.PNG`)에 대해 다음 3가지 버전을 자동 생성합니다:

1. **`1_low.PNG`** - 화질을 압축하여 파일 크기를 줄인 버전 (해상도 유지)
2. **`1_md.PNG`** - 해상도를 1/3로 줄인 버전 (341×512 픽셀)
3. **`1_sm.PNG`** - 해상도를 1/10으로 줄인 버전 (102×154 픽셀)

## 설치 방법

### 1. Node.js 설치

먼저 Node.js가 설치되어 있어야 합니다.

**macOS (Homebrew 사용):**
```bash
# Homebrew가 없다면 먼저 설치
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js 설치
brew install node
```

**macOS (공식 사이트):**
- [nodejs.org](https://nodejs.org)에서 LTS 버전 다운로드 및 설치

### 2. 의존성 설치

```bash
cd /Users/jeonghunlee/Documents/project/tarot_card_decks
npm install
```

## 사용 방법

### 테스트 실행 (처음 3개 파일만)

프로그램이 올바르게 작동하는지 확인하기 위해 먼저 테스트 모드로 실행하세요:

```bash
npm run test
# 또는
node image-converter.js 고흐 --test
```

### 전체 실행 (78개 모든 파일)

테스트가 성공적으로 완료되면 전체 파일을 변환하세요:

```bash
npm start
# 또는
node image-converter.js 고흐
```

### 다른 디렉토리 사용

다른 이미지 폴더를 변환하려면:

```bash
node image-converter.js <폴더명>
node image-converter.js <폴더명> --test
```

예시:
```bash
node image-converter.js 새폴더
node image-converter.js 다른이미지폴더 --test
```

## 변환 결과

### 원본 이미지 정보
- 해상도: 1024×1536 픽셀
- 파일 크기: 약 3-4MB

### 변환된 이미지들
- **_low**: 1024×1536 (원본 크기 유지, 파일 크기 약 50-70% 감소)
- **_md**: 341×512 (1/3 크기, 파일 크기 약 80-90% 감소)
- **_sm**: 102×154 (1/10 크기, 파일 크기 약 95% 감소)

## 프로그램 특징

- **고품질 리사이징**: Lanczos3 알고리즘 사용으로 선명한 이미지 유지
- **배치 처리**: 78개 파일을 자동으로 순차 처리
- **진행 상황 표시**: 실시간 변환 진행률 및 파일 크기 정보 제공
- **에러 처리**: 개별 파일 변환 실패 시에도 나머지 파일 계속 처리
- **테스트 모드**: 전체 실행 전 소수 파일로 테스트 가능

## 출력 폴더 구조

변환 후 고흐 폴더의 구조:
```
고흐/
├── 1.PNG           (원본)
├── 1_low.PNG       (압축 버전)
├── 1_md.PNG        (중간 크기)
├── 1_sm.PNG        (소형 크기)
├── 2.PNG           (원본)
├── 2_low.PNG       (압축 버전)
├── 2_md.PNG        (중간 크기)
├── 2_sm.PNG        (소형 크기)
└── ...             (78번까지)
```

## 문제 해결

### "command not found: npm" 오류
Node.js가 설치되지 않았습니다. 위의 설치 방법을 따라 Node.js를 먼저 설치하세요.

### "Cannot find module 'sharp'" 오류
```bash
npm install
```
명령어로 의존성을 설치하세요.

### 메모리 부족 오류
78개 파일을 한 번에 처리하므로 메모리 사용량이 높을 수 있습니다. 다른 프로그램을 종료한 후 다시 시도하세요.

## 라이브러리

- **Sharp**: 고성능 이미지 처리 라이브러리
- **Node.js 내장 모듈**: fs, path