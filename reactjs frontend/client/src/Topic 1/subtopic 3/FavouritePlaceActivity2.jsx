import React, {
    useEffect,
    useRef,
    useState
} from "react";

import confetti from "canvas-confetti";

import teacher1 from "../../assets/teacher1.png";
import teacher2 from "../../assets/teacher2.png";
import teacher3 from "../../assets/teacher3.png";
import teacher4 from "../../assets/teacher4.png";

import chatBg from "../../assets/chatbg.jpeg";
import yaySound from "../../assets/yay.mp3";

import "./FavouritePlaceActivity2.css";


function FavouritePlaceActivity2({
    content,
    topicId,
    lessonId,
    userName,
    onNext,
    onBack
}) {

    /* =====================================================
       ROUNDS
    ===================================================== */

    const rounds =
        content?.activities?.[1]?.rounds || [];


    /* =====================================================
       TEACHER IMAGES
    ===================================================== */

    const teacherImages = [
        teacher1,
        teacher2,
        teacher3,
        teacher4
    ];


    /* =====================================================
       STATES
    ===================================================== */

    const [currentRound, setCurrentRound] =
        useState(0);

    const [selectedAnswer, setSelectedAnswer] =
        useState(null);

    const [feedback, setFeedback] =
        useState("");

    const [isCorrect, setIsCorrect] =
        useState(false);

    const [isSpeaking, setIsSpeaking] =
        useState(false);

    const [isProcessing, setIsProcessing] =
        useState(false);


    /* =====================================================
       REFS
    ===================================================== */

    const mountedRef =
        useRef(true);

    const wrongTimerRef =
        useRef(null);

    const nextTimerRef =
        useRef(null);

    const soundRef =
        useRef(null);

    const confettiFrameRef =
        useRef(null);


    const round =
        rounds[currentRound];


    /* =====================================================
       CLEANUP
    ===================================================== */

    useEffect(() => {

        mountedRef.current = true;

        return () => {

            mountedRef.current = false;

            window.speechSynthesis?.cancel();


            if (wrongTimerRef.current) {

                clearTimeout(
                    wrongTimerRef.current
                );

                wrongTimerRef.current = null;

            }


            if (nextTimerRef.current) {

                clearTimeout(
                    nextTimerRef.current
                );

                nextTimerRef.current = null;

            }


            if (soundRef.current) {

                soundRef.current.pause();

                soundRef.current.currentTime = 0;

                soundRef.current = null;

            }


            if (confettiFrameRef.current) {

                cancelAnimationFrame(
                    confettiFrameRef.current
                );

                confettiFrameRef.current = null;

            }

        };

    }, []);


    /* =====================================================
       CLEAR ALL TIMERS
    ===================================================== */

    const clearAllTimers = () => {

        if (wrongTimerRef.current) {

            clearTimeout(
                wrongTimerRef.current
            );

            wrongTimerRef.current = null;

        }


        if (nextTimerRef.current) {

            clearTimeout(
                nextTimerRef.current
            );

            nextTimerRef.current = null;

        }

    };


    /* =====================================================
       STOP ALL AUDIO
    ===================================================== */

    const stopAllAudio = () => {

        if (window.speechSynthesis) {

            window.speechSynthesis.cancel();

        }


        if (soundRef.current) {

            soundRef.current.pause();

            soundRef.current.currentTime = 0;

            soundRef.current = null;

        }


        if (confettiFrameRef.current) {

            cancelAnimationFrame(
                confettiFrameRef.current
            );

            confettiFrameRef.current = null;

        }

    };


    /* =====================================================
       TEACHER VOICE
    ===================================================== */

    const getTeacherVoice = () => {

        if (!window.speechSynthesis) {

            return null;

        }


        const voices =
            window.speechSynthesis.getVoices();


        return (

            voices.find(
                (voice) =>
                    /Google UK English Female/i.test(
                        voice.name
                    )
            )

            ||

            voices.find(
                (voice) =>
                    /Microsoft.*Jenny/i.test(
                        voice.name
                    )
            )

            ||

            voices.find(
                (voice) =>
                    /Microsoft.*Aria/i.test(
                        voice.name
                    )
            )

            ||

            voices.find(
                (voice) =>
                    /Samantha/i.test(
                        voice.name
                    )
            )

            ||

            voices.find(
                (voice) =>
                    /female/i.test(
                        voice.name
                    )
            )

            ||

            null

        );

    };


    /* =====================================================
       TEACHER SPEAK AND WAIT
    ===================================================== */

    const speakTeacherAndWait = (text) => {

        return new Promise((resolve) => {

            if (!window.speechSynthesis || !text) {

                setIsSpeaking(false);

                resolve();

                return;

            }


            window.speechSynthesis.cancel();


            const speech =
                new SpeechSynthesisUtterance(
                    text
                );


            const voice =
                getTeacherVoice();


            if (voice) {

                speech.voice = voice;

            }


            speech.lang = "en-US";

            speech.rate = 0.88;

            speech.pitch = 1.08;


            let completed = false;


            const finishSpeech = () => {

                if (completed) {

                    return;

                }


                completed = true;

                setIsSpeaking(false);

                resolve();

            };


            speech.onstart = () => {

                if (!mountedRef.current) {

                    return;

                }

                setIsSpeaking(true);

            };


            speech.onend =
                finishSpeech;


            speech.onerror =
                finishSpeech;


            window.speechSynthesis.speak(
                speech
            );

        });

    };


    /* =====================================================
       YAY SOUND AND WAIT
    ===================================================== */

    const playCorrectSoundAndWait = () => {

        return new Promise((resolve) => {

            try {

                if (soundRef.current) {

                    soundRef.current.pause();

                    soundRef.current.currentTime = 0;

                    soundRef.current = null;

                }


                const audio =
                    new Audio(yaySound);


                soundRef.current =
                    audio;


                let completed = false;


                const finishAudio = () => {

                    if (completed) {

                        return;

                    }


                    completed = true;

                    audio.onended = null;

                    audio.onerror = null;


                    if (
                        soundRef.current ===
                        audio
                    ) {

                        soundRef.current = null;

                    }


                    resolve();

                };


                audio.onended =
                    finishAudio;


                audio.onerror =
                    finishAudio;


                audio.volume = 1;


                const playPromise =
                    audio.play();


                if (
                    playPromise &&
                    typeof playPromise.catch ===
                        "function"
                ) {

                    playPromise.catch(
                        (error) => {

                            console.log(
                                "Yay sound error:",
                                error
                            );

                            finishAudio();

                        }
                    );

                }

            }

            catch (error) {

                console.log(
                    "Sound error:",
                    error
                );

                resolve();

            }

        });

    };


    /* =====================================================
       CONFETTI
    ===================================================== */

    const triggerConfettiAndWait = () => {

        return new Promise((resolve) => {

            const duration = 1800;

            const end =
                Date.now() + duration;


            const frame = () => {

                if (!mountedRef.current) {

                    resolve();

                    return;

                }


                confetti({

                    particleCount: 7,

                    angle: 60,

                    spread: 70,

                    origin: {
                        x: 0
                    }

                });


                confetti({

                    particleCount: 7,

                    angle: 120,

                    spread: 70,

                    origin: {
                        x: 1
                    }

                });


                if (Date.now() < end) {

                    confettiFrameRef.current =
                        requestAnimationFrame(
                            frame
                        );

                }

                else {

                    confettiFrameRef.current =
                        null;

                    resolve();

                }

            };


            frame();

        });

    };


    /* =====================================================
       NEXT ROUND
    ===================================================== */

    const goToNextRound = () => {

        if (!mountedRef.current) {

            return;

        }


        clearAllTimers();

        stopAllAudio();


        setIsSpeaking(false);

        setIsProcessing(false);


        if (
            currentRound <
            rounds.length - 1
        ) {

            setCurrentRound(
                (previousRound) =>
                    previousRound + 1
            );


            setSelectedAnswer(null);

            setFeedback("");

            setIsCorrect(false);

        }

        else {

            if (typeof onNext === "function") {

                onNext();

            }

        }

    };


    /* =====================================================
       CORRECT SEQUENCE
    ===================================================== */

    const runCorrectSequence = async () => {

        if (!mountedRef.current) {

            return;

        }


        setIsProcessing(true);


        const yayPromise =
            playCorrectSoundAndWait();


        const confettiPromise =
            triggerConfettiAndWait();


        await Promise.all([
            yayPromise,
            confettiPromise
        ]);


        if (!mountedRef.current) {

            return;

        }


        await speakTeacherAndWait(
            "Excellent! You found the perfect choice!"
        );


        if (!mountedRef.current) {

            return;

        }


        await new Promise((resolve) => {

            nextTimerRef.current =
                setTimeout(() => {

                    nextTimerRef.current =
                        null;

                    resolve();

                }, 400);

        });


        if (!mountedRef.current) {

            return;

        }


        goToNextRound();

    };


    /* =====================================================
       HANDLE ANSWER
    ===================================================== */

    const handleAnswer = (optionIndex) => {

        if (
            selectedAnswer !== null ||
            !round ||
            isProcessing
        ) {

            return;

        }


        clearAllTimers();


        setSelectedAnswer(
            optionIndex
        );


        const correct =
            optionIndex ===
            round.correctAnswer;


        setIsCorrect(correct);


        if (correct) {

            setFeedback(
                "Excellent! You found the perfect choice! 🎉"
            );


            runCorrectSequence();

            return;

        }


        const wrongMessage =
            "Almost! Think about the clue and try again.";


        setFeedback(
            wrongMessage
        );


        speakTeacherAndWait(
            wrongMessage
        );


        wrongTimerRef.current =
            setTimeout(() => {

                if (
                    !mountedRef.current
                ) {

                    return;

                }


                setSelectedAnswer(null);

                setFeedback("");

                setIsCorrect(false);

                wrongTimerRef.current =
                    null;

            }, 1800);

    };


    /* =====================================================
       SKIP
    ===================================================== */

    const handleSkip = () => {

        clearAllTimers();

        stopAllAudio();


        setIsSpeaking(false);

        setIsProcessing(false);


        if (typeof onNext === "function") {

            onNext();

        }

    };


    /* =====================================================
       BACK
       
       IMPORTANT:
       Back button ko processing ke time bhi
       click karne denge.

       Isliye button disabled nahi hai.
    ===================================================== */

    const handleBack = () => {

        console.log(
            "FavouritePlaceActivity2 BACK clicked"
        );


        clearAllTimers();

        stopAllAudio();


        setIsSpeaking(false);

        setIsProcessing(false);


        /*
         * Parent Flow ka handleBack call hoga.
         *
         * Activity 2:
         * currentStep = 3
         *
         * Flow:
         * setCurrentStep(2)
         *
         * yani Activity 2 Intro par wapas.
         */

        if (typeof onBack === "function") {

            onBack();

        }

    };


    /* =====================================================
       OPTION ICON
    ===================================================== */

    const getPlaceIcon = (option) => {

        if (
            typeof option === "object" &&
            option?.icon
        ) {

            return option.icon;

        }


        const placeName =
            typeof option === "string"
                ? option
                : option?.name ||
                  option?.text ||
                  option?.label ||
                  "";


        const name =
            placeName
                .toLowerCase()
                .trim();


        if (
            name.includes("park") ||
            name.includes("garden") ||
            name.includes("playground")
        ) {

            return "🌳";

        }


        if (
            name.includes("school") ||
            name.includes("classroom")
        ) {

            return "🏫";

        }


        if (
            name.includes("hospital") ||
            name.includes("clinic")
        ) {

            return "🏥";

        }


        if (
            name.includes("library") ||
            name.includes("book")
        ) {

            return "📚";

        }


        if (
            name.includes("restaurant") ||
            name.includes("cafe")
        ) {

            return "🍽️";

        }


        if (
            name.includes("home") ||
            name.includes("house")
        ) {

            return "🏠";

        }


        if (
            name.includes("beach")
        ) {

            return "🏖️";

        }


        if (
            name.includes("mountain")
        ) {

            return "⛰️";

        }


        if (
            name.includes("mall") ||
            name.includes("shopping")
        ) {

            return "🛍️";

        }


        if (
            name.includes("museum")
        ) {

            return "🏛️";

        }


        return "📍";

    };


    /* =====================================================
       OPTION TEXT
    ===================================================== */

    const getOptionText = (option) => {

        if (
            typeof option === "string"
        ) {

            return option;

        }


        return (
            option?.name ||
            option?.text ||
            option?.label ||
            "Place"
        );

    };


    /* =====================================================
       EMPTY CONTENT
    ===================================================== */

    if (!rounds.length) {

        return (

            <div
                className="favourite-place-activity2-page"
                style={{
                    backgroundImage:
                        `url(${chatBg})`
                }}
            >

                <div className="favourite-place-empty-card">

                    <h2>
                        Activity content not found
                    </h2>


                    <button
                        type="button"
                        onClick={handleBack}
                    >
                        ← Back
                    </button>

                </div>

            </div>

        );

    }


    /* =====================================================
       CURRENT TEACHER
    ===================================================== */

    const currentTeacher =
        teacherImages[
            currentRound %
            teacherImages.length
        ];


    /* =====================================================
       EXACTLY FOUR OPTIONS
    ===================================================== */

    const options =
        Array.isArray(round?.options)
            ? round.options.slice(0, 4)
            : [];


    /* =====================================================
       UI
    ===================================================== */

    return (

        <div
            className="favourite-place-activity2-page"
            style={{
                backgroundImage:
                    `url(${chatBg})`
            }}
        >

            <div
                className="favourite-place-activity2-overlay"
            />


            <div
                className="favourite-place-activity2-card"
            >

                {/* =================================================
                    HEADER
                ================================================= */}

                <div
                    className="fp2a-activity-header"
                >

                    <button
                        type="button"
                        className="fp2a-back-button"
                        onClick={handleBack}
                    >
                        ← Back
                    </button>


                    <div
                        className="fp2a-title-area"
                    >

                        <h1>
                            Activity 2
                        </h1>


                        <div
                            className="fp2a-title-strip"
                        >
                            Explore Your Favourite Place
                        </div>

                    </div>


                    <button
                        type="button"
                        className="fp2a-skip-button"
                        onClick={handleSkip}
                        disabled={isProcessing}
                    >
                        Skip →
                    </button>

                </div>


                {/* =================================================
                    PROGRESS
                ================================================= */}

                <div
                    className="fp2a-progress"
                >

                    Round {currentRound + 1}
                    {" / "}
                    {rounds.length}

                </div>


                {/* =================================================
                    MAIN
                ================================================= */}

                <div
                    className="fp2a-main-content"
                >

                    {/* =================================================
                        TEACHER
                    ================================================= */}

                    <div
                        className="fp2a-teacher-section"
                    >

                        <div
                            className="fp2a-teacher-image-wrapper"
                        >

                            <img
                                src={currentTeacher}
                                alt="Teacher"
                                className={
                                    isSpeaking
                                        ? "fp2a-teacher-image speaking"
                                        : "fp2a-teacher-image"
                                }
                            />

                        </div>


                        <div
                            className={
                                feedback
                                    ? `fp2a-teacher-bubble ${
                                        isCorrect
                                            ? "success"
                                            : "try-again"
                                    }`
                                    : "fp2a-teacher-bubble"
                            }
                        >

                            <strong>

                                {feedback

                                    ? isCorrect
                                        ? "Excellent! 🌟"
                                        : "Keep Trying! 💛"

                                    : "Let's Explore! 🌍"

                                }

                            </strong>


                            <p>

                                {feedback ||

                                    "Choose the place that matches the clue."

                                }

                            </p>

                        </div>

                    </div>


                    {/* =================================================
                        QUESTION
                    ================================================= */}

                    <div
                        className="fp2a-question-section"
                    >

                        <div
                            className="fp2a-question-card"
                        >

                            <h2>

                                {round.question ||

                                    "Which place matches the clue?"

                                }

                            </h2>


                            {/* =================================================
                                CLUE
                            ================================================= */}

                            <div
                                className="fp2a-clue"
                            >

                                <span>
                                    Clue:
                                </span>

                                {round.clue ||
                                    round.situation
                                }

                            </div>


                            {/* =================================================
                                FOUR OPTIONS
                            ================================================= */}

                            <div
                                className="fp2a-options"
                            >

                                {options.map(
                                    (
                                        option,
                                        index
                                    ) => {

                                        const isSelected =
                                            selectedAnswer ===
                                            index;


                                        let optionClass =
                                            "fp2a-option";


                                        if (
                                            isSelected &&
                                            isCorrect
                                        ) {

                                            optionClass +=
                                                " correct";

                                        }


                                        if (
                                            isSelected &&
                                            !isCorrect
                                        ) {

                                            optionClass +=
                                                " wrong";

                                        }


                                        return (

                                            <button
                                                key={index}
                                                type="button"
                                                className={
                                                    optionClass
                                                }
                                                onClick={() =>
                                                    handleAnswer(
                                                        index
                                                    )
                                                }
                                                disabled={
                                                    selectedAnswer !==
                                                        null ||
                                                    isProcessing
                                                }
                                            >

                                                <span
                                                    className="fp2a-option-icon"
                                                >

                                                    {getPlaceIcon(
                                                        option
                                                    )}

                                                </span>


                                                <span
                                                    className="fp2a-option-letter"
                                                >

                                                    {
                                                        String.fromCharCode(
                                                            65 +
                                                            index
                                                        )
                                                    }

                                                </span>


                                                <span
                                                    className="fp2a-option-text"
                                                >

                                                    {
                                                        getOptionText(
                                                            option
                                                        )
                                                    }

                                                </span>

                                            </button>

                                        );

                                    }
                                )}

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}


export default FavouritePlaceActivity2;