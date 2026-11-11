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
    fontSizeIndex: parseInt(localStorage.getItem('knou_font_size_idx') || '1'), // 0: sm, 1: base, 2: lg
    fontSizes: ['text-sm', 'text-base', 'text-lg'],
    isShuffled: false,
    conceptSearchQuery: '',
    conceptSubjectFilter: '전체'
  };

  // ================= DOM ELEMENTS =================
  const els = {
    // Nav tabs
    navTabQuiz: document.getElementById('navTabQuiz'),
    navTabConcepts: document.getElementById('navTabConcepts'),
    navTabSaved: document.getElementById('navTabSaved'),
    navTabStats: document.getElementById('navTabStats'),
    navSavedBadge: document.getElementById('navSavedBadge'),

    // Views
    viewQuiz: document.getElementById('viewQuiz'),
    viewConcepts: document.getElementById('viewConcepts'),
    viewSaved: document.getElementById('viewSaved'),
    viewStats: document.getElementById('viewStats'),

    // Top Bar
    topSubjectBadge: document.getElementById('topSubjectBadge'),
    btnFontSize: document.getElementById('btnFontSize'),
    btnThemeToggle: document.getElementById('btnThemeToggle'),
    themeIcon: document.getElementById('themeIcon'),
    examTimerBadge: document.getElementById('examTimerBadge'),
    timerText: document.getElementById('timerText'),

    // Quiz View controls
    subjectChips: document.getElementById('subjectChips'),
    questionCountSummary: document.getElementById('questionCountSummary'),
    rangePills: document.getElementById('rangePills'),
    checkShuffle: document.getElementById('checkShuffle'),
    btnModeStudy: document.getElementById('btnModeStudy'),
    btnModeExam: document.getElementById('btnModeExam'),
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
    if (window.KNOU_DATA) {
      state.subjects = window.KNOU_DATA.subjects;
      state.questions = window.KNOU_DATA.questions;
      state.concepts = window.KNOU_DATA.concepts;
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
    attachEventListeners();
    refreshIcons();
  }

  // ================= THEME & FONT =================
  function initTheme() {
    if (state.theme === 'light') {
      document.documentElement.classList.remove('dark');
      els.themeIcon.setAttribute('data-lucide', 'sun');
    } else {
      document.documentElement.classList.add('dark');
      els.themeIcon.setAttribute('data-lucide', 'moon');
    }
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('knou_theme', state.theme);
    initTheme();
    refreshIcons();
  }

  function initFontSize() {
    applyFontSize();
  }

  function cycleFontSize() {
    state.fontSizeIndex = (state.fontSizeIndex + 1) % state.fontSizes.length;
    localStorage.setItem('knou_font_size_idx', state.fontSizeIndex);
    applyFontSize();
  }

  function applyFontSize() {
    state.fontSizes.forEach(cls => document.body.classList.remove(cls));
    document.body.classList.add(state.fontSizes[state.fontSizeIndex]);
  }

  // ================= NAVIGATION =================
  function switchTab(tabId) {
    state.currentTab = tabId;
    
    // Hide all views
    els.viewQuiz.classList.add('hidden');
    els.viewConcepts.classList.add('hidden');
    els.viewSaved.classList.add('hidden');
    els.viewStats.classList.add('hidden');

    // Reset tab button colors
    const navButtons = [els.navTabQuiz, els.navTabConcepts, els.navTabSaved, els.navTabStats];
    navButtons.forEach(btn => {
      btn.className = 'flex flex-col items-center py-1 text-slate-400 hover:text-slate-200 font-medium transition';
    });

    if (tabId === 'quiz') {
      els.viewQuiz.classList.remove('hidden');
      els.navTabQuiz.className = 'flex flex-col items-center py-1 text-emerald-400 font-bold transition';
    } else if (tabId === 'concepts') {
      els.viewConcepts.classList.remove('hidden');
      els.navTabConcepts.className = 'flex flex-col items-center py-1 text-emerald-400 font-bold transition';
      renderConcepts();
    } else if (tabId === 'saved') {
      els.viewSaved.classList.remove('hidden');
      els.navTabSaved.className = 'flex flex-col items-center py-1 text-emerald-400 font-bold transition relative';
      renderSavedList();
    } else if (tabId === 'stats') {
      els.viewStats.classList.remove('hidden');
      els.navTabStats.className = 'flex flex-col items-center py-1 text-emerald-400 font-bold transition';
      renderStats();
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

    // Update top header badge
    els.topSubjectBadge.innerText = `${state.currentSubject} (${state.currentRange})`;
  }

  function filterAndPrepareQuestions(customList = null) {
    if (customList) {
      state.activeQuestions = customList;
    } else {
      let filtered = state.questions.filter(q => q.subject === state.currentSubject);

      if (state.currentRange !== '전체') {
        filtered = filtered.filter(q => q.range === state.currentRange);
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
    els.qBadgeSubject.innerText = q.subject;
    els.qBadgeYear.innerText = q.examType === '출석대체' ? '출석대체 족보' : `${q.year} 기출 ${q.number}번`;
    els.qBadgeRange.innerText = q.range || '전범위';

    // Bookmark status
    const isBookmarked = state.bookmarks.has(q.id);
    if (isBookmarked) {
      els.bookmarkIcon.setAttribute('class', 'w-5 h-5 text-amber-400 fill-amber-400');
    } else {
      els.bookmarkIcon.setAttribute('class', 'w-5 h-5 text-slate-400');
    }

    // Question text
    els.qText.innerText = q.text;

    // Example Box / Passage
    if (q.example || q.sharedExample) {
      els.qExampleBox.classList.remove('hidden');
      els.qExampleBox.innerText = q.example || q.sharedExample;
    } else {
      els.qExampleBox.classList.add('hidden');
    }

    // Image
    if (q.imageUrls && q.imageUrls.length > 0 && q.imageUrls[0]) {
      els.qImageBox.classList.remove('hidden');
      els.qImage.src = q.imageUrls[0];
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

    q.choices.forEach(ch => {
      const choiceBtn = document.createElement('button');
      const isSelected = userAnswer === ch.number;
      const isCorrect = q.correctAnswers.includes(ch.number);

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
      const numLabel = ['①', '②', '③', '④', '⑤'][ch.number - 1] || `${ch.number}.`;
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
        <span class="flex-1 leading-snug pt-0.5">${ch.text}</span>
        ${iconFeedback}
      `;

      choiceBtn.onclick = () => {
        handleChoiceSelect(q, ch.number);
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
    const isCorrect = q.correctAnswers.includes(choiceNumber);

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
    const isCorrect = q.correctAnswers.includes(userAnswer);

    if (isCorrect) {
      els.qResultBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      els.qResultBadge.innerText = '정답입니다! 👏';
    } else {
      els.qResultBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30';
      els.qResultBadge.innerText = '오답입니다 💡';
    }

    const correctNum = q.correctAnswers[0];
    const correctChoice = q.choices.find(c => c.number === correctNum);
    els.qCorrectChoiceText.innerText = `정답: ${correctNum}번 (${correctChoice ? correctChoice.text : ''})`;

    els.qExplanationContent.innerHTML = q.explanation
      ? q.explanation.replace(/\n/g, '<br>')
      : '상세 해설이 등록되어 있지 않습니다.';

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
      els.navSavedBadge.classList.remove('hidden');
    } else {
      els.navSavedBadge.classList.add('hidden');
    }
  }

  // ================= EXAM MODE & TIMER =================
  function setMode(mode) {
    state.currentMode = mode;
    state.userAnswers = {};

    if (mode === 'exam') {
      els.btnModeExam.className = 'py-2 rounded-lg bg-emerald-600 text-white shadow-sm transition-all flex items-center justify-center gap-1.5';
      els.btnModeStudy.className = 'py-2 rounded-lg text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1.5';
      els.examTimerBadge.classList.remove('hidden');
      els.examTimerBadge.classList.add('flex');
      startExamTimer();
    } else {
      els.btnModeStudy.className = 'py-2 rounded-lg bg-emerald-600 text-white shadow-sm transition-all flex items-center justify-center gap-1.5';
      els.btnModeExam.className = 'py-2 rounded-lg text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1.5';
      els.examTimerBadge.classList.add('hidden');
      els.examTimerBadge.classList.remove('flex');
      stopExamTimer();
    }

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

  // ================= CONCEPTS VIEW =================
  function renderConcepts() {
    renderConceptSubjectFilter();
    const query = state.conceptSearchQuery.toLowerCase().trim();

    let filtered = state.concepts;
    if (state.conceptSubjectFilter !== '전체') {
      filtered = filtered.filter(c => c.subject === state.conceptSubjectFilter);
    }

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
      cardEl.className = 'bg-slate-800/90 rounded-2xl border border-slate-700/80 overflow-hidden shadow-md transition';

      const itemsHtml = card.items.map(it => `
        <div class="py-2.5 border-b border-slate-700/40 last:border-0">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-bold text-emerald-400">${it.label}</span>
            <button class="btn-copy-formula text-[10px] text-slate-400 hover:text-slate-200 bg-slate-700/60 px-1.5 py-0.5 rounded transition" data-text="${it.label}: ${it.desc}">
              복사
            </button>
          </div>
          <p class="text-xs text-slate-200 mt-1 leading-relaxed">${it.desc}</p>
        </div>
      `).join('');

      cardEl.innerHTML = `
        <div class="p-4 cursor-pointer flex items-center justify-between gap-3 concept-header">
          <div class="space-y-1">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">${card.subject}</span>
              <span class="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-700 text-slate-300">${card.category}</span>
              <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300">${card.badge}</span>
            </div>
            <h3 class="text-sm font-bold text-slate-100">${card.title}</h3>
            <p class="text-xs text-slate-400">${card.summary}</p>
          </div>
          <i data-lucide="chevron-down" class="w-5 h-5 text-slate-400 shrink-0 transition-transform chevron-icon"></i>
        </div>
        <div class="px-4 pb-4 pt-1 border-t border-slate-700/60 concept-body">
          ${itemsHtml}
        </div>
      `;

      // Accordion toggle
      const header = cardEl.querySelector('.concept-header');
      const body = cardEl.querySelector('.concept-body');
      const icon = cardEl.querySelector('.chevron-icon');

      header.onclick = (e) => {
        if (e.target.closest('.btn-copy-formula')) return;
        const isHidden = body.classList.toggle('hidden');
        if (isHidden) {
          icon.style.transform = 'rotate(0deg)';
        } else {
          icon.style.transform = 'rotate(180deg)';
        }
      };

      els.conceptCardsList.appendChild(cardEl);
    });

    // Copy formula buttons
    document.querySelectorAll('.btn-copy-formula').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const text = btn.getAttribute('data-text');
        navigator.clipboard.writeText(text).then(() => {
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
    const allSubjects = ['전체', ...state.subjects.map(s => s.id)];

    allSubjects.forEach(s => {
      const isSelected = s === state.conceptSubjectFilter;
      const btn = document.createElement('button');
      btn.className = `px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition touch-card ${
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

  // ================= SAVED LIST (BOOKMARKS & MISTAKES) =================
  function renderSavedList() {
    const isBookmarks = state.savedSubTab === 'bookmarks';
    const targetSet = isBookmarks ? state.bookmarks : state.mistakes;
    const targetIds = Array.from(targetSet);

    els.savedListContainer.innerHTML = '';
    if (targetIds.length === 0) {
      els.savedListContainer.innerHTML = `<div class="py-16 text-center text-slate-400 text-sm">${
        isBookmarks ? '저장된 북마크가 없습니다. 문제의 별표(★)를 눌러 추가해보세요.' : '누적된 오답이 없습니다. 훌륭합니다!'
      }</div>`;
      return;
    }

    const savedQuestions = state.questions.filter(q => targetSet.has(q.id));

    savedQuestions.forEach(q => {
      const card = document.createElement('div');
      card.className = 'bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 space-y-2.5 shadow-md';

      card.innerHTML = `
        <div class="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400">${q.subject}</span>
            <span class="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-700 text-slate-300">${q.year} 기출 ${q.number}번</span>
          </div>
          <button class="btn-remove-saved p-1 text-slate-400 hover:text-red-400 transition" title="항목 삭제">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
        <p class="text-sm font-semibold text-slate-100 leading-snug">${q.text}</p>
        <div class="pt-1 flex items-center justify-between text-xs">
          <button class="btn-toggle-answer text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
            <span>정답 및 해설 보기</span>
            <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
          </button>
        </div>
        <div class="hidden saved-answer-box bg-slate-900/80 p-3 rounded-xl border border-slate-700/50 text-xs text-slate-200 space-y-1">
          <div class="font-bold text-emerald-400">정답: ${q.correctAnswers[0]}번</div>
          <div class="leading-relaxed text-slate-300">${q.explanation || '해설 없음'}</div>
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

      // Toggle Answer
      const toggleBtn = card.querySelector('.btn-toggle-answer');
      const answerBox = card.querySelector('.saved-answer-box');
      toggleBtn.onclick = () => {
        const isHidden = answerBox.classList.toggle('hidden');
        toggleBtn.querySelector('span').innerText = isHidden ? '정답 및 해설 보기' : '해설 닫기';
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
    // Nav Tabs
    els.navTabQuiz.onclick = () => switchTab('quiz');
    els.navTabConcepts.onclick = () => switchTab('concepts');
    els.navTabSaved.onclick = () => switchTab('saved');
    els.navTabStats.onclick = () => switchTab('stats');

    // Theme & Font
    els.btnThemeToggle.onclick = toggleTheme;
    els.btnFontSize.onclick = cycleFontSize;

    // Modes
    els.btnModeStudy.onclick = () => setMode('study');
    els.btnModeExam.onclick = () => setMode('exam');

    // Shuffle
    els.checkShuffle.onchange = (e) => {
      state.isShuffled = e.target.checked;
      filterAndPrepareQuestions();
      renderCurrentQuestion();
    };

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
      a.download = `knou_study_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };

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
