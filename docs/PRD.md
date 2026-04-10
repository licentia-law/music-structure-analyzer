# Product Requirements Document
## Music Structure Analyzer
*YouTube URL → Key / BPM / Song Form / Pattern Analysis*

---

**Version:** 1.0
**Date:** 2026-04-10
**Author:** Project Owner
**Status:** Draft

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Feature Specification](#3-feature-specification)
4. [UI Design](#4-ui-design)
5. [Technical Specification](#5-technical-specification)
6. [Development Milestones](#6-development-milestones)
7. [Risks & Dependencies](#7-risks--dependencies)
8. [Glossary](#8-glossary)

---

## 1. Overview

### 1.1 Product Summary

Music Structure Analyzer는 YouTube URL을 입력받아 해당 음악의 Key, Scale, BPM, Time Signature, Song Form, 그리고 각 섹션별 코드 진행 Pattern을 자동으로 분석하여 브라우저에 출력하는 웹 애플리케이션입니다. 분석 결과를 md, png, pdf 형식으로 다운로드할 수 있습니다.

### 1.2 Target Users

소수 지인 그룹과 공유하는 용도이며, 간단한 인증(비밀번호 또는 초대 코드 방식)을 통해 접근을 제어합니다.

### 1.3 Development Approach

ChordMiniApp(github.com/ptnghia-j/ChordMiniApp)을 기반(fork)으로 커스터마이징합니다. 해당 레포는 YouTube URL 오디오 추출, 코드 인식, 비트 트래킹, Song Structure 분석(SongFormer) 등 핵심 파이프라인의 70~80%가 이미 구현되어 있으며 MIT 라이선스입니다.

#### Fork 판단 근거

| 항목 | 설명 |
|------|------|
| 기존 구현율 | YouTube → 오디오 추출, Key/BPM 검출, Song Structure 분석 등 70~80% 구현됨 |
| 기술 스택 | Next.js(TypeScript) + Python Flask — 모던 웹 스택으로 유지보수 용이 |
| 배포 지원 | Docker Compose, Vercel, GCP 등 다양한 환경 지원 |
| 커스터마이징 필요 범위 | Pattern 테이블 UI, Scale Degree 자동 계산, 다운로드 기능 등 추가 개발 필요 |

---

## 2. System Architecture

### 2.1 Architecture Overview

| 계층 | 기술 | 역할 |
|------|------|------|
| Frontend | Next.js + TypeScript + Tailwind CSS | 브라우저 UI, 분석 결과 시각화, 다운로드 |
| Backend | Python Flask | 오디오 분석 ML 파이프라인 처리 |
| ML Models | SongFormer, Beat-Transformer, Chord-CNN-LSTM, librosa, madmom | Key/BPM/비트/코드/구조 분석 |
| Infra | AWS EC2 (CPU), Docker | 운영 환경 |
| DB/Cache | Firebase Firestore | 분석 결과 캐시 및 사용자 인증 |

### 2.2 Data Flow

1. User가 YouTube URL을 브라우저에 입력
2. Frontend가 Backend API로 URL 전송
3. Backend이 yt-dlp로 오디오 추출 (WAV/MP3)
4. ML 모델 파이프라인 실행: Key → BPM → Time Signature → Beat/Downbeat → Chord → Song Structure
5. 분석 결과를 JSON으로 Frontend에 반환
6. Frontend이 결과를 폼에 맞게 렌더링
7. User가 md/png/pdf로 다운로드

### 2.3 Development Environment

| 항목 | 상세 |
|------|------|
| 개발 OS | Windows, macOS |
| 바이브코딩 메인 | Claude Code (전용 앱 코드 탭) |
| 바이브코딩 서브 | Codex (전용 앱) |
| IDE | Antigravity (폴더/파일 구조 확인, 터미널, git) |
| 운영 환경 | AWS EC2 (CPU only), Docker |

---

## 3. Feature Specification

### 3.1 입력 (Input)

#### Primary: YouTube URL

- YouTube URL 입력 필드 및 붙여넣기 지원
- URL 유효성 검증 (youtube.com, youtu.be 패턴)
- 오디오 추출: yt-dlp를 통한 오디오 다운로드 및 WAV 변환
- 모든 분석 정보(Key, BPM, Time, Song Form, Pattern)는 오디오 분석 결과 기준

#### Optional: 악보 이미지 업로드 (MVP 이후 검토)

- YouTube URL만으로 필요한 모든 정보를 파악 가능하면 제외
- 필요 시 이미지 업로드로 Song Form/Pattern 보정 참고 용도

### 3.2 분석 기능 (Analysis)

#### P0: Key / Scale 검출

| 항목 | 상세 |
|------|------|
| 출력 형식 | Key Name (e.g. Bb major) + Scale Table (Bb=1, C=2, D=3, Eb=4, F=5, G=6, A=7) |
| 분석 방법 | Chroma feature 기반 Key estimation (librosa + Krumhansl-Schmuckler) |
| 기존 구현 | ChordMiniApp에 Key detection 있음 — UI 커스터마이징 필요 |

#### P0: BPM 검출

| 항목 | 상세 |
|------|------|
| 출력 형식 | 정수값 (e.g. 136) |
| 분석 방법 | Beat tracking 모델(madmom / Beat-Transformer) 결과에서 BPM 산출 |
| 기존 구현 | ChordMiniApp에 이미 구현됨 |

#### P0: Time Signature 검출

| 항목 | 상세 |
|------|------|
| 출력 형식 | e.g. 4/4, 3/4, 6/8 |
| 분석 방법 | Beat/Downbeat 간격 분석으로 추정 (madmom meter detection) |
| 기존 구현 | 부분적 — Beat-Transformer에서 beat position 제공, 추가 로직 필요 |

#### P0: Song Form 분석

| 항목 | 상세 |
|------|------|
| 출력 형식 | I > V > PC > C > B > C > B(Bb 24마디) > C(Inst) > C > C > O |
| 세그먼트 레이블 | I(Intro), V(Verse), PC(Pre-Chorus), C(Chorus), B(Bridge), Inst(Interlude), O(Outro) |
| 분석 방법 | SongFormer 모델 — 이미 ChordMiniApp에 통합됨 |
| 커스터마이징 | SongFormer 레이블을 이미지의 약어 표기(I, V, PC, C, B, Inst, O)로 매핑 |

#### P1: Pattern 분석 (커스텀 개발 필요)

Pattern은 각 Song Form 섹션 내의 마디별 코드 진행을 테이블 형태로 표시하는 기능입니다:

| 항목 | 1박 | 2박 | 3박, 4박 |
|------|-----|-----|----------|
| 코드 | Bb--C | D--- | Eb---,  Eb-G- |
| Scale Degree | 1--2 | 3--- | 4---,  3-6- |

*(예시: Verse 패턴, Key=Bb major 기준)*

| 항목 | 상세 |
|------|------|
| 코드 소스 | Chord recognition 모델(Chord-CNN-LSTM / BTC) 결과 |
| Scale Degree | Key 기준으로 코드 루트의 Scale Degree 자동 계산 |
| 마디 구분 | Beat/Downbeat 정보를 기반으로 코드를 마디 단위로 그룹핑 |
| 박자 표기 | 각 박자 위치에 '-'(유지) 또는 새 코드명으로 표기 (e.g. Bb--C = 1박 Bb, 4박 C) |
| 섹션별 그룹핑 | Song Form 결과와 결합하여 Intro/Verse/Chorus 등 섹션별로 구분 표시 |

### 3.3 출력 (Output)

#### 브라우저 출력 레이아웃

분석 결과 페이지는 다음 순서로 구성됩니다:

1. 곡 정보 영역: Key, Scale Table, Time Signature, BPM
2. Song Form 요약: I > V > PC > C > B > ... 형식의 한 줄 요약
3. Pattern 영역: 섹션별 코드 진행 테이블 (Scale Degree 포함)
4. YouTube 임베드 플레이어 (선택사항)

#### 다운로드 형식

| 형식 | 용도 | 구현 방법 |
|------|------|-----------|
| Markdown (.md) | 텍스트 기반 공유/편집 | Frontend에서 JSON → Markdown 변환 후 다운로드 |
| Image (.png) | 빠른 공유/SNS 게시 | html2canvas 또는 DOM-to-image로 브라우저 렌더링 캡처 |
| PDF (.pdf) | 인쇄/보관용 | jsPDF 또는 Puppeteer로 생성 |

---

## 4. UI Design

### 4.1 Main Page

- YouTube URL 입력 필드 + 분석 버튼
- 분석 진행 상태 표시 (Progress Indicator)
- 최근 분석 목록 (Firebase에서 로드)

### 4.2 Analysis Result Page

분석 결과 페이지는 이미지에서 보여준 폼을 기반으로 구성됩니다:

#### 상단: 곡 정보 카드

- 곡 제목 (YouTube 제목에서 추출)
- Key: Bb major
- Scale Table: Bb=1, C=2, D=3, Eb=4, F=5, G=6, A=7
- Time: 4/4
- BPM: 136
- Song Form: I > V > PC > C > B > C > B(Bb 24마디) > C(Inst) > C > C > O

#### 하단: Pattern Tables

각 섹션(Intro, Verse, Pre-chorus, Chorus, Bridge 등)별로 접을 수 있는 패널이며, 펼치면 4박자 단위의 코드 테이블이 표시됩니다. 코드 이름 아래에 해당 Scale Degree가 자동 표시됩니다.

#### 우측 상단: 다운로드 버튼

- Download as MD
- Download as PNG
- Download as PDF

---

## 5. Technical Specification

### 5.1 ML Pipeline 상세

| 단계 | 모델/라이브러리 | 입력 | 출력 |
|------|-----------------|------|------|
| Audio 추출 | yt-dlp | YouTube URL | WAV/MP3 파일 |
| Key Detection | librosa chromagram + Krumhansl-Schmuckler | Audio | Key name (e.g. Bb major) |
| BPM/Beat | madmom / Beat-Transformer | Audio | BPM 값 + Beat timestamps |
| Time Signature | madmom meter / Beat position 분석 | Beat data | e.g. 4/4 |
| Chord Recognition | Chord-CNN-LSTM / BTC | Audio + Beat | Chord labels + timestamps |
| Song Structure | SongFormer (allin1) | Audio | Segment boundaries + labels |
| Scale Degree | Custom logic | Key + Chord labels | 1~7 degree mapping |

### 5.2 Key → Scale Degree 변환 로직

Key가 Bb major인 경우 스케일 구성음은 Bb(1), C(2), D(3), Eb(4), F(5), G(6), A(7)이며, 코드의 루트 노트를 이 테이블에 매핑하여 Scale Degree를 자동 산출합니다. 예: Bb 코드의 루트 = Bb = 1, D 코드의 루트 = D = 3.

### 5.3 Pattern Table 생성 로직

1. Song Structure 결과에서 각 섹션의 시작/끝 타임스탬프를 확보
2. Beat/Downbeat 타임스탬프로 마디 경계를 결정
3. Chord 타임스탬프를 마디 경계에 맞춰 박자별로 배치
4. 각 박자에 '-'(유지) 또는 새 코드명을 표기
5. Key 기준으로 Scale Degree 행을 병렬로 생성
6. 동일한 코드 진행이 반복되면 그룹핑하여 테이블 행 수를 최소화

### 5.4 인증

소수 지인과 공유하는 용도이므로 간단한 방식을 사용합니다:

- **Option A:** 환경변수로 관리하는 공유 비밀번호 방식
- **Option B:** Firebase Anonymous Auth + 초대 코드 방식

추천: Option A가 MVP에 가장 빠르고 단순합니다.

---

## 6. Development Milestones

| 단계 | 작업 내용 | 주요 산출물 | 예상 기간 |
|------|-----------|-------------|-----------|
| M0 | ChordMiniApp fork + 로컬 환경 세팅 + 정상 동작 확인 | 로컬에서 기존 기능 동작 | 1주 |
| M1 | UI 커스터마이징: Key/Scale/BPM/Time 출력 폼 리디자인 | 곡 정보 카드 UI | 1~2주 |
| M2 | Song Form 출력 커스터마이징 (SongFormer 레이블 → 약어 매핑) | Song Form 요약 및 섹션 패널 UI | 1~2주 |
| M3 | Pattern 분석 기능 개발 (핵심 커스텀) | 마디별 코드 테이블 + Scale Degree | 2~3주 |
| M4 | 다운로드 기능 (md/png/pdf) | 3종 포맷 다운로드 | 1주 |
| M5 | 인증 + AWS EC2 배포 | 운영 환경 구축 | 1~2주 |
| M6 | 테스트 + 버그 수정 + 지인 피드백 | 안정화된 MVP | 1~2주 |

**총 예상 기간: 8~14주 (MVP)**

---

## 7. Risks & Dependencies

| 리스크 | 영향 | 대응 방안 |
|--------|------|-----------|
| yt-dlp YouTube 정책 변경 | 오디오 추출 실패 | yt-dlp 주기 업데이트, 대체 추출 방법(yt-mp3-go) 확보 |
| CPU only 환경에서 ML 모델 속도 | 분석 시간 길어질 수 있음 | 분석 결과 캐시(Firebase), 비동기 처리 + Progress UI |
| Chord Recognition 정확도 | Pattern 표기 오류 | Gemini API로 보정 로직 적용 (기존 ChordMiniApp 방식) |
| SongFormer 세그먼트 오류 | Song Form 부정확 | 사용자 수동 보정 UI (MVP 이후) |
| Pre-Chorus 미지원 | SongFormer가 pre-chorus를 별도 레이블로 제공하지 않을 수 있음 | verse와 chorus 사이 짧은 구간을 휴리스틱으로 pre-chorus로 매핑 |

---

## 8. Glossary

| 용어 | 설명 |
|------|------|
| Song Form | 전체 곡의 구성. Intro, Verse, Chorus 등을 합쳐 Song Form이라 부름 |
| I - Intro | 곡의 전주 |
| V - Verse | 인트로 후 곡의 첫 전개 부분. 비교적 잔잔함 |
| PC - Pre-Chorus | 후렴이 나오는 것을 예시하는 부분 |
| C - Chorus | 후렴. 노래의 주된 멜로디와 내용이 나옴 |
| B - Bridge | 곡의 분위기를 전환하는 부분 |
| Inst - Interlude | 간주. 1절 후 2절 전 반주만 나오는 부분 |
| O - Outro | 후주. 곡이 끝날 때 반주만 나오는 부분 |
| Scale Degree | Key의 스케일 구성음 순서에 따른 번호 (1~7) |
| Pattern | 각 섹션 내 마디별 코드 진행을 테이블 형태로 표기한 것 |

---

*End of Document*
