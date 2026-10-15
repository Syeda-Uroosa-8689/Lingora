import React, { useState, useEffect, useRef } from "react";

import teacher1 from "./assets/teacher1.png";
import teacher2 from "./assets/teacher2.png";
import teacher3 from "./assets/teacher3.png";
import teacher4 from "./assets/teacher4.png";

import chatBg from "./assets/chatbg.jpeg";

function ChatPage({ onBack, userName, setUserName, onStartLesson }) {
  const teacherFrames = [teacher1, teacher2, teacher3, teacher4];

  const [frame, setFrame] = useState(0);
  const [screen, setScreen] = useState("mic");
  const [teacherText, setTeacherText] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [step, setStep] = useState(0);
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);
  const hasStartedRecognitionRef = useRef(false);

  // =====================================================
  // INTRO LINES
  // =====================================================

  const INTRO_LINES = [
    "Hello! I'm your English teacher, Miss Uroosa. What's your name?",
    "Hi there! I'm Miss Uroosa, your English teacher. Tell me your name?",
    "Hello! Miss Uroosa here. Let's start — what's your name?"
  ];

  // =====================================================
  // CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {}
      }
    };
  }, []);

  // =====================================================
  // TEACHER ANIMATION
  // =====================================================

  useEffect(() => {
    if (!isSpeaking) {
      setFrame(0);
      return;
    }

    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % teacherFrames.length);
    }, 350);

    return () => clearInterval(interval);
  }, [isSpeaking]);

  // =====================================================
  // CALLING SCREEN
  // =====================================================

  useEffect(() => {
    if (screen === "calling") {
      const timer = setTimeout(() => {
        setScreen("intro");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [screen]);

  // =====================================================
  // EXTRACT NAME
  // =====================================================

  const extractName = (sentence) => {
    let name = sentence.toLowerCase();

    name = name
      .replace("my name is", "")
      .replace("i am", "")
      .replace("i'm", "")
      .replace("this is", "")
      .replace("myself", "")
      .replace("call me", "")
      .trim();

    // Remove common punctuation
    name = name.replace(/[.,!?]/g, "");

    if (name.length > 0) {
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }

    return name;
  };

  // =====================================================
  // START LISTENING
  // =====================================================

  const startListening = () => {
    if (isListening) return;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech Recognition is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    // Stop previous recognition if any
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {}
    }

    const recognition = new SpeechRecognition();

    recognitionRef.current = recognition;

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    setIsListening(true);
    hasStartedRecognitionRef.current = true;

    try {
      recognition.start();
    } catch (error) {
      console.log("Recognition start error:", error);
      setIsListening(false);
    }

    // ===================================================
    // RESULT
    // ===================================================

    recognition.onresult = (event) => {
      const answer =
        event.results[0][0].transcript.toLowerCase();

      console.log("Student said:", answer);

      setIsListening(false);

      // ================================================
      // STEP 0 — NAME
      // ================================================

      if (step === 0) {
        const cleanName = extractName(answer);

        const finalName =
          cleanName && cleanName.length > 0
            ? cleanName
            : "there";

        setStudentName(finalName);
        setUserName(finalName);

        speak(
          `Hi ${finalName}, how are you today?`,
          () => {
            setStep(1);
          }
        );
      }

      // ================================================
      // STEP 1 — HOW ARE YOU?
      // ================================================

      else if (step === 1) {
        if (
          answer.includes("good") ||
          answer.includes("fine") ||
          answer.includes("great") ||
          answer.includes("well") ||
          answer.includes("nice") ||
          answer.includes("okay") ||
          answer.includes("ok") ||
          answer.includes("happy") ||
          answer.includes("awesome")
        ) {
          speak(
            "Great. Let's start today's lesson.",
            () => {
              window.speechSynthesis.cancel();

              setTimeout(() => {
                onStartLesson?.();
              }, 200);
            }
          );
        } else {
          speak(
            "Sorry, I don't get it. Let's start today's lesson.",
            () => {
              window.speechSynthesis.cancel();

              setTimeout(() => {
                onStartLesson?.();
              }, 200);
            }
          );
        }
      }
    };

    // ===================================================
    // ERROR
    // ===================================================

    recognition.onerror = (event) => {
      console.log("Speech recognition error:", event.error);

      setIsListening(false);

      // Permission denied / microphone issue
      if (
        event.error === "not-allowed" ||
        event.error === "permission-denied"
      ) {
        alert(
          "Please allow microphone access in your browser to continue."
        );
      }
    };

    // ===================================================
    // END
    // ===================================================

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  // =====================================================
  // SPEAK
  // =====================================================

  const speak = (text, callback) => {
    window.speechSynthesis.cancel();

    setTeacherText(text);
    setIsSpeaking(true);

    const speech =
      new SpeechSynthesisUtterance(text);

    speech.rate = 0.9;
    speech.pitch = 1.3;
    speech.volume = 1;

    // ===================================================
    // VOICES
    // ===================================================

    let voices = window.speechSynthesis.getVoices();

    const selectVoice = () => {
      voices = window.speechSynthesis.getVoices();

      const femaleVoice =
        voices.find((v) =>
          v.name.toLowerCase().includes("female")
        ) ||
        voices.find((v) =>
          v.name.toLowerCase().includes("samantha")
        ) ||
        voices.find((v) =>
          v.name.toLowerCase().includes("zira")
        ) ||
        voices.find((v) =>
          v.name
            .toLowerCase()
            .includes("google uk english female")
        ) ||
        voices.find((v) =>
          v.name
            .toLowerCase()
            .includes("google us english")
        ) ||
        voices[0];

      if (femaleVoice) {
        speech.voice = femaleVoice;
      }

      window.speechSynthesis.speak(speech);
    };

    if (!voices.length) {
      window.speechSynthesis.onvoiceschanged = () => {
        selectVoice();
        window.speechSynthesis.onvoiceschanged = null;
      };
    } else {
      selectVoice();
    }

    // ===================================================
    // SPEECH FINISHED
    // ===================================================

    speech.onend = () => {
      setIsSpeaking(false);

      if (callback) {
        callback();
      }
    };

    speech.onerror = () => {
      setIsSpeaking(false);

      if (callback) {
        callback();
      }
    };
  };

  // =====================================================
  // START CONVERSATION
  // =====================================================

  const startConversation = () => {
    const randomLine =
      INTRO_LINES[
        Math.floor(Math.random() * INTRO_LINES.length)
      ];

    speak(randomLine);
  };

  // =====================================================
  // AUTO START INTRO
  // =====================================================

  useEffect(() => {
    if (screen === "intro" && step === 0) {
      startConversation();
    }
  }, [screen]);

  // =====================================================
  // ⭐ IMPORTANT
  // AUTO OPEN MIC AFTER TEACHER FINISHES
  // =====================================================

  useEffect(() => {
    if (
      screen === "intro" &&
      !isSpeaking &&
      teacherText &&
      !isListening
    ) {
      const timer = setTimeout(() => {
        startListening();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    isSpeaking,
    teacherText,
    screen,
    isListening
  ]);

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="chat-page">

      {/* BACKGROUND */}
      <img
        src={chatBg}
        alt=""
        className="chat-bg-img"
      />

      <div className="chat-overlay"></div>

      {/* BACK BUTTON */}
      <button
        className="chat-back"
        onClick={() => {
          window.speechSynthesis.cancel();

          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (error) {}
          }

          onBack();
        }}
      >
        ← Back
      </button>

      {/* =================================================
          MIC CHECK SCREEN
      ================================================= */}

      {screen === "mic" && (
        <div className="chat-card">

          <h1 className="mic-title">
            Let's check your Microphone
          </h1>

          <img
            src={teacherFrames[frame]}
            alt=""
            className="teacher-img-large"
          />

          <h2 className="hello-text">
            Say Hello !
          </h2>

          <p className="speak-text">
            Speak to test microphone
          </p>

          <div className="voice-line"></div>

          <button
            className="call-btn"
            onClick={() => {
              setScreen("calling");
            }}
          >
            📞 Call Miss Uroosa
          </button>

        </div>
      )}

      {/* =================================================
          CALLING SCREEN
      ================================================= */}

      {screen === "calling" && (
        <div className="calling-screen">

          <img
            src={teacherFrames[frame]}
            alt=""
            className="calling-teacher"
          />

          <h1 className="calling-title">
            Calling Miss Uroosa...
          </h1>

        </div>
      )}

      {/* =================================================
          INTRO SCREEN
      ================================================= */}

      {screen === "intro" && (
        <div className="intro-screen">

          {/* SKIP */}
          <button
            className="skip-btn"
            onClick={() => {
              window.speechSynthesis.cancel();

              if (recognitionRef.current) {
                try {
                  recognitionRef.current.stop();
                } catch (error) {}
              }

              setIsSpeaking(false);
              setIsListening(false);
              setTeacherText("");

              onStartLesson?.();
            }}
          >
            Skip →
          </button>

          {/* TEACHER */}
          <img
            src={teacherFrames[frame]}
            alt=""
            className={
              isSpeaking
                ? "intro-teacher speaking"
                : "intro-teacher"
            }
          />

          {/* =================================================
              STUDENT LISTENING INDICATOR
          ================================================= */}

          {isListening && (
            <div className="auto-listening">

              <div className="listening-mic">
                🎤
              </div>

              <div className="listening-text">
                I'm listening...
              </div>

              <div className="listening-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default ChatPage;