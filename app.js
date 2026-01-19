// ===== 앱 상태 관리 =====
const state = {
    currentDay: 0, // 선택된 카테고리 인덱스
    selectedExercises: [], // 실제 운동 중인 운동 객체 목록
    exerciseSets: {}, // { exerciseId: [{weight, reps, time, completed}] }
    exerciseTimers: {}, // { exerciseId: { seconds, interval, isRunning } }
    exerciseConfigs: {}, // { exerciseId: { weight: bool, reps: bool, time: bool } }
    isRunning: false,
    elapsedSeconds: 0,
    timerInterval: null,
    workoutHistory: {},
    calendarMonth: new Date().getMonth(),
    calendarYear: new Date().getFullYear(),
    currentView: 'setup',
    restTimer: null,
    restSeconds: 20,
    tempSelectedIndices: [], // 선택 화면에서 임시 저장용
    includeCardio: false
};

// ===== DOM 요소 =====
const elements = {
    // Views
    setupView: document.getElementById('setupView'),
    selectionView: document.getElementById('selectionView'),
    workoutView: document.getElementById('workoutView'),
    calendarView: document.getElementById('calendarView'),

    // Setup
    nextStepBtn: document.getElementById('nextStepBtn'),
    selectionList: document.getElementById('selectionList'),
    cardioToggle: document.getElementById('cardioToggle'),
    absToggle: document.getElementById('absToggle'),
    startWorkoutBtn: document.getElementById('startWorkoutBtn'),
    backToSetupBtnTop: document.getElementById('backToSetupBtnTop'),

    // Workout
    exerciseCards: document.getElementById('exerciseCards'),
    addExerciseBtnMain: document.getElementById('addExerciseBtnMain'),
    completeWorkoutBtn: document.getElementById('completeWorkoutBtn'),
    checkAllSetsBtn: document.getElementById('checkAllSetsBtn'),
    stickyTimer: document.getElementById('stickyTimer'),
    stickyTimerDisplay: document.getElementById('stickyTimerDisplay'),
    progressBar: document.getElementById('progressBar'),

    // Modals
    addExerciseModal: document.getElementById('addExerciseModal'),
    addSelectionList: document.getElementById('addSelectionList'),
    confirmAddBtn: document.getElementById('confirmAddBtn'),
    addModalClose: document.getElementById('addModalClose'),

    // Calendar
    calendarGrid: document.getElementById('calendarGrid'),
    calendarTitle: document.getElementById('calendarTitle'),
    prevMonthBtn: document.getElementById('prevMonthBtn'),
    nextMonthBtn: document.getElementById('nextMonthBtn'),
    backToHomeBtn: document.getElementById('backToHomeBtn'),

    // Popups
    restPopup: document.getElementById('restPopup'),
    restTimerDisplay: document.getElementById('restTimerDisplay'),
    celebrationPopup: document.getElementById('celebrationPopup'),
    celebrationCloseBtn: document.getElementById('celebrationCloseBtn'),
    restTimerDisplay: document.getElementById('restTimerDisplay'),
    celebrationPopup: document.getElementById('celebrationPopup'),

    // Common
    homeDate: document.getElementById('homeDate'),
    homeDay: document.getElementById('homeDay'),
    categoryScroll: document.getElementById('categoryScroll')
};

function getExerciseImage(exerciseName) {
    // 부위별 통일된 일러스트 아이콘
    const iconBase = 'https://cdn-icons-png.flaticon.com/512/';

    // 1. 등 (Back)
    if (exerciseName.includes('풀다운') || exerciseName.includes('로우') || exerciseName.includes('데드리프트') || exerciseName.includes('풀업')) {
        return iconBase + '2964/2964514.png';
    }

    // 2. 가슴 (Chest)
    if (exerciseName.includes('프레스') || exerciseName.includes('플라이') || exerciseName.includes('푸시업') || exerciseName.includes('딥스')) {
        return iconBase + '2548/2548510.png';
    }

    // 3. 팔 (Arms - 이두/삼두)
    if (exerciseName.includes('컬') || exerciseName.includes('익스텐션') || exerciseName.includes('푸시다운') || exerciseName.includes('킥백')) {
        return iconBase + '2964/2964488.png';
    }

    // 4. 하체 (Legs)
    if (exerciseName.includes('스쿼트') || exerciseName.includes('런지') || exerciseName.includes('레그') || exerciseName.includes('카프') || exerciseName.includes('힙')) {
        return iconBase + '2548/2548525.png';
    }

    // 5. 복근 (Abs)
    if (exerciseName.includes('크런치') || exerciseName.includes('레이즈') || exerciseName.includes('플랭크') || exerciseName.includes('트위스트')) {
        return iconBase + '2548/2548535.png';
    }

    // 6. 유산소 (Cardio)
    if (exerciseName.includes('러닝') || exerciseName.includes('사이클') || exerciseName.includes('걷기')) {
        return iconBase + '2964/2964563.png';
    }

    // 기본값 (등 아이콘)
    return iconBase + '2964/2964514.png';
}

