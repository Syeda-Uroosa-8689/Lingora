import React, { useEffect, useRef, useState } from "react";

import teacher from "../../assets/teacher1.png";
import bg from "../../assets/chatbg.jpeg";
import yaySound from "../../assets/yay.mp3";

import confetti from "canvas-confetti";

import "./PhysicalAppearanceActivity2.css";


const ACTIVITY2_API =
`${import.meta.env.VITE_API_URL}/api/physical-appearance/activity2`;


/* =========================================================
   ACTIVITY 2 DATA
========================================================= */

const rounds = [
    {
        id: 1,
        type: "height",
        title: "Height",
        question: "How tall is your partner?",
        options: [
            {
                label: "Tall",
                value: "tall",
            },
            {
                label: "Short",
                value: "short",
            },
        ],
    },

    {
        id: 2,
        type: "hairLength",
        title: "Hair Length",
        question: "What kind of hair does your partner have?",
        options: [
            {
                label: "Long Hair",
                value: "long",
            },
            {
                label: "Short Hair",
                value: "short",
            },
        ],
    },

    {
        id: 3,
        type: "hairType",
        title: "Hair Type",
        question: "What type of hair does your partner have?",
        options: [
            {
                label: "Straight",
                value: "straight",
            },
            {
                label: "Curly",
                value: "curly",
            },
            {
                label: "Wavy",
                value: "wavy",
            },
        ],
    },

    {
        id: 4,
        type: "hairColor",
        title: "Hair Color",
        question: "What color is your partner's hair?",
        options: [
            {
                label: "Black",
                value: "black",
            },
            {
                label: "Brown",
                value: "brown",
            },
            {
                label: "Blonde",
                value: "blonde",
            },
        ],
    },

    {
        id: 5,
        type: "eyes",
        title: "Eyes",
        question: "What color are your partner's eyes?",
        options: [
            {
                label: "Brown",
                value: "brown",
            },
            {
                label: "Blue",
                value: "blue",
            },
            {
                label: "Green",
                value: "green",
            },
        ],
    },

    {
        id: 6,
        type: "glasses",
        title: "Glasses",
        question: "Does your partner wear glasses?",
        options: [
            {
                label: "Yes 👓",
                value: "yes",
            },
            {
                label: "No 🙂",
                value: "no",
            },
        ],
    },
];


/* =========================================================
   DEFAULT TEXT
========================================================= */

const DEFAULT_TEACHER_TEXT =
    "Choose a feature and build your partner!";


/* =========================================================
   COMPONENT
========================================================= */

