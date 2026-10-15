import React, { useEffect, useRef, useState } from "react";
import "./PhysicalAppearanceActivity3.css";

import confetti from "canvas-confetti";

import yaySound from "../../assets/yay.mp3";


// =========================================================
// PARTNER OPTIONS
// =========================================================

const partnerOptions = [
    {
        id: 1,
        relation: "Best Friend",
        icon: "🧑‍🤝‍🧑",
    },
    {
        id: 2,
        relation: "Mother",
        icon: "👩",
    },
    {
        id: 3,
        relation: "Father",
        icon: "👨",
    },
    {
        id: 4,
        relation: "Sister",
        icon: "👧",
    },
    {
        id: 5,
        relation: "Brother",
        icon: "👦",
    },
    {
        id: 6,
        relation: "Cousin",
        icon: "🧒",
    },
];

// =========================================================
// API
// =========================================================

const ACTIVITY3_API =
    `${import.meta.env.VITE_API_URL}/api/physical-appearance/activity3`;

// =========================================================
// HELPER
// =========================================================

const getLowercaseRelation = (relation) => {
    return relation.toLowerCase();
};

// =========================================================
// COMPONENT
// =========================================================

function PhysicalAppearanceActivity3({
    onBack,
    onFinish,
    userName,
}) {
    // -----------------------------------------------------
    // PERSON
    // -----------------------------------------------------

    const [selectedPartner, setSelectedPartner] =
        useState(null);

    // -----------------------------------------------------
    // SPEECH
    // -----------------------------------------------------

    const [isRecording, setIsRecording] =
        useState(false);

    const [spokenText, setSpokenText] =
        useState("");

    // -----------------------------------------------------
    // EVALUATION
    // -----------------------------------------------------

    const [submitted, setSubmitted] =
        useState(false);

    const [isChecking, setIsChecking] =
        useState(false);

    const [isCorrect, setIsCorrect] =
        useState(false);

    const [feedback, setFeedback] =
        useState("");

    const [correction, setCorrection] =
        useState("");

    const [teacherResponse, setTeacherResponse] =
        useState("");

    const [retry, setRetry] =
        useState(false);

    // -----------------------------------------------------
    // SUCCESS SEQUENCE
    // -----------------------------------------------------

    const [showSuccess, setShowSuccess] =
        useState(false);

    const [canContinue, setCanContinue] =
        useState(false);

    // -----------------------------------------------------
    // REFS
    // -----------------------------------------------------

    const recognitionRef =
        useRef(null);

    const yayAudioRef =
        useRef(null);

    const isMountedRef =
        useRef(true);

    const isSpeakingRef =
        useRef(false);

    const requestInProgressRef =
        useRef(false);

    // =====================================================
    // SPEECH RECOGNITION SETUP
    // =====================================================

    useEffect(() => {
        isMountedRef.current = true;

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            return;
        }

        const recognition =
            new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
            if (!isMountedRef.current) {
                return;
            }

            let finalText = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {
                if (
                    event.results[i].isFinal
                ) {
                    finalText +=
                        event.results[i][0].transcript +
                        " ";
                }
            }

            if (finalText.trim()) {
                setSpokenText((prev) =>
                    `${prev} ${finalText}`.trim()
                );
            }
        };

        recognition.onend = () => {
            if (!isMountedRef.current) {
                return;
            }

            setIsRecording(false);
        };

        recognition.onerror = () => {
            if (!isMountedRef.current) {
                return;
            }

            setIsRecording(false);
        };

        recognitionRef.current =
            recognition;

        return () => {
            isMountedRef.current = false;

            try {
                recognition.stop();
            } catch (error) {
                // Already stopped
            }

            recognitionRef.current =
                null;
        };
    }, []);

    // =====================================================
    // STOP ALL AUDIO / SPEECH
    // =====================================================

    const stopAllAudio = () => {
        // -------------------------------------------------
        // Stop browser speech synthesis
        // -------------------------------------------------

        try {
            if (
                window.speechSynthesis
            ) {
                window.speechSynthesis.cancel();
            }
        } catch (error) {
            // Ignore
        }

        isSpeakingRef.current =
            false;

        // -------------------------------------------------
        // Stop yay audio
        // -------------------------------------------------

        try {
            if (
                yayAudioRef.current
            ) {
                yayAudioRef.current.pause();

                yayAudioRef.current.currentTime = 0;
            }
        } catch (error) {
            // Ignore
        }
    };

    // =====================================================
    // SPEAK TEACHER REMARK
    // =====================================================

    const speakTeacher = (text) => {
        return new Promise((resolve) => {
            if (!text) {
                resolve();
                return;
            }

            if (
                !window.speechSynthesis
            ) {
                resolve();
                return;
            }

            try {
                window.speechSynthesis.cancel();
            } catch (error) {
                // Ignore
            }

            const utterance =
                new SpeechSynthesisUtterance(
                    text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
                );

            utterance.lang =
                "en-US";

            utterance.rate =
                0.88;

            utterance.pitch =
                1.05;

            utterance.volume =
                1;

            const voices =
                window.speechSynthesis.getVoices();

            const preferredVoice =
                voices.find(
                    (voice) =>
                        /Google UK English Female/i.test(
                            voice.name
                        )
                ) ||
                voices.find(
                    (voice) =>
                        /Samantha/i.test(
                            voice.name
                        )
                ) ||
                voices.find(
                    (voice) =>
                        /Zira/i.test(
                            voice.name
                        )
                ) ||
                voices.find(
                    (voice) =>
                        /Female/i.test(
                            voice.name
                        )
                );

            if (preferredVoice) {
                utterance.voice =
                    preferredVoice;
            }

            isSpeakingRef.current =
                true;

            utterance.onend = () => {
                isSpeakingRef.current =
                    false;

                resolve();
            };

            utterance.onerror = () => {
                isSpeakingRef.current =
                    false;

                resolve();
            };

            window.speechSynthesis.speak(
                utterance
            );
        });
    };

    // =====================================================
    // PLAY YAY VOICE
    // =====================================================

    const playYayVoice = () => {
        return new Promise((resolve) => {
            try {
                if (
                    !yayAudioRef.current
                ) {
                    const audio =
                        new Audio(
                            yayVoice
                        );

                    yayAudioRef.current =
                        audio;
                }

                const audio =
                    yayAudioRef.current;

                audio.pause();

                audio.currentTime = 0;

                audio.volume = 1;

                audio.onended = () => {
                    resolve();
                };

                audio.onerror = () => {
                    resolve();
                };

                const playPromise =
                    audio.play();

                if (
                    playPromise &&
                    typeof playPromise.then ===
                        "function"
                ) {
                    playPromise.catch(
                        () => {
                            resolve();
                        }
                    );
                }
            } catch (error) {
                resolve();
            }
        });
    };

    // =====================================================
    // CONFETTI
    // =====================================================

    const celebrateCorrectAnswer = () => {
        try {
            const duration =
                2200;

            const animationEnd =
                Date.now() +
                duration;

            const interval =
                setInterval(() => {
                    const timeLeft =
                        animationEnd -
                        Date.now();

                    if (
                        timeLeft <= 0
                    ) {
                        clearInterval(
                            interval
                        );

                        return;
                    }

                    const particleCount =
                        Math.floor(
                            45 *
                                (timeLeft /
                                    duration)
                        );

                    confetti({
                        particleCount,
                        spread: 75,
                        startVelocity: 35,
                        origin: {
                            x: Math.random(),
                            y:
                                Math.random() *
                                    0.35 +
                                0.2,
                        },
                    });
                }, 180);
            } catch (error) {
            // Ignore confetti errors
        }
    };

    // =====================================================
    // SUCCESS SEQUENCE
    //
    // CORRECT
    // ↓
    // CONFETTI
    // ↓
    // YAY VOICE
    // ↓
    // TEACHER REMARK
    // ↓
    // CONTINUE
    // =====================================================

    const runSuccessSequence = async (
        responseText
    ) => {
        if (
            !isMountedRef.current
        ) {
            return;
        }

        setShowSuccess(true);

        setCanContinue(false);

        // -------------------------------------------------
        // Confetti
        // -------------------------------------------------

        celebrateCorrectAnswer();

        // -------------------------------------------------
        // YAY FIRST
        // -------------------------------------------------

        await playYayVoice();

        if (
            !isMountedRef.current
        ) {
            return;
        }

        // -------------------------------------------------
        // Teacher remark AFTER YAY FINISHES
        // -------------------------------------------------

        await speakTeacher(
            responseText
        );

        if (
            !isMountedRef.current
        ) {
            return;
        }

        // -------------------------------------------------
        // Only now enable Continue
        // -------------------------------------------------

        setCanContinue(true);
    };

    // =====================================================
    // SELECT PARTNER
    // =====================================================

    const handlePartnerSelect = (
        partner
    ) => {
        if (
            !isMountedRef.current
        ) {
            return;
        }

        stopAllAudio();

        setSelectedPartner(
            partner
        );

        setSpokenText("");

        setSubmitted(false);

        setIsChecking(false);

        setIsCorrect(false);

        setFeedback("");

        setCorrection("");

        setTeacherResponse("");

        setRetry(false);

        setShowSuccess(false);

        setCanContinue(false);
    };

    // =====================================================
    // START RECORDING
    // =====================================================

    const startRecording = () => {
        if (
            !recognitionRef.current
        ) {
            alert(
                "Speech recognition is not supported in this browser. Please use Google Chrome."
            );

            return;
        }

        if (isChecking) {
            return;
        }

        stopAllAudio();

        setSpokenText("");

        setSubmitted(false);

        setIsCorrect(false);

        setFeedback("");

        setCorrection("");

        setTeacherResponse("");

        setRetry(false);

        setShowSuccess(false);

        setCanContinue(false);

        try {
            recognitionRef.current.start();

            setIsRecording(true);
        } catch (error) {
            setIsRecording(false);
        }
    };

    // =====================================================
    // STOP RECORDING
    // =====================================================

    const stopRecording = () => {
        try {
            recognitionRef.current?.stop();
        } catch (error) {
            // Already stopped
        }

        setIsRecording(false);
    };

    // =====================================================
    // TOGGLE RECORDING
    // =====================================================

    const toggleRecording = () => {
        if (isChecking) {
            return;
        }

        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    // =====================================================
    // CHECK ANSWER WITH AI
    // =====================================================

    const handleSubmit = async () => {
        const message =
            spokenText.trim();

        if (!message) {
            return;
        }

        if (
            requestInProgressRef.current
        ) {
            return;
        }

        // -------------------------------------------------
        // Stop recording
        // -------------------------------------------------

        stopRecording();

        // -------------------------------------------------
        // Stop old audio
        // -------------------------------------------------

        stopAllAudio();

        requestInProgressRef.current =
            true;

        setIsChecking(true);

        setSubmitted(false);

        setShowSuccess(false);

        setCanContinue(false);

        try {
            const question =
                `Describe your ${getLowercaseRelation(
                    selectedPartner.relation
                )}.`;

            const response =
                await fetch(
                    ACTIVITY3_API,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            question,

                            message,

                            context:
                                "Physical Appearance Activity 3 - Describe Your Partner.",

                            userName:
                                userName ||
                                "Student",

                            partner:
                                selectedPartner.relation,

                            relation:
                                selectedPartner.relation,
                        }),
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                        "Unable to check answer."
                );
            }

            if (
                !isMountedRef.current
            ) {
                return;
            }

            // -------------------------------------------------
            // SAVE AI RESPONSE
            // -------------------------------------------------

            const correct =
                Boolean(
                    data.isCorrect
                );

            setIsCorrect(
                correct
            );

            setFeedback(
                data.feedback ||
                    ""
            );

            setCorrection(
                data.correction ||
                    ""
            );

            setTeacherResponse(
                data.teacherResponse ||
                    ""
            );

            setRetry(
                Boolean(
                    data.retry
                )
            );

            setSubmitted(true);

            // -------------------------------------------------
            // CORRECT
            // -------------------------------------------------

            if (correct) {
                await runSuccessSequence(
                    data.teacherResponse ||
                        "Excellent! You did a great job."
                );
            }

            // -------------------------------------------------
            // WRONG
            // -------------------------------------------------

            else {
                setShowSuccess(false);

                setCanContinue(false);

                // Teacher explains correction
                await speakTeacher(
                    data.teacherResponse ||
                        "Good try! Let's try that again."
                );
            }
        } catch (error) {
            console.error(
                "❌ Activity 3 AI Check Error:",
                error
            );

            if (
                !isMountedRef.current
            ) {
                return;
            }

            setSubmitted(true);

            setIsCorrect(false);

            setRetry(true);

            setFeedback(
                "Let's try again!"
            );

            setCorrection("");

            setTeacherResponse(
                "Good try! Mujhe answer check karne mein thodi problem hui. Ek baar phir bolo."
            );

            setShowSuccess(false);

            setCanContinue(false);

            await speakTeacher(
                "Good try! Mujhe answer check karne mein thodi problem hui. Ek baar phir bolo."
            );
        } finally {
            requestInProgressRef.current =
                false;

            if (
                isMountedRef.current
            ) {
                setIsChecking(false);
            }
        }
    };

    // =====================================================
    // CONTINUE
    // =====================================================

    const handleContinue = () => {
        if (
            !canContinue ||
            !isCorrect
        ) {
            return;
        }

        stopAllAudio();

        if (
            typeof onFinish ===
            "function"
        ) {
            onFinish();
        }
    };

    // =====================================================
    // BACK
    // =====================================================

    const handleBack = () => {
        stopAllAudio();

        if (isRecording) {
            try {
                recognitionRef.current?.stop();
            } catch (error) {
                // Ignore
            }

            setIsRecording(false);
        }

        if (
            typeof onBack ===
            "function"
        ) {
            onBack();
        }
    };

    // =====================================================
    // SKIP
    // =====================================================

    const handleSkip = () => {
        stopAllAudio();

        if (isRecording) {
            try {
                recognitionRef.current?.stop();
            } catch (error) {
                // Ignore
            }

            setIsRecording(false);
        }

        if (
            typeof onFinish ===
            "function"
        ) {
            onFinish();
        }
    };

    // =====================================================
    // CLEANUP
    // =====================================================

    useEffect(() => {
        return () => {
            isMountedRef.current =
                false;

            try {
                recognitionRef.current?.stop();
            } catch (error) {
                // Ignore
            }

            stopAllAudio();
        };
    }, []);

    // =====================================================
    // CHARACTER SELECTION SCREEN
    // =====================================================

    if (!selectedPartner) {
        return (
            <div className="physical-appearance-activity3-page">

                <div className="physical-appearance-activity3-overlay" />

                <div className="physical-appearance-activity3-card">

                    {/* HEADER */}

                    <div className="physical-appearance-activity3-header">

                        <div className="physical-appearance-activity3-header-left">

                            <button
                                type="button"
                                className="physical-appearance-activity3-back-btn"
                                onClick={handleBack}
                            >
                                ← Back
                            </button>

                        </div>

                        <div className="physical-appearance-activity3-header-center">

                            <h1>
                                🗣️ Describe Your Partner
                            </h1>

                            <span>
                                Physical Appearance • Activity 3
                            </span>

                        </div>

                        <div className="physical-appearance-activity3-header-right">

                            <button
                                type="button"
                                className="physical-appearance-activity3-skip-btn"
                                onClick={handleSkip}
                            >
                                Skip →
                            </button>

                        </div>

                    </div>

                    {/* CONTENT */}

                    <div className="physical-appearance-activity3-content">

                        <div className="physical-appearance-activity3-main-section">

                            <div className="physical-appearance-select-card">

                                <div className="physical-appearance-select-label">
                                    CHOOSE A PERSON
                                </div>

                                <h2>
                                    Who would you like to describe?
                                </h2>

                                <p>
                                    Choose someone and describe their
                                    physical appearance.
                                </p>

                                <div className="partner-choice-grid">

                                    {partnerOptions.map(
                                        (partner) => (
                                            <button
                                                key={partner.id}
                                                type="button"
                                                className="partner-choice-card"
                                                onClick={() =>
                                                    handlePartnerSelect(
                                                        partner
                                                    )
                                                }
                                            >

                                                <div className="partner-choice-icon">
                                                    {partner.icon}
                                                </div>

                                                <div className="partner-choice-name">
                                                    {partner.relation}
                                                </div>

                                                <div className="partner-choice-arrow">
                                                    →
                                                </div>

                                            </button>
                                        )
                                    )}

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>
        );
    }

    // =====================================================
    // DESCRIBE SCREEN
    // =====================================================

    return (
        <div className="physical-appearance-activity3-page">

            <div className="physical-appearance-activity3-overlay" />

            <div className="physical-appearance-activity3-card">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="physical-appearance-activity3-header">

                    <div className="physical-appearance-activity3-header-left">

                        <button
                            type="button"
                            className="physical-appearance-activity3-back-btn"
                            onClick={handleBack}
                        >
                            ← Back
                        </button>

                    </div>

                    <div className="physical-appearance-activity3-header-center">

                        <h1>
                            🗣️ Describe Your Partner
                        </h1>

                        <span>
                            Physical Appearance • Activity 3
                        </span>

                    </div>

                    <div className="physical-appearance-activity3-header-right">

                        <button
                            type="button"
                            className="physical-appearance-activity3-skip-btn"
                            onClick={handleSkip}
                        >
                            Skip →
                        </button>

                    </div>

                </div>

                {/* =================================================
                    MAIN CONTENT
                ================================================= */}

                <div className="physical-appearance-activity3-content">

                    <div className="physical-appearance-activity3-main-section">

                        {/* =================================================
                            SELECTED PERSON
                        ================================================= */}

                        <div className="selected-partner-section">

                            <div className="selected-partner-avatar">
                                {selectedPartner.icon}
                            </div>

                            <div>

                                <div className="selected-partner-label">
                                    YOUR CHOICE
                                </div>

                                <h2>
                                    {selectedPartner.relation}
                                </h2>

                            </div>

                        </div>

                        {/* =================================================
                            QUESTION
                        ================================================= */}

                        <div className="describe-question-box">

                            <div className="describe-question-small">
                                SPEAK IN 2–3 SENTENCES
                            </div>

                            <h2>
                                Describe your{" "}
                                {getLowercaseRelation(
                                    selectedPartner.relation
                                )}
                                .
                            </h2>

                            <p>
                                Tell us about their physical
                                appearance.
                            </p>

                        </div>

                        {/* =================================================
                            HINTS
                        ================================================= */}

                        <div className="speaking-hints">

                            <div className="speaking-hint">
                                👤 Hair
                            </div>

                            <div className="speaking-hint">
                                📏 Height
                            </div>

                            <div className="speaking-hint">
                                👁️ Eyes
                            </div>

                            <div className="speaking-hint">
                                👓 Glasses
                            </div>

                        </div>

                        {/* =================================================
                            SPEECH AREA
                        ================================================= */}

                        <div className="speech-area">

                            <div className="speech-status">

                                {isChecking
                                    ? "Teacher is checking..."
                                    : isRecording
                                    ? "Listening..."
                                    : spokenText
                                    ? "Your answer"
                                    : "Tap the microphone and speak"}

                            </div>

                            <div className="spoken-text-box">

                                {spokenText ? (
                                    <span>
                                        {spokenText}
                                    </span>
                                ) : (
                                    <span className="speech-placeholder">
                                        Your sentences will appear here...
                                    </span>
                                )}

                            </div>

                            {/* =================================================
                                MIC
                            ================================================= */}

                            {!submitted && (
                                <button
                                    type="button"
                                    disabled={
                                        isChecking
                                    }
                                    className={
                                        isRecording
                                            ? "activity3-mic recording"
                                            : "activity3-mic"
                                    }
                                    onClick={
                                        toggleRecording
                                    }
                                >

                                    <span>
                                        {isRecording
                                            ? "⏹"
                                            : "🎙️"}
                                    </span>

                                </button>
                            )}

                            {!submitted && (
                                <div className="mic-help">

                                    {isChecking
                                        ? "Please wait..."
                                        : isRecording
                                        ? "Tap to stop"
                                        : "Tap to speak"}

                                </div>
                            )}

                        </div>

                        {/* =================================================
                            SUBMIT
                        ================================================= */}

                        {!submitted &&
                            spokenText.trim() &&
                            !isChecking && (
                                <button
                                    type="button"
                                    className="activity3-submit-button"
                                    onClick={
                                        handleSubmit
                                    }
                                >
                                    Check My Answer ✓
                                </button>
                            )}

                        {/* =================================================
                            CHECKING
                        ================================================= */}

                        {isChecking && (
                            <div className="activity3-feedback">

                                <div className="activity3-feedback-icon">
                                    🤔
                                </div>

                                <div>
                                    <strong>
                                        Miss Uroosa is checking...
                                    </strong>

                                    <p>
                                        Let's see how you did!
                                    </p>
                                </div>

                            </div>
                        )}

                        {/* =================================================
                            SUCCESS
                        ================================================= */}

                        {submitted &&
                            isCorrect &&
                            showSuccess && (
                                <div className="activity3-feedback success">

                                    <div className="activity3-feedback-icon">
                                        🎉
                                    </div>

                                    <div>

                                        <strong>
                                            {feedback ||
                                                "Excellent!"}
                                        </strong>

                                        <p>
                                            {teacherResponse ||
                                                "You did a great job!"}
                                        </p>

                                    </div>

                                </div>
                            )}

                        {/* =================================================
                            WRONG / RETRY
                        ================================================= */}

                        {submitted &&
                            !isCorrect &&
                            !isChecking && (
                                <div className="activity3-feedback retry">

                                    <div className="activity3-feedback-icon">
                                        💡
                                    </div>

                                    <div>

                                        <strong>
                                            {feedback ||
                                                "Good try!"}
                                        </strong>

                                        <p>
                                            {teacherResponse ||
                                                "Let's try again."}
                                        </p>

                                        {correction && (
                                            <div
                                                style={{
                                                    marginTop:
                                                        "8px",
                                                    fontWeight:
                                                        "600",
                                                }}
                                            >
                                                {correction}
                                            </div>
                                        )}

                                    </div>

                                </div>
                            )}

                        {/* =================================================
                            RETRY BUTTON
                        ================================================= */}

                        {submitted &&
                            !isCorrect &&
                            retry &&
                            !isChecking && (
                                <button
                                    type="button"
                                    className="activity3-submit-button"
                                    onClick={() => {
                                        setSubmitted(
                                            false
                                        );

                                        setFeedback(
                                            ""
                                        );

                                        setCorrection(
                                            ""
                                        );

                                        setTeacherResponse(
                                            ""
                                        );

                                        setRetry(
                                            false
                                        );

                                        setShowSuccess(
                                            false
                                        );

                                        setCanContinue(
                                            false
                                        );

                                        setSpokenText(
                                            ""
                                        );
                                    }}
                                >
                                    Try Again 🎙️
                                </button>
                            )}

                        {/* =================================================
                            CONTINUE
                            ONLY AFTER:
                            CONFETTI → YAY → TEACHER VOICE
                        ================================================= */}

                        {submitted &&
                            isCorrect &&
                            canContinue && (
                                <button
                                    type="button"
                                    className="activity3-continue-button"
                                    onClick={
                                        handleContinue
                                    }
                                >
                                    Continue →
                                </button>
                            )}

                    </div>

                </div>

            </div>

        </div>
    );
}

export default PhysicalAppearanceActivity3;