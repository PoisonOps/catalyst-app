const data = [
    { day: "Day 1", date: "26 Apr", qa: "—", lrdi: "—", varc: "—", test: "Full Mock + Analysis", qaVal: 0, lrdiVal: 0, rcVal: 0, mockVal: 1, components: ['test'] },
    { day: "Day 2", date: "27 Apr", qa: "% (1–20), P&L (1–10)", lrdi: "1 Arr + 1 Selection", varc: "RC 1–2 + PJ + Summary", qaVal: 30, lrdiVal: 2, rcVal: 2, components: ['qa', 'lrdi', 'varc'] },
    { day: "Day 3", date: "28 Apr", qa: "% (21–33), P&L (11–25)", lrdi: "1 Puzzle + 1 Selection", varc: "RC 3–4 + PJ + OOO", qaVal: 28, lrdiVal: 2, rcVal: 2, components: ['qa', 'lrdi', 'varc'] },
    { day: "Day 4", date: "29 Apr", qa: "Ratio (1–30)", lrdi: "1 Charts + 1 Selection", varc: "RC 5–6 + PJ + Summary", qaVal: 30, lrdiVal: 2, rcVal: 2, components: ['qa', 'lrdi', 'varc'] },
    { day: "Day 5", date: "30 Apr", qa: "T&W (1–15), TSD (16–30)", lrdi: "1 Puzzle + 1 Selection", varc: "RC 7–8 + OOO + Summary", qaVal: 30, lrdiVal: 2, rcVal: 2, components: ['qa', 'lrdi', 'varc'] },
    { day: "Day 6", date: "1 May", qa: "Arithmetic Mixed (1–30)", lrdi: "1 Arr + 1 Selection", varc: "RC 9–10 + PJ + Summary", qaVal: 30, lrdiVal: 2, rcVal: 2, components: ['qa', 'lrdi', 'varc'] },
    { day: "Day 7", date: "2 May", qa: "Linear (1–20), Quad (1–10)", lrdi: "2 sets timed", varc: "RC 11–12 + VA", test: "Sectional (QA)", qaVal: 30, lrdiVal: 2, rcVal: 2, mockVal: 0.3, components: ['qa', 'lrdi', 'varc', 'test'] },
    { day: "Day 8", date: "3 May (Sun)", qa: "—", lrdi: "—", varc: "—", test: "Full Mock + Analysis", qaVal: 0, lrdiVal: 0, rcVal: 0, mockVal: 1, components: ['test'] },
    { day: "Day 9", date: "4 May", qa: "Linear (21–40), Quad (11–20)", lrdi: "1 Selection + 1 Puzzle", varc: "RC 13–14 + VA", qaVal: 30, lrdiVal: 2, rcVal: 2, components: ['qa', 'lrdi', 'varc'] },
    { day: "Day 10", date: "5 May", qa: "Inequalities (1–30)", lrdi: "1 Arr + 1 Charts", varc: "RC 15–16 + VA", qaVal: 30, lrdiVal: 2, rcVal: 2, components: ['qa', 'lrdi', 'varc'] },
    { day: "Day 11", date: "6 May", qa: "Arithmetic Mixed (31–60)", lrdi: "1 Selection + 1 Puzzle", varc: "RC 17–18 + VA", qaVal: 30, lrdiVal: 2, rcVal: 2, components: ['qa', 'lrdi', 'varc'] },
    { day: "Day 12", date: "7 May", qa: "Ratio + TSD Mixed", lrdi: "2 timed sets", varc: "RC 19–20 + VA", test: "Sectional (LRDI)", qaVal: 30, lrdiVal: 2, rcVal: 2, mockVal: 0.3, components: ['qa', 'lrdi', 'varc', 'test'] },
    { day: "Day 13", date: "8 May", qa: "Quad + Inequality Mixed", lrdi: "1 Selection + 1 set", varc: "RC 21–22 + VA", qaVal: 30, lrdiVal: 2, rcVal: 2, components: ['qa', 'lrdi', 'varc'] },
    { day: "Day 14", date: "9 May", qa: "Mixed QA Test (30 Q) + Analysis", lrdi: "2 sets", varc: "RC 23–24 + VA", test: "Sectional (VARC)", qaVal: 30, lrdiVal: 2, rcVal: 2, mockVal: 0.3, components: ['qa', 'lrdi', 'varc', 'test'] }
];

