import React, { useEffect, useRef, useState } from "react";
import "./PlanItTogetherActivity.css";

import teacher1 from "../../assets/teacher1.png";
import planTogetherBg from "../../assets/planTogetherBg.png";
import weekendCalendar from "../../assets/weekendCalendar.png";
import clockImg from "../../assets/clock.png";

import football from "../../assets/football2.png";
import book from "../../assets/book.png";
import lunch from "../../assets/lunch.png";
import walk from "../../assets/walk.png";

import library from "../../assets/library.png";
import park from "../../assets/park.png";

/* =====================================================
   CHARACTER IMAGES
===================================================== */

import boyCharacter from "../../assets/boyCharacter.png";
import girlCharacter from "../../assets/girlCharacter.png";

/* =====================================================
   BACKEND URL
===================================================== */

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

/* =====================================================
   SPEECH RECOGNITION
===================================================== */

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

/* =====================================================
   COMPONENT
===================================================== */

function PlanItTogetherActivity({
  onBack,
  onFinish,
  onSkip,
  userName,
}) {
  /* =====================================================
     STEPS

     0 = Intro
     1 = Day speaking
     2 = Activity speaking
     3 = Time selection
     4 = Activity selection
     5 = Time speaking
     6 = Place speaking
     7 = Final confirmation
     8 = Complete
     9 = Character Selection
  ===================================================== */

  const [step, setStep] = useState(0);

  /* =====================================================
     SPEECH
  ===================================================== */

  const [isListening, setIsListening] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const [userText, setUserText] = useState("");
  const [teacherResponse, setTeacherResponse] = useState("");
  const [feedbackType, setFeedbackType] = useState("");

  /* =====================================================
     PLAN
  ===================================================== */

  const [selectedTime, setSelectedTime] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");

  const [planDay, setPlanDay] = useState("");
  const [planPlace, setPlanPlace] = useState("");
  const [planTime, setPlanTime] = useState("");
  const [planActivity, setPlanActivity] = useState("");

  /* =====================================================
     HISTORY
  ===================================================== */

  const [previousMessages, setPreviousMessages] = useState([]);

  /* =====================================================
     CHARACTER
  ===================================================== */

  const [selectedCharacter, setSelectedCharacter] = useState("");

  /* =====================================================
     REFS
  ===================================================== */

  const recognitionRef = useRef(null);
  const requestInProgressRef = useRef(false);
  const transitionTimeoutRef = useRef(null);

  const speechResultReceivedRef = useRef(false);

  const recognitionSessionRef = useRef(0);

  /* =====================================================
     CLEANUP
  ===================================================== */

  useEffect(() => {
    return () => {
      recognitionSessionRef.current += 1;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch (error) {}
      }

      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  /* =====================================================
     TEACHER VOICE
  ===================================================== */

  const speakTeacher = (text) => {
    if (!text || !window.speechSynthesis) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();

    const preferredVoice =
      voices.find((voice) =>
        /Google UK English Female/i.test(voice.name)
      ) ||
      voices.find((voice) =>
        /Google US English/i.test(voice.name)
      ) ||
      voices.find((voice) =>
        /Jenny/i.test(voice.name)
      ) ||
      voices.find((voice) =>
        /Aria/i.test(voice.name)
      ) ||
      voices.find((voice) =>
        /Samantha/i.test(voice.name)
      ) ||
      voices.find((voice) =>
        /Zira/i.test(voice.name)
      );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  /* =====================================================
     DEFAULT QUESTIONS
  ===================================================== */

  const getTeacherSpeech = (currentStep = step) => {
    switch (currentStep) {
      case 1:
        return "Are you free this Saturday?";

      case 2:
        return "What would you like to do?";

      case 5:
        return "What time would you like to meet?";

      case 6:
        return "Where would you like to go?";

      case 7:
        return "Is our plan correct?";

      default:
        return "";
    }
  };

  /* =====================================================
     DISPLAY TEACHER SPEECH
  ===================================================== */

  const getDisplayedTeacherSpeech = () => {
    if (teacherResponse) {
      return teacherResponse;
    }

    return getTeacherSpeech(step);
  };

  /* =====================================================
     CURRENT BACKEND STEP
  ===================================================== */

  const getCurrentBackendStep = () => {
    switch (step) {
      case 1:
        return "day";

      case 2:
        return "activity";

      case 5:
        return "time";

      case 6:
        return "place";

      case 7:
        return "final";

      default:
        return "";
    }
  };

  /* =====================================================
     START ACTIVITY

     LET'S GO → CHARACTER SELECTION
  ===================================================== */

  const startActivity = () => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {}
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    recognitionSessionRef.current += 1;

    setStep(9);

    setUserText("");
    setTeacherResponse("");
    setFeedbackType("");

    setIsListening(false);
    setIsChecking(false);

    setSelectedTime("");
    setSelectedActivity("");

    setPlanDay("");
    setPlanPlace("");
    setPlanTime("");
    setPlanActivity("");

    setPreviousMessages([]);

    setSelectedCharacter("");

    requestInProgressRef.current = false;
  };

  /* =====================================================
     CHARACTER SELECTION
  ===================================================== */

  const chooseCharacter = (character) => {
    setSelectedCharacter(character);

    setUserText("");
    setTeacherResponse("");
    setFeedbackType("");

    setIsListening(false);
    setIsChecking(false);

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    transitionTimeoutRef.current = setTimeout(() => {
      setStep(1);

      setTimeout(() => {
        speakTeacher("Are you free this Saturday?");
      }, 250);
    }, 300);
  };

  /* =====================================================
     STOP LISTENING
  ===================================================== */

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {}
    }

    setIsListening(false);
  };

  /* =====================================================
     NO SPEECH
  ===================================================== */

  const handleNoSpeech = () => {
    if (requestInProgressRef.current) {
      return;
    }

    const message =
      "Sorry, I couldn't hear you. Please try again.";

    setUserText("");
    setTeacherResponse(message);
    setFeedbackType("wrong");

    speakTeacher(message);
  };

  /* =====================================================
     START LISTENING
  ===================================================== */

  const startListening = () => {
    if (isChecking || requestInProgressRef.current) {
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    if (!SpeechRecognition) {
      const message =
        "Speech recognition is not supported in this browser. Please use Chrome.";

      setTeacherResponse(message);
      setFeedbackType("wrong");

      speakTeacher(message);

      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (error) {}
    }

    const sessionId = recognitionSessionRef.current + 1;

    recognitionSessionRef.current = sessionId;

    speechResultReceivedRef.current = false;

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onaudiostart = () => {
      if (recognitionSessionRef.current !== sessionId) {
        return;
      }

      console.log("🎤 Audio started");
    };

    recognition.onsoundstart = () => {
      if (recognitionSessionRef.current !== sessionId) {
        return;
      }

      console.log("🔊 Sound detected");
    };

    recognition.onspeechstart = () => {
      if (recognitionSessionRef.current !== sessionId) {
        return;
      }

      console.log("🗣️ Speech detected");
    };

    recognition.onstart = () => {
      if (recognitionSessionRef.current !== sessionId) {
        return;
      }

      console.log("🎤 Recognition STARTED");

      setIsListening(true);

      setUserText("");
      setFeedbackType("");
    };

    recognition.onresult = (event) => {
      if (recognitionSessionRef.current !== sessionId) {
        return;
      }

      console.log(
        "🎤 SPEECH RESULT EVENT:",
        event
      );

      let transcript = "";

      try {
        for (
          let i = event.resultIndex;
          i < event.results.length;
          i++
        ) {
          const result = event.results[i];

          if (
            result &&
            result[0] &&
            result.isFinal
          ) {
            transcript +=
              " " + result[0].transcript;
          }
        }

        if (!transcript.trim()) {
          const firstResult =
            event?.results?.[0]?.[0]?.transcript || "";

          transcript = firstResult;
        }
      } catch (error) {
        console.error(
          "❌ Transcript reading error:",
          error
        );
      }

      transcript = transcript.trim();

      console.log(
        "🎤 FINAL TRANSCRIPT:",
        transcript
      );

      if (transcript) {
        speechResultReceivedRef.current = true;

        setIsListening(false);

        setUserText(transcript);

        setFeedbackType("");

        handleSpeechAnswer(transcript);

        return;
      }

      console.log(
        "🎤 Result event contained no usable transcript."
      );
    };

    recognition.onerror = (event) => {
      if (recognitionSessionRef.current !== sessionId) {
        return;
      }

      console.log(
        "🎤 Speech Recognition Error:",
        event?.error,
        event
      );

      setIsListening(false);

      if (event?.error === "aborted") {
        return;
      }

      if (speechResultReceivedRef.current) {
        return;
      }

      if (event?.error === "no-speech") {
        const message =
          "I didn't hear anything. Please try speaking again.";

        setUserText("");
        setTeacherResponse(message);
        setFeedbackType("wrong");

        speakTeacher(message);

        return;
      }

      if (event?.error === "audio-capture") {
        const message =
          "Mujhe microphone se awaaz nahi mil rahi. Please microphone check karo aur phir try karo.";

        setTeacherResponse(message);
        setFeedbackType("wrong");

        speakTeacher(message);

        return;
      }

      if (event?.error === "not-allowed") {
        const message =
          "Please allow microphone permission and try again.";

        setTeacherResponse(message);
        setFeedbackType("wrong");

        speakTeacher(message);

        return;
      }

      if (event?.error === "service-not-allowed") {
        const message =
          "Speech recognition permission is not available. Please check your browser settings.";

        setTeacherResponse(message);
        setFeedbackType("wrong");

        speakTeacher(message);

        return;
      }

      if (event?.error === "network") {
        const message =
          "Speech recognition needs an internet connection. Please try again.";

        setTeacherResponse(message);
        setFeedbackType("wrong");

        speakTeacher(message);

        return;
      }

      const message =
        "I couldn't hear you. Please try again.";

      setTeacherResponse(message);
      setFeedbackType("wrong");

      speakTeacher(message);
    };

    recognition.onend = () => {
      if (recognitionSessionRef.current !== sessionId) {
        return;
      }

      console.log(
        "🎤 Recognition ENDED",
        {
          speechReceived:
            speechResultReceivedRef.current,
        }
      );

      setIsListening(false);
    };

    recognitionRef.current = recognition;

    setUserText("");
    setTeacherResponse("");
    setFeedbackType("");

    try {
      recognition.start();

      console.log(
        "🎤 recognition.start() called"
      );
    } catch (error) {
      console.error(
        "❌ Recognition Start Error:",
        error
      );

      setIsListening(false);

      if (
        error?.name === "InvalidStateError"
      ) {
        try {
          recognition.stop();
        } catch (stopError) {}
      } else {
        const message =
          "I couldn't start the microphone. Please try again.";

        setTeacherResponse(message);
        setFeedbackType("wrong");

        speakTeacher(message);
      }
    }
  };

  /* =====================================================
     HANDLE SPEECH ANSWER
  ===================================================== */

  const handleSpeechAnswer = (text) => {
    const cleanText = String(
      text || ""
    ).trim();

    if (!cleanText) {
      handleNoSpeech();
      return;
    }

    console.log(
      "🗣️ Sending actual child speech:",
      cleanText
    );

    if (
      step === 1 ||
      step === 2 ||
      step === 5 ||
      step === 6 ||
      step === 7
    ) {
      checkSpeakingAnswer(cleanText);
    }
  };

  /* =====================================================
     UPDATE PLAN
  ===================================================== */

  const updatePlanFromBackend = (
    backendPlan
  ) => {
    if (!backendPlan) {
      return;
    }

    if (
      backendPlan.day !== null &&
      backendPlan.day !== undefined
    ) {
      const day =
        String(
          backendPlan.day
        ).trim();

      setPlanDay(day);
    }

    if (
      backendPlan.activity !== null &&
      backendPlan.activity !== undefined
    ) {
      const activity =
        String(
          backendPlan.activity
        ).trim();

      setPlanActivity(activity);
      setSelectedActivity(activity);
    }

    if (
      backendPlan.place !== null &&
      backendPlan.place !== undefined
    ) {
      const place =
        String(
          backendPlan.place
        ).trim();

      setPlanPlace(place);
    }

    if (
      backendPlan.time !== null &&
      backendPlan.time !== undefined
    ) {
      const time =
        String(
          backendPlan.time
        ).trim();

      setPlanTime(time);
      setSelectedTime(time);
    }
  };

  /* =====================================================
     BACKEND STEP → FRONTEND STEP
  ===================================================== */

  const getFrontendStepFromBackend = (
    nextStep
  ) => {
    switch (
      String(nextStep || "")
        .trim()
        .toLowerCase()
    ) {
      case "day":
        return 1;

      case "activity":
        return 2;

      case "place":
        return 6;

      case "time":
        return 5;

      case "final":
        return 7;

      default:
        return null;
    }
  };

  /* =====================================================
     MOVE TO NEXT STEP
  ===================================================== */

  const moveToNextStep = (
    backendData
  ) => {
    if (!backendData) {
      return;
    }

    if (
      transitionTimeoutRef.current
    ) {
      clearTimeout(
        transitionTimeoutRef.current
      );
    }

    if (
      backendData.conversationComplete === true
    ) {
      setFeedbackType("correct");

      transitionTimeoutRef.current =
        setTimeout(() => {
          setStep(8);

          setUserText("");
          setTeacherResponse("");
          setFeedbackType("");
        }, 300);

      return;
    }

    const nextFrontendStep =
      getFrontendStepFromBackend(
        backendData.nextStep
      );

    if (
      nextFrontendStep === null
    ) {
      return;
    }

    transitionTimeoutRef.current =
      setTimeout(() => {
        setStep(
          nextFrontendStep
        );

        setFeedbackType("");
      }, 250);
  };

  /* =====================================================
     BACKEND CHECK
  ===================================================== */

  const checkSpeakingAnswer =
    async (text) => {
      const cleanText = String(
        text || ""
      ).trim();

      if (!cleanText) {
        handleNoSpeech();
        return;
      }

      if (
        requestInProgressRef.current
      ) {
        return;
      }

      requestInProgressRef.current = true;

      setIsChecking(true);

      setTeacherResponse("");
      setFeedbackType("");

      try {
        const currentBackendStep =
          getCurrentBackendStep();

        if (!currentBackendStep) {
          return;
        }

        const currentPlan = {
          day: planDay || "",

          activity:
            planActivity ||
            selectedActivity ||
            "",

          place:
            planPlace || "",

          time:
            planTime ||
            selectedTime ||
            "",
        };

        const currentQuestion =
          getTeacherSpeech(step);

        const updatedPreviousMessages = [
          ...previousMessages.slice(-3),

          {
            role: "student",

            message:
              cleanText,

            step:
              currentBackendStep,
          },
        ];

        const payload = {
          message:
            cleanText,

          question:
            currentQuestion,

          userName:
            userName ||
            "Student",

          currentStep:
            currentBackendStep,

          selectedDay:
            currentPlan.day,

          selectedActivity:
            currentPlan.activity,

          selectedPlace:
            currentPlan.place,

          selectedTime:
            currentPlan.time,

          previousMessages:
            updatedPreviousMessages,

          context:
            "Plan It Together",
        };

        console.log(
          "📤 Plan It Together:",
          {
            step:
              currentBackendStep,

            answer:
              cleanText,

            plan:
              currentPlan,
          }
        );

        const response =
          await fetch(
            `${API_URL}/api/plan-it-together`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        const rawResponse =
          await response.text();

        console.log(
          "📥 Plan It Together:",
          rawResponse
        );

        if (!response.ok) {
          throw new Error(
            `Backend request failed: ${response.status}`
          );
        }

        let data;

        try {
          data =
            JSON.parse(
              rawResponse
            );
        } catch (error) {
          console.error(
            "❌ Invalid backend JSON:",
            rawResponse
          );

          throw new Error(
            "Backend returned invalid JSON."
          );
        }

        if (
          !data ||
          data.success === false
        ) {
          throw new Error(
            data?.message ||
              "Unable to check answer."
          );
        }

        updatePlanFromBackend(
          data.updatedPlan
        );

        const teacherMessage =
          data.teacherResponse ||
          data.feedback ||
          "";

        const finalHistory = [
          ...updatedPreviousMessages,

          {
            role:
              "teacher",

            message:
              teacherMessage,

            step:
              currentBackendStep,
          },
        ].slice(-6);

        setPreviousMessages(
          finalHistory
        );

        const responseText =
          data.teacherResponse ||
          data.feedback ||
          "Let's try again.";

        setTeacherResponse(
          responseText
        );

        if (
          data.isCorrect !== true
        ) {
          setFeedbackType(
            "wrong"
          );

          speakTeacher(
            responseText
          );

          return;
        }

        setFeedbackType(
          "correct"
        );

        speakTeacher(
          responseText
        );

        moveToNextStep(
          data
        );
      } catch (error) {
        console.error(
          "❌ Plan It Together Error:",
          error
        );

        setFeedbackType(
          "wrong"
        );

        const message =
          "Mujhe tumhara answer check karne mein thodi problem aa rahi hai. Please ek baar phir try karo.";

        setTeacherResponse(
          message
        );

        speakTeacher(
          message
        );
      } finally {
        requestInProgressRef.current =
          false;

        setIsChecking(false);
      }
    };

  /* =====================================================
     TIME SELECTION
  ===================================================== */

  const chooseTime = (
    time
  ) => {
    setSelectedTime(time);
    setPlanTime(time);

    setTeacherResponse("");
    setFeedbackType("");

    if (
      transitionTimeoutRef.current
    ) {
      clearTimeout(
        transitionTimeoutRef.current
      );
    }

    transitionTimeoutRef.current =
      setTimeout(() => {
        setStep(4);
      }, 250);
  };

  /* =====================================================
     ACTIVITY SELECTION
  ===================================================== */

  const chooseActivity = (
    activity
  ) => {
    setSelectedActivity(
      activity
    );

    setPlanActivity(
      activity
    );

    setTeacherResponse("");
    setFeedbackType("");

    if (
      transitionTimeoutRef.current
    ) {
      clearTimeout(
        transitionTimeoutRef.current
      );
    }

    transitionTimeoutRef.current =
      setTimeout(() => {
        setStep(5);

        setTimeout(() => {
          speakTeacher(
            "What time would you like to meet?"
          );
        }, 150);
      }, 250);
  };

  /* =====================================================
     FINISH
  ===================================================== */

  const finishActivity = () => {
    recognitionSessionRef.current += 1;

    if (
      recognitionRef.current
    ) {
      try {
        recognitionRef.current.onresult =
          null;

        recognitionRef.current.onerror =
          null;

        recognitionRef.current.onend =
          null;

        recognitionRef.current.stop();
      } catch (error) {}
    }

    if (
      window.speechSynthesis
    ) {
      window.speechSynthesis.cancel();
    }

    if (
      transitionTimeoutRef.current
    ) {
      clearTimeout(
        transitionTimeoutRef.current
      );
    }

    setIsListening(false);

    if (onFinish) {
      onFinish();
    }
  };

  /* =====================================================
     BACK
     
     ALWAYS GO TO CALLING PAGE
  ===================================================== */

  const handleBack = () => {
    if (isChecking) {
      return;
    }

    recognitionSessionRef.current += 1;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (error) {}
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (transitionTimeoutRef.current) {
      clearTimeout(
        transitionTimeoutRef.current
      );
    }

    setIsListening(false);
    setIsChecking(false);

    /*
      BACK ALWAYS CALLS THE PAGE
      THAT OPENED THIS ACTIVITY.
    */

    if (onBack) {
      onBack();
    }
  };

  /* =====================================================
     SKIP
     
     ALWAYS GO TO NEXT ACTIVITY INTRO
  ===================================================== */

  const handleSkip = () => {
    if (isChecking) {
      return;
    }

    recognitionSessionRef.current += 1;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (error) {}
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (transitionTimeoutRef.current) {
      clearTimeout(
        transitionTimeoutRef.current
      );
    }

    setIsListening(false);
    setIsChecking(false);

    /*
      SKIP MUST GO TO NEXT ACTIVITY INTRO.
    */

    if (onSkip) {
      onSkip();
      return;
    }

    /*
      Fallback.
    */

    if (onFinish) {
      onFinish();
    }
  };

  /* =====================================================
     CHILD SPEECH
  ===================================================== */

  const getChildSpeech = () => {
    if (userText) {
      return userText;
    }

    return "Your turn! Speak your idea…";
  };

  /* =====================================================
     PROGRESS
  ===================================================== */

  const progressCount = 9;

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div
      className={`plan-together-page plan-step-${step}`}
    >
      <div className="plan-bg-overlay"></div>

      {/* =================================================
          MAIN GAME CONTAINER
      ================================================= */}

      <div className="plan-game-container">

        {/* =================================================
            TOP BAR
        ================================================= */}

        {step !== 8 && (
          <div className="plan-top-bar">

            <button
              type="button"
              className="plan-top-btn plan-back-btn"
              onClick={handleBack}
              disabled={isChecking}
            >
              <span className="back-arrow">
                ‹
              </span>

              Back
            </button>

            <div className="plan-title">
              PLAN IT TOGETHER
            </div>

            <button
              type="button"
              className="plan-top-btn plan-skip-btn"
              onClick={handleSkip}
              disabled={isChecking}
            >
              Skip
            </button>

          </div>
        )}

        {/* =================================================
            INTRO
        ================================================= */}

        {step === 0 && (
          <div className="plan-intro-screen">

            <div className="intro-teacher-section">

              <img
                src={teacher1}
                alt="Miss Uroosa"
                className="intro-teacher"
              />

            </div>

            <div className="intro-content">

              <div className="calendar-title-icon">

                <img
                  src={weekendCalendar}
                  alt="Calendar"
                />

              </div>

              <div className="intro-title-cloud">

                <span className="cloud-decoration cloud-heart-left">
                  ♥
                </span>

                <span className="cloud-decoration cloud-heart-right">
                  ♥
                </span>

                <h1>
                  PLAN IT
                  <br />
                  TOGETHER!
                </h1>

              </div>

              <p className="intro-subtitle">
                Let's make a plan together!
              </p>

              <button
                type="button"
                className="lets-go-btn"
                onClick={startActivity}
              >
                LET'S GO!
              </button>

            </div>

          </div>
        )}

        {/* =================================================
            CHARACTER SELECTION
        ================================================= */}

        {step === 9 && (
          <div className="character-selection-screen">

            <div className="character-selection-card">

              <div className="character-selection-title">
                CHOOSE YOUR CHARACTER
              </div>

              <p className="character-selection-subtitle">
                Who will make the plan with Miss Uroosa?
              </p>

              <div className="character-selection-options">

                {/* ===============================
                    BOY
                =============================== */}

                <button
                  type="button"
                  className={`character-choice ${
                    selectedCharacter === "boy"
                      ? "character-choice-selected"
                      : ""
                  }`}
                  onClick={() =>
                    chooseCharacter("boy")
                  }
                >

                  <div className="character-choice-image">

                    <img
                      src={boyCharacter}
                      alt="Boy"
                    />

                  </div>

                  <div className="character-choice-name">
                    BOY
                  </div>

                </button>

                {/* ===============================
                    GIRL
                =============================== */}

                <button
                  type="button"
                  className={`character-choice ${
                    selectedCharacter === "girl"
                      ? "character-choice-selected"
                      : ""
                  }`}
                  onClick={() =>
                    chooseCharacter("girl")
                  }
                >

                  <div className="character-choice-image">

                    <img
                      src={girlCharacter}
                      alt="Girl"
                    />

                  </div>

                  <div className="character-choice-name">
                    GIRL
                  </div>

                </button>

              </div>

            </div>

          </div>
        )}

        {/* =================================================
            ACTIVITY
        ================================================= */}

        {step >= 1 &&
          step <= 7 && (
            <div className="plan-activity-area">

              {/* =================================================
                  TEACHER
              ================================================= */}

              <div className="plan-teacher-area">

                <img
                  src={teacher1}
                  alt="Miss Uroosa"
                  className="plan-teacher"
                />

                <div className="teacher-name-tag">
                  Miss Uroosa
                </div>

              </div>

              {/* =================================================
                  TEACHER QUESTION / RESPONSE
              ================================================= */}

              <div className="teacher-speech">
                {getDisplayedTeacherSpeech()}
              </div>

              {/* =================================================
                  SELECTED CHARACTER
              ================================================= */}

              {selectedCharacter &&
                (
                  step === 2 ||
                  step === 5 ||
                  step === 6 ||
                  step === 7
                ) && (
                  <div className="selected-child-character">

                    <img
                      src={
                        selectedCharacter === "boy"
                          ? boyCharacter
                          : girlCharacter
                      }
                      alt={
                        selectedCharacter === "boy"
                          ? "Boy"
                          : "Girl"
                      }
                    />

                  </div>
                )}

              {/* =================================================
                  CALENDAR
              ================================================= */}

              {(step === 1 ||
                step === 2) && (
                <img
                  src={weekendCalendar}
                  alt="Weekend Calendar"
                  className="weekend-calendar"
                />
              )}

              {/* =================================================
                  CHILD RESPONSE - ACTIVITY
              ================================================= */}

              {step === 2 && (
                <div className="child-speech">

                  {getChildSpeech()}

                  {userText && (
                    <span className="success-check">
                      ✓
                    </span>
                  )}

                </div>
              )}

              {/* =================================================
                  CHILD RESPONSE - TIME
              ================================================= */}

              {step === 5 && (
                <div className="child-speech child-response">

                  {getChildSpeech()}

                  {userText && (
                    <span className="success-check">
                      ✓
                    </span>
                  )}

                </div>
              )}

              {/* =================================================
                  CHILD RESPONSE - PLACE
              ================================================= */}

              {step === 6 && (
                <div className="child-speech child-response">

                  {getChildSpeech()}

                  {userText && (
                    <span className="success-check">
                      ✓
                    </span>
                  )}

                </div>
              )}

              {/* =================================================
                  CHILD RESPONSE - FINAL
              ================================================= */}

              {step === 7 && (
                <div className="child-speech child-response final-response">

                  {getChildSpeech()}

                  {userText && (
                    <span className="success-check">
                      ✓
                    </span>
                  )}

                </div>
              )}

              {/* =================================================
                  OUR PLAN
              ================================================= */}

              {step >= 3 && (
                <div className="our-plan-card">

                  <div className="our-plan-header">

                    <span className="mini-sparkle">
                      ✦
                    </span>

                    OUR PLAN

                    <span className="mini-sparkle">
                      ✦
                    </span>

                  </div>

                  <div className="plan-day">
                    {planDay
                      ? planDay.toUpperCase()
                      : "NOT DECIDED"}
                  </div>

                  <div className="plan-info-row">

                    <div className="plan-info-icon location-icon">
                      📍
                    </div>

                    <div className="plan-info-content">

                      <span>
                        Place
                      </span>

                      <strong>
                        {planPlace ||
                          "—"}
                      </strong>

                    </div>

                  </div>

                  <div className="plan-info-row">

                    <div className="plan-info-icon time-icon">
                      ◷
                    </div>

                    <div className="plan-info-content">

                      <span>
                        Time
                      </span>

                      <strong>
                        {planTime ||
                          "—"}
                      </strong>

                    </div>

                  </div>

                  <div className="plan-info-row">

                    <div className="plan-info-icon activity-icon">
                      ⭐
                    </div>

                    <div className="plan-info-content">

                      <span>
                        Activity
                      </span>

                      <strong>
                        {planActivity ||
                          "—"}
                      </strong>

                    </div>

                  </div>

                  {planPlace &&
                    planPlace
                      .toLowerCase()
                      .trim() ===
                      "park" && (
                      <img
                        src={park}
                        alt="Park"
                        className="plan-place-image"
                      />
                  )}

                  {planPlace &&
                    planPlace
                      .toLowerCase()
                      .trim() ===
                      "library" && (
                      <img
                        src={library}
                        alt="Library"
                        className="plan-place-image"
                      />
                  )}

                </div>
              )}

              {/* =================================================
                  STEP 3 - TIME SELECTION
              ================================================= */}

              {step === 3 && (
                <div className="time-selection-area">

                  <div className="time-selection-title">
                    Pick a time
                  </div>

                  <div className="time-selection-content">

                    <div className="digital-time-box">
                      {selectedTime ||
                        "Choose a time"}
                    </div>

                    <img
                      src={clockImg}
                      alt="Clock"
                      className="large-clock"
                    />

                  </div>

                  <div className="time-options">

                    <button
                      type="button"
                      className="time-option"
                      onClick={() =>
                        chooseTime(
                          "4:00 PM"
                        )
                      }
                    >
                      4:00 PM
                    </button>

                    <button
                      type="button"
                      className="time-option"
                      onClick={() =>
                        chooseTime(
                          "5:00 PM"
                        )
                      }
                    >
                      5:00 PM
                    </button>

                    <button
                      type="button"
                      className="time-option"
                      onClick={() =>
                        chooseTime(
                          "6:00 PM"
                        )
                      }
                    >
                      6:00 PM
                    </button>

                  </div>

                </div>
              )}

              {/* =================================================
                  STEP 4 - ACTIVITY SELECTION
              ================================================= */}

              {step === 4 && (
                <div className="activity-selection-area">

                  <div className="activity-selection-title">
                    Choose an activity
                  </div>

                  <div className="activity-options">

                    {/* FOOTBALL */}

                    <button
                      type="button"
                      className="activity-option"
                      onClick={() =>
                        chooseActivity(
                          "Play football"
                        )
                      }
                    >

                      <img
                        src={football}
                        alt="Football"
                      />

                      <span>
                        Play
                        <br />
                        football
                      </span>

                    </button>

                    {/* LUNCH */}

                    <button
                      type="button"
                      className="activity-option"
                      onClick={() =>
                        chooseActivity(
                          "Have lunch"
                        )
                      }
                    >

                      <img
                        src={lunch}
                        alt="Lunch"
                      />

                      <span>
                        Have
                        <br />
                        lunch
                      </span>

                    </button>

                    {/* WALK */}

                    <button
                      type="button"
                      className="activity-option"
                      onClick={() =>
                        chooseActivity(
                          "Go for a walk"
                        )
                      }
                    >

                      <img
                        src={walk}
                        alt="Walk"
                      />

                      <span>
                        Go for
                        <br />
                        a walk
                      </span>

                    </button>

                    {/* BOOK */}

                    <button
                      type="button"
                      className="activity-option"
                      onClick={() =>
                        chooseActivity(
                          "Read a book"
                        )
                      }
                    >

                      <img
                        src={book}
                        alt="Book"
                      />

                      <span>
                        Read a
                        <br />
                        book
                      </span>

                    </button>

                  </div>

                </div>
              )}

              {/* =================================================
                  PLAN CHANGE - STEP 5
              ================================================= */}

              {step === 5 && (
                <div className="plan-change-overlay">

                  <div className="plan-change-banner">

                    <span className="warning-symbol">
                      !
                    </span>

                    PLAN CHANGE!

                  </div>

                  <div className="change-decoration change-one">
                    ✦
                  </div>

                  <div className="change-decoration change-two">
                    ♥
                  </div>

                </div>
              )}

              {/* =================================================
                  PLAN CHANGE - STEP 6
              ================================================= */}

              {step === 6 && (
                <div className="plan-change-overlay">

                  <div className="plan-change-banner">

                    <span className="warning-symbol">
                      !
                    </span>

                    PLAN CHANGE!

                  </div>

                  <div className="change-decoration change-one">
                    ✦
                  </div>

                  <div className="change-decoration change-two">
                    ♥
                  </div>

                </div>
              )}

              {/* =================================================
                  MICROPHONE
              ================================================= */}

              {(step === 1 ||
                step === 2 ||
                step === 5 ||
                step === 6 ||
                step === 7) && (

                <div className="mic-area">

                  <button
                    type="button"
                    className={`mic-button ${
                      isListening
                        ? "mic-listening"
                        : ""
                    }`}
                    onClick={
                      startListening
                    }
                    disabled={
                      isChecking
                    }
                  >

                    <span className="mic-ring ring-one"></span>

                    <span className="mic-ring ring-two"></span>

                    <span className="mic-icon">
                      🎤
                    </span>

                  </button>

                  <div className="mic-label">

                    {isChecking
                      ? "Checking..."
                      : isListening
                      ? "Listening..."
                      : "Tap to speak"}

                  </div>

                </div>
              )}

              {/* =================================================
                  PROGRESS
              ================================================= */}

              <div className="progress-dots">

                {Array.from(
                  {
                    length:
                      progressCount,
                  },
                  (_, index) => (

                    <span
                      key={index}
                      className={`progress-dot ${
                        index < step
                          ? "completed"
                          : index === step
                          ? "active"
                          : ""
                      }`}
                    ></span>

                  )
                )}

              </div>

            </div>
          )}

        {/* =================================================
            COMPLETE
        ================================================= */}

        {step === 8 && (
          <div className="plan-complete-screen">

            <div className="complete-teacher-section">

              <img
                src={teacher1}
                alt="Miss Uroosa"
                className="complete-teacher"
              />

            </div>

            <div className="complete-content">

              <div className="complete-cloud">

                <div className="complete-sparkles">
                  ✦
                </div>

                <h1>
                  Great Job!
                </h1>

                <p>
                  You made a plan together!
                </p>

                <div className="plan-complete-ribbon">
                  PLAN COMPLETE!
                </div>

                <button
                  type="button"
                  className="finish-btn"
                  onClick={
                    finishActivity
                  }
                >
                  Finish
                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default PlanItTogetherActivity;