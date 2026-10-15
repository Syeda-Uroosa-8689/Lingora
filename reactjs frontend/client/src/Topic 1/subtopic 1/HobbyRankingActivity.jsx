import React, {
    useEffect,
    useRef,
    useState
} from "react";

import teacher from "../../assets/teacher1.png";
import bg from "../../assets/chatbg.jpeg";
import yaySound from "../../assets/yay.mp3";

import confetti from "canvas-confetti";

import "./HobbyRankingActivity.css";


function HobbyRankingActivity({
    onBack,
    onNext
}) {

    /* =====================================================
                    HOBBY LIST
    ===================================================== */

    const [hobbies, setHobbies] = useState([
        "Drawing",
        "Playing Football",
        "Listening to Music",
        "Reading Books",
        "Playing Games"
    ]);


    /* =====================================================
                    RANKING STATE
    ===================================================== */

    const [draggedIndex, setDraggedIndex] =
        useState(null);

    const [rankingDone, setRankingDone] =
        useState(false);


    /* =====================================================
                    ROUND 2 STATE
    ===================================================== */

    const [questionIndex, setQuestionIndex] =
        useState(0);

    const [topHobby, setTopHobby] =
        useState("");


    /* =====================================================
                    SPEECH STATE
    ===================================================== */

    const [teacherMessage, setTeacherMessage] =
        useState("");

    const [isSpeaking, setIsSpeaking] =
        useState(false);

    const [isListening, setIsListening] =
        useState(false);

    const [processing, setProcessing] =
        useState(false);


    /* =====================================================
                    FEEDBACK STATE
    ===================================================== */

    const [answerStatus, setAnswerStatus] =
        useState("");

    const [userAnswer, setUserAnswer] =
        useState("");


    /* =====================================================
                    REFS
    ===================================================== */

    const recognitionRef =
        useRef(null);

    const mountedRef =
        useRef(true);

    const speechReceivedRef =
        useRef(false);

     const handledResultRef =
         useRef(false);

    const dragStateRef =
        useRef({
            dragging: false,
            startIndex: null,
            currentIndex: null,
            offsetY: 0,
        });

    const listRef =
        useRef(null);


    /* =====================================================
                    CURRENT QUESTION LIST
    ===================================================== */

    const getQuestions = (hobby) => {

        return [

            {
                question:
                    `What do you like about ${hobby}?`
            },

            {
                question:
                    `When do you usually enjoy ${hobby}?`
            },

            {
                question:
                    `How does ${hobby} make you feel?`
            }

        ];

    };


    /* =====================================================
                    CURRENT QUESTIONS
    ===================================================== */

    const questions =
        topHobby
            ? getQuestions(topHobby)
            : [];


    const currentQuestion =
        questions[questionIndex];


    /* =====================================================
                    CLEANUP
    ===================================================== */

    useEffect(() => {

        mountedRef.current = true;

        return () => {

            mountedRef.current = false;

            window.speechSynthesis?.cancel();


            if (recognitionRef.current) {

                try {

                    recognitionRef.current.stop();

                } catch (error) {

                    console.log(
                        "Recognition cleanup error:",
                        error
                    );

                }

            }

         };

     }, []);


    /* =====================================================
                    REMOVE EMOJIS FROM VOICE
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

        return new Promise((resolve) => {

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


            window.speechSynthesis
                .speak(speech);

        });

    };


    /* =====================================================
                    ROUND 1 TEACHER INTRO
    ===================================================== */

    useEffect(() => {

        if (rankingDone) {

            return;

        }


        const timer =
            setTimeout(() => {

                speak(
                    "Hi! I'm Miss Uroosa. Let's rank your favourite hobbies! Look at the hobbies on the right and drag them into the order you like them most. Put your favourite hobby at number one. When you are finished, click Done Ranking."
                );

            }, 600);


        return () => {

            clearTimeout(timer);

        };

    }, [rankingDone]);


    /* =====================================================
                    PLAY YAY SOUND
    ===================================================== */

    const playYaySound = () => {

        return new Promise((resolve) => {

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

        });

    };


    /* =====================================================
                    CONFETTI
    ===================================================== */

    const celebrate = () => {

        confetti({

            particleCount: 130,

            spread: 85,

            startVelocity: 35,

            origin: {
                x: 0.5,
                y: 0.65
            }

        });


        setTimeout(() => {

            confetti({

                particleCount: 70,

                spread: 100,

                origin: {
                    x: 0.15,
                    y: 0.65
                }

            });

        }, 150);


        setTimeout(() => {

            confetti({

                particleCount: 70,

                spread: 100,

                origin: {
                    x: 0.85,
                    y: 0.65
                }

            });

        }, 300);

    };


    /* =====================================================
                    DRAG START (Pointer Events)
    ===================================================== */

    const handlePointerDown = (event, index) => {
        if (
            rankingDone ||
            event.button !== 0 &&
            event.pointerType !== "touch"
        ) {
            return;
        }

        if (event.pointerType !== "mouse") {
            event.preventDefault();
        }

        const rect =
            event.currentTarget
                .getBoundingClientRect();

        const startY =
            event.clientY ||
            (event.touches &&
                event.touches[0] &&
                event.touches[0].clientY) ||
            0;

        dragStateRef.current = {
            dragging: true,
            startIndex: index,
            currentIndex: index,
            offsetY:
                startY -
                rect.top,
        };

         setDraggedIndex(index);

        if (listRef.current) {
            listRef.current.style.cursor =
                "grabbing";
        }

        document.addEventListener(
            "pointermove",
            handlePointerMove,
            { passive: false }
        );

        document.addEventListener(
            "pointerup",
            handlePointerUp
        );
    };


    /* =====================================================
                    DRAG MOVE (Pointer Events)
    ===================================================== */

    const handlePointerMove = (event) => {
        if (
            !dragStateRef.current.dragging ||
            rankingDone
        ) {
            return;
        }

        event.preventDefault();

        const mouseY =
            event.clientY ||
            (event.touches &&
                event.touches[0] &&
                event.touches[0].clientY) ||
            0;

        const listEl =
            listRef.current;

        if (!listEl) {
            return;
        }

        const items =
            listEl.querySelectorAll(
                ".ranking-item"
            );

        if (!items.length) {
            return;
        }

        let hoverIndex =
            dragStateRef.current
                .startIndex;

        for (
            let i = 0;
            i < items.length;
            i++
        ) {
            const item =
                items[i];

            const rect =
                item.getBoundingClientRect();

            const itemCenter =
                rect.top +
                rect.height / 2;

            if (mouseY < itemCenter) {
                hoverIndex = i;

                break;
            }

            hoverIndex =
                items.length - 1;
        }

        if (
            hoverIndex !==
            dragStateRef.current
                .currentIndex
        ) {

            dragStateRef.current.currentIndex =
                hoverIndex;

            const updated =
                [...hobbies];

            const draggedItem =
                updated[
                    dragStateRef.current
                        .startIndex
                ];

            updated.splice(
                dragStateRef.current
                    .startIndex,
                1
            );

            updated.splice(
                hoverIndex,
                0,
                draggedItem
            );

            setHobbies(updated);

            setDraggedIndex(
                hoverIndex
            );

        }
    };


    /* =====================================================
                    POINTER UP (Drop)
    ===================================================== */

    const handlePointerUp = () => {
        if (
            !dragStateRef.current.dragging
        ) {
            return;
        }

        const startIndex =
            dragStateRef.current.startIndex;

        const currentIndex =
            dragStateRef.current
                .currentIndex;

        const updated =
            [...hobbies];

        const draggedItem =
            updated[startIndex];

        updated.splice(
            startIndex,
            1
        );

        updated.splice(
            currentIndex,
            0,
            draggedItem
        );

        setHobbies(updated);

        dragStateRef.current = {
            dragging: false,
            startIndex: null,
            currentIndex: null,
            offsetY: 0,
        };

         setDraggedIndex(null);

        if (listRef.current) {
            listRef.current.style.cursor =
                "";
        }

        document.removeEventListener(
            "pointermove",
            handlePointerMove
        );

        document.removeEventListener(
            "pointerup",
            handlePointerUp
        );
    };


    /* =====================================================
                    DRAG START (HTML5 fallback)
    ===================================================== */

    const handleDragStart = (index) => {

        if (rankingDone) {

            return;

        }


        setDraggedIndex(index);

    };


    /* =====================================================
                    DRAG OVER (HTML5 fallback)
    ===================================================== */

    const handleDragOver = (event) => {

        if (rankingDone) {

            return;

        }


        event.preventDefault();

    };


    /* =====================================================
                    DROP (HTML5 fallback)
    ===================================================== */

    const handleDrop = (dropIndex) => {

        if (
            rankingDone ||
            draggedIndex === null
        ) {

            return;

        }


        const updated =
            [...hobbies];


        const draggedItem =
            updated[draggedIndex];


        updated.splice(
            draggedIndex,
            1
        );


        updated.splice(
            dropIndex,
            0,
            draggedItem
        );


        setHobbies(updated);

        setDraggedIndex(null);

    };


    /* =====================================================
                    DONE RANKING
    ===================================================== */

    const handleDoneRanking = async () => {

        if (rankingDone) {

            return;

        }


        const firstHobby =
            hobbies[0];


        if (!firstHobby) {

            return;

        }


        setTopHobby(
            firstHobby
        );

        setRankingDone(
            true
        );

        setQuestionIndex(
            0
        );

        setAnswerStatus(
            ""
        );

        setUserAnswer(
            ""
        );

        setTeacherMessage(
            ""
        );


        await new Promise(
            (resolve) =>
                setTimeout(
                    resolve,
                    400
                )
        );


        await speak(
            `Great job! ${firstHobby} is your favourite hobby. Now let's talk about it!`
        );


        await new Promise(
            (resolve) =>
                setTimeout(
                    resolve,
                    500
                )
        );


        const firstQuestion =
            getQuestions(
                firstHobby
            )[0];


        if (firstQuestion) {

            await speak(
                firstQuestion.question
            );

        }

    };


    /* =====================================================
                    ROUND 2 CLEANUP
    ===================================================== */

    useEffect(() => {

        if (
            !rankingDone ||
            !topHobby
        ) {

            return;

        }


        return () => {

            if (
                recognitionRef.current
            ) {

                try {

                    recognitionRef.current.stop();

                } catch (error) {

                    console.log(
                        "Recognition cleanup error:",
                        error
                    );

                }

            }

        };

    }, [
        rankingDone,
        topHobby
    ]);


    /* =====================================================
                    NO SPEECH RESPONSE
    ===================================================== */

    const handleNoSpeech = async () => {

        if (!mountedRef.current) {

            return;

        }


        setIsListening(false);

        setProcessing(false);

        setUserAnswer("");

        setAnswerStatus(
            "wrong"
        );

        setTeacherMessage(
            "Sorry, I couldn't hear you. Can you say it again?"
        );


        await speak(
            "Sorry, I couldn't hear you. Can you say it again?"
        );

    };


    /* =====================================================
                    SPEECH RECOGNITION
    ===================================================== */

    const startListening = () => {

        if (
            processing ||
            isListening ||
            !currentQuestion
        ) {

            return;

        }


        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;


        if (!SpeechRecognition) {

            speak(
                "Sorry, speech recognition is not supported in this browser. Please try using Google Chrome."
            );

            return;

        }


        window.speechSynthesis?.cancel();


        setTeacherMessage("");

        setUserAnswer("");

        setAnswerStatus("");

        setProcessing(false);

        setIsListening(true);


        speechReceivedRef.current =
            false;

        handledResultRef.current =
            false;


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


        /* =================================================
                    MIC STARTED
        ================================================= */

        recognition.onstart = () => {

            if (
                mountedRef.current
            ) {

                setIsListening(
                    true
                );

            }

        };


        /* =================================================
                    RESULT
        ================================================= */

        recognition.onresult =
            async (event) => {

                if (
                    handledResultRef.current
                ) {

                    return;

                }


                const transcript =
                    event
                        ?.results?.[0]?.[0]
                        ?.transcript
                        ?.trim() || "";


                speechReceivedRef.current =
                    true;

                handledResultRef.current =
                    true;


                if (!mountedRef.current) {

                    return;

                }


                setIsListening(
                    false
                );


                /* -----------------------------------------
                        EMPTY RESULT
                ----------------------------------------- */

                if (!transcript) {

                    await handleNoSpeech();

                    return;

                }


                /* -----------------------------------------
                        REAL USER ANSWER
                ----------------------------------------- */

                setUserAnswer(
                    transcript
                );


                await checkAnswer(
                    transcript
                );

            };


        /* =================================================
                    SPEECH ERROR
        ================================================= */

        recognition.onerror =
            async (event) => {

                console.log(
                    "Speech Recognition Error:",
                    event?.error
                );


                if (
                    event?.error ===
                    "no-speech"
                ) {

                    await handleNoSpeech();

                    return;

                }


                if (
                    event?.error ===
                    "audio-capture"
                ) {

                    await handleNoSpeech();

                    return;

                }


                if (
                    event?.error ===
                    "aborted"
                ) {

                    if (
                        mountedRef.current
                    ) {

                        setIsListening(
                            false
                        );

                        setProcessing(
                            false
                        );

                    }

                    return;

                }


                await handleNoSpeech();

            };


        /* =================================================
                    RECOGNITION END
        ================================================= */

        recognition.onend =
            async () => {

                if (
                    !mountedRef.current
                ) {

                    return;

                }


                setIsListening(
                    false
                );


                /*
                    IMPORTANT:
                    If no result AND no error happened,
                    then browser closed the mic without
                    capturing speech.
                */

                if (
                    !speechReceivedRef.current &&
                    !handledResultRef.current
                ) {

                    handledResultRef.current =
                        true;

                    await handleNoSpeech();

                }

            };


        /* =================================================
                    START MIC
        ================================================= */

        try {

            recognition.start();

        }

        catch (error) {

            console.log(
                "Recognition start error:",
                error
            );


            setIsListening(
                false
            );

            setProcessing(
                false
            );

        }

    };


    /* =====================================================
                    CHECK ANSWER WITH BACKEND
    ===================================================== */

    const checkAnswer = async (
        answer
    ) => {

        if (
            processing ||
            !currentQuestion ||
            !answer ||
            !answer.trim()
        ) {

            return;

        }


        setProcessing(
            true
        );

        setAnswerStatus(
            ""
        );


        try {

            const response =
                await fetch(
                    `${import.meta.env.VITE_API_URL}/api/hobby-ranking/correct`,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                question:
                                    currentQuestion.question,

                                answer:
                                    answer.trim(),

                                hobby:
                                    topHobby,

                                questionIndex:
                                    questionIndex,

                                userName:
                                    "Student"

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


            console.log(
                "✅ Hobby Ranking AI Response:",
                data
            );


            if (!data?.success) {

                throw new Error(
                    data?.message ||
                    "AI could not check the answer."
                );

            }


            /* =================================================
                    CORRECT ANSWER
            ================================================= */

            if (
                data.isCorrect === true
            ) {

                /*
                    Screen:
                    Show only Excellent.

                    Voice:
                    ONLY Excellent.

                    AI does NOT generate any next question.
                */

                setTeacherMessage(
                    "Excellent!"
                );

                setAnswerStatus(
                    "correct"
                );


                /* -----------------------------------------
                        VOICE ONLY EXCELLENT
                ----------------------------------------- */

                await speak(
                    "Excellent!"
                );


                /* -----------------------------------------
                        CELEBRATION
                ----------------------------------------- */

                celebrate();

                await playYaySound();


                /* -----------------------------------------
                        NEXT FIXED QUESTION
                ----------------------------------------- */

                if (
                    questionIndex <
                    questions.length - 1
                ) {

                    const nextIndex =
                        questionIndex + 1;


                    setQuestionIndex(
                        nextIndex
                    );

                    setAnswerStatus(
                        ""
                    );

                    setUserAnswer(
                        ""
                    );

                    setProcessing(
                        false
                    );


                    await new Promise(
                        (resolve) =>
                            setTimeout(
                                resolve,
                                500
                            )
                    );


                    /*
                        ONLY the JSON/front-end fixed
                        question is spoken here.
                    */

                    if (
                        questions[nextIndex]
                    ) {

                        await speak(
                            questions[
                                nextIndex
                            ].question
                        );

                    }


                    return;

                }


                /* -----------------------------------------
                        ALL QUESTIONS COMPLETE
                ----------------------------------------- */

                setProcessing(
                    false
                );


                await new Promise(
                    (resolve) =>
                        setTimeout(
                            resolve,
                            700
                        )
                );


                await speak(
                    "Amazing work!"
                );


                if (onNext) {

                    onNext();

                }


                return;

            }


            /* =================================================
                    INCORRECT / CORRECTION
            ================================================= */

            const correctionText =
                String(
                    data.teacherResponse ||
                    data.response ||
                    "Good try! Let's try again."
                )
                    .trim();


            setTeacherMessage(
                correctionText
            );

            setAnswerStatus(
                "wrong"
            );


            /*
                IMPORTANT:
                Do NOT change question.
                Do NOT move forward.
            */

            await speak(
                correctionText
            );


            setProcessing(
                false
            );

        }

        catch (error) {

            console.log(
                "❌ Hobby Ranking AI Error:",
                error
            );


            setProcessing(
                false
            );

            setAnswerStatus(
                "error"
            );


            setTeacherMessage(
                "Sorry, I could not check your answer right now. Please try again."
            );


            await speak(
                "Sorry, I could not check your answer right now. Please try again."
            );

        }

    };


    /* =====================================================
                    BACK
    ===================================================== */

    const handleBack = () => {

        window.speechSynthesis?.cancel();


        if (
            recognitionRef.current
        ) {

            try {

                recognitionRef.current.stop();

            } catch (error) {

                console.log(
                    "Recognition back error:",
                    error
                );

            }

        }


        setIsListening(
            false
        );

        setProcessing(
            false
        );


        if (onBack) {

            onBack();

        }

    };


    /* =====================================================
                    NO DATA
    ===================================================== */

    if (!hobbies.length) {

        return (

            <div
                className="hobby-ranking-activity-page"
                style={{
                    backgroundImage:
                        `url(${bg})`
                }}
            >

                <div
                    className="hobby-ranking-activity-overlay"
                />


                <div
                    className="hobby-ranking-activity-card"
                >

                    <h2>
                        No hobbies available.
                    </h2>


                    <button
                        type="button"
                        onClick={handleBack}
                        className="ranking-back-btn"
                    >
                        ← Back
                    </button>

                </div>

            </div>

        );

    }


    /* =====================================================
                    MAIN UI
    ===================================================== */

    return (

        <div
            className="hobby-ranking-activity-page"
            style={{
                backgroundImage:
                    `url(${bg})`
            }}
        >

            <div
                className="hobby-ranking-activity-overlay"
            />


            <div
                className="hobby-ranking-activity-card"
            >


                {/* =================================================
                                HEADER
                ================================================= */}

                <div className="ranking-activity-header">


                    <button
                        type="button"
                        className="ranking-back-btn"
                        onClick={handleBack}
                        disabled={processing}
                    >
                        ← Back
                    </button>


                    <div className="ranking-header-center">

                        <h1>
                            Hobby Ranking Challenge
                        </h1>


                        <span>

                            {rankingDone
                                ? "Round 2 • Let's Talk!"
                                : "Round 1 • Rank Your Hobbies"
                            }

                        </span>

                    </div>


                    <div
                        className="ranking-header-right"
                    >

                        <button
                            type="button"
                            className="ranking-skip-btn"
                            onClick={() => {

                                if (onNext) {

                                    onNext();

                                }

                            }}
                            disabled={
                                processing
                            }
                        >
                            Skip →
                        </button>

                    </div>

                </div>


                {/* =================================================
                            ROUND 1
                ================================================= */}

                {!rankingDone && (

                    <div className="ranking-round-one">


                        {/* =================================================
                                    ROUND 1 TEACHER
                        ================================================= */}

                        <div
                            className="ranking-round-one-teacher"
                        >

                            <div
                                className="ranking-round-one-teacher-stage"
                            >

                                <img
                                    src={teacher}
                                    alt="Miss Uroosa"
                                    className={
                                        isSpeaking
                                            ? "ranking-round-one-teacher-img speaking"
                                            : "ranking-round-one-teacher-img"
                                    }
                                />

                            </div>


                            {teacherMessage && (

                                <div
                                    className="ranking-round-one-teacher-bubble"
                                >

                                    <div
                                        className="ranking-round-one-teacher-name"
                                    >
                                        Miss Uroosa
                                    </div>


                                    <div
                                        className="ranking-round-one-teacher-text"
                                    >

                                        {teacherMessage}

                                    </div>

                                </div>

                            )}

                        </div>


                        {/* =================================================
                                    RANKING CONTENT
                        ================================================= */}

                        <div className="ranking-title-area">

                            <div className="ranking-icon">
                                🏆
                            </div>


                            <h2>
                                Rank Your Favourite Hobbies
                            </h2>


                            <p>
                                Drag the hobbies into the order
                                you like them.
                            </p>

                        </div>


                        <div className="ranking-list">

                            {hobbies.map(
                                (hobby, index) => (

                                     <div
                                        key={hobby}
                                        draggable
                                        onDragStart={() =>
                                            handleDragStart(
                                                index
                                            )
                                        }
                                        onDragOver={
                                            handleDragOver
                                        }
                                        onDrop={() =>
                                            handleDrop(
                                                index
                                            )
                                        }
                                        onPointerDown={(
                                            event
                                        ) =>
                                            handlePointerDown(
                                                event,
                                                index
                                            )
                                        }
                                        className={
                                            draggedIndex ===
                                            index
                                                ? "ranking-item ranking-item-dragged"
                                                : "ranking-item"
                                        }
                                    >

                                        <div
                                            className="rank-number"
                                        >
                                            {index + 1}
                                        </div>


                                        <div
                                            className="rank-medal"
                                        >

                                            {index === 0
                                                ? "🥇"
                                                : index === 1
                                                    ? "🥈"
                                                    : index === 2
                                                        ? "🥉"
                                                        : "⭐"
                                            }

                                        </div>


                                        <div
                                            className="ranking-hobby"
                                        >
                                            {hobby}
                                        </div>


                                        <div
                                            className="drag-icon"
                                        >
                                            ⋮⋮
                                        </div>

                                    </div>

                                )
                            )}

                        </div>


                        <button
                            type="button"
                            className="done-ranking-btn"
                            onClick={
                                handleDoneRanking
                            }
                            disabled={
                                processing
                            }
                        >
                            Done Ranking ✓
                        </button>

                    </div>

                )}


                {/* =================================================
                            ROUND 2
                ================================================= */}

                {rankingDone && (

                    <div className="ranking-round-two">


                        {/* =================================================
                                    TEACHER
                        ================================================= */}

                        <div
                            className="ranking-teacher-section"
                        >

                            <div
                                className="ranking-teacher-stage"
                            >

                                <img
                                    src={teacher}
                                    alt="Miss Uroosa"
                                    className={
                                        isSpeaking
                                            ? "ranking-teacher speaking"
                                            : "ranking-teacher"
                                    }
                                />

                            </div>


                            {teacherMessage && (

                                <div
                                    className="ranking-teacher-bubble"
                                >

                                    <div
                                        className="ranking-teacher-name"
                                    >
                                        Miss Uroosa
                                    </div>


                                    <div
                                        className="ranking-teacher-text"
                                    >
                                        {teacherMessage}
                                    </div>

                                </div>

                            )}

                        </div>


                        {/* =================================================
                                    QUESTION AREA
                        ================================================= */}

                        <div
                            className="ranking-question-section"
                        >


                            <div
                                className="favourite-hobby-badge"
                            >
                                ❤️ Your Favourite Hobby
                            </div>


                            <div
                                className="top-hobby-display"
                            >

                                🥇

                                <strong>
                                    {topHobby}
                                </strong>

                            </div>


                            <div
                                className="question-progress"
                            >

                                Question{" "}
                                {questionIndex + 1}
                                {" / 3"}

                            </div>


                            <div
                                className="ranking-question-card"
                            >


                                <div
                                    className="question-label"
                                >
                                    💬 Tell Me About It
                                </div>


                                <h2>
                                    {
                                        currentQuestion?.question
                                    }
                                </h2>


                                <p>
                                    Speak your answer in
                                    English.
                                </p>


                                <button
                                    type="button"
                                    className="speak-answer-btn"
                                    onClick={
                                        startListening
                                    }
                                    disabled={
                                        processing ||
                                        isListening
                                    }
                                >

                                    🎙️ Speak Your Answer

                                </button>


                                {userAnswer && (

                                    <div
                                        className="user-answer-box"
                                    >

                                        <strong>
                                            You said:
                                        </strong>


                                        <span>
                                            "{userAnswer}"
                                        </span>

                                    </div>

                                )}


                                {answerStatus === "wrong" && (

                                    <div
                                        className="answer-status wrong-status"
                                    >
                                        ❌ Let's try that again.
                                    </div>

                                )}


                                {answerStatus === "correct" && (

                                    <div
                                        className="answer-status correct-status"
                                    >
                                        🎉 Great answer!
                                    </div>

                                )}


                                {answerStatus === "error" && (

                                    <div
                                        className="answer-status wrong-status"
                                    >
                                        ⚠️ Something went wrong. Please try again.
                                    </div>

                                )}

                            </div>


                            <div className="ranking-tip">

                                💡 Speak naturally. Miss Uroosa
                                will listen to your answer and
                                help you correct any mistakes.

                            </div>

                        </div>

                    </div>

                )}

            </div>

        </div>

    );

}


export default HobbyRankingActivity;