// ===== 초기화 =====
function init() {
    loadWorkoutHistory();
    updateHomeDate();
    setupCategorySelection();
    setupEventListeners();
    checkMidnight();

    // 초기 뷰 설정
    switchView('setup');
}

function updateHomeDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const day = days[now.getDay()];

    if (elements.homeDate) elements.homeDate.textContent = `${year}년 ${month}월 ${date}일`;
    if (elements.homeDay) elements.homeDay.textContent = day;
}

function setupCategorySelection() {
    const cards = document.querySelectorAll('.category-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            state.currentDay = parseInt(card.dataset.category);
        });
    });
}

// ===== 뷰 전환 =====
function switchView(viewName) {
    state.currentView = viewName;

    elements.setupView.classList.add('hidden');
    elements.selectionView.classList.add('hidden');
    elements.workoutView.classList.add('hidden');
    elements.calendarView.classList.add('hidden');
    elements.stickyTimer.classList.add('hidden');

    if (viewName === 'setup') {
        elements.setupView.classList.remove('hidden');
    } else if (viewName === 'selection') {
        elements.selectionView.classList.remove('hidden');
        renderSelectionView();
    } else if (viewName === 'workout') {
        elements.workoutView.classList.remove('hidden');
        elements.stickyTimer.classList.remove('hidden');
        if (!state.isRunning) startTimer();
    } else if (viewName === 'calendar') {
        elements.calendarView.classList.remove('hidden');
        renderCalendar();
        updateStats();
    }

    // 화면 전환 시 스크롤 최상단으로 이동
    window.scrollTo(0, 0);
}

// ===== 설정 및 선택 단계 =====
function renderSelectionView() {
    const categoryData = WORKOUT_DATA[state.currentDay];
    const exercises = categoryData.exercises;

    // 초기화: 부위 선택 시 아무것도 선택되지 않은 상태로 시작 (사용자 요청)
    state.tempSelectedIndices = [];
    state.includeCardio = elements.cardioToggle.checked;

    renderSelectionList();
}

function renderSelectionList() {
    const exercises = WORKOUT_DATA[state.currentDay].exercises;

    elements.selectionList.innerHTML = exercises.map((ex, idx) => `
        <div class="selection-item ${state.tempSelectedIndices.includes(idx) ? 'selected' : ''}" data-index="${idx}">
            <div class="selection-checkbox">
                <span class="check-icon">✔</span>
            </div>
            <div class="selection-info">
                <div class="selection-name">${ex.name}</div>
                <div class="selection-detail">${ex.detail}</div>
            </div>
        </div>
    `).join('');

    // 이벤트 바인딩
    document.querySelectorAll('#selectionList .selection-item').forEach(item => {
        item.addEventListener('click', () => {
            const idx = parseInt(item.dataset.index);
            if (state.tempSelectedIndices.includes(idx)) {
                state.tempSelectedIndices = state.tempSelectedIndices.filter(i => i !== idx);
            } else {
                state.tempSelectedIndices.push(idx);
            }
            renderSelectionList();
        });
    });
}

// ===== 운동 단계 (Workout Phase) =====
function isAbsExercise(name) {
    return ['크런치', '레그 레이즈', '플랭크', '러시안 트위스트', '바이시클 크런치', 'V-업', '할로우 바디 홀드', '사이드 플랭크', '데드 버그', '버드 독', '플랭크 잭'].includes(name);
}

function isCardioExercise(name) {
    return ['러닝머신', '사이클', '천국의 계단', '일립티컬', '로잉 머신', '줄넘기'].includes(name);
}

