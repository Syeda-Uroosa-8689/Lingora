
import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import teacher1 from "../../assets/teacher1.png";
import teacher2 from "../../assets/teacher2.png";
import teacher3 from "../../assets/teacher3.png";
import teacher4 from "../../assets/teacher4.png";

import chatBg from "../../assets/chatbg.jpeg";

import "./FavouritePersonActivity3.css";

function FavouritePersonActivity3({
  topicId,
  lessonId,
  userName,
  onNext,
  onBack,
}) {
  /* =====================================================
      MEMORY CARDS
  ===================================================== */

  const memoryCards = [
    {
      id: 1,
      icon: "🍕",
      title: "Favourite Food",
      question:
        "What food does your favourite person like?",
    },
    {
      id: 2,
      icon: "⚽",
      title: "Favourite Hobby",
      question:
        "What does your favourite person like to do?",
    },
    {
      id: 3,
      icon: "❤️",
      title: "Personality",
      question:
        "What is your favourite person like?",
    },
    {
      id: 4,
      icon: "📚",
      title: "Something They Do",
      question:
        "What does your favourite person do for you?",
    },
    {
      id: 5,
      icon: "🎵",
      title: "Something They Like",
      question:
        "What is something your favourite person likes?",
    },
    {
      id: 6,
      icon: "🌸",
      title: "Special Thing",
      question:
        "What makes your favourite person special?",
    },
  ];

  /* =====================================================
      TEACHER IMAGES
  ===================================================== */

  const teacherImages = [
    teacher1,
    teacher2,
    teacher3,
    teacher4,
  ];

  /* =====================================================
      STATES
  ===================================================== */

  const [currentCard, setCurrentCard] =
    useState(null);

  const [completedCards, setCompletedCards] =
    useState([]);

  const [spokenAnswer, setSpokenAnswer] =
    useState("");

  const [isListening, setIsListening] =
    useState(false);

  const [isSpeaking, setIsSpeaking] =
    useState(false);

  const [showResult, setShowResult] =
    useState(false);

  const [feedback, setFeedback] =
    useState("");

  const [isCorrect, setIsCorrect] =
    useState(false);

  const [isChecking, setIsChecking] =
    useState(false);

  const [answerChecked, setAnswerChecked] =
    useState(false);

  /* =====================================================
      REFS
  ===================================================== */

  const recognitionRef =
    useRef(null);

   const mountedRef =
     useRef(true);

   /* =====================================================
      CURRENT TEACHER
  ===================================================== */

  const currentTeacher =
    teacherImages[
      ((currentCard?.id || 1) - 1) %
        teacherImages.length
    ];

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
          console.log(error);
        }
      }
    };
  }, []);

  /* =====================================================
      LOAD SPEECH VOICES
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
      GET TEACHER VOICE
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
      ) ||
      voices.find((voice) =>
        /Google US English/i.test(
          voice.name
        )
      ) ||
      voices.find((voice) =>
        /Microsoft.*Jenny/i.test(
          voice.name
        )
      ) ||
      voices.find((voice) =>
        /Microsoft.*Aria/i.test(
          voice.name
        )
      ) ||
      voices.find((voice) =>
        /Samantha/i.test(
          voice.name
        )
      ) ||
      voices.find((voice) =>
        /Zira/i.test(
          voice.name
        )
      ) ||
      null
    );
  };

  /* =====================================================
      TEACHER SPEAK
  ===================================================== */

  const speakTeacher = (text) => {
    if (
      !window.speechSynthesis ||
      !text
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(text);

    const voice =
      getTeacherVoice();

    if (voice) {
      speech.voice = voice;
    }

    speech.lang = "en-US";
    speech.rate = 0.88;
    speech.pitch = 1.05;
    speech.volume = 1;

    speech.onstart = () => {
      if (mountedRef.current) {
        setIsSpeaking(true);
      }
    };

    speech.onend = () => {
      if (mountedRef.current) {
        setIsSpeaking(false);
      }
    };

    speech.onerror = () => {
      if (mountedRef.current) {
        setIsSpeaking(false);
      }
    };

    window.speechSynthesis.speak(speech);
  };

  /* =====================================================
      CARD CLICK
  ===================================================== */

  const handleCardClick = (card) => {
    if (
      currentCard ||
      completedCards.includes(card.id)
    ) {
      return;
    }

    window.speechSynthesis?.cancel();

    setCurrentCard(card);
    setSpokenAnswer("");
    setFeedback("");
    setShowResult(false);
    setAnswerChecked(false);
    setIsCorrect(false);

    setTimeout(() => {
      speakTeacher(
        `Great choice! This is ${card.title}. ${card.question}`
      );
    }, 400);
  };

  /* =====================================================
      SPEAK QUESTION AGAIN
  ===================================================== */

  const handleSpeakQuestion = () => {
    if (!currentCard) {
      return;
    }

    speakTeacher(
      currentCard.question
    );
  };

  /* =====================================================
      START MICROPHONE
  ===================================================== */

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setFeedback(
        "Speech recognition is not supported. Please use Google Chrome."
      );

      setShowResult(true);
      return;
    }

    if (
      isListening ||
      !currentCard
    ) {
      return;
    }

    window.speechSynthesis?.cancel();

    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (!mountedRef.current) {
        return;
      }

      setIsListening(true);
      setSpokenAnswer("");
      setFeedback("");
      setShowResult(false);
    };

    recognition.onresult = (event) => {
      if (
        answerChecked ||
        isChecking
      ) {
        return;
      }

      const text =
        event.results?.[0]?.[0]
          ?.transcript
          ?.trim() || "";

      if (!mountedRef.current) {
        return;
      }

      if (
        !text ||
        !text.trim()
      ) {
        setFeedback(
          "I couldn't hear you. Please try again. 🎙️"
        );
        setShowResult(true);
        return;
      }

      setSpokenAnswer(text);
      setIsListening(false);
      setShowResult(false);

      void checkAnswerWithAI(text);
    };

    recognition.onerror = (event) => {
      console.log(
        "Speech Recognition Error:",
        event.error
      );

      if (!mountedRef.current) {
        return;
      }

      setIsListening(false);

      if (
        event.error === "no-speech"
      ) {
        setFeedback(
          "I couldn't hear you. Please try again. 🎙️"
        );
      } else if (
        event.error === "not-allowed"
      ) {
        setFeedback(
          "Please allow microphone permission and try again."
        );
      } else {
        setFeedback(
          "Something went wrong with the microphone. Please try again."
        );
      }

      setShowResult(true);
    };

    recognition.onend = () => {
      if (mountedRef.current) {
        setIsListening(false);
      }
    };

    recognitionRef.current =
      recognition;

    try {
      recognition.start();
    } catch (error) {
      console.log(
        "Recognition Start Error:",
        error
      );

      setIsListening(false);
    }
  };

  /* =====================================================
      CHECK ANSWER WITH BACKEND
  ===================================================== */

  const checkAnswerWithAI = async (answerText) => {
    if (
      !answerText ||
      !answerText.trim()
    ) {
      setFeedback(
        "I didn't catch that. Please try speaking again. 🎙️"
      );
      setShowResult(true);
      return;
    }

    if (!currentCard) {
      return;
    }

    setIsChecking(true);
    setAnswerChecked(true);
    setShowResult(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/favourite-person/activity3/check-answer`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            cardTitle: currentCard.title,
            question: currentCard.question,
            studentAnswer: answerText.trim(),
            topicId: topicId || 1,
            lessonId: lessonId || 2,
            userName: userName || "Student",
          }),
        }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
          "Unable to check your answer."
        );
      }

      if (!mountedRef.current) {
        return;
      }

      const correct = Boolean(data?.isCorrect);

      if (correct) {
        setIsCorrect(true);

        const feedbackText = data?.feedback || "Excellent!";

        setFeedback(feedbackText);

        await speakTeacher(feedbackText);
      } else {
        setIsCorrect(false);

        const feedbackText =
          data?.feedback || "Good try!";

        const correctionText =
          data?.correction || "";

        const explanationText =
          data?.explanation || "";

        let teacherResponse = feedbackText;

        if (correctionText) {
          teacherResponse +=
            ` You said: ${answerText.trim()}. Correct sentence: ${correctionText}.`;
        }

        if (explanationText) {
          teacherResponse += ` ${explanationText}`;
        }

        setFeedback(teacherResponse);

        await speakTeacher(teacherResponse);
      }
    } catch (error) {
      console.log(
        "Favourite Person Activity 3 Check Error:",
        error
      );

      if (!mountedRef.current) {
        return;
      }

      setIsCorrect(false);

      setFeedback(
        "Sorry! I could not check your answer right now. Please try again."
      );

      setShowResult(true);
    } finally {
      if (mountedRef.current) {
        setIsChecking(false);
      }
    }
  };

  /* =====================================================
      CONTINUE TO NEXT CARD
      (shown after feedback is displayed)
  ===================================================== */

  const handleContinue = () => {
    if (
      isChecking ||
      !answerChecked
    ) {
      return;
    }

    window.speechSynthesis?.cancel();

    handleAutomaticNext();
  };

  /* =====================================================
      AUTOMATIC NEXT CARD
  ===================================================== */

  const handleAutomaticNext = () => {
    if (!currentCard) {
      return;
    }

    window.speechSynthesis?.cancel();

    const updatedCompleted = [
      ...completedCards,
      currentCard.id,
    ];

    setCompletedCards(updatedCompleted);
    setCurrentCard(null);
    setSpokenAnswer("");
    setFeedback("");
    setShowResult(false);
    setAnswerChecked(false);
    setIsCorrect(false);

    /* =========================================
        ALL CARDS COMPLETED
        DIRECT → FLOW LESSON COMPLETE CARD
    ========================================= */

    if (
      updatedCompleted.length ===
      memoryCards.length
    ) {
      setTimeout(() => {
        if (!mountedRef.current) {
          return;
        }

        // IMPORTANT:
        // Directly move FavouritePersonFlow
        // from Step 5 → Step 6
        onNext?.();
      }, 500);

      return;
    }

    setTimeout(() => {
      if (!mountedRef.current) {
        return;
      }

      speakTeacher(
        "Great job! Choose another card."
      );
    }, 500);
  };

  /* =====================================================
      TRY AGAIN
  ===================================================== */

  const handleTryAgain = () => {
    window.speechSynthesis?.cancel();

    setSpokenAnswer("");
    setFeedback("");
    setShowResult(false);
    setAnswerChecked(false);
    setIsCorrect(false);

    setTimeout(() => {
      if (currentCard?.question) {
        speakTeacher(
          currentCard.question
        );
      }
    }, 300);
  };

  /* =====================================================
      SKIP ACTIVITY
      DIRECT → FLOW LESSON COMPLETE CARD
  ===================================================== */

  const handleSkip = () => {
    window.speechSynthesis?.cancel();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log(error);
      }
    }

    setIsListening(false);

    // IMPORTANT:
    // Direct Step 5 → Step 6
    // No extra completion card
    onNext?.();
  };

  /* =====================================================
      BACK
      → CALLING PAGE
  ===================================================== */

  const handleBack = () => {
    window.speechSynthesis?.cancel();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log(error);
      }
    }

    setIsListening(false);

    onBack?.();
  };

  /* =====================================================
      MAIN UI
  ===================================================== */

  return (
    <div
      className="fp3-page"
      style={{
        backgroundImage: `url(${chatBg})`,
      }}
    >
      <div className="fp3-overlay" />

      <div className="fp3-card">

        {/* =========================================
            HEADER
        ========================================= */}

        <div className="fp3-header">

          <button
            type="button"
            className="fp3-back-button"
            onClick={handleBack}
          >
            ← Back
          </button>

          <div className="fp3-title-area">
            <h1>
              Activity 3
            </h1>

            <div className="fp3-title-strip">
              Favourite Person Memory Game
            </div>
          </div>

          <button
            type="button"
            className="fp3-skip-button"
            onClick={handleSkip}
          >
            Skip →
          </button>

        </div>

        {/* =========================================
            GAME INTRO
        ========================================= */}

        {!currentCard && (
          <>
            <div className="fp3-game-intro">

              <div className="fp3-intro-icon">
                🧠
              </div>

              <h2>
                Let's Play a Memory Game!
              </h2>

              <p>
                Choose a mystery card and tell me
                something about your favourite person.
              </p>

            </div>

            {/* =========================================
                MEMORY CARDS
            ========================================= */}

            <div className="fp3-memory-grid">

              {memoryCards.map((card) => {
                const isCompleted =
                  completedCards.includes(
                    card.id
                  );

                return (
                  <button
                    type="button"
                    key={card.id}
                    className={
                      isCompleted
                        ? "fp3-memory-card completed"
                        : "fp3-memory-card"
                    }
                    onClick={() =>
                      handleCardClick(card)
                    }
                    disabled={isCompleted}
                  >
                    <div className="fp3-card-top">
                      {isCompleted
                        ? "✓"
                        : "?"}
                    </div>

                    <div className="fp3-card-icon">
                      {isCompleted
                        ? "💗"
                        : "🃏"}
                    </div>

                    <span>
                      {isCompleted
                        ? "Completed"
                        : "Mystery Card"}
                    </span>
                  </button>
                );
              })}

            </div>
          </>
        )}

        {/* =========================================
            ACTIVE CARD
        ========================================= */}

        {currentCard && (
          <div className="fp3-active-area">

            {/* =====================================
                TEACHER
            ===================================== */}

            <div className="fp3-teacher-section">

              <div className="fp3-teacher-image-wrapper">
                <img
                  src={currentTeacher}
                  alt="Miss Uroosa"
                  className={
                    isSpeaking
                      ? "fp3-teacher-image speaking"
                      : "fp3-teacher-image"
                  }
                />
              </div>

              <div className="fp3-teacher-bubble">

                <strong>
                  Miss Uroosa 👩‍🏫
                </strong>

                <p>
                  {showResult && feedback
                    ? feedback
                    : `Tell me about ${currentCard.title.toLowerCase()}!`}
                </p>

                <div className="fp3-heart">
                  💗
                </div>

              </div>

            </div>

            {/* =====================================
                QUESTION
            ===================================== */}

            <div className="fp3-question-section">

              <div className="fp3-revealed-card">

                <div className="fp3-revealed-icon">
                  {currentCard.icon}
                </div>

                <div className="fp3-revealed-title">
                  {currentCard.title}
                </div>

              </div>

              <div className="fp3-question-card">

                <div className="fp3-question-heading">

                  <h2>
                    {currentCard.question}
                  </h2>

                  <button
                    type="button"
                    className="fp3-speaker-button"
                    onClick={handleSpeakQuestion}
                    title="Listen to question"
                  >
                    🔊
                  </button>

                </div>

                <div className="fp3-divider" />

                {/* =================================
                    MICROPHONE
                ================================= */}

                {!showResult && (
                  <div className="fp3-speaking-area">

                    <p className="fp3-speaking-title">
                      {isListening
                        ? "I'm listening..."
                        : "Tell me your answer"}
                    </p>

                    <button
                      type="button"
                      className={
                        isListening
                          ? "fp3-mic-button listening"
                          : "fp3-mic-button"
                      }
                      onClick={startListening}
                      disabled={isListening}
                    >
                      🎙️
                    </button>

                    <p className="fp3-mic-text">
                      {isListening
                        ? "Speak clearly..."
                        : "Tap the microphone to speak"}
                    </p>

                  </div>
                )}

                {/* =================================
                    SPOKEN ANSWER
                ================================= */}

                {spokenAnswer && (
                  <div className="fp3-spoken-answer">

                    <span>
                      You said:
                    </span>

                    <strong>
                      "{spokenAnswer}"
                    </strong>

                  </div>
                )}

                 {/* =================================
                     RESULT / FEEDBACK
                 ================================= */}

                 {showResult && (
                   <div
                     className={`fp3-success-box ${
                       isCorrect
                         ? "correct"
                         : "incorrect"
                     }`}
                   >

                     <div className="fp3-success-row">

                       <div className="fp3-success-icon">
                         {isCorrect
                           ? "✅"
                           : "❌"}
                       </div>

                       <div>

                         <strong>
                           {isCorrect
                             ? "Correct! 🎉"
                             : "Not quite!"}
                         </strong>

                         <p>
                           {feedback}
                         </p>

                       </div>

                     </div>

                     {answerChecked &&
                       !isChecking && (
                       <button
                         type="button"
                         className="fp3-continue-button"
                         onClick={handleContinue}
                       >
                         Continue →
                       </button>
                     )}

                   </div>
                 )}

                 {/* =================================
                     TRY AGAIN (no answer)
                 ================================= */}

                 {showResult &&
                   !answerChecked &&
                   !spokenAnswer && (
                     <button
                       type="button"
                       className="fp3-try-button"
                       onClick={handleTryAgain}
                     >
                       🎙️ Try Again
                     </button>
                   )}

              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}

export default FavouritePersonActivity3;

