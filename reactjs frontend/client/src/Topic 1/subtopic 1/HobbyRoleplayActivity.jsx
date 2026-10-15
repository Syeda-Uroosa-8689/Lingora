import React, {
    useEffect,
    useRef,
    useState
} from "react";

import teacher from "../../assets/teacher1.png";
import bg from "../../assets/chatbg.jpeg";
import yaySound from "../../assets/yay.mp3";

import confetti from "canvas-confetti";

import "./HobbyRoleplayActivity.css";


function HobbyRoleplayActivity({
    onBack,
    onNext
}) {

    /* =====================================================
                    ROUND / SCENE DATA
    ===================================================== */

    const scenes = [

        {
            round: 1,

            title: "Round 1 • Meeting a Friend",

            badge: "🤝 Meeting a Friend",

            question:
                "Hi! What is your favourite hobby?",

            expectedExample:
                "My favourite hobby is drawing.",

            teacherStart:
                "Hi! Let's imagine we are meeting for the first time. What is your favourite hobby?"
        },

        {
            round: 2,

            title: "Round 2 • Asking About Hobbies",

            badge: "💬 Asking About Hobbies",

            question:
                "What do you like doing in your free time?",

            expectedExample:
                "I like playing football in my free time.",

            teacherStart:
                "Great! Now let's talk a little more about your hobbies. What do you like doing in your free time?"
        },

        {
            round: 3,

            title: "Round 3 • Natural Conversation",

            badge: "🎭 Natural Conversation",

            question:
                "Why do you like your favourite hobby?",

            expectedExample:
                "I like it because it is fun.",

            teacherStart:
                "Now let's have a natural conversation. Tell me, why do you like your favourite hobby?"
        }

    ];


    /* =====================================================
                            STATE
    ===================================================== */

    const [round, setRound] =
        useState(1);

    const [userAnswer, setUserAnswer] =
        useState("");

    const [teacherMessage, setTeacherMessage] =
        useState("");

    const [isSpeaking, setIsSpeaking] =
        useState(false);

    const [isListening, setIsListening] =
        useState(false);

    const [processing, setProcessing] =
        useState(false);

    const [answerStatus, setAnswerStatus] =
        useState("");

    const [showExample, setShowExample] =
        useState(false);

    const [conversationHistory, setConversationHistory] =
        useState([]);

    const [userName] =
        useState("Student");


    /* =====================================================
                            REFS
    ===================================================== */

    const recognitionRef =
        useRef(null);

    const timeoutRefs =
        useRef([]);

    const mountedRef =
        useRef(true);


    /* =====================================================
                    CURRENT SCENE
    ===================================================== */

    const currentScene =
        scenes.find(
            (scene) =>
                scene.round === round
        );


    /* =====================================================
                    CLEAR TIMERS
    ===================================================== */

    const clearAllTimers = () => {

        timeoutRefs.current.forEach(
            (timer) => {
                clearTimeout(timer);
            }
        );

        timeoutRefs.current = [];

    };


    /* =====================================================
                    STOP EVERYTHING
    ===================================================== */

    const stopEverything = () => {

        clearAllTimers();


        if (window.speechSynthesis) {

            window.speechSynthesis.cancel();

        }


        if (recognitionRef.current) {

            try {

                recognitionRef.current.abort();

            } catch (error) {

                console.log(
                    "Recognition stop error:",
                    error
                );

            }

            recognitionRef.current = null;

        }


        if (mountedRef.current) {

            setIsListening(false);

            setIsSpeaking(false);

            setProcessing(false);

        }

    };


    /* =====================================================
                    CLEAN SPEECH TEXT
    ===================================================== */

    const cleanSpeechText = (text) => {

        if (!text) {

            return "";

        }


        return String(text)

            .replace(
                /[\u{1F300}-\u{1FAFF}]/gu,
                ""
            )

            .replace(
                /[\u{2600}-\u{27BF}]/gu,
                ""
            )

            .replace(
                /\s+/g,
                " "
            )

            .trim();

    };


    /* =====================================================
                    TEACHER SPEAK
    ===================================================== */

    const speak = (text) => {

        return new Promise(
            (resolve) => {

                if (
                    !text ||
                    !window.speechSynthesis
                ) {

                    if (mountedRef.current) {

                        setIsSpeaking(false);

                    }

                    resolve();

                    return;

                }


                window.speechSynthesis.cancel();


                const cleanText =
                    cleanSpeechText(text);


                if (!cleanText) {

                    if (mountedRef.current) {

                        setIsSpeaking(false);

                    }

                    resolve();

                    return;

                }


                if (mountedRef.current) {

                    setTeacherMessage(text);

                    setIsSpeaking(true);

                }


                const speech =
                    new SpeechSynthesisUtterance(
                        cleanText
                    );


                speech.lang =
                    "en-US";

                speech.rate =
                    0.88;

                speech.pitch =
                    1.05;

                speech.volume =
                    1;


                const voices =
                    window.speechSynthesis
                        .getVoices();


                const femaleVoice =

                    voices.find(
                        (voice) =>
                            /Google UK English Female/i
                                .test(
                                    voice.name
                                )
                    )

                    ||

                    voices.find(
                        (voice) =>
                            /Google US English/i
                                .test(
                                    voice.name
                                )
                    )

                    ||

                    voices.find(
                        (voice) =>
                            /Samantha/i
                                .test(
                                    voice.name
                                )
                    )

                    ||

                    voices.find(
                        (voice) =>
                            /Zira/i
                                .test(
                                    voice.name
                                )
                    )

                    ||

                    voices.find(
                        (voice) =>
                            /Jenny/i
                                .test(
                                    voice.name
                                )
                    )

                    ||

                    voices.find(
                        (voice) =>
                            /Aria/i
                                .test(
                                    voice.name
                                )
                    );


                if (femaleVoice) {

                    speech.voice =
                        femaleVoice;

                }


                speech.onend = () => {

                    if (mountedRef.current) {

                        setIsSpeaking(false);

                    }

                    resolve();

                };


                speech.onerror = () => {

                    if (mountedRef.current) {

                        setIsSpeaking(false);

                    }

                    resolve();

                };


                window.speechSynthesis.speak(
                    speech
                );

            }
        );

    };


    /* =====================================================
                    PLAY YAY SOUND
    ===================================================== */

    const playYaySound = () => {

        return new Promise(
            (resolve) => {

                const audio =
                    new Audio(yaySound);

                audio.volume = 1;


                let finished = false;


                const finish = () => {

                    if (finished) {

                        return;

                    }

                    finished = true;

                    resolve();

                };


                audio.addEventListener(
                    "ended",
                    finish,
                    { once: true }
                );


                audio.addEventListener(
                    "error",
                    finish,
                    { once: true }
                );


                audio.play().catch(() => {

                    finish();

                });

            }
        );

    };


    /* =====================================================
                    CONFETTI
    ===================================================== */

    const celebrate = () => {

        confetti({

            particleCount: 120,

            spread: 85,

            startVelocity: 35,

            origin: {
                x: 0.5,
                y: 0.65
            }

        });


        const timer1 =
            setTimeout(() => {

                confetti({

                    particleCount: 60,

                    spread: 100,

                    origin: {
                        x: 0.15,
                        y: 0.65
                    }

                });

            }, 150);


        const timer2 =
            setTimeout(() => {

                confetti({

                    particleCount: 60,

                    spread: 100,

                    origin: {
                        x: 0.85,
                        y: 0.65
                    }

                });

            }, 300);


        timeoutRefs.current.push(
            timer1,
            timer2
        );

    };


    /* =====================================================
                INITIAL TEACHER PROMPT
    ===================================================== */

    useEffect(() => {

        mountedRef.current = true;


        const timer =
            setTimeout(
                async () => {

                    if (!mountedRef.current) {

                        return;

                    }


                    await speak(
                        currentScene.teacherStart
                    );

                },
                600
            );


        timeoutRefs.current.push(
            timer
        );


        return () => {

            mountedRef.current = false;

            stopEverything();

        };

        // First scene only
        // eslint-disable-next-line react-hooks/exhaustive-deps

    }, []);


    /* =====================================================
                    START LISTENING
    ===================================================== */

    const startListening = () => {

        if (
            processing ||
            isListening ||
            isSpeaking ||
            !currentScene
        ) {

            return;

        }


        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;


        if (!SpeechRecognition) {

            speak(
                "Sorry, speech recognition is not supported in this browser. Please use Google Chrome."
            );

            return;

        }


        window.speechSynthesis?.cancel();


        setTeacherMessage("");

        setUserAnswer("");

        setAnswerStatus("");

        setShowExample(false);

        setIsListening(true);

        setProcessing(false);


        const recognition =
            new SpeechRecognition();


        recognition.lang =
            "en-US";

        recognition.continuous =
            false;

        recognition.interimResults =
            false;

        recognition.maxAlternatives =
            1;


        recognitionRef.current =
            recognition;


        recognition.onstart = () => {

            if (mountedRef.current) {

                setIsListening(true);

            }

        };


        recognition.onresult =
            async (event) => {

                const transcript =
                    event
                        ?.results?.[0]?.[0]
                        ?.transcript
                        ?.trim() || "";


                if (!mountedRef.current) {

                    return;

                }


                setIsListening(false);


                if (!transcript) {

                    await handleNoSpeech();

                    return;

                }


                setUserAnswer(
                    transcript
                );


                await handleSpokenAnswer(
                    transcript
                );

            };


        recognition.onerror =
            async (event) => {

                console.log(
                    "Speech recognition error:",
                    event?.error
                );


                if (
                    event?.error ===
                    "aborted"
                ) {

                    if (mountedRef.current) {

                        setIsListening(false);

                        setProcessing(false);

                    }

                    return;

                }


                await handleNoSpeech();

            };


        recognition.onend = () => {

            if (mountedRef.current) {

                setIsListening(false);

            }

        };


        try {

            recognition.start();

        } catch (error) {

            console.log(
                "Recognition start error:",
                error
            );

            setIsListening(false);

            setProcessing(false);

        }

    };


    /* =====================================================
                    NO SPEECH
    ===================================================== */

    const handleNoSpeech = async () => {

        if (!mountedRef.current) {

            return;

        }


        setIsListening(false);

        setProcessing(false);

        setUserAnswer("");

        setAnswerStatus(
            "retry"
        );


        await speak(
            "Sorry, I couldn't hear you. Please try again."
        );

    };


    /* =====================================================
                    CHECK ANSWER
    ===================================================== */

    const handleSpokenAnswer = async (
        answer
    ) => {

        if (
            !answer ||
            !answer.trim() ||
            !currentScene
        ) {

            setProcessing(false);

            await speak(
                "Sorry, I couldn't hear you. Please try again."
            );

            return;

        }


        setProcessing(true);

        setAnswerStatus(
            "checking"
        );


        try {

            const response =
                await fetch(
                    `${import.meta.env.VITE_API_URL}/api/hobby-roleplay/check`,
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            message:
                                answer.trim(),

                            question:
                                currentScene.question,

                            round:
                                round,

                            scene:
                                currentScene.title,

                            expectedExample:
                                currentScene.expectedExample,

                            activity:
                                "hobby-roleplay",

                            history:
                                conversationHistory,

                            userName:
                                userName

                        })

                    }
                );


            if (!response.ok) {

                throw new Error(
                    `Server returned ${response.status}`
                );

            }


            const data =
                await response.json();


            const teacherResponse =
                data?.teacherResponse?.trim();


            const isCorrect =
                Boolean(
                    data?.isCorrect
                );


            if (!teacherResponse) {

                throw new Error(
                    "Teacher response missing."
                );

            }


            /* =================================================
                    CORRECT
            ================================================= */

            if (isCorrect) {

                setAnswerStatus(
                    "correct"
                );

                setConversationHistory(
                    (previous) =>
                        [
                            ...previous,
                            {
                                role: "user",
                                content:
                                    answer.trim()
                            },
                            {
                                role: "assistant",
                                content:
                                    teacherResponse
                            }
                        ]
                );


                await speak(
                    teacherResponse
                );


                celebrate();

                await playYaySound();


                setProcessing(false);

                return;

            }


            /* =================================================
                    WRONG / RETRY
            ================================================= */

            setAnswerStatus(
                "retry"
            );

            setConversationHistory(
                (previous) =>
                    [
                        ...previous,
                        {
                            role: "user",
                            content:
                                answer.trim()
                        },
                        {
                            role: "assistant",
                            content:
                                teacherResponse
                        }
                    ]
            );


            await speak(
                teacherResponse
            );


            setProcessing(false);

        }

        catch (error) {

            console.log(
                "Hobby Roleplay error:",
                error
            );


            setProcessing(false);

            setAnswerStatus(
                "error"
            );

            await speak(
                "Sorry, I could not check your answer right now. Please try again."
            );

        }

    };


    /* =====================================================
                    REPEAT QUESTION
    ===================================================== */

    const handleRepeat = async () => {

        if (
            processing ||
            isListening ||
            isSpeaking
        ) {

            return;

        }


        setUserAnswer("");

        setAnswerStatus("");

        setShowExample(false);

        setTeacherMessage("");


        await speak(
            currentScene.question
        );

    };


    /* =====================================================
                    NEXT SCENE
    ===================================================== */

    const handleNextScene = async () => {

        if (
            processing ||
            isListening ||
            isSpeaking ||
            answerStatus !== "correct"
        ) {

            return;

        }


        /* =================================================
                    FINISH ROUND 3
        ================================================= */

        if (round === 3) {

            setProcessing(true);

            setTeacherMessage("");


            await speak(
                "Amazing! You completed all three scenes of the Hobby Roleplay. You did a fantastic job speaking English!"
            );


            await new Promise(
                (resolve) => {

                    const timer =
                        setTimeout(
                            resolve,
                            700
                        );

                    timeoutRefs.current.push(
                        timer
                    );

                }
            );


            stopEverything();


            if (onNext) {

                onNext();

            }

            return;

        }


        /* =================================================
                    NEXT ROUND
        ================================================= */

        const nextRound =
            round + 1;


        setProcessing(true);

        setTeacherMessage("");

        setUserAnswer("");

        setAnswerStatus("");

        setShowExample(false);

        setConversationHistory([]);


        setRound(
            nextRound
        );


        await new Promise(
            (resolve) => {

                const timer =
                    setTimeout(
                        resolve,
                        500
                    );

                timeoutRefs.current.push(
                    timer
                );

            }
        );


        const nextScene =
            scenes.find(
                (scene) =>
                    scene.round ===
                    nextRound
            );


        if (nextScene) {

            await speak(
                nextScene.teacherStart
            );

        }


        setProcessing(false);

    };


    /* =====================================================
                        SKIP
    ===================================================== */

    const handleSkip = () => {

        stopEverything();


        setTeacherMessage("");

        setUserAnswer("");

        setAnswerStatus("");

        setShowExample(false);

        setConversationHistory([]);


        if (onNext) {

            onNext();

        }

    };


    /* =====================================================
                        BACK
    ===================================================== */

    const handleBack = () => {

        stopEverything();


        setTeacherMessage("");

        setUserAnswer("");

        setAnswerStatus("");

        setShowExample(false);

        setConversationHistory([]);


        if (onBack) {

            onBack();

        }

    };


    /* =====================================================
                    TOGGLE EXAMPLE
    ===================================================== */

    const toggleExample = () => {

        setShowExample(
            (previous) =>
                !previous
        );

    };


    /* =====================================================
                        MAIN UI
    ===================================================== */

    return (

        <div
            className="hobby-roleplay-activity-page"
            style={{
                backgroundImage:
                    `url(${bg})`
            }}
        >

            <div
                className="hobby-roleplay-activity-overlay"
            />


            <div
                className="hobby-roleplay-activity-card"
            >

                {/* =================================================
                                HEADER
                ================================================= */}

                <div
                    className="roleplay-activity-header"
                >

                    {/* LEFT */}

                    <button
                        type="button"
                        className="roleplay-back-btn"
                        onClick={handleBack}
                        disabled={
                            processing ||
                            isListening
                        }
                    >
                        ← Back
                    </button>


                    {/* CENTER */}

                    <div
                        className="roleplay-header-center"
                    >

                        <h1>
                            Hobby Roleplay
                        </h1>

                        <span>
                            {currentScene?.title}
                        </span>

                    </div>


                    {/* RIGHT */}

                    <button
                        type="button"
                        className="roleplay-skip-btn"
                        onClick={handleSkip}
                        disabled={
                            processing ||
                            isListening
                        }
                    >
                        Skip →
                    </button>

                </div>


                {/* =================================================
                            MAIN CONTENT
                ================================================= */}

                <div className="roleplay-main">


                    {/* =================================================
                                TEACHER LEFT
                    ================================================= */}

                    <div
                        className="roleplay-teacher-section"
                    >

                        <div
                            className="roleplay-teacher-stage"
                        >

                            <img
                                src={teacher}
                                alt="Miss Uroosa"
                                className={
                                    isSpeaking
                                        ? "roleplay-teacher speaking"
                                        : "roleplay-teacher"
                                }
                            />

                        </div>


                        {teacherMessage && (

                            <div
                                className="roleplay-teacher-bubble"
                            >

                                <div
                                    className="roleplay-teacher-name"
                                >
                                    Miss Uroosa
                                </div>


                                <div
                                    className="roleplay-teacher-text"
                                >
                                    {teacherMessage}
                                </div>

                            </div>

                        )}

                    </div>


                    {/* =================================================
                            RIGHT SIDE
                    ================================================= */}

                    <div
                        className="roleplay-question-section"
                    >


                        {/* SCENE BADGE */}

                        <div
                            className="roleplay-scene-badge"
                        >
                            {currentScene?.badge}
                        </div>


                        {/* PROGRESS */}

                        <div
                            className="roleplay-progress"
                        >

                            Scene{" "}
                            {round}
                            {" / 3"}

                        </div>


                        {/* QUESTION CARD */}

                        <div
                            className="roleplay-question-card"
                        >


                            <div
                                className="roleplay-question-label"
                            >
                                💬 Miss Uroosa asks
                            </div>


                            <h2>
                                {currentScene?.question}
                            </h2>


                            <p>
                                Listen carefully and answer
                                using a complete English sentence.
                            </p>


                            {/* MIC */}

                            <button
                                type="button"
                                className={
                                    isListening
                                        ? "roleplay-speak-btn listening"
                                        : "roleplay-speak-btn"
                                }
                                onClick={
                                    startListening
                                }
                                disabled={
                                    processing ||
                                    isListening ||
                                    isSpeaking
                                }
                            >

                                {isListening
                                    ? "🎙️ Listening..."
                                    : processing
                                        ? "🤔 Checking..."
                                        : "🎤 Speak Your Answer"
                                }

                            </button>


                            {/* USER ANSWER */}

                            {userAnswer && (

                                <div
                                    className="roleplay-user-answer"
                                >

                                    <strong>
                                        You said:
                                    </strong>

                                    <span>
                                        "{userAnswer}"
                                    </span>

                                </div>

                            )}


                            {/* RETRY */}

                            {answerStatus === "retry" && (

                                <div
                                    className="
                                        roleplay-answer-status
                                        retry-status
                                    "
                                >
                                    💬 Good try! Listen to Miss Uroosa
                                    and try again.
                                </div>

                            )}


                            {/* CORRECT */}

                            {answerStatus === "correct" && (

                                <div
                                    className="
                                        roleplay-answer-status
                                        correct-status
                                    "
                                >
                                    🎉 Excellent! Great speaking!
                                </div>

                            )}


                            {/* ERROR */}

                            {answerStatus === "error" && (

                                <div
                                    className="
                                        roleplay-answer-status
                                        error-status
                                    "
                                >
                                    ⚠️ Something went wrong.
                                    Please try again.
                                </div>

                            )}


                            {/* ACTION BUTTONS */}

                            <div
                                className="
                                    roleplay-action-buttons
                                "
                            >

                                {(answerStatus === "retry" ||
                                    answerStatus === "error") && (

                                    <button
                                        type="button"
                                        className="roleplay-repeat-btn"
                                        onClick={
                                            handleRepeat
                                        }
                                        disabled={
                                            processing ||
                                            isSpeaking
                                        }
                                    >
                                        🔁 Repeat Question
                                    </button>

                                )}


                                {answerStatus === "correct" && (

                                    <button
                                        type="button"
                                        className="roleplay-next-btn"
                                        onClick={
                                            handleNextScene
                                        }
                                        disabled={
                                            processing ||
                                            isSpeaking
                                        }
                                    >

                                        {round === 3
                                            ? "Finish Roleplay ✓"
                                            : "Next Scene →"
                                        }

                                    </button>

                                )}

                            </div>


                            {/* EXAMPLE BUTTON */}

                            <button
                                type="button"
                                className="roleplay-example-btn"
                                onClick={
                                    toggleExample
                                }
                                disabled={
                                    processing ||
                                    isListening ||
                                    isSpeaking
                                }
                            >

                                💡{" "}

                                {showExample
                                    ? "Hide Example"
                                    : "Show Example"
                                }

                            </button>


                            {/* EXAMPLE */}

                            {showExample && (

                                <div
                                    className="roleplay-example"
                                >

                                    <strong>
                                        Example:
                                    </strong>

                                    <span>
                                        {
                                            currentScene?.expectedExample
                                        }
                                    </span>

                                </div>

                            )}

                        </div>


                        {/* TIP */}

                        <div
                            className="roleplay-tip"
                        >

                            💡 Speak naturally. Miss Uroosa will
                            listen to your answer and help you
                            improve your English.

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}


export default HobbyRoleplayActivity;