function startWorkout() {
    if (state.tempSelectedIndices.length === 0 && !elements.cardioToggle.checked && !elements.absToggle.checked) {
        alert('최소 하나 이상의 운동을 선택해주세요!');
        return;
    }

    const categoryExercises = WORKOUT_DATA[state.currentDay].exercises;
    state.selectedExercises = state.tempSelectedIndices.map(idx => ({
        ...categoryExercises[idx],
        id: Date.now() + Math.random()
    }));

    // 유산소 추가 여부
    if (elements.cardioToggle.checked) {
        const cardioExercises = WORKOUT_DATA[6].exercises.filter(ex => isCardioExercise(ex.name));
        state.selectedExercises.unshift({
            ...cardioExercises[0], // 러닝머신 기본 추가
            id: Date.now() + Math.random()
        });
    }

    // 복근 운동 추가 여부 (랜덤 3종)
    if (elements.absToggle && elements.absToggle.checked) {
        const absExercises = WORKOUT_DATA[6].exercises.filter(ex => isAbsExercise(ex.name));

        // 랜덤하게 3개 섞기
        const shuffledAbs = [...absExercises].sort(() => 0.5 - Math.random());
        const selectedAbs = shuffledAbs.slice(0, 3);

        selectedAbs.forEach(ex => {
            state.selectedExercises.push({
                ...ex,
                id: Date.now() + Math.random()
            });
        });
    }

    // 세트 및 설정 데이터 초기화
    state.exerciseSets = {};
    state.exerciseTimers = {};
    state.exerciseConfigs = {};

    state.selectedExercises.forEach(ex => {
        const id = ex.id;
        if (isCardioExercise(ex.name)) {
            state.exerciseTimers[id] = { seconds: 0, interval: null, isRunning: false };
        } else if (isAbsExercise(ex.name)) {
            state.exerciseConfigs[id] = { weight: false, reps: true, time: false }; // 기본: 횟수만 활성
            state.exerciseSets[id] = [{ weight: '', reps: '', time: '', completed: false }];
        } else {
            state.exerciseSets[id] = [{ weight: '', reps: '', time: '', completed: false }];
        }
    });

    renderWorkoutCards();
    switchView('workout');
}

function renderWorkoutCards() {
    elements.exerciseCards.innerHTML = state.selectedExercises.map(ex => {
        const isCardio = isCardioExercise(ex.name);
        const isAbs = isAbsExercise(ex.name);
        const id = ex.id;

        return `
            <div class="exercise-card ${isCardio ? 'cardio-card' : ''}" data-id="${id}">
                <div class="exercise-header" onclick="toggleSlide(this)">
                    <div class="exercise-image-container">
                        <img class="exercise-image illustration" src="${getExerciseImage(ex.name)}" alt="${ex.name}" loading="lazy">
                    </div>
                    <div class="exercise-info">
                        <div class="exercise-name-row">
                            <div class="exercise-name">${ex.name}</div>
                            ${isAbs ? `
                                <div class="abs-config-group">
                                    <label class="config-label"><input type="checkbox" ${state.exerciseConfigs[id].weight ? 'checked' : ''} onchange="updateAbsConfig('${id}', 'weight')"> 무게</label>
                                    <label class="config-label"><input type="checkbox" ${state.exerciseConfigs[id].reps ? 'checked' : ''} onchange="updateAbsConfig('${id}', 'reps')"> 횟수</label>
                                    <label class="config-label"><input type="checkbox" ${state.exerciseConfigs[id].time ? 'checked' : ''} onchange="updateAbsConfig('${id}', 'time')"> 시간</label>
                                </div>
                            ` : ''}
                            <button class="exercise-info-btn" data-name="${ex.name}">?</button>
                        </div>
                        <div class="exercise-detail">${ex.detail}</div>
                    </div>
                </div>
                <div class="exercise-remove-btn" onclick="removeExercise('${id}')">삭제</div>
                
                ${isCardio ? `
                    <div class="cardio-timer-container">
                        <div class="cardio-timer-display" id="timer-${id}">${formatSeconds(state.exerciseTimers[id].seconds)}</div>
                        <button class="cardio-timer-btn ${state.exerciseTimers[id].isRunning ? 'running' : ''}" onclick="toggleCardioTimer('${id}')">
                            ${state.exerciseTimers[id].isRunning ? '정지' : '시작'}
                        </button>
                    </div>
                ` : `
                    <div class="sets-container" id="sets-${id}">
                        ${renderSets(id)}
                    </div>
                    <div class="exercise-controls">
                        <button class="add-set-btn" onclick="addSet('${id}')">
                            <span class="plus-icon">+</span> 세트 추가
                        </button>
                    </div>
                `}
            </div>
        `;
    }).join('');

    setupWorkoutEvents();
}

