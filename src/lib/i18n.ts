/**
 * i18n.ts — EN/KR translation dictionary for Music Structure Analyzer
 *
 * Usage: import { t, type Lang } from '@/lib/i18n';
 *        const label = t('nav.home', lang);
 *
 * Add keys here as more components are internationalized.
 */

export type Lang = 'en' | 'kr';

const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.features': 'Features',
    'nav.analyze': 'Analyze Audio',
    'nav.docs': 'API Docs',
    'nav.settings': 'Settings',
    'nav.langToggle': 'Switch to Korean',

    // Homepage hero
    'home.subtitle': 'Open source chord & beat detection application. Get your favorite songs transcribed!',
    'home.recentTitle': 'Recent Analyses',
    'home.recentSubtitle': 'Explore recently analyzed songs and discover new music through our community',

    // Homepage feature cards
    'home.feature.beatChord': 'Beat & Chord Analysis & Lyrics',
    'home.feature.beatChordDesc': 'Progressions with Roman numeral analysis, key changes, and sync lyrics',
    'home.feature.piano': 'Piano Visualizer',
    'home.feature.pianoDesc': 'Falling notes visualization with multi-instrument support and MIDI export',

    // Search
    'search.placeholder': 'Enter YouTube URL or search for a song...',
    'search.button': 'Analyze',
    'search.searching': 'Searching...',
    'search.noResults': 'No results found',
    'search.error': 'Search failed. Please try again.',

    // Analysis result labels
    'result.key': 'Key',
    'result.bpm': 'BPM',
    'result.scale': 'Scale',
    'result.timeSignature': 'Time Signature',
    'result.songForm': 'Song Form',
    'result.chordPattern': 'Chord Pattern',
    'result.scaleDegree': 'Scale Degree',

    // Section labels
    'section.intro': 'Intro',
    'section.verse': 'Verse',
    'section.preChorus': 'Pre-Chorus',
    'section.chorus': 'Chorus',
    'section.bridge': 'Bridge',
    'section.interlude': 'Interlude',
    'section.outro': 'Outro',

    // Common UI
    'ui.loading': 'Loading...',
    'ui.analyzing': 'Analyzing...',
    'ui.download': 'Download',
    'ui.downloadMd': 'Download .md',
    'ui.downloadPng': 'Download .png',
    'ui.downloadPdf': 'Download .pdf',
    'ui.retry': 'Retry',
    'ui.cancel': 'Cancel',
    'ui.close': 'Close',
    'ui.error': 'An error occurred. Please try again.',
    'ui.errorNetwork': 'Network error. Please check your connection.',
    'ui.errorVideo': 'Could not load video. Please check the URL.',
    'ui.noCache': 'No cached result found.',
    'ui.viewMore': 'View more',
    'ui.collapse': 'Collapse',
  },

  kr: {
    // Navigation
    'nav.home': '홈',
    'nav.features': '기능',
    'nav.analyze': '오디오 분석',
    'nav.docs': 'API 문서',
    'nav.settings': '설정',
    'nav.langToggle': '영어로 전환',

    // Homepage hero
    'home.subtitle': '오픈소스 코드·박자 분석 앱. 좋아하는 곡을 악보로 만들어 보세요!',
    'home.recentTitle': '최근 분석',
    'home.recentSubtitle': '커뮤니티에서 최근 분석된 곡들을 탐색하고 새로운 음악을 발견해 보세요',

    // Homepage feature cards
    'home.feature.beatChord': '박자·코드 분석 & 가사',
    'home.feature.beatChordDesc': '로마 숫자 분석, 조 변경, 가사 싱크를 포함한 코드 진행',
    'home.feature.piano': '피아노 비주얼라이저',
    'home.feature.pianoDesc': '멀티 악기 지원 및 MIDI 내보내기가 포함된 폴링 노트 시각화',

    // Search
    'search.placeholder': 'YouTube URL 또는 곡 제목을 입력하세요...',
    'search.button': '분석하기',
    'search.searching': '검색 중...',
    'search.noResults': '검색 결과가 없습니다',
    'search.error': '검색에 실패했습니다. 다시 시도해 주세요.',

    // Analysis result labels
    'result.key': '조성',
    'result.bpm': 'BPM',
    'result.scale': '음계',
    'result.timeSignature': '박자',
    'result.songForm': '곡 구성',
    'result.chordPattern': '코드 패턴',
    'result.scaleDegree': '음계 도수',

    // Section labels
    'section.intro': '인트로',
    'section.verse': '버스',
    'section.preChorus': '프리 코러스',
    'section.chorus': '코러스',
    'section.bridge': '브리지',
    'section.interlude': '인터루드',
    'section.outro': '아웃트로',

    // Common UI
    'ui.loading': '로딩 중...',
    'ui.analyzing': '분석 중...',
    'ui.download': '다운로드',
    'ui.downloadMd': '.md 다운로드',
    'ui.downloadPng': '.png 다운로드',
    'ui.downloadPdf': '.pdf 다운로드',
    'ui.retry': '다시 시도',
    'ui.cancel': '취소',
    'ui.close': '닫기',
    'ui.error': '오류가 발생했습니다. 다시 시도해 주세요.',
    'ui.errorNetwork': '네트워크 오류입니다. 연결 상태를 확인해 주세요.',
    'ui.errorVideo': '동영상을 불러올 수 없습니다. URL을 확인해 주세요.',
    'ui.noCache': '캐시된 결과가 없습니다.',
    'ui.viewMore': '더 보기',
    'ui.collapse': '접기',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

/**
 * Look up a translation key for the given language.
 * Falls back to English if the key is missing in the target language.
 */
export function t(key: TranslationKey, lang: Lang): string {
  return (translations[lang] as Record<string, string>)[key]
    ?? (translations.en as Record<string, string>)[key]
    ?? key;
}

export default translations;
