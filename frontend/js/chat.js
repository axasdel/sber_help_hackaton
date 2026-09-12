// ======================================================
// SberHelp
// FRONTEND
// ======================================================


const screen =
    document.getElementById("screen");


// ======================================================
// СОСТОЯНИЕ
// ======================================================


const state = {

    initialMessage: "",

    currentQuestion: 0,

    questions: [],

    answers: [
        "",
        "",
        ""
    ],

    summary: "",

    solution: [],

    status: ""

};


// ======================================================
// API
// ======================================================


async function apiRequest(
    url,
    data
) {

    const response = await fetch(
        url,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify(
                data
            )
        }
    );


    let result;

    try {

        result =
            await response.json();

    } catch {

        throw new Error(
            "Сервер вернул некорректный ответ"
        );
    }


    if (!response.ok) {

        throw new Error(
            result.error ||
            "Ошибка сервера"
        );
    }


    return result;
}


// ======================================================
// ЗАЩИТА ТЕКСТА
// ======================================================


function escapeHtml(text) {

    return String(text)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


function formatMultiline(text) {

    return escapeHtml(text)
        .replaceAll(
            "\n",
            "<br>"
        );
}


// ======================================================
// СООБЩЕНИЕ ОБ ОШИБКЕ
// ======================================================


function showError(message) {

    alert(
        message ||
        "Произошла ошибка"
    );
}


// ======================================================
// ЭКРАН 1
// ======================================================


function renderStart() {

    screen.innerHTML = `

        <section class="page fade-in">

            <div class="page-content">

                <h1 class="page-title">
                    Чем можем помочь?
                </h1>

                <p class="page-description">
                    Опишите проблему — ИИ SberHelp поможет
                    сформировать и решить запрос.
                </p>


                <div class="input-card">

                    <textarea
                        id="problemInput"
                        class="large-textarea"
                        placeholder="Опишите вашу проблему..."
                    >Не могу войти в рабочий аккаунт. Ввожу пароль, но система не пускает. Что делать?</textarea>

                    <div class="input-plus">
                        +
                    </div>

                </div>


                <button
                    id="startButton"
                    class="main-button"
                >
                    Найти решение
                    <span>→</span>
                </button>


                <div class="bottom-note">
                    Безопасно. Быстро. Надёжно.
                </div>

            </div>

        </section>

    `;


    const input =
        document.getElementById(
            "problemInput"
        );


    const button =
        document.getElementById(
            "startButton"
        );


    button.addEventListener(
        "click",
        async () => {

            const value =
                input.value.trim();


            if (!value) {

                input.classList.add(
                    "input-error"
                );

                input.focus();

                return;
            }


            state.initialMessage =
                value;


            renderAnalysis();


            try {

                const data =
                    await apiRequest(
                        "/api/analyze",
                        {
                            message:
                                state.initialMessage
                        }
                    );


                state.questions =
                    data.questions || [];


                if (
                    state.questions.length === 0
                ) {

                    throw new Error(
                        "Сервер не вернул вопросы"
                    );
                }


                // Небольшая задержка нужна только
                // для красивой анимации анализа.

                setTimeout(
                    () => {

                        state.currentQuestion =
                            0;

                        renderQuestion();

                    },
                    600
                );


            } catch (error) {

                console.error(
                    error
                );


                showError(
                    "Не удалось выполнить анализ: " +
                    error.message
                );


                renderStart();
            }
        }
    );


    input.addEventListener(
        "input",
        () => {

            input.classList.remove(
                "input-error"
            );
        }
    );
}


// ======================================================
// ЭКРАН 2 — АНАЛИЗ
// ======================================================


function renderAnalysis() {

    screen.innerHTML = `

        <section class="page fade-in">

            <div class="page-content">

                <h1 class="page-title">
                    Анализируем запрос
                </h1>

                <p class="page-description">
                    Это займёт несколько секунд.
                </p>


                <div class="ai-orb-wrapper">

                    <div class="ai-orb">

                        <div
                            class="ai-orb-core"
                        ></div>

                    </div>

                </div>


                <div class="analysis-card">

                    <div class="analysis-row">

                        <span class="check">
                            ✓
                        </span>

                        <span>
                            Определяем тему обращения
                        </span>

                    </div>


                    <div class="analysis-row muted-analysis">

                        <span class="analysis-circle"></span>

                            <span>
                                Готовим уточняющие вопросы
                            </span>

                    </div>

                </div>

            </div>

        </section>

    `;
}


// ======================================================
// ЭКРАНЫ 3–5 — ВОПРОСЫ
// ======================================================


function renderQuestion() {

    const index = state.currentQuestion;
    const question = state.questions;

    if (!question) {
        showError("Не удалось получить уточняющий вопрос.");
        renderStart();
        return;
    }

    screen.innerHTML = `
        <section class="page fade-in">

            <div class="page-content question-page">

                <h1 class="page-title">
                    Нужно немного<br>
                    уточнить
                </h1>

                <div class="question-card">
                    <div class="question-text">
                        ${escapeHtml(question.title || question)}
                    </div>
                </div>

                <textarea
                    id="questionAnswer"
                    class="question-textarea"
                    placeholder="${escapeHtml(
                        question.placeholder || "Введите ваш ответ..."
                    )}"
                >${escapeHtml(state.answers[index] || "")}</textarea>

                <button
                    id="continueButton"
                    class="main-button question-button"
                >
                    Продолжить
                </button>

            </div>

        </section>
    `;

    const answerInput =
        document.getElementById("questionAnswer");

    const continueButton =
        document.getElementById("continueButton");

    continueButton.addEventListener("click", () => {

        const answer = answerInput.value.trim();

        if (!answer) {
            answerInput.classList.add("input-error");
            answerInput.focus();
            return;
        }

        state.answers[index] = answer;

        if (
            state.currentQuestion < state.questions.length - 1
        ) {
            state.currentQuestion++;
            renderQuestion();
        } else {
            loadConfirmation();
        }
    });

    answerInput.addEventListener("input", () => {
        answerInput.classList.remove("input-error");
    });
}
// ======================================================
// ПОДГОТОВКА SUMMARY
// ======================================================


function renderPreparingSummary() {

    screen.innerHTML = `

        <section class="page fade-in">

            <div class="page-content">

                <h1 class="page-title">
                    Формируем запрос
                </h1>

                <p class="page-description">
                    Объединяем описание проблемы
                    и ваши ответы.
                </p>


                <div class="ai-orb-wrapper">

                    <div class="ai-orb">

                        <div
                            class="ai-orb-core"
                        ></div>

                    </div>

                </div>

            </div>

        </section>

    `;
}


// ======================================================
// ЭКРАН 6 — ПОДТВЕРЖДЕНИЕ
// ======================================================


function renderConfirmation() {

    screen.innerHTML = `

        <section class="page fade-in">

            <div class="page-content">

                <h1 class="page-title">
                    Мы сформулировали
                    вашу проблему
                </h1>


                <p class="page-description">
                    Проверьте, всё ли верно.
                    При необходимости можно передать
                    запрос в поддержку.
                </p>


                <div
                    class="problem-summary-card"
                >

                    <div class="summary-label">
                        Сформулированная проблема
                    </div>


                    <div class="summary-text">
                        ${formatMultiline(
                            state.summary
                        )}
                    </div>


                    <button
                        id="editButton"
                        class="text-button"
                    >
                        Изменить
                    </button>

                </div>


                <div class="confirm-buttons">

                    <button
                        id="supportButton"
                        class="outline-button"
                    >
                        Нет, в поддержку
                    </button>


                    <button
                        id="confirmButton"
                        class="green-button"
                    >
                        Да, всё верно
                        <span>→</span>
                    </button>

                </div>

            </div>

        </section>

    `;


    document
        .getElementById(
            "editButton"
        )
        .addEventListener(
            "click",
            () => {

                state.currentQuestion =
                    0;

                renderQuestion();
            }
        );


    document
        .getElementById(
            "supportButton"
        )
        .addEventListener(
            "click",
            renderSupport
        );


    document
        .getElementById(
            "confirmButton"
        )
        .addEventListener(
            "click",
            getSolution
        );
}


// ======================================================
// ПОЛУЧЕНИЕ РЕШЕНИЯ
// ======================================================


async function getSolution() {

    renderSolutionLoading();


    try {

        const data =
            await apiRequest(
                "/api/solution",
                {
                    message:
                        state.initialMessage,

                    answers:
                        state.answers
                }
            );


        state.solution =
            data.solution || [];


        state.status =
            data.status || "";


        if (
            state.status ===
            "ESCALATED"
        ) {

            renderSupport();

            return;
        }


        renderAIAnswer();


    } catch (error) {

        console.error(
            error
        );


        showError(
            "Не удалось получить решение: " +
            error.message
        );


        renderConfirmation();
    }
}


// ======================================================
// ЗАГРУЗКА РЕШЕНИЯ
// ======================================================


function renderSolutionLoading() {

    screen.innerHTML = `

        <section class="page fade-in">

            <div class="page-content">

                <h1 class="page-title">
                    Подбираем решение
                </h1>


                <p class="page-description">
                    Анализируем собранную информацию.
                </p>


                <div class="ai-orb-wrapper">

                    <div class="ai-orb">

                        <div
                            class="ai-orb-core"
                        ></div>

                    </div>

                </div>

            </div>

        </section>

    `;
}


// ======================================================
// ЭКРАН РЕШЕНИЯ
// ======================================================


function renderAIAnswer() {

    const items =
        state.solution
            .map(
                (solution, index) => `

                    <div
                        class="solution-item"
                    >

                        <div
                            class="solution-number"
                        >
                            ${index + 1}
                        </div>

                        <div
                            class="solution-text"
                        >
                            ${escapeHtml(solution)}
                        </div>

                    </div>

                `
            )
            .join("");


    screen.innerHTML = `

        <section class="page fade-in">

            <div class="page-content">

                <h1 class="page-title">
                    Решение проблемы
                </h1>


                <p class="page-description">
                    Попробуйте следующие шаги.
                    Если проблема не исчезнет —
                    сформированный запрос уже готов
                    для передачи специалисту.
                </p>


                <div class="solution-list">

                    ${items}

                </div>


                <div class="help-question">
                    Помогло решение?
                </div>


                <div class="answer-buttons">

                    <button
                        id="successButton"
                        class="green-button"
                    >
                        Да, всё получилось
                    </button>


                    <button
                        id="noHelpButton"
                        class="outline-button"
                    >
                        Нет, нужна поддержка
                    </button>

                </div>

            </div>

        </section>

    `;


    document
        .getElementById(
            "successButton"
        )
        .addEventListener(
            "click",
            renderSuccess
        );


    document
        .getElementById(
            "noHelpButton"
        )
        .addEventListener(
            "click",
            renderSupport
        );
}


// ======================================================
// УСПЕШНО
// ======================================================


function renderSuccess() {

    screen.innerHTML = `

        <section class="page fade-in">

            <div
                class="page-content success-page"
            >

                <h1 class="page-title">
                    Рады, что помогли!
                </h1>


                <p class="page-description">
                    Если появятся новые вопросы —
                    SberHelp всегда рядом.
                </p>


                <div
                    class="success-icon-wrapper"
                >

                    <div class="success-icon">
                        ✓
                    </div>

                </div>


                <button
                    id="newQuestionButton"
                    class="main-button"
                >
                    Задать другой вопрос
                </button>


                <button
                    id="homeButton"
                    class="text-button home-link"
                >
                    Вернуться на главную
                </button>

            </div>

        </section>

    `;


    document
        .getElementById(
            "newQuestionButton"
        )
        .addEventListener(
            "click",
            resetApplication
        );


    document
        .getElementById(
            "homeButton"
        )
        .addEventListener(
            "click",
            resetApplication
        );
}


// ======================================================
// ПОДДЕРЖКА
// ======================================================


function renderSupport() {

    screen.innerHTML = `

        <section class="page fade-in">

            <div class="page-content">

                <h1 class="page-title">
                    Запрос подготовлен
                    для поддержки
                </h1>


                <p class="page-description">
                    В демонстрационной версии
                    запрос сформирован и готов
                    для передачи специалисту.
                </p>


                <div class="support-plane">
                    ➤
                </div>


                <div class="support-card">

                    <div class="support-title">
                        Что подготовлено:
                    </div>


                    <div class="support-row">
                        ✓
                        Сформулированная проблема
                    </div>


                    <div class="support-row">
                        ✓
                        Ваши ответы на вопросы
                    </div>


                    <div class="support-row">
                        ✓ Скриншоты и вложения (если были)
                    </div>


                    <div class="support-row">
                        ✓
                        Результат первичного анализа
                    </div>

                </div>


                <button
                    id="returnHomeButton"
                    class="main-button"
                >
                    Вернуться на главную
                </button>

            </div>

        </section>

    `;


    document
        .getElementById(
            "returnHomeButton"
        )
        .addEventListener(
            "click",
            resetApplication
        );
}


// ======================================================
// RESET
// ======================================================


function resetApplication() {

    state.initialMessage =
        "";


    state.currentQuestion =
        0;


    state.questions =
        [];


    state.answers = [
        "",
        "",
        ""
    ];


    state.summary =
        "";


    state.solution =
        [];


    state.status =
        "";


    renderStart();
}


// ======================================================
// СТАРТ
// ======================================================


renderStart();