function formatSeconds(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function toggleCardioTimer(id) {
    const timer = state.exerciseTimers[id];
    if (timer.isRunning) {
        clearInterval(timer.interval);
        timer.isRunning = false;
    } else {
        timer.isRunning = true;
        timer.interval = setInterval(() => {
            timer.seconds++;
            const display = document.getElementById(`timer-${id}`);
            if (display) display.textContent = formatSeconds(timer.seconds);
        }, 1000);
    }
    renderWorkoutCards();
}

function updateAbsConfig(id, field) {
    state.exerciseConfigs[id][field] = !state.exerciseConfigs[id][field];
    renderWorkoutCards();
}

function toggleSlide(header) {
    const card = header.closest('.exercise-card');
    card.classList.toggle('sliding');
}

function removeExercise(id) {
    state.selectedExercises = state.selectedExercises.filter(ex => ex.id.toString() !== id.toString());
    if (state.exerciseTimers[id] && state.exerciseTimers[id].interval) {
        clearInterval(state.exerciseTimers[id].interval);
    }
    delete state.exerciseSets[id];
    delete state.exerciseTimers[id];
    delete state.exerciseConfigs[id];
    renderWorkoutCards();
}

function renderSets(exId) {
    const sets = state.exerciseSets[exId];
    const config = state.exerciseConfigs[exId] || { weight: true, reps: true, time: false };

    return sets.map((set, sIdx) => `
        <div class="set-row ${set.completed ? 'completed' : ''}">
            <span class="set-number">${sIdx + 1}세트</span>
            <div class="set-input-group">
                ${config.weight ? `
                    <input type="number" class="set-input" placeholder="0" value="${set.weight}" oninput="updateSetData('${exId}', ${sIdx}, 'weight', this.value)">
                    <span class="input-label">kg</span>
                ` : ''}
                ${config.reps ? `
                    <input type="number" class="set-input" placeholder="0" value="${set.reps}" oninput="updateSetData('${exId}', ${sIdx}, 'reps', this.value)">
                    <span class="input-label">회</span>
                ` : ''}
                ${config.time ? `
                    <input type="number" class="set-input" placeholder="0" value="${set.time}" oninput="updateSetData('${exId}', ${sIdx}, 'time', this.value)">
                    <span class="input-label">초</span>
                ` : ''}
            </div>
            <div class="set-checkbox ${set.completed ? 'checked' : ''}" onclick="toggleSet('${exId}', ${sIdx})"></div>
        </div>
    `).join('');
}

function updateSetData(exId, sIdx, key, value) {
    state.exerciseSets[exId][sIdx][key] = value;
}

function toggleSet(exId, sIdx) {
    const set = state.exerciseSets[exId][sIdx];
    set.completed = !set.completed;

    if (set.completed) {
        startRestTimer();
    }

    renderWorkoutCards();
}

function addSet(exId) {
    const sets = state.exerciseSets[exId];
    const lastSet = sets[sets.length - 1];
    sets.push({ weight: lastSet.weight, reps: lastSet.reps, time: lastSet.time, completed: false });
    renderWorkoutCards();
}

function checkAllSets(exId) {
    state.exerciseSets[exId].forEach(set => set.completed = true);
    startRestTimer();
    renderWorkoutCards();
}

// ===== 운동 추가 팝업 =====
function openAddExercisePopup() {
    const categoryData = WORKOUT_DATA[state.currentDay];
    const exercises = categoryData.exercises;

    elements.addSelectionList.innerHTML = exercises.map((ex, idx) => `
        <div class="selection-item" data-index="${idx}">
            <div class="selection-checkbox"></div>
            <div class="selection-info">
                <div class="selection-name">${ex.name}</div>
                <div class="selection-detail">${ex.detail}</div>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.add-selection-list .selection-item').forEach(item => {
        item.addEventListener('click', () => item.classList.toggle('selected'));
    });

    elements.addExerciseModal.classList.add('show');
}

function confirmAddExercises() {
    const selectedItems = document.querySelectorAll('.add-selection-list .selection-item.selected');
    const categoryExercises = WORKOUT_DATA[state.currentDay].exercises;

    selectedItems.forEach(item => {
        const idx = parseInt(item.dataset.index);
        const ex = { ...categoryExercises[idx], id: Date.now() + Math.random() };
        const id = ex.id;
        state.selectedExercises.push(ex);

        if (isCardioExercise(ex.name)) {
            state.exerciseTimers[id] = { seconds: 0, interval: null, isRunning: false };
        } else if (isAbsExercise(ex.name)) {
            state.exerciseConfigs[id] = { weight: false, reps: true, time: false };
            state.exerciseSets[id] = [{ weight: '', reps: '', time: '', completed: false }];
        } else {
            state.exerciseSets[id] = [{ weight: '', reps: '', time: '', completed: false }];
        }
    });

    elements.addExerciseModal.classList.remove('show');
    renderWorkoutCards();
}

// ===== 휴식 타이머 =====
function startRestTimer() {
    // 팝업 표시
    elements.restPopup.classList.add('show');
    setTimeout(() => elements.restPopup.classList.remove('show'), 3000);

    // 기존 타이머 제거
    if (state.restTimer) clearInterval(state.restTimer);

    let timeLeft = 20;
    elements.restTimerDisplay.textContent = timeLeft;

    state.restTimer = setInterval(() => {
        timeLeft--;
        elements.restTimerDisplay.textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(state.restTimer);
            playDing();
        }
    }, 1000);
}

function playDing() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, context.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.5);

    gain.gain.setValueAtTime(0.1, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(context.destination);

    osc.start();
    osc.stop(context.currentTime + 0.5);
}

// ===== 타이머 로직 =====
function startTimer() {
    state.isRunning = true;
    state.elapsedSeconds = 0;

    if (state.timerInterval) clearInterval(state.timerInterval);

    state.timerInterval = setInterval(() => {
        state.elapsedSeconds++;
        updateTimerUI();
    }, 1000);
}

function updateTimerUI() {
    const mins = Math.floor(state.elapsedSeconds / 60);
    const secs = state.elapsedSeconds % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    elements.stickyTimerDisplay.textContent = timeStr;

    // 진행바 (60분 기준)
    const progress = Math.min((state.elapsedSeconds / 3600) * 100, 100);
    elements.progressBar.style.width = `${progress}%`;
}

// ===== 완료 및 축하 =====
function completeWorkout() {
    clearInterval(state.timerInterval);
    // 모든 개별 타이머 해제
    Object.values(state.exerciseTimers).forEach(timer => {
        if (timer.interval) clearInterval(timer.interval);
    });
    state.isRunning = false;

    // 완료된 세트가 있는 운동만 필터링하여 저장
    const finalSets = {};
    Object.keys(state.exerciseSets).forEach(exIdx => {
        const sets = state.exerciseSets[exIdx];
        const completedSets = sets.filter(s => s.completed && s.active !== false);
        if (completedSets.length > 0) {
            finalSets[exIdx] = completedSets;
        }
    });

    if (Object.keys(finalSets).length === 0) {
        alert('완료된 운동 세트가 없습니다. 체크박스를 클릭해 세트를 완료해주세요!');
        return;
    }

    // 기록 저장
    const today = new Date().toISOString().split('T')[0];
    state.workoutHistory[today] = {
        date: today,
        duration: state.elapsedSeconds,
        sets: finalSets
    };
    saveWorkoutHistory();

    // 폭죽 효과
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#14b8a6', '#f43f5e']
    });

    // 축하 팝업
    elements.celebrationPopup.classList.add('show');
}

function checkAllSetsGlobal() {
    if (!confirm('모든 운동의 세트를 완료 처리하시겠습니까?')) return;

    Object.keys(state.exerciseSets).forEach(exId => {
        state.exerciseSets[exId].forEach(set => set.completed = true);
    });

    renderWorkoutCards();
}

// ===== 캘린더 및 통계 =====
function renderCalendar() {
    const year = state.calendarYear;
    const month = state.calendarMonth;

    elements.calendarTitle.textContent = `${year}년 ${month + 1}월`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '';

    // 빈 칸
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    // 날짜
    const todayStr = new Date().toISOString().split('T')[0];

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const hasWorkout = state.workoutHistory[dateStr];
        const isToday = dateStr === todayStr;

        html += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${hasWorkout ? 'has-workout' : ''}">
                <span class="day-number">${day}</span>
                ${hasWorkout ? `<div class="stamp">완료</div>` : ''}
            </div>
        `;
    }

    elements.calendarGrid.innerHTML = html;
}

function updateStats() {
    const history = Object.values(state.workoutHistory);
    const currentMonthHistory = history.filter(h => {
        const d = new Date(h.date);
        return d.getMonth() === state.calendarMonth && d.getFullYear() === state.calendarYear;
    });

    document.getElementById('monthWorkouts').textContent = currentMonthHistory.length;

    const totalSeconds = currentMonthHistory.reduce((acc, h) => acc + h.duration, 0);
    document.getElementById('totalTime').textContent = `${Math.floor(totalSeconds / 3600)}시간`;

    // 연속 운동일 (단순 구현)
    let streak = 0;
    let checkDate = new Date();
    while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (state.workoutHistory[dateStr] || checkDate.getDay() === 3) { // 수요일은 휴식이라 포함
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    document.getElementById('streakDays').textContent = streak;
}

// ===== 유틸리티 =====
// 기존 updateDateDisplay 및 renderDayTabs 제거됨

function setupEventListeners() {
    // Setup
    if (elements.nextStepBtn) {
        elements.nextStepBtn.addEventListener('click', () => switchView('selection'));
    }
    if (elements.backToSetupBtnTop) {
        elements.backToSetupBtnTop.addEventListener('click', () => switchView('setup'));
    }
    if (elements.startWorkoutBtn) {
        elements.startWorkoutBtn.addEventListener('click', startWorkout);
    }

    // Workout
    if (elements.addExerciseBtnMain) {
        elements.addExerciseBtnMain.addEventListener('click', openAddExercisePopup);
    }
    if (elements.completeWorkoutBtn) {
        elements.completeWorkoutBtn.addEventListener('click', completeWorkout);
    }
    if (elements.checkAllSetsBtn) {
        elements.checkAllSetsBtn.addEventListener('click', checkAllSetsGlobal);
    }

    // Modals
    if (elements.addModalClose) {
        elements.addModalClose.addEventListener('click', () => elements.addExerciseModal.classList.remove('show'));
    }
    const addModalOverlay = document.getElementById('addModalOverlay');
    if (addModalOverlay) {
        addModalOverlay.addEventListener('click', () => elements.addExerciseModal.classList.remove('show'));
    }
    if (elements.confirmAddBtn) {
        elements.confirmAddBtn.addEventListener('click', confirmAddExercises);
    }

    // Popups
    if (elements.celebrationCloseBtn) {
        elements.celebrationCloseBtn.addEventListener('click', () => {
            elements.celebrationPopup.classList.remove('show');
            switchView('calendar');
        });
    }

    // Calendar
    elements.prevMonthBtn.addEventListener('click', () => {
        state.calendarMonth--;
        if (state.calendarMonth < 0) {
            state.calendarMonth = 11;
            state.calendarYear--;
        }
        renderCalendar();
    });

    elements.nextMonthBtn.addEventListener('click', () => {
        state.calendarMonth++;
        if (state.calendarMonth > 11) {
            state.calendarMonth = 0;
            state.calendarYear++;
        }
        renderCalendar();
    });

    if (elements.backToHomeBtn) {
        elements.backToHomeBtn.addEventListener('click', () => switchView('setup'));
    }
}

function setupWorkoutEvents() {
    document.querySelectorAll('.exercise-info-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openExerciseModal(btn.dataset.name);
        });
    });
}

function checkMidnight() {
    const now = new Date();
    const night = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const msToMidnight = night.getTime() - now.getTime();

    setTimeout(() => {
        updateHomeDate();
        checkMidnight();
    }, msToMidnight);
}

function saveWorkoutHistory() {
    localStorage.setItem('workoutHistory', JSON.stringify(state.workoutHistory));
}

function loadWorkoutHistory() {
    const saved = localStorage.getItem('workoutHistory');
    if (saved) state.workoutHistory = JSON.parse(saved);
}

// 초기화 실행
document.addEventListener('DOMContentLoaded', init);
