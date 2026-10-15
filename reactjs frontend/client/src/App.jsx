import React, { useState } from "react";
 
import HomePage from "./homepage";
import LoginPage from "./LoginPage";
import AdminDashboard from "./AdminDashboard";
import SuperAdminDashboard from "./SuperAdminDashboard";
import TeacherDashboard from "./TeacherDashboard";
import PathwayPage from "./pathwaypage";
import TopicPage from "./TopicPage";
import SubtopicPage from "./SubtopicPage";
import ChatPage from "./chatpage";

import FoodFlow from "./FoodFlow";
import VocabularyFlow from "./VocabularyFlow";
import ListenRepeatFlow from "./ListenRepeatFlow";
import RestaurantConversationFlow from "./RestaurantConversationFlow";
import FinalChallengeFlow from "./FinalChallengeFlow";


/* =========================================
   TOPIC 1
========================================= */

/* Subtopic 1 - Talking About Hobbies */
import HobbiesFlow from "./Topic 1/Subtopic 1/HobbiesFlow";

/* Subtopic 2 - Favourite Person */
import FavouritePersonFlow
    from "./Topic 1/subtopic 2/FavouritePersonFlow.jsx";

/* Subtopic 3 - Favourite Place */
import FavouritePlaceFlow
    from "./Topic 1/subtopic 3/FavouritePlaceFlow.jsx";


/* =========================================
   TOPIC 1 - SUBTOPIC 4
   FINAL CHALLENGE 1
========================================= */

import FinalChallenge1Flow
    from "./Topic 1/subtopic 4/FinalChallenge1Flow.jsx";


/* =========================================
   TOPIC 2
   SUBTOPIC 1 - PHYSICAL APPEARANCE
========================================= */

import PhysicalAppearanceFlow
    from "./Topic 2/subtopic 1/PhysicalAppearanceFlow.jsx";


/* =========================================
   TOPIC 2
   SUBTOPIC 2 - PERSONALITY TRAITS
========================================= */

import PersonalityTraitsFlow
    from "./Topic 2/subtopic 2/PersonalityTraitsFlow.jsx";


/* =========================================
   TOPIC 2
   SUBTOPIC 3 - LIKES AND DISLIKES
========================================= */

import LikesAndDislikesFlow
    from "./Topic 2/subtopic 3/LikesAndDislikesFlow.jsx";


/* =========================================
   TOPIC 2 - SUBTOPIC 4
   FINAL CHALLENGE 2
========================================= */

import FinalChallenge2Flow
    from "./Topic 2/subtopic 4/FinalChallenge2Flow.jsx";


/* =========================================
   TOPIC 4
   SUBTOPIC 1 - DAYS AND MONTHS
========================================= */

import DaysAndMonthsFlow
    from "./Topic 4/subtopic 1/DaysAndMonthsFlow.jsx";


/* =========================================
   TOPIC 4
   SUBTOPIC 2 - DAILY ROUTINE
========================================= */

import RoutineRushFlow
    from "./Topic 4/subtopic 2/RoutineRushFlow.jsx";


/* =========================================
   TOPIC 4
   SUBTOPIC 3 - MAKING PLANS
========================================= */

import MyPlanMyDayFlow
    from "./Topic 4/subtopic 3/MyPlanMyDayFlow.jsx";


/* =========================================
   TOPIC 4
   SUBTOPIC 4 - FINAL CHALLENGE 4
========================================= */

import FinalChallenge4Flow
    from "./Topic 4/subtopic 4/FinalChallenge4Flow.jsx";


import LessonComplete from "./LessonComplete";

import "./App.css";


