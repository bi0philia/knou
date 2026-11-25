/**
 * KNOU Mobile Study WebApp - Main Logic
 * Designed for High-Performance Mobile Study
 */

(function () {
  'use strict';

  // ================= STATE =================
  const state = {
    subjects: [],
    questions: [],
    concepts: [],
    
    currentSubject: '환경화학',
    currentRange: '전체',
    currentMode: 'study', // 'study' | 'exam'
    currentIndex: 0,
    activeQuestions: [],
    userAnswers: {}, // { qId: choiceNumber }
    
    // Persistence
    bookmarks: new Set(JSON.parse(localStorage.getItem('knou_bookmarks') || '[]')),
    mistakes: new Set(JSON.parse(localStorage.getItem('knou_mistakes') || '[]')),
    history: JSON.parse(localStorage.getItem('knou_history') || '{}'), // { qId: { correct: 0, count: 0 } }
    
    // Exam timer
    examTimerInterval: null,
    examSecondsLeft: 1500, // 25 mins
    examSubmitted: false,
    
    // UI state
    currentTab: 'quiz', // 'quiz' | 'concepts' | 'saved' | 'stats'
    savedSubTab: 'bookmarks', // 'bookmarks' | 'mistakes'
    theme: localStorage.getItem('knou_theme') || 'dark',
    fontSizeIndex: parseInt(localStorage.getItem('knou_font_size_idx') || '0'), // 0: base (100%), 1: lg (125%), 2: xl (153%)
    fontScaleConfig: [
      { id: 'font-scale-base', label: '보통', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', pct: '100%' },
      { id: 'font-scale-lg', label: '크게', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30', pct: '125%' },
      { id: 'font-scale-xl', label: '아주 크게', badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30', pct: '153%' }
    ],
    isShuffled: false,
    conceptSearchQuery: '',
    conceptSubjectFilter: '환경화학'
  };

  // ================= DOM ELEMENTS =================
  const els = {
    // Nav tabs (Mobile)
    navTabQuiz: document.getElementById('navTabQuiz'),
    navTabConcepts: document.getElementById('navTabConcepts'),
    navTabSaved: document.getElementById('navTabSaved'),
    navTabStats: document.getElementById('navTabStats'),
    navSavedBadge: document.getElementById('navSavedBadge'),

    // Nav tabs (Desktop)
    deskTabQuiz: document.getElementById('deskTabQuiz'),
    deskTabConcepts: document.getElementById('deskTabConcepts'),
    deskTabSaved: document.getElementById('deskTabSaved'),
    deskTabStats: document.getElementById('deskTabStats'),
    deskSavedBadge: document.getElementById('deskSavedBadge'),

    // Desktop Question Board
    desktopQuestionGrid: document.getElementById('desktopQuestionGrid'),
    deskAnsweredRatio: document.getElementById('deskAnsweredRatio'),

    // Views
    viewQuiz: document.getElementById('viewQuiz'),
    viewConcepts: document.getElementById('viewConcepts'),
    viewSaved: document.getElementById('viewSaved'),
    viewStats: document.getElementById('viewStats'),
    viewProfile: document.getElementById('viewProfile'),

    // Top Bar
    btnOpenProfile: document.getElementById('btnOpenProfile'),
    btnProfileBackQuiz: document.getElementById('btnProfileBackQuiz'),
    topSubjectBadge: document.getElementById('topSubjectBadge'),
    btnFontSize: document.getElementById('btnFontSize'),
    examTimerBadge: document.getElementById('examTimerBadge'),
    timerText: document.getElementById('timerText'),

    // Quiz View controls
    subjectChips: document.getElementById('subjectChips'),
    questionCountSummary: document.getElementById('questionCountSummary'),
    rangePills: document.getElementById('rangePills'),
    btnShuffleToggle: document.getElementById('btnShuffleToggle'),
    btnModeToggle: document.getElementById('btnModeToggle'),
    modeToggleIcon: document.getElementById('modeToggleIcon'),
    modeToggleLabel: document.getElementById('modeToggleLabel'),
    quizProgressText: document.getElementById('quizProgressText'),
    quizAccuracyRate: document.getElementById('quizAccuracyRate'),
    btnOpenGridDrawer: document.getElementById('btnOpenGridDrawer'),
    quizProgressBar: document.getElementById('quizProgressBar'),

    // Question Card
    qBadgeSubject: document.getElementById('qBadgeSubject'),
    qBadgeYear: document.getElementById('qBadgeYear'),
    qBadgeRange: document.getElementById('qBadgeRange'),
    btnBookmark: document.getElementById('btnBookmark'),
    bookmarkIcon: document.getElementById('bookmarkIcon'),
    qText: document.getElementById('qText'),
    qExampleBox: document.getElementById('qExampleBox'),
    qDiagramBox: document.getElementById('qDiagramBox'),
    qImageBox: document.getElementById('qImageBox'),
    qImage: document.getElementById('qImage'),
    qChoices: document.getElementById('qChoices'),
    qExplanationBox: document.getElementById('qExplanationBox'),
    qResultBadge: document.getElementById('qResultBadge'),
    qCorrectChoiceText: document.getElementById('qCorrectChoiceText'),
    qExplanationContent: document.getElementById('qExplanationContent'),
    qConceptTags: document.getElementById('qConceptTags'),

    // Controls
    btnPrevQ: document.getElementById('btnPrevQ'),
    btnNextQ: document.getElementById('btnNextQ'),
    btnSubmitExam: document.getElementById('btnSubmitExam'),

    // Concepts View
    conceptSearchInput: document.getElementById('conceptSearchInput'),
    conceptSubjectFilter: document.getElementById('conceptSubjectFilter'),
    conceptCardsList: document.getElementById('conceptCardsList'),

    // Saved View
    btnSavedBookmarksTab: document.getElementById('btnSavedBookmarksTab'),
    btnSavedMistakesTab: document.getElementById('btnSavedMistakesTab'),
    savedBookmarksCountLabel: document.getElementById('savedBookmarksCountLabel'),
    savedMistakesCountLabel: document.getElementById('savedMistakesCountLabel'),
    btnPracticeSaved: document.getElementById('btnPracticeSaved'),
    btnClearSavedCategory: document.getElementById('btnClearSavedCategory'),
    savedSubjectFilter: document.getElementById('savedSubjectFilter'),
    savedListContainer: document.getElementById('savedListContainer'),

    // Stats View
    statTotalSolved: document.getElementById('statTotalSolved'),
    statAccuracy: document.getElementById('statAccuracy'),
    statBookmarks: document.getElementById('statBookmarks'),
    statMistakes: document.getElementById('statMistakes'),
    statSubjectBreakdown: document.getElementById('statSubjectBreakdown'),
    btnExportData: document.getElementById('btnExportData'),
    btnImportData: document.getElementById('btnImportData'),
    importFileInput: document.getElementById('importFileInput'),
    btnResetAllData: document.getElementById('btnResetAllData'),

    // Modals
    modalRoadmap: document.getElementById('modalRoadmap'),
    btnOpenRoadmap: document.getElementById('btnOpenRoadmap'),
    bannerRoadmap: document.getElementById('bannerRoadmap'),
    btnCloseRoadmap: document.getElementById('btnCloseRoadmap'),
    rmTabSchedule: document.getElementById('rmTabSchedule'),
    rmTabCheat: document.getElementById('rmTabCheat'),
    rmTabGuide: document.getElementById('rmTabGuide'),
    rmPanelSchedule: document.getElementById('rmPanelSchedule'),
    rmPanelCheat: document.getElementById('rmPanelCheat'),
    rmPanelGuide: document.getElementById('rmPanelGuide'),
    modalGridDrawer: document.getElementById('modalGridDrawer'),
    btnCloseGridDrawer: document.getElementById('btnCloseGridDrawer'),
    gridDrawerButtons: document.getElementById('gridDrawerButtons'),
    modalScoreReport: document.getElementById('modalScoreReport'),
    reportSubTitle: document.getElementById('reportSubTitle'),
    reportScore: document.getElementById('reportScore'),
    reportCorrectCount: document.getElementById('reportCorrectCount'),
    reportWrongCount: document.getElementById('reportWrongCount'),
    btnReviewWrongOnly: document.getElementById('btnReviewWrongOnly'),
    btnCloseScoreReport: document.getElementById('btnCloseScoreReport'),
    modalImageZoom: document.getElementById('modalImageZoom'),
    zoomImageTarget: document.getElementById('zoomImageTarget'),
    btnCloseImageZoom: document.getElementById('btnCloseImageZoom')
  };

  // ================= INIT =================
  async function init() {
    initTheme();
    initFontSize();

    // Load Data
    const dataset = window.STUDY_DATA || window.KNOU_DATA;
    if (dataset) {
      state.subjects = dataset.subjects;
      state.questions = dataset.questions;
      state.concepts = dataset.concepts;
    } else {
      try {
        const [subRes, qRes, cRes] = await Promise.all([
          fetch('data/subjects.json'),
          fetch('data/questions.json'),
          fetch('data/concepts.json')
        ]);
        state.subjects = await subRes.json();
        state.questions = await qRes.json();
        state.concepts = await cRes.json();
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    }

    renderSubjectChips();
    renderRangePills();
    filterAndPrepareQuestions();
    renderCurrentQuestion();
    renderConcepts();
    updateSavedBadges();
    updateDynamicDdays();
    attachEventListeners();
    refreshIcons();
  }

  // ================= DYNAMIC D-DAY CALCULATOR =================
  function updateDynamicDdays() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const midDate = new Date(2026, 10, 29);   // 2026-11-29 (월은 0-indexed)
    const finalDate = new Date(2026, 11, 13); // 2026-12-13

    const calcDiff = (target) => Math.round((target - today) / (1000 * 60 * 60 * 24));
    const fmt = (diff) => {
      if (diff > 0) return `D-${diff}`;
      if (diff === 0) return 'D-Day';
      return `D+${Math.abs(diff)}`;
    };

    const midDiff = calcDiff(midDate);
    const finalDiff = calcDiff(finalDate);
    const midStr = fmt(midDiff);
    const finalStr = fmt(finalDiff);

    // Next upcoming exam badge
    const nextStr = midDiff >= 0 ? `중간 ${midStr}` : `기말 ${finalStr}`;
    const bothStr = midDiff >= 0 ? `중간 ${midStr} · 기말 ${finalStr}` : `기말 ${finalStr}`;

    document.querySelectorAll('.js-dday-next').forEach(el => { el.textContent = nextStr; });
    document.querySelectorAll('.js-dday-mid').forEach(el => { el.textContent = midStr; });
    document.querySelectorAll('.js-dday-final').forEach(el => { el.textContent = `기말 ${finalStr}`; });
    document.querySelectorAll('.js-dday-both').forEach(el => { el.textContent = bothStr; });
  }

  // ================= THEME (DARK MODE FIXED) & FONT =================
  function initTheme() {
    document.documentElement.classList.add('dark');
  }

  function initFontSize() {
    applyFontSize(false);
  }

  function cycleFontSize() {
    state.fontSizeIndex = (state.fontSizeIndex + 1) % state.fontScaleConfig.length;
    localStorage.setItem('knou_font_size_idx', state.fontSizeIndex);
    applyFontSize(true);
  }

  function applyFontSize(showNotification = false) {
    const html = document.documentElement;
    state.fontScaleConfig.forEach(cfg => html.classList.remove(cfg.id));
    
    if (state.fontSizeIndex < 0 || state.fontSizeIndex >= state.fontScaleConfig.length) {
      state.fontSizeIndex = 0;
    }
    const current = state.fontScaleConfig[state.fontSizeIndex];
    html.classList.add(current.id);

    // Update UI badge
    const badge = document.getElementById('fontSizeBadge');
    if (badge) {
      badge.innerText = current.label;
      badge.className = `px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${current.badgeClass}`;
    }

    if (showNotification) {
      showToast(`글자 크기: ${current.label} (${current.pct})`);
    }
  }

  function showToast(msg) {
    let toast = document.getElementById('knouGlobalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'knouGlobalToast';
      toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 text-emerald-300 border border-emerald-500/40 shadow-2xl text-xs font-bold transition-all duration-300 pointer-events-none opacity-0';
      document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, -6px)';
    clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, 0px)';
    }, 1800);
  }

  // ================= NAVIGATION =================
  function switchTab(tabId) {
    state.currentTab = tabId;
    
    // Hide all views
    els.viewQuiz.classList.add('hidden');
    els.viewConcepts.classList.add('hidden');
    els.viewSaved.classList.add('hidden');
    els.viewStats.classList.add('hidden');
    if (els.viewProfile) els.viewProfile.classList.add('hidden');

    // Reset mobile tab button colors
    const mobileNavButtons = [els.navTabQuiz, els.navTabConcepts, els.navTabSaved, els.navTabStats];
    mobileNavButtons.forEach(btn => {
      if (btn) btn.className = 'flex flex-col items-center py-1 text-slate-400 hover:text-slate-200 font-medium transition';
    });

    // Reset desktop tab button colors
    const desktopNavButtons = [els.deskTabQuiz, els.deskTabConcepts, els.deskTabSaved, els.deskTabStats];
    desktopNavButtons.forEach(btn => {
      if (btn) btn.className = 'px-3.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 flex items-center gap-1.5 transition';
    });

    const deskActiveClasses = 'px-3.5 py-2 rounded-lg bg-emerald-600 text-white shadow-sm flex items-center gap-1.5 transition';

    if (tabId === 'quiz') {
      els.viewQuiz.classList.remove('hidden');
      if (els.navTabQuiz) els.navTabQuiz.className = 'flex flex-col items-center py-1 text-emerald-400 font-bold transition';
      if (els.deskTabQuiz) els.deskTabQuiz.className = deskActiveClasses;
    } else if (tabId === 'concepts') {
      els.viewConcepts.classList.remove('hidden');
      if (els.navTabConcepts) els.navTabConcepts.className = 'flex flex-col items-center py-1 text-emerald-400 font-bold transition';
      if (els.deskTabConcepts) els.deskTabConcepts.className = deskActiveClasses;
      renderConcepts();
    } else if (tabId === 'saved') {
      els.viewSaved.classList.remove('hidden');
      if (els.navTabSaved) els.navTabSaved.className = 'flex flex-col items-center py-1 text-emerald-400 font-bold transition relative';
      if (els.deskTabSaved) els.deskTabSaved.className = deskActiveClasses + ' relative';
      renderSavedList();
    } else if (tabId === 'stats') {
      els.viewStats.classList.remove('hidden');
      if (els.navTabStats) els.navTabStats.className = 'flex flex-col items-center py-1 text-emerald-400 font-bold transition';
      if (els.deskTabStats) els.deskTabStats.className = deskActiveClasses;
      renderStats();
    } else if (tabId === 'profile') {
      if (els.viewProfile) els.viewProfile.classList.remove('hidden');
    }

    refreshIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ================= QUIZ CONTROLS & FILTERING =================
  function renderSubjectChips() {
    els.subjectChips.innerHTML = '';
    state.subjects.forEach(sub => {
      const isSelected = sub.id === state.currentSubject;
      const chip = document.createElement('button');
      chip.className = `px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 touch-card ${
        isSelected
          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
      }`;
      chip.innerHTML = `<span>${sub.name}</span>`;
      chip.onclick = () => {
        state.currentSubject = sub.id;
        state.currentRange = '전체';
        state.currentIndex = 0;
        state.userAnswers = {};
        renderSubjectChips();
        renderRangePills();
        filterAndPrepareQuestions();
        renderCurrentQuestion();
      };
      els.subjectChips.appendChild(chip);
    });

    els.questionCountSummary.innerText = `${state.questions.length}문항 탑재`;
  }

  function renderRangePills() {
    const curSubObj = state.subjects.find(s => s.id === state.currentSubject);
    const ranges = curSubObj ? curSubObj.ranges : ['전체'];
    
    els.rangePills.innerHTML = '';
    ranges.forEach(rng => {
      const isSelected = rng === state.currentRange;
      const pill = document.createElement('button');
      pill.className = `px-2.5 py-1 rounded-lg text-xs font-semibold transition touch-card ${
        isSelected
          ? 'bg-emerald-600 text-white shadow-sm'
          : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 border border-slate-600/40'
      }`;
      pill.innerText = rng;
      pill.onclick = () => {
        state.currentRange = rng;
        state.currentIndex = 0;
        state.userAnswers = {};
        renderRangePills();
        filterAndPrepareQuestions();
        renderCurrentQuestion();
      };
      els.rangePills.appendChild(pill);
    });

    // Update top header badge if present
    if (els.topSubjectBadge) {
      els.topSubjectBadge.innerText = `${state.currentSubject} (${state.currentRange})`;
    }
  }

  function filterAndPrepareQuestions(customList = null) {
    if (customList) {
      state.activeQuestions = customList;
    } else {
      let filtered = state.questions.filter(q => q.subject === state.currentSubject);

      if (state.currentRange !== '전체') {
        filtered = filtered.filter(q => {
          if (q.range === state.currentRange) return true;
          if (q.range && state.currentRange.startsWith(q.range)) return true;
          if (state.currentRange.includes('1~6강') && q.range === '1~6강') return true;
          if (state.currentRange.includes('7~15강') && q.range === '7~15강') return true;
          if (state.currentRange.includes('1~5강') && q.range === '1~5강') return true;
          if (state.currentRange.includes('6~10강') && q.range === '6~10강') return true;
          if (state.currentRange.includes('11~15강') && q.range === '11~15강') return true;
          if (state.currentRange.includes('미분류') && q.range === '미분류') return true;
          return false;
        });
      }

      if (state.isShuffled) {
        filtered = [...filtered].sort(() => Math.random() - 0.5);
      }

      state.activeQuestions = filtered;
    }

    state.currentIndex = 0;
    state.userAnswers = {};
    updateAccuracyIndicator();
  }

  // ================= QUESTION CARD RENDERING =================
  function renderCurrentQuestion() {
    if (!state.activeQuestions || state.activeQuestions.length === 0) {
      els.qText.innerHTML = '<div class="py-12 text-center text-slate-400">해당 조건에 일치하는 문제가 없습니다.</div>';
      els.qChoices.innerHTML = '';
      els.qExplanationBox.classList.add('hidden');
      els.qExampleBox.classList.add('hidden');
      els.qImageBox.classList.add('hidden');
      els.quizProgressText.innerText = '0 / 0';
      els.quizProgressBar.style.width = '0%';
      return;
    }

    const q = state.activeQuestions[state.currentIndex];
    const total = state.activeQuestions.length;
    const currentNum = state.currentIndex + 1;

    // Progress
    els.quizProgressText.innerText = `문항 ${currentNum} / ${total}`;
    const pct = Math.round((currentNum / total) * 100);
    els.quizProgressBar.style.width = `${pct}%`;

    // Badges
    els.qBadgeSubject.innerText = q.subject || '';
    if (q.examType === '기초평가') {
      els.qBadgeYear.innerText = '기초 핵심 문항';
    } else if (q.examType === '워크북') {
      els.qBadgeYear.innerText = q.lecture ? `${q.lecture}강 워크북 ${q.number}번` : `워크북 ${q.number || ''}번`;
    } else if (q.examType === '강의퀴즈') {
      els.qBadgeYear.innerText = q.lecture ? `${q.lecture}강 퀴즈 ${q.number}번` : `강의 퀴즈 ${q.number || ''}번`;
    } else if (q.examType === '기출복원') {
      els.qBadgeYear.innerText = `${q.year || '2025'} 기출 복원`;
    } else {
      els.qBadgeYear.innerText = q.year && q.number ? `${q.year} 실전 ${q.number}번` : (q.examType || '실전 문제');
    }
    els.qBadgeRange.innerText = q.lecture ? `${q.lecture}강 · ${q.range || '전체'}` : (q.lectureTitle || q.range || '단원 미분류');

    // Bookmark status
    const isBookmarked = state.bookmarks.has(q.id);
    if (isBookmarked) {
      els.bookmarkIcon.setAttribute('class', 'w-5 h-5 text-amber-400 fill-amber-400');
    } else {
      els.bookmarkIcon.setAttribute('class', 'w-5 h-5 text-slate-400');
    }

    // Question text
    els.qText.innerText = q.text || q.question || '';

    // Example Box / Passage
    if (q.example || q.sharedExample) {
      els.qExampleBox.classList.remove('hidden');
      els.qExampleBox.innerHTML = formatMarkdown(q.example || q.sharedExample);
    } else {
      els.qExampleBox.classList.add('hidden');
    }

    // Vector SVG Diagram
    if (q.svg && els.qDiagramBox) {
      els.qDiagramBox.classList.remove('hidden');
      els.qDiagramBox.innerHTML = q.svg;
    } else if (els.qDiagramBox) {
      els.qDiagramBox.classList.add('hidden');
      els.qDiagramBox.innerHTML = '';
    }

    // Image (if local or remote image exists)
    if (q.imageUrls && q.imageUrls.length > 0 && q.imageUrls[0]) {
      els.qImageBox.classList.remove('hidden');
      els.qImage.src = q.imageUrls[0];
      els.qImage.onerror = () => {
        els.qImageBox.classList.add('hidden');
      };
      els.qImage.onclick = () => {
        els.zoomImageTarget.src = q.imageUrls[0];
        els.modalImageZoom.classList.remove('hidden');
      };
    } else {
      els.qImageBox.classList.add('hidden');
    }

    // Choices
    renderChoices(q);

    // Immediate Explanation (Study mode)
    const hasAnswered = state.userAnswers[q.id] !== undefined;
    if (state.currentMode === 'study' && hasAnswered) {
      renderExplanation(q);
    } else {
      els.qExplanationBox.classList.add('hidden');
    }

    // Prev / Next button states
    els.btnPrevQ.disabled = state.currentIndex === 0;
    
    if (state.currentIndex === total - 1 && state.currentMode === 'exam') {
      els.btnNextQ.classList.add('hidden');
      els.btnSubmitExam.classList.remove('hidden');
      els.btnSubmitExam.classList.add('flex');
    } else {
      els.btnNextQ.classList.remove('hidden');
      els.btnSubmitExam.classList.add('hidden');
      els.btnSubmitExam.classList.remove('flex');
    }

    // Render persistent desktop question grid
    renderDesktopQuestionGrid();

    // Trigger KaTeX rendering on text and choices
    renderMath();
    refreshIcons();
  }

  function renderChoices(q) {
    els.qChoices.innerHTML = '';
    const userAnswer = state.userAnswers[q.id];
    const isAnswered = userAnswer !== undefined;
    const isStudyMode = state.currentMode === 'study';
    const isExamMode = state.currentMode === 'exam';
    const correctAnswers = Array.isArray(q.correctAnswers) ? q.correctAnswers : (q.answer !== undefined ? [q.answer] : [1]);

    (q.choices || []).forEach((ch, idx) => {
      const choiceBtn = document.createElement('button');
      const choiceNum = (typeof ch === 'object' && ch.number !== undefined) ? ch.number : (idx + 1);
      const choiceText = (typeof ch === 'object' && ch.text !== undefined) ? ch.text : String(ch);
      const isSelected = userAnswer === choiceNum;
      const isCorrect = correctAnswers.includes(choiceNum);

      let btnClasses = 'w-full min-h-[52px] p-3 rounded-xl border text-left text-sm font-medium transition-all flex items-start gap-3 touch-card ';

      if (isAnswered) {
        if (isStudyMode) {
          if (isCorrect) {
            btnClasses += 'bg-emerald-950/70 border-emerald-500 text-emerald-100 ring-1 ring-emerald-500/50';
          } else if (isSelected && !isCorrect) {
            btnClasses += 'bg-rose-950/70 border-rose-500 text-rose-100 ring-1 ring-rose-500/50';
          } else {
            btnClasses += 'bg-slate-800/60 border-slate-700/60 text-slate-400 opacity-60';
          }
        } else if (isExamMode) {
          if (isSelected) {
            btnClasses += 'bg-indigo-950/80 border-indigo-500 text-indigo-100 ring-1 ring-indigo-500';
          } else {
            btnClasses += 'bg-slate-800/80 border-slate-700/70 text-slate-200 hover:bg-slate-750';
          }
        }
      } else {
        btnClasses += 'bg-slate-800/80 border-slate-700/70 text-slate-200 hover:bg-slate-750 hover:border-slate-600 active:bg-slate-700';
      }

      choiceBtn.className = btnClasses;

      // Circle number icon (①, ②, ③, ④)
      const numLabel = ['①', '②', '③', '④', '⑤'][choiceNum - 1] || `${choiceNum}.`;
      let badgeHtml = `<span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        isSelected
          ? (isStudyMode ? (isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white') : 'bg-indigo-500 text-white')
          : 'bg-slate-700 text-slate-300'
      }">${numLabel}</span>`;

      let iconFeedback = '';
      if (isStudyMode && isAnswered) {
        if (isCorrect) {
          iconFeedback = '<i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-400 shrink-0 ml-auto"></i>';
        } else if (isSelected && !isCorrect) {
          iconFeedback = '<i data-lucide="x-circle" class="w-5 h-5 text-rose-400 shrink-0 ml-auto"></i>';
        }
      }

      choiceBtn.innerHTML = `
        ${badgeHtml}
        <span class="flex-1 leading-snug pt-0.5">${choiceText}</span>
        ${iconFeedback}
      `;

      choiceBtn.onclick = () => {
        handleChoiceSelect(q, choiceNum);
      };

      els.qChoices.appendChild(choiceBtn);
    });
  }

  function handleChoiceSelect(q, choiceNumber) {
    if (state.currentMode === 'study' && state.userAnswers[q.id] !== undefined) {
      // In study mode, already locked after first answer
      return;
    }

    state.userAnswers[q.id] = choiceNumber;
    const correctAnswers = Array.isArray(q.correctAnswers) ? q.correctAnswers : (q.answer !== undefined ? [q.answer] : [1]);
    const isCorrect = correctAnswers.includes(choiceNumber);

    // Update history & mistakes
    if (!state.history[q.id]) {
      state.history[q.id] = { count: 0, correct: 0 };
    }
    state.history[q.id].count += 1;
    if (isCorrect) {
      state.history[q.id].correct += 1;
      state.mistakes.delete(q.id);
    } else {
      state.mistakes.add(q.id);
    }

    // Save to localStorage
    localStorage.setItem('knou_history', JSON.stringify(state.history));
    localStorage.setItem('knou_mistakes', JSON.stringify(Array.from(state.mistakes)));
    updateSavedBadges();
    updateAccuracyIndicator();

    renderCurrentQuestion();

    // Auto-scroll slightly to explanation in study mode
    if (state.currentMode === 'study') {
      setTimeout(() => {
        els.qExplanationBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    }
  }

  function renderExplanation(q) {
    els.qExplanationBox.classList.remove('hidden');
    const userAnswer = state.userAnswers[q.id];
    const correctAnswers = Array.isArray(q.correctAnswers) ? q.correctAnswers : (q.answer !== undefined ? [q.answer] : [1]);
    const isCorrect = correctAnswers.includes(userAnswer);

    if (isCorrect) {
      els.qResultBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      els.qResultBadge.innerText = '정답입니다! 👏';
    } else {
      els.qResultBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30';
      els.qResultBadge.innerText = '오답입니다 💡';
    }

    const correctNum = correctAnswers[0] || 1;
    const correctChoice = (q.choices || []).find((c, idx) => ((typeof c === 'object' && c.number !== undefined) ? c.number : idx + 1) === correctNum);
    const correctChoiceText = correctChoice ? ((typeof correctChoice === 'object' && correctChoice.text !== undefined) ? correctChoice.text : String(correctChoice)) : '';
    els.qCorrectChoiceText.innerText = `정답: ${correctNum}번 (${correctChoiceText})`;

    els.qExplanationContent.innerHTML = q.explanation
      ? formatMarkdown(q.explanation)
      : '<span class="text-slate-400">상세 해설이 등록되어 있지 않습니다.</span>';

    // Concept Link Button
    if (q.conceptId) {
      const linkDiv = document.createElement('div');
      linkDiv.className = 'mt-3 pt-3 border-t border-slate-700/60';
      linkDiv.innerHTML = `
        <button class="btn-jump-concept inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition">
          <span>📖 관련 핵심 개념: <b>${q.conceptTitle || '핵심 정리'}</b> 보기</span>
          <span>→</span>
        </button>
      `;
      linkDiv.querySelector('.btn-jump-concept').onclick = () => {
        openConceptById(q.conceptId, q.subject);
      };
      els.qExplanationContent.appendChild(linkDiv);
    }

    // Tags
    els.qConceptTags.innerHTML = '';
    if (q.conceptTags && q.conceptTags.length > 0) {
      q.conceptTags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md';
        tagEl.innerText = `#${tag}`;
        els.qConceptTags.appendChild(tagEl);
      });
    }

    // Immediate KaTeX formula rendering for the explanation box
    renderMath();
  }

  function updateAccuracyIndicator() {
    const answeredKeys = Object.keys(state.userAnswers);
    if (answeredKeys.length === 0) {
      els.quizAccuracyRate.innerText = '정답률 100%';
      return;
    }

    let correctCount = 0;
    answeredKeys.forEach(qId => {
      const q = state.activeQuestions.find(item => item.id === qId);
      if (q && q.correctAnswers.includes(state.userAnswers[qId])) {
        correctCount += 1;
      }
    });

    const rate = Math.round((correctCount / answeredKeys.length) * 100);
    els.quizAccuracyRate.innerText = `정답률 ${rate}% (${correctCount}/${answeredKeys.length})`;
  }

  // ================= BOOKMARK TOGGLE =================
  function toggleBookmark() {
    if (!state.activeQuestions || state.activeQuestions.length === 0) return;
    const q = state.activeQuestions[state.currentIndex];
    if (state.bookmarks.has(q.id)) {
      state.bookmarks.delete(q.id);
    } else {
      state.bookmarks.add(q.id);
    }
    localStorage.setItem('knou_bookmarks', JSON.stringify(Array.from(state.bookmarks)));
    renderCurrentQuestion();
    updateSavedBadges();
  }

  function updateSavedBadges() {
    const bCount = state.bookmarks.size;
    const mCount = state.mistakes.size;
    els.savedBookmarksCountLabel.innerText = `북마크 (${bCount})`;
    els.savedMistakesCountLabel.innerText = `오답노트 (${mCount})`;

    if (bCount > 0 || mCount > 0) {
      if (els.navSavedBadge) els.navSavedBadge.classList.remove('hidden');
      if (els.deskSavedBadge) els.deskSavedBadge.classList.remove('hidden');
    } else {
      if (els.navSavedBadge) els.navSavedBadge.classList.add('hidden');
      if (els.deskSavedBadge) els.deskSavedBadge.classList.add('hidden');
    }
  }

  // ================= EXAM MODE & TIMER =================
  function setMode(mode) {
    state.currentMode = mode;
    state.userAnswers = {};

    if (mode === 'exam') {
      if (els.btnModeToggle) {
        els.btnModeToggle.className = 'px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all flex items-center gap-1.5 text-xs font-bold whitespace-nowrap shrink-0';
      }
      if (els.modeToggleIcon) els.modeToggleIcon.setAttribute('data-lucide', 'timer');
      if (els.modeToggleLabel) els.modeToggleLabel.innerText = '실전 테스트';
      els.examTimerBadge.classList.remove('hidden');
      els.examTimerBadge.classList.add('flex');
      startExamTimer();
    } else {
      if (els.btnModeToggle) {
        els.btnModeToggle.className = 'px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all flex items-center gap-1.5 text-xs font-bold whitespace-nowrap shrink-0';
      }
      if (els.modeToggleIcon) els.modeToggleIcon.setAttribute('data-lucide', 'book-open-check');
      if (els.modeToggleLabel) els.modeToggleLabel.innerText = '학습 모드';
      els.examTimerBadge.classList.add('hidden');
      els.examTimerBadge.classList.remove('flex');
      stopExamTimer();
    }

    refreshIcons();
    renderCurrentQuestion();
  }

  function startExamTimer() {
    stopExamTimer();
    state.examSecondsLeft = state.activeQuestions.length * 60; // 1 min per question
    updateTimerDisplay();

    state.examTimerInterval = setInterval(() => {
      state.examSecondsLeft -= 1;
      updateTimerDisplay();

      if (state.examSecondsLeft <= 0) {
        stopExamTimer();
        alert('시험 시간이 종료되었습니다! 답안을 자동 제출합니다.');
        submitExam();
      }
    }, 1000);
  }

  function stopExamTimer() {
    if (state.examTimerInterval) {
      clearInterval(state.examTimerInterval);
      state.examTimerInterval = null;
    }
  }

  function updateTimerDisplay() {
    const min = Math.floor(state.examSecondsLeft / 60);
    const sec = state.examSecondsLeft % 60;
    els.timerText.innerText = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  function submitExam() {
    stopExamTimer();
    state.examSubmitted = true;

    let correctCount = 0;
    const wrongQuestions = [];

    state.activeQuestions.forEach(q => {
      const ans = state.userAnswers[q.id];
      if (ans && q.correctAnswers.includes(ans)) {
        correctCount += 1;
      } else {
        wrongQuestions.push(q);
      }
    });

    const total = state.activeQuestions.length;
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    els.reportSubTitle.innerText = `${state.currentSubject} ${state.currentRange} 모의고사`;
    els.reportScore.innerText = `${score}점`;
    els.reportCorrectCount.innerText = `정답: ${correctCount}개`;
    els.reportWrongCount.innerText = `오답: ${wrongQuestions.length}개`;

    els.modalScoreReport.classList.remove('hidden');

    // Confetti effect on high score
    if (score >= 80 && window.confetti) {
      window.confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // Wrong review button setup
    els.btnReviewWrongOnly.onclick = () => {
      els.modalScoreReport.classList.add('hidden');
      if (wrongQuestions.length > 0) {
        setMode('study');
        filterAndPrepareQuestions(wrongQuestions);
        renderCurrentQuestion();
      } else {
        alert('틀린 문제가 없습니다! 만점입니다 🎉');
      }
    };
  }

  // ================= QUESTION GRID SHEET MODAL =================
  function openGridDrawer() {
    els.gridDrawerButtons.innerHTML = '';
    const total = state.activeQuestions.length;

    for (let i = 0; i < total; i++) {
      const q = state.activeQuestions[i];
      const hasAnswered = state.userAnswers[q.id] !== undefined;
      const isCurrent = state.currentIndex === i;

      const btn = document.createElement('button');
      let classes = 'h-11 rounded-xl font-bold text-sm flex items-center justify-center transition-all touch-card ';

      if (isCurrent) {
        classes += 'ring-2 ring-emerald-400 bg-emerald-600/30 text-emerald-300 ';
      }

      if (hasAnswered) {
        classes += 'bg-emerald-600 text-white shadow-sm';
      } else {
        classes += 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white';
      }

      btn.className = classes;
      btn.innerText = i + 1;
      btn.onclick = () => {
        state.currentIndex = i;
        renderCurrentQuestion();
        els.modalGridDrawer.classList.add('hidden');
      };

      els.gridDrawerButtons.appendChild(btn);
    }

    els.modalGridDrawer.classList.remove('hidden');
  }

  // ================= DESKTOP PERSISTENT QUESTION GRID =================
  function renderDesktopQuestionGrid() {
    if (!els.desktopQuestionGrid) return;
    els.desktopQuestionGrid.innerHTML = '';
    const total = state.activeQuestions.length;
    let answeredCount = 0;

    for (let i = 0; i < total; i++) {
      const q = state.activeQuestions[i];
      const hasAnswered = state.userAnswers[q.id] !== undefined;
      const isCurrent = state.currentIndex === i;
      if (hasAnswered) answeredCount += 1;

      const btn = document.createElement('button');
      let classes = 'h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all touch-card ';

      if (isCurrent) {
        classes += 'ring-2 ring-emerald-400 bg-emerald-600/30 text-emerald-300 font-black ';
      }

      if (hasAnswered) {
        classes += 'bg-emerald-600 text-white shadow-sm';
      } else {
        classes += 'bg-slate-700/60 text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-700';
      }

      btn.className = classes;
      btn.innerText = i + 1;
      btn.onclick = () => {
        state.currentIndex = i;
        renderCurrentQuestion();
      };

      els.desktopQuestionGrid.appendChild(btn);
    }

    if (els.deskAnsweredRatio) {
      els.deskAnsweredRatio.innerText = `${answeredCount} / ${total}`;
    }
  }

  // ================= CONCEPTS VIEW =================
  function renderConcepts() {
    renderConceptSubjectFilter();
    const query = state.conceptSearchQuery.toLowerCase().trim();

    // Filter by selected subject (No '전체' view)
    let filtered = state.concepts.filter(c => c.subject === state.conceptSubjectFilter);

    if (query) {
      filtered = filtered.filter(c => {
        const inTitle = c.title.toLowerCase().includes(query);
        const inCat = c.category.toLowerCase().includes(query);
        const inSum = c.summary.toLowerCase().includes(query);
        const inItems = c.items.some(it => it.label.toLowerCase().includes(query) || it.desc.toLowerCase().includes(query));
        return inTitle || inCat || inSum || inItems;
      });
    }

    els.conceptCardsList.innerHTML = '';
    if (filtered.length === 0) {
      els.conceptCardsList.innerHTML = '<div class="py-12 text-center text-slate-400 text-sm">일치하는 개념 노트가 없습니다.</div>';
      return;
    }

    filtered.forEach((card, idx) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'bg-slate-800/90 rounded-2xl border border-slate-700/80 overflow-hidden shadow-md transition min-w-0 max-w-full';
      cardEl.setAttribute('data-concept-id', card.id);

      const itemsHtml = card.items.map((it, itemIdx) => `
        <div class="py-2.5 border-b border-slate-700/40 last:border-0 min-w-0 max-w-full">
          <div class="flex items-center justify-between gap-2 min-w-0">
            <span class="text-xs font-bold text-emerald-400 break-words min-w-0">${it.label}</span>
            <button class="btn-copy-formula shrink-0 text-[10px] text-slate-400 hover:text-slate-200 bg-slate-700/60 px-1.5 py-0.5 rounded transition" data-concept-id="${card.id}" data-item-idx="${itemIdx}">
              복사
            </button>
          </div>
          <div class="text-xs text-slate-200 mt-1 leading-relaxed min-w-0 max-w-full break-words">${formatMarkdown(it.desc)}</div>
        </div>
      `).join('');

      let practiceHtml = '';
      if (card.practiceQuestions && card.practiceQuestions.length > 0) {
        const pList = card.practiceQuestions.map((pq, pidx) => `
          <div class="mt-3 p-3.5 bg-slate-900/85 rounded-xl border border-slate-700/70">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-amber-400">✍️ 실전 연습문제 ${pidx + 1}</span>
            </div>
            <p class="text-xs text-slate-100 font-medium leading-relaxed">${pq.question}</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2.5">
              ${pq.choices.map((ch, chIdx) => `
                <div class="text-[11px] p-2 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-300">
                  <span class="font-bold text-slate-400 mr-1">${chIdx + 1}.</span> ${ch}
                </div>
              `).join('')}
            </div>
            <div class="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
              <button class="btn-toggle-practice text-xs text-emerald-400 hover:text-emerald-300 font-semibold text-left inline-flex items-center gap-1 transition">
                <span>💡 정답 및 상세 풀이 확인</span>
              </button>
              <div class="practice-ans-box hidden p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 leading-relaxed">
                <div class="font-bold text-emerald-300 mb-1">정답: ${pq.answer}번</div>
                <div>${formatMarkdown(pq.explanation)}</div>
              </div>
            </div>
          </div>
        `).join('');

        practiceHtml = `
          <div class="mt-4 pt-3 border-t border-slate-700/80">
            <h4 class="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-2">
              <span>📝 단원 핵심 실전 연습문제</span>
            </h4>
            ${pList}
          </div>
        `;
      }

      let relatedBtnHtml = '';
      if (card.relatedQuestionIds && card.relatedQuestionIds.length > 0) {
        relatedBtnHtml = `
          <div class="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between flex-wrap gap-2">
            <span class="text-[11px] text-slate-400">연계 기출: ${card.relatedQuestionIds.length}문항</span>
            <button class="btn-jump-to-quiz px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1" data-subject="${card.subject}">
              <span>🎯 관련 기출문제 풀러가기</span> →
            </button>
          </div>
        `;
      }

      let figureHtml = '';
      if (card.figure) {
        figureHtml = `
          <div class="my-4 p-3 bg-slate-900/90 rounded-xl border border-slate-700/80 text-center shadow-inner">
            <img src="${card.figure.url}" alt="${card.figure.caption || card.title}" class="mx-auto max-h-80 w-full object-contain rounded-lg border border-slate-700/50 bg-slate-950/60 p-1" loading="lazy">
            ${card.figure.caption ? `<p class="text-xs text-emerald-400 mt-2 font-medium flex items-center justify-center gap-1.5"><i data-lucide="image" class="w-3.5 h-3.5"></i><span>${card.figure.caption}</span></p>` : ''}
          </div>
        `;
      }

      cardEl.innerHTML = `
        <div class="p-4 cursor-pointer flex items-center justify-between gap-3 concept-header min-w-0">
          <div class="space-y-1 min-w-0 flex-1">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">${card.subject}</span>
              ${card.category ? `<span class="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-700 text-slate-300">${card.category}</span>` : ''}
              ${card.badge ? `<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300">${card.badge}</span>` : ''}
            </div>
            <h3 class="text-sm sm:text-base font-bold text-slate-100 break-words">${card.title}</h3>
            <p class="text-xs text-slate-400 break-words">${card.summary}</p>
          </div>
          <i data-lucide="chevron-down" class="w-5 h-5 text-slate-400 shrink-0 transition-transform chevron-icon"></i>
        </div>
        <div class="px-4 pb-4 pt-1 border-t border-slate-700/60 concept-body min-w-0 max-w-full overflow-hidden">
          ${figureHtml}
          ${itemsHtml}
          ${practiceHtml}
          ${relatedBtnHtml}
        </div>
      `;

      // Accordion toggle
      const header = cardEl.querySelector('.concept-header');
      const body = cardEl.querySelector('.concept-body');
      const icon = cardEl.querySelector('.chevron-icon');

      header.onclick = (e) => {
        if (e.target.closest('.btn-copy-formula') || e.target.closest('.btn-toggle-practice') || e.target.closest('.btn-jump-to-quiz')) return;
        const isHidden = body.classList.toggle('hidden');
        if (isHidden) {
          icon.style.transform = 'rotate(0deg)';
        } else {
          icon.style.transform = 'rotate(180deg)';
        }
      };

      // Toggle practice question answer
      cardEl.querySelectorAll('.btn-toggle-practice').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const ansBox = btn.nextElementSibling;
          if (ansBox) {
            const isHidden = ansBox.classList.toggle('hidden');
            if (!isHidden) renderMath();
          }
        };
      });

      // Jump to quiz from concept card
      const jumpBtn = cardEl.querySelector('.btn-jump-to-quiz');
      if (jumpBtn) {
        jumpBtn.onclick = (e) => {
          e.stopPropagation();
          state.currentSubject = card.subject;
          state.currentRange = '전체';
          switchTab('quiz');
          renderSubjects();
          renderRangePills();
          filterAndPrepareQuestions();
          if (card.relatedQuestionIds && card.relatedQuestionIds.length > 0) {
            const firstId = card.relatedQuestionIds[0];
            const targetIdx = state.filteredQuestions.findIndex(q => q.id === firstId);
            if (targetIdx !== -1) {
              state.currentIndex = targetIdx;
            }
          }
          renderCurrentQuestion();
        };
      }

      els.conceptCardsList.appendChild(cardEl);
    });

    // Copy formula buttons
    document.querySelectorAll('.btn-copy-formula').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const cId = btn.getAttribute('data-concept-id');
        const idxStr = btn.getAttribute('data-item-idx');
        let textToCopy = '';
        if (cId && idxStr !== null) {
          const idx = parseInt(idxStr, 10);
          const concept = state.concepts.find(c => c.id === cId);
          if (concept && concept.items && concept.items[idx]) {
            const item = concept.items[idx];
            const cleanDesc = item.desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            textToCopy = `${item.label}: ${cleanDesc}`;
          }
        }
        if (!textToCopy) {
          textToCopy = btn.getAttribute('data-text') || '';
        }
        navigator.clipboard.writeText(textToCopy).then(() => {
          const original = btn.innerText;
          btn.innerText = '복사됨! ✓';
          setTimeout(() => { btn.innerText = original; }, 1500);
        });
      };
    });

    renderMath();
    refreshIcons();
  }

  function renderConceptSubjectFilter() {
    els.conceptSubjectFilter.innerHTML = '';
    const allSubjects = state.subjects.map(s => s.id);
    
    // Default to currentSubject or first subject, never '전체'
    if (!state.conceptSubjectFilter || state.conceptSubjectFilter === '전체' || !allSubjects.includes(state.conceptSubjectFilter)) {
      state.conceptSubjectFilter = (state.currentSubject && allSubjects.includes(state.currentSubject))
        ? state.currentSubject
        : (allSubjects[0] || '환경화학');
    }

    allSubjects.forEach(s => {
      const isSelected = s === state.conceptSubjectFilter;
      const btn = document.createElement('button');
      btn.className = `px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition touch-card ${
        isSelected
          ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
      }`;
      btn.innerText = s;
      btn.onclick = () => {
        state.conceptSubjectFilter = s;
        renderConcepts();
      };
      els.conceptSubjectFilter.appendChild(btn);
    });
  }

  function openConceptById(conceptId, subject) {
    if (subject) state.conceptSubjectFilter = subject;
    switchTab('concepts');
    renderConcepts();
    setTimeout(() => {
      const targetCard = document.querySelector(`[data-concept-id="${conceptId}"]`);
      if (targetCard) {
        const body = targetCard.querySelector('.concept-body');
        const icon = targetCard.querySelector('.chevron-icon');
        if (body) body.classList.remove('hidden');
        if (icon) icon.style.transform = 'rotate(180deg)';
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  }

  // ================= SAVED LIST (BOOKMARKS & MISTAKES) =================
  function renderSavedList() {
    const isBookmarks = state.savedSubTab === 'bookmarks';
    const targetSet = isBookmarks ? state.bookmarks : state.mistakes;
    const targetIds = Array.from(targetSet);

    if (!state.savedSubjectFilter) state.savedSubjectFilter = '전체';

    const allSavedQuestions = state.questions.filter(q => targetSet.has(q.id));

    // Render subject filter chips inside Saved view
    if (els.savedSubjectFilter) {
      els.savedSubjectFilter.innerHTML = '';
      const subCounts = {};
      allSavedQuestions.forEach(q => {
        subCounts[q.subject] = (subCounts[q.subject] || 0) + 1;
      });
      const filterList = ['전체', ...Object.keys(subCounts)];
      if (!filterList.includes(state.savedSubjectFilter)) {
        state.savedSubjectFilter = '전체';
      }
      filterList.forEach(sub => {
        const cnt = sub === '전체' ? allSavedQuestions.length : (subCounts[sub] || 0);
        const isSelected = state.savedSubjectFilter === sub;
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
          isSelected
            ? 'bg-emerald-500 text-slate-950 shadow-sm'
            : 'bg-slate-900/80 text-slate-300 hover:bg-slate-700 border border-slate-700/70'
        }`;
        chip.innerText = `${sub} (${cnt})`;
        chip.onclick = () => {
          state.savedSubjectFilter = sub;
          renderSavedList();
        };
        els.savedSubjectFilter.appendChild(chip);
      });
    }

    els.savedListContainer.innerHTML = '';
    if (targetIds.length === 0) {
      els.savedListContainer.innerHTML = `<div class="col-span-full py-16 text-center text-slate-400 text-sm">${
        isBookmarks ? '저장된 북마크가 없습니다. 문제의 별표(★)를 눌러 추가해보세요.' : '누적된 오답이 없습니다. 훌륭합니다!'
      }</div>`;
      return;
    }

    const savedQuestions = state.savedSubjectFilter === '전체'
      ? allSavedQuestions
      : allSavedQuestions.filter(q => q.subject === state.savedSubjectFilter);

    const circled = ['①', '②', '③', '④', '⑤'];

    savedQuestions.forEach(q => {
      const card = document.createElement('div');
      card.className = 'bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-700/80 space-y-3 shadow-md min-w-0 max-w-full';

      const ansNum = q.correctAnswers && q.correctAnswers[0] ? q.correctAnswers[0] : 1;
      const yearLabel = q.year && q.number ? `${q.year} ${q.examType || '실전'} ${q.number}번` : (q.examType || '실전');
      const lecLabel = q.lecture ? `${q.lecture}강 · ${q.range || ''}` : (q.range || '미분류');

      const exampleHtml = (q.example || q.sharedExample)
        ? `<div class="p-3 rounded-xl bg-slate-900/90 border border-slate-700/70 text-xs text-slate-300 leading-relaxed">${formatMarkdown(q.example || q.sharedExample)}</div>`
        : '';

      const choicesHtml = (q.choices || []).map((ch, idx) => {
        const cNum = ch.number || (idx + 1);
        const cText = typeof ch === 'string' ? ch : (ch.text || '');
        const isCorrect = cNum === ansNum;
        return `
          <div class="flex items-start gap-2 px-3 py-2 rounded-xl text-xs leading-relaxed border ${
            isCorrect
              ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200 font-semibold'
              : 'bg-slate-900/50 border-slate-700/50 text-slate-300'
          }">
            <span class="shrink-0 font-bold ${isCorrect ? 'text-emerald-400' : 'text-slate-400'}">${circled[cNum - 1] || cNum + '.'}</span>
            <span class="flex-1 break-words">${cText}</span>
            ${isCorrect ? '<span class="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-black">정답</span>' : ''}
          </div>
        `;
      }).join('');

      card.innerHTML = `
        <div class="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2.5">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">${q.subject}</span>
            <span class="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-700 text-slate-300">${yearLabel}</span>
            <span class="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-900/80 text-teal-300 border border-slate-700/70">${lecLabel}</span>
          </div>
          <button class="btn-remove-saved shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/60 transition" title="항목 삭제">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>

        <p class="text-sm font-bold text-slate-100 leading-relaxed break-words">${q.text}</p>
        ${exampleHtml}

        <div class="space-y-1.5">
          ${choicesHtml}
        </div>

        <div class="bg-slate-900/85 p-3.5 rounded-xl border border-slate-700/60 text-xs text-slate-200 space-y-1.5">
          <div class="leading-relaxed text-slate-300 break-words">${q.explanation ? formatMarkdown(q.explanation) : '해설 없음'}</div>
        </div>
      `;

      // Remove button
      card.querySelector('.btn-remove-saved').onclick = () => {
        targetSet.delete(q.id);
        if (isBookmarks) {
          localStorage.setItem('knou_bookmarks', JSON.stringify(Array.from(state.bookmarks)));
        } else {
          localStorage.setItem('knou_mistakes', JSON.stringify(Array.from(state.mistakes)));
        }
        updateSavedBadges();
        renderSavedList();
      };

      els.savedListContainer.appendChild(card);
    });

    renderMath();
    refreshIcons();
  }

  // ================= STATS VIEW =================
  function renderStats() {
    const solvedIds = Object.keys(state.history);
    let totalCorrect = 0;
    let totalAttempts = 0;

    solvedIds.forEach(id => {
      const h = state.history[id];
      totalAttempts += h.count;
      totalCorrect += h.correct;
    });

    const totalQuestions = state.questions.length;
    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    els.statTotalSolved.innerText = solvedIds.length;
    els.statAccuracy.innerText = `${accuracy}%`;
    els.statBookmarks.innerText = state.bookmarks.size;
    els.statMistakes.innerText = state.mistakes.size;

    // Subject Breakdown
    els.statSubjectBreakdown.innerHTML = '';
    state.subjects.forEach(sub => {
      const subQuestions = state.questions.filter(q => q.subject === sub.id);
      const subSolved = subQuestions.filter(q => state.history[q.id] !== undefined);
      const pct = subQuestions.length > 0 ? Math.round((subSolved.length / subQuestions.length) * 100) : 0;

      const row = document.createElement('div');
      row.className = 'space-y-1.5';
      row.innerHTML = `
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-slate-200">${sub.name}</span>
          <span class="text-slate-400 font-medium">${subSolved.length} / ${subQuestions.length} (${pct}%)</span>
        </div>
        <div class="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden">
          <div class="bg-emerald-500 h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
        </div>
      `;
      els.statSubjectBreakdown.appendChild(row);
    });
  }

  // ================= MARKDOWN & RICH TEXT FORMATTER =================
  function formatMarkdown(rawText) {
    if (!rawText) return '';
    let text = String(rawText);

    // 1. Protect Math Blocks ($$...$$ and $...$) so markdown regex won't mangle math formulas
    const mathBlocks = [];
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (match) => {
      mathBlocks.push(match);
      return `___MATH_BLOCK_${mathBlocks.length - 1}___`;
    });
    text = text.replace(/\$([^\$\n]+?)\$/g, (match) => {
      mathBlocks.push(match);
      return `___MATH_BLOCK_${mathBlocks.length - 1}___`;
    });

    // 2. Handle literal \n string if present outside math
    text = text.replace(/\\n/g, '\n');

    // 3. Section Headers **[...]** -> Beautiful badge headers
    text = text.replace(/\*\*\[(.*?)\]\*\*/g, (match, title) => {
      let icon = '📌';
      let badgeClass = 'text-amber-300 bg-amber-500/15 border-amber-500/30';
      if (title.includes('정답')) {
        icon = '🎯';
        badgeClass = 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30';
      } else if (title.includes('오답') || title.includes('선지')) {
        icon = '🔍';
        badgeClass = 'text-sky-300 bg-sky-500/15 border-sky-500/30';
      } else if (title.includes('핵심') || title.includes('암기') || title.includes('공식') || title.includes('팁')) {
        icon = '💡';
        badgeClass = 'text-amber-300 bg-amber-500/15 border-amber-500/30';
      }
      return `\n<div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${badgeClass} border text-xs font-bold mt-3.5 mb-2 w-fit shadow-sm"><span>${icon}</span><span>${title}</span></div>\n`;
    });

    // 4. Bold **...**
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-slate-100">$1</strong>');

    // 5. Italic *...*
    text = text.replace(/(?<!\*)\*([^\*\n]+?)\*(?!\*)/g, '<em class="italic text-slate-200">$1</em>');

    // 6. Inline Code `...`
    text = text.replace(/`([^`\n]+?)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px] border border-slate-700/60">$1</code>');

    // 6.5 Markdown Images ![alt](url)
    text = text.replace(/!\[(.*?)\]\((.*?)\)/g, '<div class="my-3 text-center"><img src="$2" alt="$1" class="mx-auto rounded-xl border border-slate-700 max-h-72 w-auto object-contain bg-slate-900/60 p-2 shadow-sm" loading="lazy"><p class="text-[11px] text-slate-400 mt-1.5 font-medium">$1</p></div>');

    // 6.8 Markdown Tables
    text = text.replace(/\|\s*<br\s*\/?>\s*\|/gi, '|\n|');
    text = text.replace(/(?:^|\n)(\|[^\n]+\|\r?\n\|[-:\s|]+\|\r?\n(?:\|[^\n]+\|\r?\n?)+)/g, (match, tableText) => {
      const rows = tableText.trim().split('\n').map(r => r.trim()).filter(Boolean);
      if (rows.length < 2) return match;
      const headerCells = rows[0].split('|').slice(1, -1).map(c => c.trim());
      const bodyRows = rows.slice(2);
      
      let html = '<div class="overflow-x-auto my-3 rounded-xl border border-slate-700/80 shadow-sm"><table class="w-full text-left text-xs border-collapse">';
      html += '<thead class="bg-slate-900/90 text-emerald-400 font-bold border-b border-slate-700"><tr>';
      headerCells.forEach(cell => {
        html += `<th class="py-2.5 px-3 border-r border-slate-700/60 last:border-0 whitespace-nowrap">${cell}</th>`;
      });
      html += '</tr></thead><tbody class="divide-y divide-slate-700/50 bg-slate-800/60">';
      bodyRows.forEach(row => {
        const cells = row.split('|').slice(1, -1).map(c => c.trim());
        html += '<tr class="hover:bg-slate-700/30 transition">';
        cells.forEach(cell => {
          html += `<td class="py-2 px-3 text-slate-200 border-r border-slate-700/40 last:border-0">${cell}</td>`;
        });
        html += '</tr>';
      });
      html += '</tbody></table></div>';
      return '\n' + html + '\n';
    });

    // 7. Line-by-line processing for lists (- item) and tags
    const lines = text.split('\n');
    const processedLines = [];
    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        processedLines.push('');
        continue;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        let content = trimmed.substring(2).trim();
        content = content.replace(/\[정답\]/g, '<span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mr-1">정답</span>');
        content = content.replace(/\[오답\]/g, '<span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 mr-1">오답</span>');
        processedLines.push(`<div class="flex items-start gap-2 my-1 pl-1 text-xs text-slate-200 leading-relaxed"><span class="text-emerald-400 font-bold shrink-0 mt-0.5">•</span><div class="flex-1">${content}</div></div>`);
      } else if (trimmed.startsWith('<div class="flex items-center')) {
        processedLines.push(trimmed);
      } else {
        processedLines.push(line);
      }
    }
    text = processedLines.join('\n');

    // 8. Restore Math Blocks
    text = text.replace(/___MATH_BLOCK_(\d+)___/g, (match, idx) => {
      return mathBlocks[parseInt(idx, 10)] || match;
    });

    // 9. Clean line breaks and paragraphs
    text = text
      .replace(/(<\/?(table|thead|tbody|tr|th|td)[^>]*>)\s*\n+/gi, '$1')
      .replace(/(<\/div>)\n+/g, '$1')
      .replace(/\n+(<div)/g, '$1')
      .replace(/\n{2,}/g, '<div class="my-2"></div>')
      .replace(/\n/g, '<br>');

    return text;
  }

  // ================= KATEX MATH RENDERER =================
  function renderMath() {
    if (window.renderMathInElement) {
      try {
        renderMathInElement(document.body, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          throwOnError: false,
          ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
        });
      } catch (e) {
        console.warn('KaTeX rendering error:', e);
      }
    }
  }

  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // ================= EVENT LISTENERS =================
  function attachEventListeners() {
    // Nav Tabs (Mobile)
    if (els.navTabQuiz) els.navTabQuiz.onclick = () => switchTab('quiz');
    if (els.navTabConcepts) els.navTabConcepts.onclick = () => switchTab('concepts');
    if (els.navTabSaved) els.navTabSaved.onclick = () => switchTab('saved');
    if (els.navTabStats) els.navTabStats.onclick = () => switchTab('stats');

    // Nav Tabs (Desktop)
    if (els.deskTabQuiz) els.deskTabQuiz.onclick = () => switchTab('quiz');
    if (els.deskTabConcepts) els.deskTabConcepts.onclick = () => switchTab('concepts');
    if (els.deskTabSaved) els.deskTabSaved.onclick = () => switchTab('saved');
    if (els.deskTabStats) els.deskTabStats.onclick = () => switchTab('stats');

    // Theme & Font
    // Font size
    if (els.btnFontSize) els.btnFontSize.onclick = cycleFontSize;

    // Profile / Farmer Cat Archive page
    if (els.btnOpenProfile) {
      els.btnOpenProfile.onclick = () => {
        switchTab(state.currentTab === 'profile' ? 'quiz' : 'profile');
      };
    }
    if (els.btnProfileBackQuiz) {
      els.btnProfileBackQuiz.onclick = () => switchTab('quiz');
    }
    document.querySelectorAll('.btn-profile-jump').forEach(btn => {
      btn.onclick = () => {
        const subj = btn.getAttribute('data-subj');
        if (subj) {
          state.currentSubject = subj;
          state.currentRange = '전체';
          renderSubjectChips();
          renderRangePills();
          filterAndPrepareQuestions();
          renderCurrentQuestion();
        }
        switchTab('quiz');
      };
    });

    // Mode single toggle (default: study <-> exam)
    if (els.btnModeToggle) {
      els.btnModeToggle.onclick = () => {
        const nextMode = state.currentMode === 'study' ? 'exam' : 'study';
        setMode(nextMode);
        showToast(nextMode === 'exam' ? '실전 테스트 모드 (타이머 시작)' : '학습 모드 (즉시 해설)');
      };
    }

    // Shuffle icon toggle
    if (els.btnShuffleToggle) {
      els.btnShuffleToggle.onclick = () => {
        state.isShuffled = !state.isShuffled;
        els.btnShuffleToggle.className = state.isShuffled
          ? 'p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm transition flex items-center justify-center shrink-0'
          : 'p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700/80 transition flex items-center justify-center shrink-0';
        filterAndPrepareQuestions();
        renderCurrentQuestion();
        showToast(state.isShuffled ? '무작위 셔플 켜짐' : '순서대로 보기');
      };
    }

    // Prev / Next
    els.btnPrevQ.onclick = () => {
      if (state.currentIndex > 0) {
        state.currentIndex -= 1;
        renderCurrentQuestion();
      }
    };

    els.btnNextQ.onclick = () => {
      if (state.currentIndex < state.activeQuestions.length - 1) {
        state.currentIndex += 1;
        renderCurrentQuestion();
      }
    };

    // Bookmark button
    els.btnBookmark.onclick = toggleBookmark;

    // Exam submit
    els.btnSubmitExam.onclick = () => {
      if (confirm('모의고사를 제출하시겠습니까?')) {
        submitExam();
      }
    };

    // Grid Drawer Modal
    els.btnOpenGridDrawer.onclick = openGridDrawer;
    els.btnCloseGridDrawer.onclick = () => els.modalGridDrawer.classList.add('hidden');
    els.modalGridDrawer.onclick = (e) => {
      if (e.target === els.modalGridDrawer) els.modalGridDrawer.classList.add('hidden');
    };

    // Score Report Modal
    els.btnCloseScoreReport.onclick = () => els.modalScoreReport.classList.add('hidden');

    // Image Zoom Modal
    els.btnCloseImageZoom.onclick = () => els.modalImageZoom.classList.add('hidden');
    els.modalImageZoom.onclick = (e) => {
      if (e.target === els.modalImageZoom) els.modalImageZoom.classList.add('hidden');
    };

    // Roadmap & Timetable Modal
    function openRoadmapModal() {
      if (els.modalRoadmap) {
        els.modalRoadmap.classList.remove('hidden');
        renderMath();
        refreshIcons();
      }
    }

    function closeRoadmapModal() {
      if (els.modalRoadmap) {
        els.modalRoadmap.classList.add('hidden');
      }
    }

    if (els.btnOpenRoadmap) els.btnOpenRoadmap.onclick = openRoadmapModal;
    if (els.bannerRoadmap) els.bannerRoadmap.onclick = openRoadmapModal;
    if (els.btnCloseRoadmap) els.btnCloseRoadmap.onclick = closeRoadmapModal;
    if (els.modalRoadmap) {
      els.modalRoadmap.onclick = (e) => {
        if (e.target === els.modalRoadmap) closeRoadmapModal();
      };
    }

    // Roadmap Sub-Tab Switching
    function switchRoadmapTab(tab) {
      const activeClass = 'bg-emerald-600 text-white shadow-sm';
      const inactiveClass = 'text-slate-300 hover:text-white hover:bg-slate-700/60';

      [els.rmTabSchedule, els.rmTabCheat, els.rmTabGuide].forEach(btn => {
        if (btn) btn.className = `flex-1 py-2 rounded-lg ${inactiveClass} flex items-center justify-center gap-1.5 transition`;
      });
      [els.rmPanelSchedule, els.rmPanelCheat, els.rmPanelGuide].forEach(panel => {
        if (panel) panel.classList.add('hidden');
      });

      if (tab === 'schedule') {
        if (els.rmTabSchedule) els.rmTabSchedule.className = `flex-1 py-2 rounded-lg ${activeClass} flex items-center justify-center gap-1.5 transition`;
        if (els.rmPanelSchedule) els.rmPanelSchedule.classList.remove('hidden');
      } else if (tab === 'cheat') {
        if (els.rmTabCheat) els.rmTabCheat.className = `flex-1 py-2 rounded-lg ${activeClass} flex items-center justify-center gap-1.5 transition`;
        if (els.rmPanelCheat) els.rmPanelCheat.classList.remove('hidden');
        renderMath();
      } else if (tab === 'guide') {
        if (els.rmTabGuide) els.rmTabGuide.className = `flex-1 py-2 rounded-lg ${activeClass} flex items-center justify-center gap-1.5 transition`;
        if (els.rmPanelGuide) els.rmPanelGuide.classList.remove('hidden');
      }
    }

    if (els.rmTabSchedule) els.rmTabSchedule.onclick = () => switchRoadmapTab('schedule');
    if (els.rmTabCheat) els.rmTabCheat.onclick = () => switchRoadmapTab('cheat');
    if (els.rmTabGuide) els.rmTabGuide.onclick = () => switchRoadmapTab('guide');

    // Jump to subject from cheat sheet
    document.querySelectorAll('.btn-jump-subject').forEach(btn => {
      btn.onclick = (e) => {
        const subj = e.currentTarget.getAttribute('data-subj');
        if (subj) {
          closeRoadmapModal();
          state.currentSubject = subj;
          state.currentRange = '전체';
          switchTab('quiz');
          renderSubjectChips();
          renderRangePills();
          filterAndPrepareQuestions();
          renderCurrentQuestion();
        }
      };
    });

    // Concepts search
    els.conceptSearchInput.oninput = (e) => {
      state.conceptSearchQuery = e.target.value;
      renderConcepts();
    };

    // Saved Sub-Tabs
    els.btnSavedBookmarksTab.onclick = () => {
      state.savedSubTab = 'bookmarks';
      els.btnSavedBookmarksTab.className = 'py-2 rounded-lg bg-amber-500 text-slate-900 shadow-sm flex items-center justify-center gap-1.5 transition';
      els.btnSavedMistakesTab.className = 'py-2 rounded-lg text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition';
      renderSavedList();
    };

    els.btnSavedMistakesTab.onclick = () => {
      state.savedSubTab = 'mistakes';
      els.btnSavedMistakesTab.className = 'py-2 rounded-lg bg-rose-500 text-white shadow-sm flex items-center justify-center gap-1.5 transition';
      els.btnSavedBookmarksTab.className = 'py-2 rounded-lg text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition';
      renderSavedList();
    };

    // Practice Saved
    els.btnPracticeSaved.onclick = () => {
      const isBookmarks = state.savedSubTab === 'bookmarks';
      const targetSet = isBookmarks ? state.bookmarks : state.mistakes;
      const savedQuestions = state.questions.filter(q => targetSet.has(q.id));

      if (savedQuestions.length === 0) {
        alert('풀이할 문항이 없습니다.');
        return;
      }

      switchTab('quiz');
      setMode('study');
      filterAndPrepareQuestions(savedQuestions);
      renderCurrentQuestion();
    };

    // Clear saved category
    els.btnClearSavedCategory.onclick = () => {
      const isBookmarks = state.savedSubTab === 'bookmarks';
      if (confirm(`현재 보고 있는 ${isBookmarks ? '북마크' : '오답노트'} 항목을 모두 비우시겠습니까?`)) {
        if (isBookmarks) {
          state.bookmarks.clear();
          localStorage.removeItem('knou_bookmarks');
        } else {
          state.mistakes.clear();
          localStorage.removeItem('knou_mistakes');
        }
        updateSavedBadges();
        renderSavedList();
      }
    };

    // Export / Import Data
    els.btnExportData.onclick = () => {
      const backup = {
        bookmarks: Array.from(state.bookmarks),
        mistakes: Array.from(state.mistakes),
        history: state.history,
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study_lab_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };

    // Keyboard Shortcuts for Desktop Users
    document.addEventListener('keydown', (e) => {
      // Do not trigger shortcuts when user is typing in search input
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }

      if (state.currentTab === 'quiz') {
        if (e.key === 'ArrowLeft') {
          if (state.currentIndex > 0) {
            state.currentIndex -= 1;
            renderCurrentQuestion();
          }
        } else if (e.key === 'ArrowRight') {
          if (state.currentIndex < state.activeQuestions.length - 1) {
            state.currentIndex += 1;
            renderCurrentQuestion();
          }
        } else if (['1', '2', '3', '4'].includes(e.key)) {
          const choiceNum = parseInt(e.key);
          const q = state.activeQuestions[state.currentIndex];
          if (q && q.choices.some(c => c.number === choiceNum)) {
            handleChoiceSelect(q, choiceNum);
          }
        }
      }
    });

    els.btnImportData.onclick = () => {
      els.importFileInput.click();
    };

    els.importFileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.bookmarks) state.bookmarks = new Set(data.bookmarks);
          if (data.mistakes) state.mistakes = new Set(data.mistakes);
          if (data.history) state.history = data.history;

          localStorage.setItem('knou_bookmarks', JSON.stringify(Array.from(state.bookmarks)));
          localStorage.setItem('knou_mistakes', JSON.stringify(Array.from(state.mistakes)));
          localStorage.setItem('knou_history', JSON.stringify(state.history));

          updateSavedBadges();
          renderStats();
          alert('학습 기록을 성공적으로 가져왔습니다!');
        } catch (err) {
          alert('올바르지 않은 백업 파일 형식입니다.');
        }
      };
      reader.readAsText(file);
    };

    // Reset All Data
    els.btnResetAllData.onclick = () => {
      if (confirm('정말로 모든 풀이 기록, 오답노트, 북마크를 초기화하시겠습니까? (이 작업은 되돌릴 수 없습니다)')) {
        state.bookmarks.clear();
        state.mistakes.clear();
        state.history = {};
        localStorage.removeItem('knou_bookmarks');
        localStorage.removeItem('knou_mistakes');
        localStorage.removeItem('knou_history');
        updateSavedBadges();
        renderStats();
        alert('모든 학습 데이터가 초기화되었습니다.');
      }
    };
  }

  // Start app on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