function init() {
    const body = document.getElementById('table-body');
    const saved = JSON.parse(localStorage.getItem('cat_audit_v2')) || {};

    data.forEach((item, dayIndex) => {
        const daySaved = saved[dayIndex] || {};
        const row = document.createElement('tr');
        
        // Helper to generate a themed checkbox for each subject
        const getCB = (comp) => {
            if (item[comp] === "—" || !item[comp]) return '<span style="color:var(--text-dim)">—</span>';
            const checked = daySaved[comp] ? 'checked' : '';
            return `
                <div class="subject-row">
                    <label class="cb-container small">
                        <input type="checkbox" ${checked} onchange="toggleSubject(${dayIndex}, '${comp}', this.checked)">
                        <span class="checkmark"></span>
                        <span class="work-item">${item[comp]}</span>
                    </label>
                </div>
            `;
        };

        const isDayDone = item.components.every(c => daySaved[c]);
        
        row.innerHTML = `
            <td id="day-status-${dayIndex}">
                <div class="day-dot ${isDayDone ? 'done' : ''}"></div>
            </td>
            <td>
                <div class="day-cell">${item.day}</div>
                <div class="meta-item">${item.date}</div>
            </td>
            <td>${getCB('qa')}</td>
            <td>${getCB('lrdi')}</td>
            <td>${getCB('varc')}</td>
            <td>${getCB('test')}</td>
        `;
        body.appendChild(row);
    });

    updateStats();
}

function toggleSubject(dayIndex, comp, isChecked) {
    const saved = JSON.parse(localStorage.getItem('cat_audit_v2')) || {};
    if (!saved[dayIndex]) saved[dayIndex] = {};
    saved[dayIndex][comp] = isChecked;
    localStorage.setItem('cat_audit_v2', JSON.stringify(saved));

    // Update Day Status Dot
    const item = data[dayIndex];
    const isDayDone = item.components.every(c => saved[dayIndex][c]);
    const dot = document.querySelector(`#day-status-${dayIndex} .day-dot`);
    if (dot) {
        if (isDayDone) dot.classList.add('done');
        else dot.classList.remove('done');
    }

    updateStats();
}

function updateStats() {
    const saved = JSON.parse(localStorage.getItem('cat_audit_v2')) || {};
    let fullDays = 0;
    let totalQA = 0;
    let totalLRDI = 0;
    let totalRC = 0;

    data.forEach((item, i) => {
        const daySaved = saved[i] || {};
        if (item.components.every(c => daySaved[c])) fullDays++;
        
        if (daySaved.qa) totalQA += item.qaVal;
        if (daySaved.lrdi) totalLRDI += item.lrdiVal;
        if (daySaved.varc) totalRC += item.rcVal;
    });

    document.getElementById('days-stat').textContent = `${fullDays}/14`;
    document.getElementById('qa-stat').textContent = `~${totalQA}`;
    document.getElementById('lrdi-stat').textContent = totalLRDI;
    document.getElementById('rc-stat').textContent = totalRC;
}

function generateReport() {
    const saved = JSON.parse(localStorage.getItem('cat_audit_v2')) || {};
    let fullDays = 0;
    let totalQA = 0;
    let totalLRDI = 0;
    let totalRC = 0;
    let mocks = 0;
    let sectionals = 0;

    data.forEach((item, i) => {
        const daySaved = saved[i] || {};
        if (item.components.every(c => daySaved[c])) fullDays++;
        
        if (daySaved.qa) totalQA += item.qaVal;
        if (daySaved.lrdi) totalLRDI += item.lrdiVal;
        if (daySaved.varc) totalRC += item.rcVal;
        if (daySaved.test) {
            if (item.mockVal === 1) mocks++;
            if (item.mockVal === 0.3) sectionals++;
        }
    });

    const text = `* Days completed properly: ${fullDays}/14
* QA done approx: ${totalQA}
* LRDI sets done: ${totalLRDI}
* RC done: ${totalRC}
* Mocks: ${mocks} Full, ${sectionals} Sectionals`;

    document.getElementById('output').value = text;
}

init();