function App() {

    /* =========================================
       USER NAME
    ========================================= */

    const [userName, setUserName] =
        useState("");


    /* =========================================
       CURRENT PAGE
    ========================================= */

    const [currentPage, setCurrentPage] =
        useState("home");


    /* =========================================
       SELECTED TOPIC
    ========================================= */

    const [selectedTopic, setSelectedTopic] =
        useState(null);


    /* =========================================
       SELECTED LESSON
    ========================================= */

    const [selectedLesson, setSelectedLesson] =
        useState(null);


    return (

        <div className="app-main-wrapper">


            {/* =========================================
                HOME PAGE
            ========================================= */}

            {currentPage === "home" && (

                <HomePage

                    onStart={() =>
                        setCurrentPage("login")
                    }

                />

            )}


            {/* =========================================
                LOGIN PAGE
            ========================================= */}

              {currentPage === "login" && (

                 <LoginPage

                     onLogin={() =>
                         setCurrentPage("pathway")
                     }

                     onBack={() =>
                         setCurrentPage("home")
                     }

                     onAdmin={() =>
                         setCurrentPage("admin")
                     }

                     onTeacher={() =>
                        setCurrentPage("teacher")
                     }

                     onSuperAdmin={() =>
                         setCurrentPage("superadmin")
                     }

                 />

             )}


             {/* =========================================
                 ADMIN PANEL
             ========================================= */}

             {currentPage === "admin" && (

                  <AdminDashboard

                     onBack={() =>
                         setCurrentPage("login")
                     }

                 />

             )}


             {/* =========================================
                 TEACHER DASHBOARD
             ========================================= */}

             {currentPage === "teacher" && (

                  <TeacherDashboard

                     onBack={() =>
                         setCurrentPage("login")
                     }

                 />

              )}


             {/* =========================================
                  SUPER ADMIN DASHBOARD
             ========================================= */}

             {currentPage === "superadmin" && (

                   <SuperAdminDashboard

                      onBack={() =>
                          setCurrentPage("login")
                      }

                  />

             )}


             {/* =========================================
                PATHWAY PAGE
            ========================================= */}

            {currentPage === "pathway" && (

                <PathwayPage

                    onBack={() =>
                        setCurrentPage("home")
                    }

                    onSelectMode={() =>
                        setCurrentPage("topics")
                    }

                />

            )}


            {/* =========================================
                TOPICS PAGE
            ========================================= */}

            {currentPage === "topics" && (

                <TopicPage

                    onBack={() =>
                        setCurrentPage("pathway")
                    }

                    onSelectTopic={(topic) => {

                        setSelectedTopic(topic);

                        setCurrentPage(
                            "subtopics"
                        );

                    }}

                />

            )}


            {/* =========================================
                SUBTOPICS PAGE
            ========================================= */}

            {currentPage === "subtopics" && (

                <SubtopicPage

                    selectedTopic={
                        selectedTopic
                    }

                    onBack={() =>
                        setCurrentPage("topics")
                    }

                    onSelectTopic={(lesson) => {

                        setSelectedLesson(lesson);

                        /* =========================
                           FIRST GO TO CHAT PAGE
                        ========================= */

                        setCurrentPage("chat");

                    }}

                />

            )}


            {/* =========================================
                CALLING / CHAT PAGE
            ========================================= */}

            {currentPage === "chat" && (

                <ChatPage

                    userName={
                        userName
                    }

                    setUserName={
                        setUserName
                    }


                    onBack={() =>
                        setCurrentPage(
                            "subtopics"
                        )
                    }


                    onStartLesson={() => {


                        /* =========================
                           TOPIC 1
                           SUBTOPIC 4
                           FINAL CHALLENGE 1
                        ========================= */

                        if (
                            selectedLesson?.type ===
                            "finalChallenge1"
                        ) {

                            setCurrentPage(
                                "finalChallenge1"
                            );

                        }


                        /* =========================
                           FOOD LESSON
                        ========================= */

                        else if (
                            selectedLesson?.type ===
                            "lesson"
                        ) {

                            setCurrentPage(
                                "foodFlow"
                            );

                        }


                        /* =========================
                           RESTAURANT CONVERSATION
                        ========================= */

                        else if (
                            selectedLesson?.type ===
                            "restaurantConversation"
                        ) {

                            setCurrentPage(
                                "restaurantConversation"
                            );

                        }


                        /* =========================
                           OLD FINAL CHALLENGE
                        ========================= */

                        else if (
                            selectedLesson?.type ===
                            "finalChallenge"
                        ) {

                            setCurrentPage(
                                "finalChallenge"
                            );

                        }


                        /* =========================
                           VOCABULARY
                        ========================= */

                        else if (
                            selectedLesson?.type ===
                            "vocabulary"
                        ) {

                            setCurrentPage(
                                "vocabulary"
                            );

                        }


                        /* =========================
                           OLD RESTAURANT
                        ========================= */

                        else if (
                            selectedLesson?.type ===
                            "restaurant"
                        ) {

                            setCurrentPage(
                                "restaurant"
                            );

                        }


                        /* =========================
                           TOPIC 1
                           SUBTOPIC 1
                           TALKING ABOUT HOBBIES
                        ========================= */

                        else if (
                            selectedLesson?.type ===
                            "hobbies"
                        ) {

                            setCurrentPage(
                                "hobbiesFlow"
                            );

                        }


                        /* =========================
                           TOPIC 1
                           SUBTOPIC 2
                           FAVOURITE PERSON
                        ========================= */

                        else if (
                            selectedLesson?.type ===
                            "favouritePerson"
                        ) {

                            setCurrentPage(
                                "favouritePersonFlow"
                            );

                        }


                        /* =========================
                           TOPIC 1
                           SUBTOPIC 3
                           FAVOURITE PLACE
                        ========================= */

                        else if (
                            selectedLesson?.type ===
                            "favouritePlace"
                        ) {

                            setCurrentPage(
                                "favouritePlaceFlow"
                            );

                        }


                        /* =========================
                           TOPIC 2
                           SUBTOPIC 1
                           PHYSICAL APPEARANCE
                        ========================= */

                        else if (
                            selectedLesson?.type ===
                            "physicalAppearance"
                        ) {

                            setCurrentPage(
                                "physicalAppearanceFlow"
                            );

                        }


                        /* =========================
                           TOPIC 2
                           SUBTOPIC 2
                           PERSONALITY TRAITS
                        ========================= */

                        else if (
                            selectedLesson?.type ===
                            "personalityTraits"
                        ) {

                            setCurrentPage(
                                "personalityTraitsFlow"
                            );

                        }


                        /* =========================
                           TOPIC 2
                           SUBTOPIC 3
                           LIKES AND DISLIKES
                        ========================= */

                        else if (
                            selectedLesson?.type ===
                            "likesAndDislikes"
                        ) {

                            setCurrentPage(
                                "likesAndDislikesFlow"
                            );

                        }


                        /* =========================
                           TOPIC 2
                           SUBTOPIC 4
                           FINAL CHALLENGE 2
                        ========================= */

                        else if (
                            selectedLesson?.type ===
                            "finalChallenge2"
                        ) {

                            setCurrentPage(
                                "finalChallenge2"
                            );

                        }


                        /* =========================
                           TOPIC 4
                           SUBTOPIC 1
                           DAYS AND MONTHS
                        ========================= */

                        else if (
                            selectedLesson?.type ===
                            "daysAndMonths"
                        ) {

                            setCurrentPage(
                                "daysAndMonthsFlow"
                            );

                        }


                        /* =========================
                           TOPIC 4
                           SUBTOPIC 2
                           DAILY ROUTINE
                        ========================= */

                        else if (
                            selectedLesson?.type ===
                            "dailyRoutine"
                        ) {

                            setCurrentPage(
                                "routineRushFlow"
                            );

                        }


                        /* =========================
                           TOPIC 4
                           SUBTOPIC 3
                           MAKING PLANS
                        ========================= */

                        else if (
                            selectedLesson?.type ===
                            "makingPlans"
                        ) {

                            setCurrentPage(
                                "myPlanMyDayFlow"
                            );

                        }


                        /* =========================
                           TOPIC 4
                           SUBTOPIC 4
                           FINAL CHALLENGE 4
                        ========================= */

                        else if (
                            selectedLesson?.type ===
                            "finalChallenge4"
                        ) {

                            setCurrentPage(
                                "finalChallenge4"
                            );

                        }

                    }}

                />

            )}


            {/* =========================================
                TOPIC 1
                SUBTOPIC 4
                FINAL CHALLENGE 1
            ========================================= */}

            {currentPage ===
                "finalChallenge1" && (

                <FinalChallenge1Flow

                    content={
                        selectedLesson?.content
                    }

                    topicId={
                        selectedTopic?.id
                    }

                    lessonId={
                        selectedLesson?.id
                    }

                    userName={
                        userName
                    }


                    onFinish={() => {

                        setCurrentPage(
                            "lessonComplete"
                        );

                    }}


                    onBack={() => {

                        setCurrentPage(
                            "chat"
                        );

                    }}

                />

            )}


            {/* =========================================
                FOOD FLOW
            ========================================= */}

            {currentPage === "foodFlow" && (

                <FoodFlow

                    content={
                        selectedLesson?.content
                    }

                    topicId={
                        selectedTopic?.id
                    }

                    lessonId={
                        selectedLesson?.id
                    }

                    userName={
                        userName
                    }


                    onFinish={() => {

                        setCurrentPage(
                            "lessonComplete"
                        );

                    }}


                    onBack={() => {

                        setCurrentPage(
                            "chat"
                        );

                    }}

                />

            )}


            {/* =========================================
                RESTAURANT CONVERSATION FLOW
            ========================================= */}

            {currentPage ===
                "restaurantConversation" && (

                <RestaurantConversationFlow

                    content={
                        selectedLesson?.content
                    }

                    topicId={
                        selectedTopic?.id
                    }

                    lessonId={
                        selectedLesson?.id
                    }

                    userName={
                        userName
                    }


                    onFinish={() => {

                        setCurrentPage(
                            "lessonComplete"
                        );

                    }}


                    onBack={() => {

                        setCurrentPage(
                            "chat"
                        );

                    }}

                />

            )}


            {/* =========================================
                OLD FINAL CHALLENGE FLOW
            ========================================= */}

            {currentPage ===
                "finalChallenge" && (

                <FinalChallengeFlow

                    content={
                        selectedLesson?.content
                    }

                    topicId={
                        selectedTopic?.id
                    }

                    lessonId={
                        selectedLesson?.id
                    }

                    userName={
                        userName
                    }


                    onFinish={() => {

                        setCurrentPage(
                            "lessonComplete"
                        );

                    }}


                    onBack={() => {

                        setCurrentPage(
                            "chat"
                        );

                    }}

                />

            )}


            {/* =========================================
                VOCABULARY FLOW
            ========================================= */}

            {currentPage === "vocabulary" && (

                <VocabularyFlow

                    content={
                        selectedLesson?.content
                    }


                    onFinish={() => {

                        setCurrentPage(
                            "listenRepeat"
                        );

                    }}


                    onBack={() => {

                        setCurrentPage(
                            "chat"
                        );

                    }}

                />

            )}


            {/* =========================================
                LISTEN & REPEAT
            ========================================= */}

            {currentPage === "listenRepeat" && (

                <ListenRepeatFlow

                    onFinish={() => {

                        setCurrentPage(
                            "lessonComplete"
                        );

                    }}


                    onBack={() => {

                        console.log(
                            "APP BACK FUNCTION CALLED"
                        );

                        setCurrentPage(
                            "chat"
                        );

                    }}

                />

            )}


            {/* =========================================
                TOPIC 1
                SUBTOPIC 1
                TALKING ABOUT HOBBIES
            ========================================= */}

            {currentPage === "hobbiesFlow" && (

                <HobbiesFlow

                    content={
                        selectedLesson?.content
                    }

                    topicId={
                        selectedTopic?.id
                    }

                    lessonId={
                        selectedLesson?.id
                    }

                    userName={
                        userName
                    }

                    onFinish={() => {

                        setCurrentPage(
                            "lessonComplete"
                        );

                    }}

                    onBack={() => {

                        setCurrentPage(
                            "chat"
                        );

                    }}

                />

            )}


            {/* =========================================
                TOPIC 1
                SUBTOPIC 2
                FAVOURITE PERSON
            ========================================= */}

            {currentPage ===
                "favouritePersonFlow" && (

                <FavouritePersonFlow

                    content={
                        selectedLesson?.content
                    }

                    topicId={
                        selectedTopic?.id
                    }

                    lessonId={
                        selectedLesson?.id
                    }

                    userName={
                        userName
                    }

                    onFinish={() => {

                        setCurrentPage(
                            "lessonComplete"
                        );

                    }}

                    onBack={() => {

                        setCurrentPage(
                            "chat"
                        );

                    }}

                />

            )}


            {/* =========================================
                TOPIC 1
                SUBTOPIC 3
                FAVOURITE PLACE
            ========================================= */}

            {currentPage ===
                "favouritePlaceFlow" && (

                <FavouritePlaceFlow

                    content={
                        selectedLesson?.content
                    }

                    topicId={
                        selectedTopic?.id
                    }

                    lessonId={
                        selectedLesson?.id
                    }

                    userName={
                        userName
                    }

                    onFinish={() => {

                        setCurrentPage(
                            "lessonComplete"
                        );

                    }}

                    onBack={() => {

                        setCurrentPage(
                            "chat"
                        );

                    }}

                />

            )}


            {/* =========================================
                TOPIC 2
                SUBTOPIC 1
                PHYSICAL APPEARANCE
            ========================================= */}

            {currentPage ===
                "physicalAppearanceFlow" && (

                <PhysicalAppearanceFlow

                    content={
                        selectedLesson?.content
                    }

                    topicId={
                        selectedTopic?.id
                    }

                    lessonId={
                        selectedLesson?.id
                    }

                    userName={
                        userName
                    }

                    onFinish={() => {

                        setCurrentPage(
                            "lessonComplete"
                        );

                    }}

                    onBack={() => {

                        setCurrentPage(
                            "chat"
                        );

                    }}

                />

            )}


            {/* =========================================
                TOPIC 2
                SUBTOPIC 2
                PERSONALITY TRAITS
            ========================================= */}

            {currentPage ===
                "personalityTraitsFlow" && (

                <PersonalityTraitsFlow

                    content={
                        selectedLesson?.content
                    }

                    topicId={
                        selectedTopic?.id
                    }

                    lessonId={
                        selectedLesson?.id
                    }

                    userName={
                        userName
                    }

                    onFinish={() => {

                        setCurrentPage(
                            "lessonComplete"
                        );

                    }}

                    onBack={() => {

                        setCurrentPage(
                            "chat"
                        );

                    }}

                />

            )}


            {/* =========================================
                TOPIC 2
                SUBTOPIC 3
                LIKES AND DISLIKES
            ========================================= */}

            {currentPage ===
                "likesAndDislikesFlow" && (

                <LikesAndDislikesFlow

                    content={
                        selectedLesson?.content
                    }

                    topicId={
                        selectedTopic?.id
                    }

                    lessonId={
                        selectedLesson?.id
                    }

                    userName={
                        userName
                    }

                    onFinish={() => {

                        setCurrentPage(
                            "lessonComplete"
                        );

                    }}

                    onBack={() => {

                        setCurrentPage(
                            "chat"
                        );

                    }}

                />

            )}


            {/* =========================================
                TOPIC 2
                SUBTOPIC 4
                FINAL CHALLENGE 2
            ========================================= */}

            {currentPage ===
                "finalChallenge2" && (

                <FinalChallenge2Flow

                    content={
                        selectedLesson?.content
                    }

                    topicId={
                        selectedTopic?.id
                    }

                    lessonId={
                        selectedLesson?.id
                    }

                    userName={
                        userName
                    }

                    onFinish={() => {

                        setCurrentPage(
                            "lessonComplete"
                        );

                    }}

                    onBack={() => {

                        setCurrentPage(
                            "chat"
                        );

                    }}

                />

            )}


            {/* =========================================
                TOPIC 4
                SUBTOPIC 1
                DAYS AND MONTHS
            ========================================= */}

            {currentPage ===
                "daysAndMonthsFlow" && (

                <DaysAndMonthsFlow

                    onFinish={() => {

                        setCurrentPage(
                            "lessonComplete"
                        );

                    }}

                    onBack={() => {

                        setCurrentPage(
                            "chat"
                        );

                    }}

                />

            )}


            {/* =========================================
                TOPIC 4
                SUBTOPIC 2
                DAILY ROUTINE
            ========================================= */}

            {currentPage ===
                "routineRushFlow" && (

                <RoutineRushFlow

                    content={
                        selectedLesson?.content
                    }

                    topicId={
                        selectedTopic?.id
                    }

                    lessonId={
                        selectedLesson?.id
                    }

                    userName={
                        userName
                    }

                    onFinish={() => {

                        setCurrentPage(
                            "lessonComplete"
                        );

                    }}

                    onBack={() => {

                        setCurrentPage(
                            "chat"
                        );

                    }}

                />

            )}


            {/* =========================================
                TOPIC 4
                SUBTOPIC 3
                MAKING PLANS
            ========================================= */}

            {currentPage ===
                "myPlanMyDayFlow" && (

                <MyPlanMyDayFlow

                    onFinish={() => {

                        setCurrentPage(
                            "lessonComplete"
                        );

                    }}

                    onBack={() => {

                        setCurrentPage(
                            "chat"
                        );

                    }}

                />

            )}


            {/* =========================================
                TOPIC 4
                SUBTOPIC 4
                FINAL CHALLENGE 4
            ========================================= */}

            {currentPage ===
                "finalChallenge4" && (

                <FinalChallenge4Flow

                    content={
                        selectedLesson?.content
                    }

                    topicId={
                        selectedTopic?.id
                    }

                    lessonId={
                        selectedLesson?.id
                    }

                    userName={
                        userName
                    }


                    onNext={() => {

                        setCurrentPage(
                            "lessonComplete"
                        );

                    }}


                    onBack={() => {

                        setCurrentPage(
                            "chat"
                        );

                    }}

                />

            )}


            {/* =========================================
                OLD RESTAURANT PAGE
            ========================================= */}

            {currentPage === "restaurant" && (

                <div className="lesson-page">

                    <h2>
                        Restaurant Flow Coming Soon...
                    </h2>

                </div>

            )}


            {/* =========================================
                COMMON LESSON COMPLETE PAGE
            ========================================= */}

            {currentPage ===
                "lessonComplete" && (

                <LessonComplete

                    onFinish={() => {

                        setCurrentPage(
                            "subtopics"
                        );

                    }}

                />

            )}

        </div>

    );

}


export default App;