function PhysicalAppearanceActivity2({
    onBack,
    onFinish,
}) {

    /* =====================================================
       STATES
    ===================================================== */

    const [round, setRound] = useState(0);

    const [selections, setSelections] = useState({
        height: null,
        hairLength: null,
        hairType: null,
        hairColor: null,
        eyes: null,
        glasses: null,
    });

    const [selectedOption, setSelectedOption] = useState(null);

    const [teacherRemark, setTeacherRemark] =
        useState(DEFAULT_TEACHER_TEXT);

    const [isSpeaking, setIsSpeaking] =
        useState(false);

    const [celebrating, setCelebrating] =
        useState(false);

    const [showDescription, setShowDescription] =
        useState(false);

    const [isListening, setIsListening] =
        useState(false);

    const [speechText, setSpeechText] =
        useState("");

    const [speechStatus, setSpeechStatus] =
        useState("");

    const [waitingForSentence, setWaitingForSentence] =
        useState(false);

    const [checkingAnswer, setCheckingAnswer] =
        useState(false);


    /* =====================================================
       REFS
    ===================================================== */

    const yayAudioRef = useRef(null);

    const confettiFrameRef = useRef(null);

    const speechTimeoutRef = useRef(null);

    const recognitionRef = useRef(null);

    const isMountedRef = useRef(true);

    const roundTimeoutRef = useRef(null);


    /* =====================================================
       CURRENT ROUND
    ===================================================== */

    const currentRound = rounds[round];


    /* =====================================================
       MOUNT / UNMOUNT
    ===================================================== */

    useEffect(() => {

        isMountedRef.current = true;

        const audio = new Audio(yaySound);

        audio.preload = "auto";

        yayAudioRef.current = audio;


        return () => {

            isMountedRef.current = false;

            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }

            if (speechTimeoutRef.current) {
                clearTimeout(
                    speechTimeoutRef.current
                );
            }

            if (roundTimeoutRef.current) {
                clearTimeout(
                    roundTimeoutRef.current
                );
            }

            if (confettiFrameRef.current) {

                cancelAnimationFrame(
                    confettiFrameRef.current
                );

            }

            if (recognitionRef.current) {

                try {
                    recognitionRef.current.stop();
                } catch (error) {
                    // already stopped
                }

            }

            if (yayAudioRef.current) {

                yayAudioRef.current.pause();

                yayAudioRef.current.currentTime = 0;

                yayAudioRef.current.onended = null;

                yayAudioRef.current.onerror = null;

            }

        };

    }, []);


    /* =====================================================
       LOAD BROWSER VOICES
    ===================================================== */

    useEffect(() => {

        if (!window.speechSynthesis) {
            return;
        }

        const loadVoices = () => {
            window.speechSynthesis.getVoices();
        };

        loadVoices();

        window.speechSynthesis.onvoiceschanged =
            loadVoices;


        return () => {

            window.speechSynthesis.onvoiceschanged =
                null;

        };

    }, []);


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

            voices.find((voice) =>
                /Google UK English Female/i.test(
                    voice.name
                )
            )

            ||

            voices.find((voice) =>
                /Google US English/i.test(
                    voice.name
                )
            )

            ||

            voices.find((voice) =>
                /Microsoft.*Jenny/i.test(
                    voice.name
                )
            )

            ||

            voices.find((voice) =>
                /Microsoft.*Aria/i.test(
                    voice.name
                )
            )

            ||

            voices.find((voice) =>
                /Samantha/i.test(
                    voice.name
                )
            )

            ||

            voices.find((voice) =>
                /Zira/i.test(
                    voice.name
                )
            )

            ||

            null
        );

    };


    /* =====================================================
       SPEAK TEACHER
    ===================================================== */

    const speakTeacher = (
        text,
        callback
    ) => {

        if (!isMountedRef.current) {
            return;
        }

        if (!window.speechSynthesis) {

            if (callback) {
                callback();
            }

            return;
        }


        window.speechSynthesis.cancel();


        const speech =
            new SpeechSynthesisUtterance(
                text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
            );


        speech.lang = "en-US";


        const voice = getTeacherVoice();

        if (voice) {
            speech.voice = voice;
        }


        speech.rate = 0.88;

        speech.pitch = 1.08;

        speech.volume = 1;


        speech.onstart = () => {

            if (!isMountedRef.current) {
                return;
            }

            setIsSpeaking(true);

        };


        speech.onend = () => {

            if (!isMountedRef.current) {
                return;
            }

            setIsSpeaking(false);

            if (callback) {
                callback();
            }

        };


        speech.onerror = () => {

            if (!isMountedRef.current) {
                return;
            }

            setIsSpeaking(false);

            if (callback) {
                callback();
            }

        };


        window.speechSynthesis.speak(
            speech
        );

    };


    /* =====================================================
       CONFETTI
========================================================= */

    const playConfetti = () => {

        if (!isMountedRef.current) {
            return;
        }


        if (confettiFrameRef.current) {

            cancelAnimationFrame(
                confettiFrameRef.current
            );

            confettiFrameRef.current = null;

        }


        const duration = 1800;

        const end =
            Date.now() + duration;


        const frame = () => {

            if (!isMountedRef.current) {
                return;
            }


            confetti({

                particleCount: 5,

                spread: 70,

                startVelocity: 35,

                origin: {
                    x: Math.random(),
                    y: Math.random() * 0.5,
                },

            });


            if (Date.now() < end) {

                confettiFrameRef.current =
                    requestAnimationFrame(frame);

            } else {

                confettiFrameRef.current = null;

            }

        };


        frame();

    };


    /* =====================================================
       YAY AUDIO
========================================================= */

    const playYaySound = (callback) => {

        if (!isMountedRef.current) {
            return;
        }


        const audio =
            yayAudioRef.current;


        if (!audio) {

            if (callback) {
                callback();
            }

            return;

        }


        audio.pause();

        audio.currentTime = 0;


        let finished = false;


        const finishSound = () => {

            if (finished) {
                return;
            }

            finished = true;


            audio.onended = null;

            audio.onerror = null;


            if (
                isMountedRef.current &&
                callback
            ) {

                callback();

            }

        };


        audio.onended = finishSound;

        audio.onerror = finishSound;


        const playPromise =
            audio.play();


        if (playPromise !== undefined) {

            playPromise.catch(() => {

                finishSound();

            });

        }

    };


    /* =====================================================
       GET CURRENT SENTENCE
       
       IMPORTANT:
       This is ONLY sent to backend as context.
       It is NOT shown on screen.
========================================================= */

    const getCurrentSentence = (
        option
    ) => {

        if (!option) {
            return "";
        }


        switch (currentRound.type) {

            case "height":

                return `My partner is ${option.value}.`;


            case "hairLength":

                return `My partner has ${option.value} hair.`;


            case "hairType":

                return `My partner has ${option.value} hair.`;


            case "hairColor":

                return `My partner has ${option.value} hair.`;


            case "eyes":

                return `My partner has ${option.value} eyes.`;


            case "glasses":

                if (option.value === "yes") {

                    return "My partner wears glasses.";

                }

                return "My partner does not wear glasses.";


            default:

                return "";

        }

    };


    /* =====================================================
       GET FULL DESCRIPTION
       
       Used only for backend final challenge.
       NOT displayed automatically.
========================================================= */

    const buildSentence = (
        data = selections
    ) => {

        const {
            height,
            hairLength,
            hairType,
            hairColor,
            eyes,
            glasses,
        } = data;


        const sentences = [];


        if (height) {

            sentences.push(
                `My partner is ${height}.`
            );

        }


        if (hairLength) {

            sentences.push(
                `My partner has ${hairLength} hair.`
            );

        }


        if (hairType) {

            sentences.push(
                `My partner has ${hairType} hair.`
            );

        }


        if (hairColor) {

            sentences.push(
                `My partner has ${hairColor} hair.`
            );

        }


        if (eyes) {

            sentences.push(
                `My partner has ${eyes} eyes.`
            );

        }


        if (glasses === "yes") {

            sentences.push(
                "My partner wears glasses."
            );

        }


        if (glasses === "no") {

            sentences.push(
                "My partner does not wear glasses."
            );

        }


        return sentences.join(" ");

    };


    /* =====================================================
       OPTION SELECT
       
       NEW FLOW:
       SELECT OPTION
       ↓
       TEACHER PROMPT
       ↓
       MIC
========================================================= */

    const handleOptionSelect = (
        option
    ) => {

        if (
            celebrating ||
            checkingAnswer ||
            waitingForSentence ||
            isListening
        ) {
            return;
        }


        const sentence =
            getCurrentSentence(option);


        setSelectedOption(
            option.value
        );


        setSelections((prev) => ({
            ...prev,
            [currentRound.type]:
                option.value,
        }));


        setSpeechText("");

        setSpeechStatus("");

        setWaitingForSentence(true);


        /*
         IMPORTANT:
         Sentence is NOT displayed.
         Teacher only asks child to make
         the sentence themselves.
        */

        const teacherPrompt =
            "Great! Now make a sentence and tell me.";


        setTeacherRemark(
            teacherPrompt
        );


        speakTeacher(
            teacherPrompt,
            () => {

                if (!isMountedRef.current) {
                    return;
                }

                setWaitingForSentence(false);

            }
        );

    };


    /* =====================================================
       SPEECH RECOGNITION
    ===================================================== */

    const startListening = () => {

        if (
            celebrating ||
            isListening ||
            checkingAnswer ||
            waitingForSentence
        ) {
            return;
        }


        /*
         User must select option first.
        */

        if (!selectedOption && !showDescription) {

            setTeacherRemark(
                "First choose a feature, then make your sentence."
            );

            speakTeacher(
                "First choose a feature, then make your sentence."
            );

            return;

        }


        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;


        if (!SpeechRecognition) {

            setSpeechStatus(
                "Speech recognition is not supported in this browser."
            );

            return;

        }


        if (recognitionRef.current) {

            try {
                recognitionRef.current.stop();
            } catch (error) {
                // already stopped
            }

        }


        const recognition =
            new SpeechRecognition();


        recognition.lang = "en-US";

        recognition.continuous = false;

        recognition.interimResults = false;

        recognition.maxAlternatives = 3;


        recognitionRef.current =
            recognition;


        setSpeechText("");

        setSpeechStatus(
            "Listening..."
        );

        setIsListening(true);


        recognition.onresult = (
            event
        ) => {

            const transcript =
                event
                    .results[0][0]
                    .transcript
                    .trim();


            setSpeechText(
                transcript
            );


            setIsListening(false);


            /*
             Final description
             */

            if (showDescription) {

                checkFinalDescription(
                    transcript
                );

                return;

            }


            /*
             Individual round sentence
             */

            checkRoundAnswer(
                transcript
            );

        };


        recognition.onerror = () => {

            if (!isMountedRef.current) {
                return;
            }


            setIsListening(false);


            setSpeechStatus(
                "I couldn't hear you. Please try again."
            );


            setTeacherRemark(
                "Good try! I couldn't hear you clearly. Please try again."
            );


            speakTeacher(
                "Good try! I couldn't hear you clearly. Please try again."
            );

        };


        recognition.onend = () => {

            if (!isMountedRef.current) {
                return;
            }


            setIsListening(false);

        };


        try {

            recognition.start();

        } catch (error) {

            setIsListening(false);

            setSpeechStatus(
                "Please tap the microphone again."
            );

        }

    };


    /* =====================================================
       NORMALIZE TEXT
    ===================================================== */

    const normalizeText = (
        text
    ) => {

        return String(text || "")
            .toLowerCase()
            .replace(/[.,!?]/g, "")
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    };


    /* =====================================================
       CHECK ROUND ANSWER WITH BACKEND
    ===================================================== */

    const checkRoundAnswer = async (
        transcript
    ) => {

        if (!transcript || !transcript.trim()) {

            setSpeechStatus(
                "Sorry, I couldn't hear you. Please try again."
            );

            setTeacherRemark(
                "Sorry, I couldn't hear you. Please try again."
            );

            speakTeacher(
                "Sorry, I couldn't hear you. Please try again."
            );

            return;

        }


        setCheckingAnswer(true);

        setSpeechStatus(
            "Checking your sentence..."
        );


        const selected =
            currentRound.options.find(
                (option) =>
                    option.value === selectedOption
            );


        if (!selected) {

            setCheckingAnswer(false);

            return;

        }


        const expectedSentence =
            getCurrentSentence(
                selected
            );


        try {

            const response =
                await fetch(
                     ACTIVITY2_API,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({

                            question:
                                currentRound.question,

                            feature:
                                currentRound.title,

                            selectedOption:
                                selected.value,

                            selectedOptionLabel:
                                selected.label,

                            expectedSentence:
                                expectedSentence,

                            message:
                                transcript,

                            context:
                                `Physical Appearance Activity 2.
                                 Round ${currentRound.id}.
                                 Feature: ${currentRound.title}.
                                 The student selected: ${selected.label}.
                                 The student must create their own English sentence.`,

                        }),
                    }
                );


            const data =
                await response.json();


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Unable to check answer."
                );

            }


            if (data.isCorrect) {

                handleCorrectRound(
                    data.teacherResponse ||
                    "Excellent! Great job!"
                );

            } else {

                handleWrongRound(
                    data.teacherResponse ||
                    "Good try! Let's try that again."
                );

            }

        } catch (error) {

            console.error(
                "Physical Appearance Activity 2 API Error:",
                error
            );


            setTeacherRemark(
                "I couldn't check your answer right now. Please try again."
            );


            setSpeechStatus(
                "Please try again."
            );


            speakTeacher(
                "I couldn't check your answer right now. Please try again."
            );

        } finally {

            if (isMountedRef.current) {

                setCheckingAnswer(false);

            }

        }

    };


    /* =====================================================
       CORRECT ROUND
       
       CORRECT:
       confetti + yay
       ↓
       yay finishes
       ↓
       teacher remark
       ↓
       next round
========================================================= */

    const handleCorrectRound = (
        backendRemark
    ) => {

        if (!isMountedRef.current) {
            return;
        }


        setCheckingAnswer(false);

        setCelebrating(true);

        setSpeechStatus(
            "Excellent! Your sentence is correct."
        );


        const finalRound =
            round === rounds.length - 1;


        /*
         Teacher remark is stored,
         but NOT spoken yet.
         
         First:
         CONFETTI + YAY
        */

        setTeacherRemark(
            backendRemark
        );


        playConfetti();


        playYaySound(
            () => {

                if (!isMountedRef.current) {
                    return;
                }


                /*
                 YAY HAS FINISHED.
                 
                 NOW teacher remark.
                */

                speakTeacher(
                    backendRemark,
                    () => {

                        if (!isMountedRef.current) {
                            return;
                        }


                        speechTimeoutRef.current =
                            setTimeout(
                                () => {

                                    if (!isMountedRef.current) {
                                        return;
                                    }


                                    setCelebrating(false);

                                    setSpeechText("");

                                    setSpeechStatus("");


                                    /*
                                     LAST ROUND
                                     */

                                    if (finalRound) {

                                        setShowDescription(
                                            true
                                        );

                                        setSelectedOption(
                                            null
                                        );

                                        setTeacherRemark(
                                            "Wonderful! Now tell me about your partner."
                                        );


                                        speakTeacher(
                                            "Wonderful! Now tell me about your partner."
                                        );

                                        return;

                                    }


                                    /*
                                     NEXT ROUND
                                    */

                                    setRound(
                                        (prev) =>
                                            prev + 1
                                    );


                                    setSelectedOption(
                                        null
                                    );

                                    setWaitingForSentence(
                                        false
                                    );


                                    setTeacherRemark(
                                        DEFAULT_TEACHER_TEXT
                                    );


                                    speechTimeoutRef.current =
                                        null;

                                },
                                300
                            );

                    }
                );

            }
        );

    };


    /* =====================================================
       WRONG ROUND
       
       Backend gives Roman-English correction.
       Stay on same round.
========================================================= */

    const handleWrongRound = (
        backendRemark
    ) => {

        if (!isMountedRef.current) {
            return;
        }


        setCheckingAnswer(false);

        setSpeechStatus(
            "Good try! Let's try the sentence again."
        );


        setTeacherRemark(
            backendRemark
        );


        /*
         No confetti.
         No yay.
         Same round.
        */

        speakTeacher(
            backendRemark
        );

    };


    /* =====================================================
       FINAL DESCRIPTION CHECK
    ===================================================== */

    const checkFinalDescription = async (
        transcript
    ) => {

        if (
            !transcript ||
            !transcript.trim()
        ) {

            setSpeechStatus(
                "Sorry, I couldn't hear you. Please try again."
            );

            setTeacherRemark(
                "Sorry, I couldn't hear you. Please try again."
            );

            speakTeacher(
                "Sorry, I couldn't hear you. Please try again."
            );

            return;

        }


        setCheckingAnswer(true);

        setSpeechStatus(
            "Checking your description..."
        );


        try {

            const response =
                await fetch(
                     ACTIVITY2_API,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({

                            question:
                                "Tell me about your partner.",

                            feature:
                                "Final Description",

                            selectedOption:
                                "final-description",

                            selectedOptionLabel:
                                "Final Partner Description",

                            expectedSentence:
                                buildSentence(),

                            message:
                                transcript,

                            context:
                                `Physical Appearance Activity 2 - Final Challenge.
                                 The student has selected these features:
                                 ${JSON.stringify(selections)}.
                                 The student must describe their partner using
                                 the selected features.
                                 Evaluate the student's spoken description.`,

                        }),
                    }
                );


            const data =
                await response.json();


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Unable to check final description."
                );

            }


            if (data.isCorrect) {

                handleFinalSuccess(
                    data.teacherResponse ||
                    "Wonderful speaking! You described your partner clearly. Great job!"
                );

            } else {

                handleFinalWrong(
                    data.teacherResponse ||
                    "Good try! Tell me more about your partner."
                );

            }

        } catch (error) {

            console.error(
                "Physical Appearance Final API Error:",
                error
            );


            setTeacherRemark(
                "I couldn't check your answer right now. Please try again."
            );


            setSpeechStatus(
                "Please try again."
            );


            speakTeacher(
                "I couldn't check your answer right now. Please try again."
            );

        } finally {

            if (isMountedRef.current) {

                setCheckingAnswer(false);

            }

        }

    };


    /* =====================================================
       FINAL SUCCESS
       
       confetti + yay
       ↓
       yay finished
       ↓
       teacher remark
       ↓
       onFinish
========================================================= */

    const handleFinalSuccess = (
        backendRemark
    ) => {

        if (!isMountedRef.current) {
            return;
        }


        setCheckingAnswer(false);

        setCelebrating(true);


        setTeacherRemark(
            backendRemark
        );


        setSpeechStatus(
            "Excellent! You completed the activity."
        );


        playConfetti();


        playYaySound(
            () => {

                if (!isMountedRef.current) {
                    return;
                }


                speakTeacher(
                    backendRemark,
                    () => {

                        if (!isMountedRef.current) {
                            return;
                        }


                        speechTimeoutRef.current =
                            setTimeout(
                                () => {

                                    if (!isMountedRef.current) {
                                        return;
                                    }


                                    setCelebrating(
                                        false
                                    );


                                    if (
                                        typeof onFinish ===
                                        "function"
                                    ) {

                                        onFinish();

                                    }

                                },
                                300
                            );

                    }
                );

            }
        );

    };


    /* =====================================================
       FINAL WRONG
    ========================================================== */

    const handleFinalWrong = (
        backendRemark
    ) => {

        if (!isMountedRef.current) {
            return;
        }


        setCheckingAnswer(false);


        setSpeechStatus(
            "Good try! Let's try your description again."
        );


        setTeacherRemark(
            backendRemark
        );


        /*
         Stay on Final Challenge.
         No confetti.
         No yay.
        */

        speakTeacher(
            backendRemark
        );

    };


    /* =====================================================
       STOP EVERYTHING
    ========================================================== */

    const stopAll = () => {

        if (window.speechSynthesis) {

            window.speechSynthesis.cancel();

        }


        if (speechTimeoutRef.current) {

            clearTimeout(
                speechTimeoutRef.current
            );

            speechTimeoutRef.current = null;

        }


        if (roundTimeoutRef.current) {

            clearTimeout(
                roundTimeoutRef.current
            );

            roundTimeoutRef.current = null;

        }


        if (recognitionRef.current) {

            try {

                recognitionRef.current.stop();

            } catch (error) {

                // already stopped

            }


            recognitionRef.current = null;

        }


        if (yayAudioRef.current) {

            yayAudioRef.current.pause();

            yayAudioRef.current.currentTime = 0;

            yayAudioRef.current.onended = null;

            yayAudioRef.current.onerror = null;

        }


        if (confettiFrameRef.current) {

            cancelAnimationFrame(
                confettiFrameRef.current
            );

            confettiFrameRef.current = null;

        }


        setIsSpeaking(false);

        setIsListening(false);

        setCelebrating(false);

        setCheckingAnswer(false);

        setWaitingForSentence(false);

    };


    /* =====================================================
       BACK
    ========================================================== */

    const handleBack = () => {

        if (
            celebrating ||
            checkingAnswer
        ) {
            return;
        }


        stopAll();


        if (
            typeof onBack ===
            "function"
        ) {

            onBack();

        }

    };


    /* =====================================================
       SKIP
    ========================================================== */

    const handleSkip = () => {

        if (
            celebrating ||
            checkingAnswer
        ) {
            return;
        }


        stopAll();


        if (
            typeof onFinish ===
            "function"
        ) {

            onFinish();

        }

    };


    /* =====================================================
       AVATAR
    ========================================================== */

    const avatarHairClass = [
        selections.hairLength,
        selections.hairType,
        selections.hairColor,
    ]
        .filter(Boolean)
        .join(" ");


    /* =====================================================
       RENDER
    ========================================================== */

    return (

        <div
            className="physical-appearance-activity2-page"
            style={{
                backgroundImage:
                    `url(${bg})`,
            }}
        >

            <div className="physical-appearance-activity2-overlay" />


            <div className="physical-appearance-activity2-card">


                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="physical-appearance-activity2-header">

                    <div className="physical-appearance-activity2-header-left">

                        <button
                            type="button"
                            className="physical-appearance-activity2-back-btn"
                            onClick={handleBack}
                            disabled={
                                celebrating ||
                                checkingAnswer
                            }
                        >
                            ← Back
                        </button>

                    </div>


                    <div className="physical-appearance-activity2-header-center">

                        <h1>
                            🎨 Build & Describe
                        </h1>

                        <span>
                            Physical Appearance • Activity 2
                        </span>

                    </div>


                    <div className="physical-appearance-activity2-header-right">

                        <button
                            type="button"
                            className="physical-appearance-activity2-skip-btn"
                            onClick={handleSkip}
                            disabled={
                                celebrating ||
                                checkingAnswer
                            }
                        >
                            Skip →
                        </button>

                    </div>

                </div>


                {/* =================================================
                    MAIN CONTENT
                ================================================= */}

                <div className="physical-appearance-activity2-content">


                    {/* =================================================
                        TEACHER
                    ================================================= */}

                    <div className="physical-appearance-activity2-teacher-section">

                        <div className="physical-appearance-activity2-teacher-stage">

                            <img
                                src={teacher}
                                alt="Miss Uroosa"
                                className={
                                    isSpeaking
                                        ? "physical-appearance-activity2-teacher-img speaking"
                                        : "physical-appearance-activity2-teacher-img"
                                }
                            />

                        </div>


                        <div className="physical-appearance-activity2-teacher-bubble">

                            <div className="physical-appearance-activity2-teacher-name">
                                Miss Uroosa
                            </div>

                            <div className="physical-appearance-activity2-teacher-text">
                                {teacherRemark}
                            </div>

                        </div>


                        <div className="physical-appearance-activity2-teacher-stats">

                            <div className="physical-appearance-activity2-round-badge">

                                {showDescription
                                    ? "Final Challenge"
                                    : `Round ${round + 1} / ${rounds.length}`
                                }

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        RIGHT SECTION
                    ================================================= */}

                    <div className="physical-appearance-activity2-main-section">


                        {!showDescription ? (

                            <>

                                {/* =====================================
                                    QUESTION
                                ===================================== */}

                                <div className="physical-appearance-activity2-question-card">

                                    <div className="physical-appearance-activity2-question-label">
                                        BUILD YOUR PARTNER
                                    </div>

                                    <h2>
                                        {currentRound.question}
                                    </h2>

                                    <p>
                                        Choose one option to build your character.
                                    </p>

                                </div>


                                {/* =====================================
                                    PROGRESS
                                ===================================== */}

                                <div className="physical-appearance-activity2-progress">

                                    {rounds.map(
                                        (item, index) => (

                                            <div
                                                key={item.id}
                                                className={
                                                    index < round
                                                        ? "activity2-progress-dot completed"
                                                        : index === round
                                                            ? "activity2-progress-dot active"
                                                            : "activity2-progress-dot"
                                                }
                                            />

                                        )
                                    )}

                                </div>


                                {/* =====================================
                                    OPTIONS
                                ===================================== */}

                                <div
                                    className={
                                        currentRound.options.length === 3
                                            ? "physical-appearance-activity2-options three"
                                            : "physical-appearance-activity2-options"
                                    }
                                >

                                    {currentRound.options.map(
                                        (option) => (

                                            <button
                                                key={option.value}
                                                type="button"
                                                className={
                                                    selectedOption ===
                                                    option.value
                                                        ? "physical-appearance-activity2-option selected"
                                                        : "physical-appearance-activity2-option"
                                                }
                                                onClick={() =>
                                                    handleOptionSelect(
                                                        option
                                                    )
                                                }
                                                disabled={
                                                    celebrating ||
                                                    checkingAnswer ||
                                                    waitingForSentence ||
                                                    isListening
                                                }
                                            >

                                                <span className="activity2-option-icon">

                                                    {currentRound.type ===
                                                        "height" &&
                                                        "📏"}

                                                    {currentRound.type ===
                                                        "hairLength" &&
                                                        "💇"}

                                                    {currentRound.type ===
                                                        "hairType" &&
                                                        "〰️"}

                                                    {currentRound.type ===
                                                        "hairColor" &&
                                                        "🎨"}

                                                    {currentRound.type ===
                                                        "eyes" &&
                                                        "👁️"}

                                                    {currentRound.type ===
                                                        "glasses" &&
                                                        (
                                                            option.value ===
                                                            "yes"
                                                                ? "👓"
                                                                : "🙂"
                                                        )
                                                    }

                                                </span>

                                                <span>
                                                    {option.label}
                                                </span>

                                            </button>

                                        )
                                    )}

                                </div>


                                {/* =====================================
                                    MIC AREA
                                    
                                    IMPORTANT:
                                    No sentence preview.
                                    No "YOUR SENTENCE".
                                    No expected sentence.
                                ===================================== */}

                                {selectedOption && (

                                    <div className="physical-appearance-activity2-speaking-card">

                                        <div className="activity2-speaking-icon">
                                            🎤
                                        </div>

                                        <div>

                                            <h3>
                                                Make a sentence
                                            </h3>

                                            <p>
                                                Tell me your sentence about your partner.
                                            </p>

                                        </div>

                                    </div>

                                )}


                                {/* =====================================
                                    MIC
                                ===================================== */}

                                {selectedOption && (

                                    <button
                                        type="button"
                                        className={
                                            isListening
                                                ? "physical-appearance-activity2-mic listening"
                                                : "physical-appearance-activity2-mic"
                                        }
                                        onClick={startListening}
                                        disabled={
                                            celebrating ||
                                            checkingAnswer ||
                                            waitingForSentence ||
                                            isListening
                                        }
                                    >

                                        <span>
                                            {isListening
                                                ? "🔴"
                                                : "🎤"
                                            }
                                        </span>

                                        <div>

                                            <strong>
                                                {isListening
                                                    ? "Listening..."
                                                    : checkingAnswer
                                                        ? "Checking..."
                                                        : "Tap to Speak"
                                                }
                                            </strong>

                                            <small>
                                                {isListening
                                                    ? "Tell me your sentence"
                                                    : checkingAnswer
                                                        ? "Please wait..."
                                                        : "Use your microphone"
                                                }
                                            </small>

                                        </div>

                                    </button>

                                )}


                                {/* =====================================
                                    SPEECH RESULT
                                ===================================== */}

                                {speechText && (

                                    <div className="physical-appearance-activity2-speech-result">

                                        <span>
                                            🗣️
                                        </span>

                                        <div>

                                            <small>
                                                YOU SAID
                                            </small>

                                            <strong>
                                                "{speechText}"
                                            </strong>

                                        </div>

                                    </div>

                                )}


                                {/* =====================================
                                    SPEECH STATUS
                                ===================================== */}

                                {speechStatus && (

                                    <div className="physical-appearance-activity2-speech-status">

                                        {speechStatus}

                                    </div>

                                )}

                            </>

                        ) : (

                            /* =================================================
                               FINAL DESCRIPTION
                            ================================================= */

                            <div className="physical-appearance-activity2-final-section">


                                {/* =====================================
                                    FINAL TITLE
                                ===================================== */}

                                <div className="physical-appearance-activity2-final-title">

                                    <span>
                                        ⭐
                                    </span>

                                    <div>

                                        <h2>
                                            Tell Me About Your Partner!
                                        </h2>

                                        <p>
                                            Use the features you selected and describe your partner.
                                        </p>

                                    </div>

                                </div>


                                {/* =====================================
                                    CHARACTER PREVIEW
                                ===================================== */}

                                <div className="physical-appearance-activity2-character-preview">

                                    <div
                                        className={
                                            `activity2-avatar ${selections.height || ""}`
                                        }
                                    >

                                        <div
                                            className={
                                                `activity2-hair ${avatarHairClass}`
                                            }
                                        />


                                        <div className="activity2-face">

                                            <div className="activity2-eyes">

                                                <span
                                                    className={
                                                        selections.eyes ||
                                                        "brown"
                                                    }
                                                />

                                                <span
                                                    className={
                                                        selections.eyes ||
                                                        "brown"
                                                    }
                                                />

                                            </div>


                                            <div className="activity2-mouth" />

                                        </div>


                                        {selections.glasses === "yes" && (

                                            <div className="activity2-glasses">

                                                <span />
                                                <span />

                                            </div>

                                        )}


                                        <div className="activity2-body">

                                            <div className="activity2-shirt">
                                                👕
                                            </div>

                                        </div>

                                    </div>


                                    <div className="activity2-feature-summary">

                                        <h3>
                                            Your Partner
                                        </h3>


                                        <div className="activity2-summary-tags">

                                            {selections.height && (

                                                <span>
                                                    📏 {selections.height}
                                                </span>

                                            )}


                                            {selections.hairLength && (

                                                <span>
                                                    💇 {selections.hairLength} hair
                                                </span>

                                            )}


                                            {selections.hairType && (

                                                <span>
                                                    〰️ {selections.hairType} hair
                                                </span>

                                            )}


                                            {selections.hairColor && (

                                                <span>
                                                    🎨 {selections.hairColor} hair
                                                </span>

                                            )}


                                            {selections.eyes && (

                                                <span>
                                                    👁️ {selections.eyes} eyes
                                                </span>

                                            )}


                                            {selections.glasses ===
                                                "yes" && (

                                                    <span>
                                                        👓 wears glasses
                                                    </span>

                                                )}


                                            {selections.glasses ===
                                                "no" && (

                                                    <span>
                                                        🙂 no glasses
                                                    </span>

                                                )}

                                        </div>

                                    </div>

                                </div>


                                {/* =====================================
                                    FINAL SPEAKING INSTRUCTION
                                    
                                    NO EXAMPLE SENTENCE.
                                ===================================== */}

                                <div className="physical-appearance-activity2-speaking-card">

                                    <div className="activity2-speaking-icon">
                                        🎤
                                    </div>

                                    <div>

                                        <h3>
                                            Tell me about your partner
                                        </h3>

                                        <p>
                                            Speak in complete English sentences.
                                        </p>

                                    </div>

                                </div>


                                {/* =====================================
                                    FINAL MIC
                                ===================================== */}

                                <button
                                    type="button"
                                    className={
                                        isListening
                                            ? "physical-appearance-activity2-mic listening"
                                            : "physical-appearance-activity2-mic"
                                    }
                                    onClick={startListening}
                                    disabled={
                                        celebrating ||
                                        checkingAnswer ||
                                        isListening
                                    }
                                >

                                    <span>
                                        {isListening
                                            ? "🔴"
                                            : "🎤"
                                        }
                                    </span>


                                    <div>

                                        <strong>
                                            {isListening
                                                ? "Listening..."
                                                : checkingAnswer
                                                    ? "Checking..."
                                                    : "Tap to Speak"
                                            }
                                        </strong>


                                        <small>
                                            {isListening
                                                ? "Tell me about your partner"
                                                : checkingAnswer
                                                    ? "Please wait..."
                                                    : "Use your microphone"
                                            }
                                        </small>

                                    </div>

                                </button>


                                {/* =====================================
                                    FINAL SPEECH RESULT
                                ===================================== */}

                                {speechText && (

                                    <div className="physical-appearance-activity2-speech-result">

                                        <span>
                                            🗣️
                                        </span>

                                        <div>

                                            <small>
                                                YOU SAID
                                            </small>

                                            <strong>
                                                "{speechText}"
                                            </strong>

                                        </div>

                                    </div>

                                )}


                                {/* =====================================
                                    FINAL STATUS
                                ===================================== */}

                                {speechStatus && (

                                    <div className="physical-appearance-activity2-speech-status">

                                        {speechStatus}

                                    </div>

                                )}

                            </div>

                        )}

                    </div>

                </div>

            </div>

        </div>

    );

}


export default PhysicalAppearanceActivity2;