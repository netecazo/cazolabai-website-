/* LabReady Pro quiz player. Used by the module pages and the app.
 *   LabReadyQuiz.mount(el, moduleId, { onFinish(result), finishLabel, showPrint, onSubmit(answers), noRetry })
 * onSubmit (optional, async) gets the chosen option indexes before marking; if it throws, the
 * message is shown and the tech can try again. If it returns {correct, total, percent, passed},
 * those server figures are shown instead of the local ones.
 * Needs window.LABREADY_QUIZZES (content/quizzes.js).
 * result = { moduleId, title, correct, total, percent, passed, passMark, completedAt, name }
 */
(function () {
    'use strict';

    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function shuffled(n) {
        const idx = Array.from({ length: n }, (_, i) => i);
        for (let i = n - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [idx[i], idx[j]] = [idx[j], idx[i]];
        }
        return idx;
    }

    function mount(el, moduleId, opts) {
        opts = opts || {};
        const bank = window.LABREADY_QUIZZES;
        const mod = bank && bank.modules[moduleId];
        if (!mod) { el.innerHTML = '<p class="muted">No quiz is available for this module yet.</p>'; return; }
        const passMark = bank.passMark;

        // Two-option (true/false, yes/no) questions keep their order; others are shuffled every attempt.
        const order = mod.questions.map(q => q.o.length > 2 ? shuffled(q.o.length) : q.o.map((_, i) => i));

        el.innerHTML =
            '<form class="quiz" novalidate>' +
            '<p class="quiz-meta">' + mod.questions.length + ' questions · pass mark ' + passMark + '%</p>' +
            (opts.showPrint ? '<div class="quiz-name"><label class="lbl" for="quizName_' + moduleId + '">Your name (for the printed result)</label><input type="text" id="quizName_' + moduleId + '"></div>' : '') +
            mod.questions.map((q, qi) =>
                '<fieldset class="quiz-q" data-q="' + qi + '"><legend><span class="quiz-n">' + (qi + 1) + '</span>' + esc(q.q) + '</legend>' +
                order[qi].map(oi =>
                    '<label class="quiz-o"><input type="radio" name="q' + qi + '_' + moduleId + '" value="' + oi + '"><span>' + esc(q.o[oi]) + '</span></label>').join('') +
                '<p class="quiz-why" hidden></p></fieldset>').join('') +
            '<p class="error quiz-err" hidden>Answer every question before submitting.</p>' +
            '<div class="actions quiz-actions"><button class="btn primary" type="submit">Submit answers</button></div>' +
            '</form><div class="quiz-result" hidden></div>';

        const form = el.querySelector('form');
        let sending = false;
        form.onsubmit = async e => {
            e.preventDefault();
            const answers = mod.questions.map((_, qi) => {
                const c = form.querySelector('input[name="q' + qi + '_' + moduleId + '"]:checked');
                return c ? Number(c.value) : null;
            });
            if (answers.some(a => a === null)) {
                form.querySelector('.quiz-err').hidden = false;
                const first = answers.findIndex(a => a === null);
                form.querySelector('[data-q="' + first + '"]').scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            let server = null;
            if (opts.onSubmit) {
                if (sending) return;
                sending = true;
                const btn = form.querySelector('.quiz-actions button');
                const err = form.querySelector('.quiz-err');
                btn.disabled = true; btn.textContent = 'Sending…';
                try { server = await opts.onSubmit(answers); } catch (ex) {
                    err.textContent = ex.message || 'Couldn\'t send your answers. Check your connection and try again.';
                    err.hidden = false;
                    btn.disabled = false; btn.textContent = 'Submit answers';
                    sending = false;
                    return;
                }
            }
            let correct = 0;
            mod.questions.forEach((q, qi) => {
                const fs = form.querySelector('[data-q="' + qi + '"]');
                const ok = answers[qi] === q.a;
                if (ok) correct++;
                fs.classList.add(ok ? 'right' : 'wrong');
                fs.querySelectorAll('input').forEach(i => {
                    i.disabled = true;
                    if (Number(i.value) === q.a) i.parentElement.classList.add('is-answer');
                });
                const why = fs.querySelector('.quiz-why');
                why.innerHTML = '<b>' + (ok ? 'Correct.' : 'Answer: ' + esc(q.o[q.a]) + '.') + '</b> ' + esc(q.why);
                why.hidden = false;
            });
            form.querySelector('.quiz-err').hidden = true;
            form.querySelector('.quiz-actions').style.display = 'none';
            const nameEl = form.querySelector('.quiz-name input');
            if (nameEl) nameEl.disabled = true;

            const total = mod.questions.length;
            const percent = Math.round(correct / total * 100);
            const result = {
                moduleId, title: mod.title, correct, total, percent, passMark,
                passed: percent >= passMark, completedAt: new Date().toISOString(),
                name: nameEl ? nameEl.value.trim() : ''
            };
            if (server && typeof server.percent === 'number') {
                Object.assign(result, { correct: server.correct, total: server.total, percent: server.percent, passed: !!server.passed });
                if (server.pass_mark) result.passMark = server.pass_mark;
                if (server.submitted_at) result.completedAt = server.submitted_at;
            }

            const res = el.querySelector('.quiz-result');
            res.hidden = false;
            res.className = 'quiz-result ' + (result.passed ? 'pass' : 'fail');
            res.innerHTML =
                '<div class="quiz-score"><b>' + result.correct + ' / ' + result.total + '</b> (' + result.percent + '%) · ' + (result.passed ? 'Pass' : 'Below the ' + result.passMark + '% pass mark') + '</div>' +
                '<p class="muted">Module ' + esc(moduleId) + ': ' + esc(mod.title) + (result.name ? ' · ' + esc(result.name) : '') + ' · ' + new Date(result.completedAt).toLocaleString() + '</p>' +
                '<div class="actions" style="margin:0.8rem 0 0">' +
                (opts.onFinish ? '<button class="btn primary quiz-finish" type="button">' + esc(opts.finishLabel || 'Use this result') + '</button>' : '') +
                (opts.showPrint ? '<button class="btn ghost quiz-print" type="button">Print result</button>' : '') +
                (opts.noRetry ? '' : '<button class="btn ghost quiz-retry" type="button">Try again</button>') + '</div>' +
                (opts.resultNote ? '<p class="quiz-note">' + esc(opts.resultNote) + '</p>' : '');
            const fin = res.querySelector('.quiz-finish');
            if (fin) fin.onclick = () => opts.onFinish(result);
            const pr = res.querySelector('.quiz-print');
            if (pr) pr.onclick = () => {
                document.body.classList.add('print-quiz-only');
                window.print();
                setTimeout(() => document.body.classList.remove('print-quiz-only'), 500);
            };
            const retry = res.querySelector('.quiz-retry');
            if (retry) retry.onclick = () => mount(el, moduleId, opts);
            res.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };
    }

    window.LabReadyQuiz = { mount };
})();
