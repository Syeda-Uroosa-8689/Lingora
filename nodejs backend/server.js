require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Groq = require("groq-sdk");
const crypto = require("crypto");

const User =
    require("./models/User");

const School =
    require("./models/School");

const Progress =
    require("./models/Progress");

const Result =
    require("./models/Result");

const Pathway =
    require("./models/Pathway");

const Class =
    require("./models/Class");

const app = express();

app.use(cors());

app.use(express.json());

/* =========================================================
   MONGODB CONNECTION
========================================================= */

let mongooseConnectPromise = null;

if (process.env.MONGODB_URI) {
  mongooseConnectPromise = mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("=================================");
      console.log("✅ MongoDB Connected Successfully");
      console.log("=================================");
    })
    .catch((err) => {
      console.log("❌ MongoDB Connection Error:", err.message);
    });
} else {
  console.log(
    "⚠️ MONGODB_URI not found. MongoDB features are disabled."
  );
}

/* =========================================================
   MONGODB CONNECTION STATUS HELPER
========================================================= */

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

/* =========================================================
   EXISTING CONVERSATION MODEL
========================================================= */

const ConversationSchema = new mongoose.Schema({
  user_name: {
    type: String,
    default: "Student",
  },

  topic_id: {
    type: Number,
  },

  lesson_id: {
    type: Number,
  },

  user_message: {
    type: String,
  },

  ai_response: {
    type: String,
  },

  activity: {
    type: String,
    default: "normal",
  },

  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Conversation = mongoose.model(
  "Conversation",
  ConversationSchema
);

/* =========================================================
   FINAL CHALLENGE ANSWER SCHEMA
========================================================= */

const FinalChallengeAnswerSchema = new mongoose.Schema(
  {
    question_id: {
      type: Number,
      required: true,
    },

    question: {
      type: String,
      required: true,
    },

    user_answer: {
      type: String,
      default: "",
    },

    marks: {
      type: Number,
      default: 0,
      min: 0,
    },

    max_marks: {
      type: Number,
      default: 5,
      min: 0,
    },

    grammar_correct: {
      type: Boolean,
      default: true,
    },

    answer_correct: {
      type: Boolean,
      default: false,
    },

    mistake: {
      type: String,
      default: "",
    },

    correction: {
      type: String,
      default: "",
    },

    urdu_explanation: {
      type: String,
      default: "",
    },

    feedback: {
      type: String,
      default: "",
    },

    /* Store all mistakes also */
    mistakes: {
      type: [
        {
          mistake: {
            type: String,
            default: "",
          },

          correction: {
            type: String,
            default: "",
          },

          urduExplanation: {
            type: String,
            default: "",
          },
        },
      ],
      default: [],
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   FINAL CHALLENGE RESULT SCHEMA
========================================================= */

const FinalChallengeResultSchema = new mongoose.Schema({
  user_name: {
    type: String,
    default: "Student",
  },

  topic_id: {
    type: Number,
    default: 3,
  },

  lesson_id: {
    type: Number,
    default: 4,
  },

  /* FINAL CHALLENGE = 25 MARKS */
  total_marks: {
    type: Number,
    default: 25,
  },

  obtained_marks: {
    type: Number,
    default: 0,
  },

  percentage: {
    type: Number,
    default: 0,
  },

  grade: {
    type: String,
    default: "",
  },

  answers: {
    type: [FinalChallengeAnswerSchema],
    default: [],
  },

  grammar_mistakes: {
    type: [
      {
        question_id: {
          type: Number,
        },

        mistake: {
          type: String,
          default: "",
        },

        correction: {
          type: String,
          default: "",
        },

        urdu_explanation: {
          type: String,
          default: "",
        },
      },
    ],
    default: [],
  },

  created_at: {
    type: Date,
    default: Date.now,
  },
});

const FinalChallengeResult = mongoose.model(
  "FinalChallengeResult",
  FinalChallengeResultSchema
);

/* =========================================================
   GROQ
========================================================= */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* =========================================================
   TOPIC PROMPTS
========================================================= */

const TOPIC_PROMPTS = {
  1: {
    title: "My Favourite Things",
    prompt:
      "Teach primary school children to talk about favourite things.",
  },

  2: {
    title: "All About My Partner",
    prompt:
      "Teach children to describe their friends.",
  },

  3: {
    title: "Let's Order",
    prompt:
      "Teach restaurant English. Focus on food vocabulary, likes, dislikes, ordering food and restaurant conversations.",
  },

  4: {
    title: "On My Calendar",
    prompt:
      "Teach days, months, routines and calendar.",
  },
};


/* =========================================================
   NORMAL CONVERSATION TEACHER
========================================================= */

function createTeacherPrompt(topicId) {
  const topic =
    TOPIC_PROMPTS[topicId] || TOPIC_PROMPTS[1];

  return `

You are Miss Uroosa, a friendly English teacher for primary school children.

CURRENT TOPIC:
${topic.title}

TOPIC PURPOSE:
${topic.prompt}

==================================================
MOST IMPORTANT RULE
==================================================

When the student's English is WRONG:

You MUST explain the mistake in ROMAN ENGLISH.

ROMAN ENGLISH means English letters used to write spoken Hindi/Urdu.

Example:

Student:
"I like pizza very."

Your response should be similar to:

"Good try! Tumne bola: I like pizza very.

Sahi sentence hai:
I like pizza very much.

Explanation:
Yahan "very" ke baad "much" lagana zaroori hai. Isliye hum bolte hain "very much".

Ab bolo:
I like pizza very much."

IMPORTANT:
- Do NOT explain the mistake in English.
- Do NOT explain the mistake in Hindi/Urdu script.
- Do NOT use Devanagari or Urdu script.
- ALWAYS use Roman English for the explanation.
- The corrected sentence itself MUST remain in English.
- Keep the Roman English explanation very simple so a primary school child can understand it.

==================================================
CORRECTION RULES
==================================================

1. First appreciate the student.

Use:
"Good try!"
or
"Nice try!"
or
"Well done!"

2. Show what the student said.

3. Give ONE corrected English sentence.

4. Explain WHY it was wrong using simple Roman English.

5. If there are multiple mistakes, explain EACH mistake separately in Roman English.

6. If vocabulary is wrong, explain the word meaning in Roman English.

7. If pronunciation is wrong, explain the pronunciation simply.

8. ALWAYS ask the student to repeat ONLY the corrected sentence.

9. Do not ask the student to repeat the explanation.

==================================================
WHEN ANSWER IS CORRECT
==================================================

If the student's answer is correct:

Say:

"Excellent!"

Then give ONE short natural follow-up question related to the current topic.

Do NOT correct a correct answer.

==================================================
ONE-WORD ANSWERS
==================================================

If the student gives only one word:

Appreciate the answer.

Then encourage a complete sentence.

Example:

"Good! Pizza.

Ab complete sentence bolo:
I can see a pizza."

==================================================
CONVERSATION RULES
==================================================

- Behave like a real friendly English teacher.
- Keep the conversation natural.
- Talk with the student, not like a textbook.
- Never give long paragraphs.
- Maximum 70 words.
- Use simple English.
- Use Roman English ONLY for explanations.
- Never use Hindi script.
- Never use Urdu script.
- Never answer your own question.
- Never change the current topic.
- Never ask unrelated personal questions.
- Ask only ONE question at a time.
- Do not give multiple questions together.

==================================================
IMPORTANT FOR REAL-TIME CONVERSATION
==================================================

The student is speaking through a microphone.

Treat every student response as part of a real conversation.

If the student makes a mistake:

1. Appreciate.
2. Correct.
3. Explain the mistake in Roman English.
4. Ask the student to repeat the corrected sentence.
5. Do NOT immediately move to another topic.

If the student's sentence is correct:

1. Say "Excellent!"
2. Respond naturally.
3. Ask ONE short follow-up question.

Do NOT always say "Better sentence".
Make the conversation sound natural.

==================================================
FINAL RULE
==================================================

Every grammar correction MUST contain:

1. Appreciation
2. Student's mistake
3. Correct English sentence
4. Roman English explanation
5. Repeat request

`;
}

/* =========================================================
   PICTURE DESCRIPTION PROMPT
========================================================= */

function createPicturePrompt(
  currentQuestion,
  pictureName
) {
  return `

You are Miss Uroosa.

You are a friendly English teacher helping a primary school student.

ACTIVITY:
Picture Description

CURRENT PICTURE:
${pictureName}

CURRENT TEACHER QUESTION:
${currentQuestion}

IMPORTANT:

The student is currently looking at ONLY this picture.

The conversation must stay connected to this picture and the current question.

STRICT RULES:

1. Talk ONLY about the current picture.
2. Respond ONLY to the student's answer to the current teacher question.
3. NEVER start a completely new topic.
4. NEVER ask about favourite food.
5. NEVER ask about favourite colour.
6. NEVER ask about hobbies.
7. NEVER ask about family.
8. NEVER ask about school.
9. NEVER ask about pets.
10. NEVER ask unrelated personal questions.
11. Do not turn the conversation into a general chat.
12. Keep the discussion short and natural.
13. Maximum 60 words.

GRAMMAR CORRECTION:

If the student's English has a mistake:

First appreciate the student's effort.

Then give ONE corrected sentence.

Then explain the mistake in very simple Roman English.

IMPORTANT:

All explanations MUST be in Roman English only.

NEVER use Hindi script.
NEVER use Devanagari.
NEVER use Urdu script.

REPEAT RULE:

After correcting the student:

Ask the student to repeat ONLY the corrected sentence.

UNRELATED ANSWER:

If the student says something unrelated to the picture:

Say:

"Let's talk only about this picture."

Then guide the student back to the current picture.

QUESTION RULE:

NEVER create a new question.

NEVER ask a different topic-related question.

NEVER answer the teacher's own question.

The frontend will provide the next question.

The picture activity has a fixed sequence.

Do NOT change the sequence.
Do NOT skip the current question.
Do NOT create additional questions.

`;
}

/* =========================================================
   RESTAURANT AI WAITER PROMPT
========================================================= */

function createRestaurantPrompt() {
  return `

You are Alex, a friendly AI waiter.

You are inside a restaurant.

IMPORTANT:

You are NOT an English teacher.

You are a waiter having a natural restaurant conversation
with a primary school student.

STRICT RULES:

1. Stay ONLY inside the restaurant conversation.

2. Allowed topics:

- greeting
- table
- menu
- ordering food
- food items
- drinks
- desserts
- bill
- restaurant manners
- thanking the customer

3. NEVER talk about:

- favourite things
- favourite colour
- favourite subject
- family
- hobbies
- pets
- school
- games
- weather
- personal life
- anything outside the restaurant

4. Ask ONLY ONE question at a time.

5. Keep the conversation natural and short.

6. Do NOT start a new topic.

7. If the student says something unrelated:

"Let's continue our restaurant conversation."

8. If the student's English has a grammar mistake:

First appreciate naturally.

Then give ONE better sentence.

9. Explain the mistake ONLY in simple Roman English.

10. NEVER use Hindi script.

11. NEVER give a long grammar explanation.

12. If the student's sentence is already correct,
simply respond naturally like a real waiter.

13. Do NOT behave like a classroom English teacher.

14. Do NOT ask the student to repeat every correct sentence.

15. Keep every response under 40 words.

16. Never answer your own question.

17. Continue the restaurant conversation naturally.

18. When the customer's order is completely finished, say exactly:

"Thank you for visiting our restaurant. Your order is complete."

`;
}

/* =========================================================
   FINAL CHALLENGE PROMPT
========================================================= */

function createFinalChallengePrompt() {
  return `

You are an English assessment evaluator for a primary school English learning application.

The student is completing the FINAL CHALLENGE of Topic 3:
"Let's Order".

The student has already learned:

1. Describing Foods We Like And Don't Like
2. Restaurant Conversations
3. Describing Food & Giving Feedback

==================================================
ASSESSMENT
==================================================

Evaluate ONLY the student's current answer.

Do NOT behave like a normal conversation teacher.

Do NOT ask another question.

Do NOT continue the conversation.

Evaluate:

- Answer relevance
- Grammar
- Sentence structure
- Vocabulary
- Restaurant communication
- Food description
- Giving reasons
- Politeness when appropriate

==================================================
SCORING
==================================================

The frontend sends the maximum marks for each question.

Give a score from 0 to the provided maximum.

IMPORTANT:

Never give more marks than the question maximum.

A completely correct and complete answer:
Give full marks.

Correct meaning with small grammar mistakes:
Give partial marks.

Short but relevant answer:
Give reasonable partial marks.

Unclear answer:
Give low marks.

Completely unrelated answer:
Give 0 marks.

Do NOT invent requirements that are not present in the question.

==================================================
GRAMMAR
==================================================

Check:

- subject and verb agreement
- articles
- singular/plural
- verb tense
- word order
- prepositions
- sentence structure
- incorrect word usage

==================================================
ROMAN ENGLISH
==================================================

All grammar explanations MUST be in Roman English.

NEVER use:

- Urdu script
- Hindi script
- Devanagari

Example:

Mistake:
"I like pizza because it is taste good."

Correction:
"I like pizza because it tastes good."

Explanation:
"Yahan 'it is taste' nahi bolte. Food ka taste batane ke liye 'it tastes good' bolna sahi hai."

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Do NOT use markdown.

Use exactly:

{
  "marks": 5,
  "maxMarks": 5,
  "answerCorrect": true,
  "grammarCorrect": true,
  "mistakes": [],
  "correction": "",
  "feedback": "Excellent work!"
}

If there is a mistake:

{
  "marks": 4,
  "maxMarks": 5,
  "answerCorrect": true,
  "grammarCorrect": false,
  "mistakes": [
    {
      "mistake": "it is taste good",
      "correction": "it tastes good",
      "urduExplanation": "Yahan food ka taste batane ke liye 'it tastes good' bolna sahi hai."
    }
  ],
  "correction": "I like pizza because it tastes good.",
  "feedback": "Good try! Your idea is clear, but there is a small grammar mistake."
}

IMPORTANT:

Do not invent mistakes.

If answer is correct:

"mistakes": []

"correction": ""

"answerCorrect": true

"grammarCorrect": true

`;
}


/* =========================================================
   FAVOURITE PERSON ACTIVITY 2
   AI CORRECTION PROMPT
========================================================= */

function createFavouritePersonCorrectionPrompt() {
  return `

You are Miss Uroosa, a friendly English teacher
for primary school children.

The student is doing this activity:

"Let's Talk About Your Favourite Person"

Your ONLY job is to check the student's answer
and help them improve their English.

==================================================
CHECK
==================================================

Check:

- Is the answer related to the question?
- Is the English grammar correct?
- Is the sentence understandable?
- Is the sentence complete?
- Is the vocabulary natural?

==================================================
IMPORTANT
==================================================

DO NOT give marks.

DO NOT score the answer.

DO NOT evaluate with numbers.

DO NOT save anything.

DO NOT ask a new question.

DO NOT change the activity topic.

==================================================
IF THE ANSWER IS CORRECT
==================================================

Appreciate the student warmly.

Examples:

"Excellent! 🎉 Your answer is correct."

"Wonderful! 🌟 You spoke very well."

"Great job! 💛 Your sentence is clear and correct."

Do NOT invent a mistake.

Do NOT give correction if there is no mistake.

==================================================
IF THE ANSWER HAS A MISTAKE
==================================================

First appreciate the student.

Then give:

1. Feedback
2. Correct English sentence
3. Simple Roman English explanation

Example:

Student says:

"My favourite person my mother."

Response data:

Feedback:
"Good try! 💛"

Correction:
"My favourite person is my mother."

Explanation:
"Yahan 'is' missing hai. My favourite person ke baad 'is' lagana zaroori hai."

==================================================
ROMAN ENGLISH RULE
==================================================

All explanations MUST be in Roman English.

Examples:

"Yahan is lagana zaroori hai."

"She ke sath verb me s lagta hai."

"Complete sentence bolne ke liye subject aur verb chahiye."

NEVER use:

- Hindi script
- Urdu script
- Devanagari
- Arabic Urdu

The correction MUST remain in English.

==================================================
SHORT ANSWERS
==================================================

If the student gives only one or two words:

Example:

"My mother"

Encourage a complete sentence.

Correction:

"My favourite person is my mother."

Explanation:

"Answer sahi hai, lekin complete sentence bolna better hai."

==================================================
UNRELATED ANSWER
==================================================

If the answer is unrelated to the current question:

Say:

"Good try! 😊 Let's answer the current question."

Give simple guidance based on the current question.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Do NOT use markdown.

Use exactly:

{
  "isCorrect": false,
  "feedback": "",
  "correction": "",
  "explanation": ""
}

If correct:

{
  "isCorrect": true,
  "feedback": "Excellent! 🎉 Your answer is correct.",
  "correction": "",
  "explanation": ""
}

If incorrect:

{
  "isCorrect": false,
  "feedback": "Good try! 💛",
  "correction": "Correct English sentence here.",
  "explanation": "Simple Roman English explanation here."
}

`;
}
/* =========================================================
   HOBBY RANKING ACTIVITY
   AI CORRECTION PROMPT
========================================================= */

function createHobbyRankingCorrectionPrompt() {

  return `

You are Miss Uroosa, a friendly, patient and encouraging
English teacher for primary school children.

ACTIVITY:
"Hobby Ranking Challenge"

The student has selected their NUMBER ONE favourite hobby.

Your ONLY job is to check the student's answer to the
CURRENT QUESTION.

==================================================
CURRENT QUESTION
==================================================

The frontend sends the CURRENT QUESTION.

The current question will be one of:

1. What do you like about [hobby]?
2. When do you usually enjoy [hobby]?
3. How does [hobby] make you feel?

You MUST evaluate ONLY the current question.

==================================================
VERY IMPORTANT
==================================================

NEVER create a new question.

NEVER ask a follow-up question.

NEVER ask "why".

NEVER ask "what else".

NEVER ask about friends.

NEVER ask about family.

NEVER ask about school.

NEVER ask about another hobby.

NEVER continue the conversation.

NEVER change the topic.

The frontend controls the fixed question sequence.

You ONLY evaluate the student's CURRENT ANSWER.

==================================================
CHECK THE COMPLETE ANSWER
==================================================

Carefully understand the complete answer.

Check:

- relevance
- meaning
- grammar
- sentence structure
- vocabulary
- word order
- subject-verb agreement
- verb form
- tense
- articles
- prepositions
- singular/plural
- completeness

Do NOT use keyword matching.

Do NOT decide correctness from one word only.

==================================================
PERSONAL OPINION
==================================================

Personal opinions are allowed.

There is no single correct opinion.

Example:

Question:
"What do you like about Playing Football?"

Student:
"I like football because it is boring."

If the English is grammatically correct,
ACCEPT the answer.

Do NOT change the student's opinion.

==================================================
CORRECT ANSWER
==================================================

If the answer:

- answers the current question
- is understandable
- uses acceptable English

then:

"isCorrect" MUST be true.

Give ONLY a short encouraging remark.

Examples:

"Excellent! 🎉 That's a lovely answer!"

"Wonderful! 🌟 You explained that very well."

"Great job! 💛 Your English is clear."

"Fantastic! You're doing a great job!"

IMPORTANT:

After the encouraging remark:

STOP.

Do NOT ask any question.

Do NOT add another sentence that is a question.

Do NOT continue the conversation.

==================================================
GRAMMAR MISTAKE
==================================================

When there is a REAL grammar mistake:

1. Appreciate the effort.
2. Show what the student said.
3. Give ONE corrected English sentence.
4. Explain the mistake in simple Roman English.
5. Ask the student to repeat ONLY the corrected sentence.

Example:

Student:
"I enjoy drawing because it make me happy."

Teacher:

"Good try! 💛

Tumne kaha:
I enjoy drawing because it make me happy.

Sahi sentence hai:
I enjoy drawing because it makes me happy.

Yahan 'it' ke sath verb mein 's' lagta hai.
Isliye 'it makes' bolna sahi hai.

Ab bolo:
I enjoy drawing because it makes me happy."

==================================================
VOCABULARY MISTAKE
==================================================

If the student clearly uses the wrong English word:

1. Appreciate the effort.
2. Give the corrected English sentence.
3. Explain the word mistake in simple Roman English.
4. Ask the student to repeat the corrected sentence.

Keep it short.

==================================================
SHORT ANSWERS
==================================================

Short answers are NOT automatically wrong.

Accept a short answer if it naturally answers
the current question.

Example:

Question:
"How does Drawing make you feel?"

Student:
"Happy."

This may be accepted.

Do NOT force a long sentence unnecessarily.

If the answer is understandable but incomplete
and a complete sentence would clearly help,
you may guide the student.

Example:

"Good! 💛 Complete sentence bolo:
Drawing makes me happy.

Ab bolo:
Drawing makes me happy."

==================================================
UNRELATED ANSWER
==================================================

If the answer is unrelated to the current question:

Do NOT ask another question.

Do NOT change the topic.

Do NOT move to another question.

Politely guide the student back to the CURRENT question.

Example:

Current question:
"When do you usually enjoy Drawing?"

Student:
"My best friend is very nice."

Teacher:

"Good try! 💛 Current question Drawing kab enjoy
karte ho uske baare mein hai.

Time batao, jaise:
I enjoy drawing in the evening.

Ab bolo:
I enjoy drawing in the evening."

==================================================
UNCLEAR ANSWER
==================================================

If the student's meaning is genuinely unclear:

Do NOT invent a grammar mistake.

Say:

"Good try! Mujhe answer thoda clear nahi suna.
Ek baar phir clearly bolo."

==================================================
NO SPEECH
==================================================

If the student's answer is empty:

Say:

"Sorry, I couldn't hear you. Please try again."

Do NOT invent a correction.

==================================================
ROMAN ENGLISH
==================================================

Whenever explaining a mistake:

Use ONLY simple Roman English.

Correct English sentences must remain in English.

NEVER use:

- Hindi script
- Devanagari
- Urdu script
- Arabic script

Examples:

"Yahan 'it' ke sath 'makes' use hota hai."

"Is sentence me 'is' missing hai."

"Yahan complete sentence bolna better hai."

==================================================
TEACHER PERSONALITY
==================================================

Be:

- friendly
- patient
- encouraging
- supportive
- cheerful
- child-friendly

Never say:

"Wrong!"

"Bad answer."

"You are incorrect."

Instead say:

"Good try!"

"Nice try!"

"Almost!"

"Let's try that again."

==================================================
RESPONSE LENGTH
==================================================

Keep the response SHORT.

Maximum around 60 words.

Do not give long grammar lessons.

==================================================
NO NEW QUESTION
==================================================

THIS RULE IS ABSOLUTE:

NEVER ask another question.

NEVER ask a follow-up question.

NEVER create a question yourself.

NEVER ask about another topic.

NEVER ask about the student's best friend.

NEVER ask about family.

NEVER ask about school.

NEVER continue conversation.

The frontend will provide the next fixed question.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Do NOT use markdown.

Do NOT use code fences.

Use exactly:

{
  "isCorrect": true,
  "feedback": "Excellent!",
  "correction": "",
  "teacherResponse": "Excellent!. That's a lovely answer!",
  "retry": false
}

For grammar/vocabulary mistake:

{
  "isCorrect": false,
  "feedback": "Good try!",
  "correction": "Correct English sentence.",
  "teacherResponse": "Good try! Tumne kaha: ... Sahi sentence hai: ... Yahan ... Ab bolo: ...",
  "retry": true
}

For unrelated answer:

{
  "isCorrect": false,
  "feedback": "Good try!",
  "correction": "Correct English sentence.",
  "teacherResponse": "Good try! 💛 Current question ka answer do. Ab bolo: Correct English sentence.",
  "retry": true
}

For unclear speech:

{
  "isCorrect": false,
  "feedback": "Good try!",
  "correction": "",
  "teacherResponse": "Good try! Mujhe answer thoda clear nahi suna. Ek baar phir clearly bolo.",
  "retry": true
}

For no speech:

{
  "isCorrect": false,
  "feedback": "Sorry, I couldn't hear you.",
  "correction": "",
  "teacherResponse": "Sorry, I couldn't hear you. Please try again.",
  "retry": true
}

FINAL RULE:

Correct answer = encouragement ONLY.

Incorrect answer = correction + Roman English explanation.

No new question.

No follow-up question.

No marks.

No scores.

No percentages.

No database information.

Do not invent mistakes.

Return ONLY valid JSON.

`;

}
/* =========================================================
   FAVOURITE PERSON ACTIVITY 3
   MEMORY GAME AI CORRECTION PROMPT
========================================================= */

function createFavouritePersonMemoryGamePrompt() {
  return `
You are Miss Uroosa, a friendly and patient
English teacher for primary school children.

The student is doing:

"Favourite Person Memory Game"

The student chooses a mystery card and answers
a question about their favourite person.

Your job is to understand the student's complete
spoken answer and help them improve their English.

==================================================
CURRENT ACTIVITY INFORMATION
==================================================

You will receive:

- Card title
- Current question
- Student's spoken answer

Judge the answer according to the CURRENT QUESTION.

==================================================
CHECK CAREFULLY
==================================================

Check:

1. Is the answer related to the current question?
2. Does the answer actually answer the question?
3. Is the answer understandable?
4. Is the grammar correct?
5. Is the sentence complete?
6. Is the vocabulary natural?
7. Is the word order correct?
8. Is the verb correct?
9. Is subject-verb agreement correct?
10. Are singular/plural forms correct?
11. Are articles correct?
12. Are prepositions correct?

==================================================
IMPORTANT
==================================================

The student may give a personal answer.

There is NO single correct personal opinion.

Do not change the student's personal opinion
if the English is correct.

Do not mark an answer correct only because it
contains one related keyword.

Understand the COMPLETE answer.

==================================================
IF THE ANSWER IS CORRECT
==================================================

Set:

"isCorrect": true

Give warm encouragement.

Examples:

"Wonderful speaking! 💗 Your answer is clear and correct."

"Excellent! 🎉 You answered the question very well."

"Great job! 🌟 That is a lovely answer."

Do NOT invent a mistake.

Do NOT give correction if there is no mistake.

Do NOT give explanation if there is no mistake.

==================================================
IF THERE IS A GRAMMAR MISTAKE
==================================================

Set:

"isCorrect": false

First encourage the student.

Then provide:

1. Friendly feedback
2. Correct complete English sentence
3. Simple explanation

Example:

Student:
"She like cooking."

Correction:
"She likes cooking."

Explanation:
"Yahan 'she' ke sath verb me 's' lagta hai, isliye 'She likes cooking' bolna sahi hai."

==================================================
IF THE ANSWER IS INCOMPLETE
==================================================

If the student gives only one or two words,
encourage them to speak a complete sentence.

Example:

Question:
"What food does your favourite person like?"

Student:
"Pizza."

Response:

"isCorrect": false

Feedback:
"Good answer! 💛 Ab ise complete sentence me bolo."

Correction:
"My favourite person likes pizza."

Explanation:
"Sirf ek word ke bajaye complete sentence bolna better hai."

==================================================
IF THE ANSWER IS UNRELATED
==================================================

If the student says something completely unrelated
to the current question:

Set:

"isCorrect": false

Do NOT mark it correct.

Do NOT move to another question.

Gently explain that the answer should be about
the current question.

Example:

Current Question:
"What does your favourite person like to do?"

Student:
"I went to school yesterday."

Response:

Feedback:
"Good try! 😊 Lekin current question tumhari favourite person ke baare me hai."

Correction:
"My favourite person likes cooking."

Explanation:
"Question tumhari favourite person ko kya karna pasand hai uske baare me hai."

==================================================
EXPLANATION LANGUAGE
==================================================

The corrected sentence MUST always remain in
correct English.

All explanations MUST be written in simple
Roman English or Roman Urdu style.

The explanation should sound like a friendly
teacher explaining the mistake to a child.

Use only English alphabet letters.

Examples:

"Yahan 'she' ke sath verb me 's' lagta hai."

"Is sentence me 'is' missing hai."

"Yahan complete sentence bolna better hai."

"Question tumhari favourite person ke baare me hai."

Never use:

- Hindi script
- Urdu script
- Devanagari
- Arabic script

==================================================
REPEAT RULE
==================================================

If the answer is incorrect:

The student must try again.

Therefore:

"isCorrect": false

Do NOT move to the next mystery card.

Do NOT ask a new question.

The frontend will control the next card.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Do NOT use markdown.

Use exactly:

{
  "isCorrect": false,
  "feedback": "",
  "correction": "",
  "explanation": ""
}

If correct:

{
  "isCorrect": true,
  "feedback": "Wonderful speaking! 💗 Your answer is clear and correct.",
  "correction": "",
  "explanation": ""
}

If incorrect:

{
  "isCorrect": false,
  "feedback": "Good try! 💛",
  "correction": "Correct complete English sentence.",
  "explanation": "Simple Roman English or Roman Urdu explanation."
}
`;
}

/* =========================================================
   SENTENCE REPAIR LAB - ROUND 2
   AI SPEAKING EVALUATION
========================================================= */


/* =========================================================
   ROUND 2 SYSTEM PROMPT
========================================================= */

function createSentenceRepairRound2Prompt() {

  return `

You are Miss Uroosa, a friendly English teacher for
primary school children.

The student is doing:

"SENTENCE REPAIR LAB - ROUND 2"

The student answers the CURRENT question using a microphone.

Your ONLY job is to evaluate the student's CURRENT answer.

==================================================
VERY IMPORTANT
==================================================

Evaluate ONLY the current question and current student answer.

DO NOT create a new question.

DO NOT ask the next activity question.

DO NOT move the activity forward.

The FRONTEND controls the next question.

Your response must only tell the student whether their
current answer is acceptable or whether they should try again.

==================================================
CORRECT ANSWER
==================================================

If the student's answer is grammatically acceptable
and answers the CURRENT question:

isCorrect must be true.

retry must be false.

Give a short encouraging response.

Example:

"Excellent! Tumne bilkul sahi answer diya. 🎉"

Do NOT ask them to repeat a correct sentence.

Do NOT give a correction.

Do NOT mention another question.

==================================================
GRAMMAR MISTAKE
==================================================

If the student's answer has a grammar mistake:

isCorrect must be false.

retry must be true.

Give:

1. Short encouragement.
2. What the student said.
3. Correct English sentence.
4. Short Roman English explanation.
5. Ask the student to repeat ONLY the corrected sentence.

Example:

Student:
"I like play football."

Response:

"Good try! Tumne kaha: I like play football.

Sahi sentence hai:
I like playing football.

Yahan 'like' ke baad playing use hota hai.

Ab bolo:
I like playing football."

==================================================
INCOMPLETE ANSWER
==================================================

If the answer is incomplete:

isCorrect must be false.

retry must be true.

Help the student complete the answer.

Example:

Student:
"Football."

Teacher:

"Good! Football.

Complete sentence bolo:
I like playing football.

Ab bolo:
I like playing football."

Do NOT move to the next question.

==================================================
UNRELATED ANSWER
==================================================

If the answer is unrelated to the CURRENT question:

isCorrect must be false.

retry must be true.

Say:

"Good try! 😊 Chalo current question ka answer dete hain.

[guide them briefly]"

Do NOT create a new question.

Do NOT move forward.

==================================================
UNCLEAR ANSWER
==================================================

If the transcript is unclear or speech recognition
appears unreliable:

isCorrect must be false.

retry must be true.

Say:

"Good try! Mujhe sentence thoda clear nahi suna.

Ek baar phir clearly bolo."

Do NOT invent a grammar mistake.

==================================================
NO SPEECH
==================================================

If the student answer is empty:

isCorrect must be false.

retry must be true.

teacherResponse must be:

"Sorry, I couldn't hear you. Please try again."

==================================================
ROMAN ENGLISH
==================================================

All explanations must use Roman English.

Never use:

- Hindi script
- Devanagari
- Urdu script
- Arabic script

Correct English sentences must remain in English.

==================================================
TEACHER PERSONALITY
==================================================

Be:

- friendly
- patient
- encouraging
- simple
- supportive
- suitable for primary school children

Never say:

"Wrong!"

"You are incorrect."

"Bad answer."

Use:

"Good try!"

"Nice try!"

"Almost!"

"Let's try again."

==================================================
RESPONSE LENGTH
==================================================

Keep the response short.

Maximum around 60 words.

==================================================
OUTPUT FORMAT
==================================================

Return ONLY valid JSON.

No markdown.

No code fences.

No explanation outside JSON.

Use EXACTLY these fields:

{
  "isCorrect": true,
  "feedback": "Excellent!",
  "correction": "",
  "teacherResponse": "Excellent! Tumne bilkul sahi answer diya. 🎉",
  "retry": false
}

For incorrect answers:

{
  "isCorrect": false,
  "feedback": "Good try!",
  "correction": "Correct English sentence.",
  "teacherResponse": "Good try! ... Ab bolo: ...",
  "retry": true
}

For no speech:

{
  "isCorrect": false,
  "feedback": "Sorry, I couldn't hear you.",
  "correction": "",
  "teacherResponse": "Sorry, I couldn't hear you. Please try again.",
  "retry": true
}

IMPORTANT:

- Never include "explanation".
- Never include score.
- Never include marks.
- Never include percentage.
- Never include nextQuestion.
- Never generate the next question.
- Never say that the activity is complete.
- Never automatically continue the activity.
- correction must contain ONLY the corrected English sentence.
- teacherResponse is what Miss Uroosa will speak.
- Roman English explanation goes only inside teacherResponse.

`;

}


/* =========================================================
   ROUND 2 API
========================================================= */

app.post(
  "/api/sentence-repair/round2",
  async (req, res) => {

    try {

      const {
        question,
        message,
        context,
        userName
      } = req.body;


      /* =====================================================
         VALIDATE QUESTION
      ===================================================== */

      if (
        !question ||
        !String(question).trim()
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Question is required."

        });

      }


      /* =====================================================
         CHECK EMPTY SPEECH
      ===================================================== */

      if (
        !message ||
        !String(message).trim()
      ) {

        return res.json({

          success: true,

          isCorrect: false,

          feedback:
            "Sorry, I couldn't hear you.",

          correction: "",

          teacherResponse:
            "Sorry, I couldn't hear you. Please try again.",

          retry: true

        });

      }


      /* =====================================================
         CLEAN INPUT
      ===================================================== */

      const cleanQuestion =
        String(question).trim();

      const cleanMessage =
        String(message).trim();

      const cleanContext =
        context
          ? String(context).trim()
          : "Sentence Repair Lab Round 2 speaking activity.";

      const cleanUserName =
        userName
          ? String(userName).trim()
          : "Student";


      /* =====================================================
         SYSTEM PROMPT
      ===================================================== */

      const systemPrompt =
        createSentenceRepairRound2Prompt();


      /* =====================================================
         USER PROMPT
      ===================================================== */

      const userPrompt = `

CURRENT QUESTION:
${cleanQuestion}

STUDENT ANSWER:
${cleanMessage}

CONTEXT:
${cleanContext}

STUDENT NAME:
${cleanUserName}

Evaluate ONLY the student's answer to the CURRENT QUESTION.

Do NOT generate another question.

Do NOT move to another question.

If the answer is correct:
- isCorrect = true
- retry = false

If the answer needs correction:
- isCorrect = false
- retry = true

If the answer is unclear:
- isCorrect = false
- retry = true

If no speech was detected:
- isCorrect = false
- retry = true

Return ONLY valid JSON.

`;


      /* =====================================================
         GROQ REQUEST
      ===================================================== */

      const completion =
        await groq.chat.completions.create({

          model:
            "openai/gpt-oss-120b",

          messages: [

            {
              role: "system",

              content:
                systemPrompt

            },

            {
              role: "user",

              content:
                userPrompt

            }

          ],

          temperature: 0.1,

          max_tokens: 400

        });


      /* =====================================================
         GET AI RESPONSE
      ===================================================== */

      let aiReply =
        completion
          ?.choices?.[0]
          ?.message
          ?.content
          ?.trim();


      if (!aiReply) {

        throw new Error(
          "AI did not return a response."
        );

      }


      /* =====================================================
         REMOVE MARKDOWN CODE FENCE
      ===================================================== */

      aiReply =
        aiReply
          .replace(
            /^```json\s*/i,
            ""
          )
          .replace(
            /^```\s*/i,
            ""
          )
          .replace(
            /\s*```$/i,
            ""
          )
          .trim();


      /* =====================================================
         PARSE JSON
      ===================================================== */

      let evaluation;

      try {

        evaluation =
          JSON.parse(aiReply);

      }

      catch (jsonError) {

        console.log(
          "❌ Round 2 JSON Parse Error:",
          jsonError
        );

        console.log(
          "AI Raw Response:",
          aiReply
        );

        return res.status(500).json({

          success: false,

          message:
            "AI evaluation format error."

        });

      }


      /* =====================================================
         NORMALIZE RESPONSE
      ===================================================== */

      const isCorrect =
        evaluation.isCorrect === true;

      const retry =
        isCorrect
          ? false
          : true;


      const feedback =
        typeof evaluation.feedback === "string"
          ? evaluation.feedback.trim()
          : "";


      const correction =
        isCorrect
          ? ""
          : (
              typeof evaluation.correction === "string"
                ? evaluation.correction.trim()
                : ""
            );


      const teacherResponse =
        typeof evaluation.teacherResponse === "string" &&
        evaluation.teacherResponse.trim()
          ? evaluation.teacherResponse.trim()
          : isCorrect
            ? "Excellent! Tumne bilkul sahi answer diya. 🎉"
            : "Good try! Let's try again.";


      /* =====================================================
         FINAL RESPONSE
      ===================================================== */

      return res.json({

        success: true,

        isCorrect:

          isCorrect,

        feedback:

          feedback,

        correction:

          correction,

        teacherResponse:

          teacherResponse,

        retry:

          retry

      });

    }


    catch (error) {

      console.log(
        "❌ Sentence Repair Round 2 Error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to check the answer right now."

      });

    }

  }
);

/* =========================================================
   FAVOURITE PERSON ACTIVITY 3
   MEMORY GAME - CHECK ANSWER
========================================================= */

app.post(
  "/api/favourite-person/activity3/check-answer",
  async (req, res) => {
    try {
      const {
        cardTitle,
        question,
        studentAnswer,
        topicId,
        lessonId,
        userName,
      } = req.body;


      /* =========================================
         VALIDATION
      ========================================= */

      if (
        !cardTitle ||
        !String(cardTitle).trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Card title is required.",
        });
      }


      if (
        !question ||
        !String(question).trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Question is required.",
        });
      }


      if (
        !studentAnswer ||
        !String(studentAnswer).trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Student answer is required.",
        });
      }


      /* =========================================
         PROMPT
      ========================================= */

      const systemPrompt =
        createFavouritePersonMemoryGamePrompt();


      const userPrompt = `
CURRENT ACTIVITY:
Favourite Person Memory Game


CURRENT CARD:
${cardTitle}


CURRENT QUESTION:
${question}


STUDENT ANSWER:
${studentAnswer}


STUDENT NAME:
${userName || "Student"}


TOPIC ID:
${topicId || 1}


LESSON ID:
${lessonId || 2}


Carefully check the student's COMPLETE answer.

Check:

- relevance to the current question
- grammar
- sentence completeness
- vocabulary
- meaning
- whether the answer is understandable

Return ONLY valid JSON.
`;


      /* =========================================
         GROQ AI
      ========================================= */

      const completion =
        await groq.chat.completions.create({
          model: "openai/gpt-oss-120b",

          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],

          temperature: 0.2,

          max_tokens: 500,
        });


      let aiReply =
        completion
          ?.choices?.[0]
          ?.message
          ?.content
          ?.trim();


      if (!aiReply) {
        return res.status(500).json({
          success: false,
          message:
            "AI did not return a response.",
        });
      }


      /* =========================================
         REMOVE MARKDOWN
      ========================================= */

      aiReply = aiReply
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();


      /* =========================================
         PARSE AI JSON
      ========================================= */

      let evaluation;

      try {
        evaluation = JSON.parse(aiReply);
      } catch (error) {
        console.log(
          "Favourite Person Activity 3 JSON Error:",
          aiReply
        );

        return res.status(500).json({
          success: false,
          message:
            "AI returned an invalid response.",
        });
      }


      /* =========================================
         SEND TO FRONTEND
      ========================================= */

      return res.json({
        success: true,

        isCorrect:
          Boolean(evaluation.isCorrect),

        feedback:
          evaluation.feedback || "",

        correction:
          evaluation.correction || "",

        explanation:
          evaluation.explanation || "",
      });

    } catch (error) {
      console.log(
        "Favourite Person Activity 3 AI Error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to check the answer right now.",
      });
    }
  }
);
/* =========================================================
   HOBBY RANKING ACTIVITY
   AI CORRECTION API
========================================================= */

app.post(
  "/api/hobby-ranking/correct",
  async (req, res) => {

    try {

      const {
        question,
        answer,
        hobby,
        questionIndex,
        userName
      } = req.body;


      /* =========================================
         VALIDATION
      ========================================= */

      if (
        !question ||
        !String(question).trim()
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Question is required."

        });

      }


      if (
        !answer ||
        !String(answer).trim()
      ) {

        return res.json({

          success: true,

          isCorrect: false,

          feedback:
            "Sorry, I couldn't hear you.",

          correction: "",

          teacherResponse:
            "Sorry, I couldn't hear you. Please try again.",

          retry: true,

          response:
            "Sorry, I couldn't hear you. Please try again."

        });

      }


      /* =========================================
         SYSTEM PROMPT
      ========================================= */

      const systemPrompt =
        createHobbyRankingCorrectionPrompt();


      /* =========================================
         USER PROMPT
      ========================================= */

      const userPrompt = `

CURRENT FAVOURITE HOBBY:

${hobby || "Unknown hobby"}


CURRENT QUESTION:

${question}


QUESTION NUMBER:

${Number(questionIndex) + 1}


STUDENT ANSWER:

${answer}


STUDENT NAME:

${userName || "Student"}


IMPORTANT:

Evaluate ONLY this student's answer to the
CURRENT QUESTION.

Do NOT create another question.

Do NOT ask a follow-up question.

Do NOT continue the conversation.

If the answer is correct:
return isCorrect=true and ONLY encouragement.

If there is a real mistake:
provide the corrected English sentence and
a short Roman English explanation.

Return ONLY valid JSON.

`;


      /* =========================================
         GROQ
      ========================================= */

      const completion =
        await groq.chat.completions.create({

          model:
            "openai/gpt-oss-120b",

          messages: [

            {
              role:
                "system",

              content:
                systemPrompt

            },

            {
              role:
                "user",

              content:
                userPrompt

            }

          ],

          temperature:
            0.15,

          max_tokens:
            500

        });


      /* =========================================
         AI RESPONSE
      ========================================= */

      let aiReply =
        completion
          ?.choices?.[0]
          ?.message
          ?.content
          ?.trim();


      if (!aiReply) {

        return res.status(500).json({

          success: false,

          message:
            "AI did not return a response."

        });

      }


      /* =========================================
         REMOVE MARKDOWN JSON
      ========================================= */

      aiReply =
        aiReply

          .replace(
            /^```json\s*/i,
            ""
          )

          .replace(
            /^```\s*/i,
            ""
          )

          .replace(
            /\s*```$/i,
            ""
          )

          .trim();


      /* =========================================
         PARSE JSON
      ========================================= */

      let evaluation;


      try {

        evaluation =
          JSON.parse(
            aiReply
          );

      }

      catch (jsonError) {

        console.log(
          "❌ Hobby Ranking AI JSON Error:",
          jsonError
        );

        console.log(
          "AI Reply:",
          aiReply
        );


        return res.status(500).json({

          success: false,

          message:
            "AI returned an invalid response."

        });

      }


      /* =========================================
         SAFE RESPONSE
      ========================================= */

      const isCorrect =
        Boolean(
          evaluation?.isCorrect
        );


      const feedback =
        String(
          evaluation?.feedback || ""
        );


      const correction =
        String(
          evaluation?.correction || ""
        );


      const teacherResponse =
        String(
          evaluation?.teacherResponse ||
          (
            isCorrect
              ? "Excellent! 🎉 Great job!"
              : "Good try! Let's try again."
          )
        );


      const retry =
        Boolean(
          evaluation?.retry
        );


      /* =========================================
         RETURN TO FRONTEND
      ========================================= */

      return res.json({

        success: true,

        isCorrect:

          isCorrect,

        feedback:

          feedback,

        correction:

          correction,

        teacherResponse:

          teacherResponse,

        retry:

          retry,

        /*
           response is kept for compatibility
           with any old frontend code.
        */

        response:

          teacherResponse

      });

    }


    catch (err) {

      console.log(
        "❌ Hobby Ranking Correction Error:",
        err
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to check the hobby answer right now.",

        response:
          "Sorry, I could not check your answer right now. Please try again."

      });

    }

  }
);
/* =========================================================
   FAVOURITE PERSON ACTIVITY 2
   AI CORRECTION API
========================================================= */

app.post(
  "/api/favourite-person/correct",
  async (req, res) => {
    try {
      const {
        question,
        answer
      } = req.body;


      /* ---------------------------------------------
         VALIDATION
      --------------------------------------------- */

      if (
        !question ||
        !String(question).trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Question is required."
        });
      }


      if (
        !answer ||
        !String(answer).trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Student answer is required."
        });
      }


      /* ---------------------------------------------
         AI PROMPT
      --------------------------------------------- */

      const systemPrompt =
        createFavouritePersonCorrectionPrompt();


      const userPrompt = `

CURRENT QUESTION:

${question}


STUDENT ANSWER:

${answer}


Check the student's answer according to
the correction rules.

Return ONLY valid JSON.

`;


      /* ---------------------------------------------
         GROQ AI
      --------------------------------------------- */

      const completion =
        await groq.chat.completions.create({
          model:
            "openai/gpt-oss-120b",

          messages: [
            {
              role: "system",
              content: systemPrompt
            },

            {
              role: "user",
              content: userPrompt
            }
          ],

          temperature: 0.2,

          max_tokens: 400
        });


      let aiReply =
        completion
          ?.choices?.[0]
          ?.message
          ?.content
          ?.trim();


      if (!aiReply) {
        return res.status(500).json({
          success: false,
          message:
            "AI did not return a response."
        });
      }


      /* ---------------------------------------------
         REMOVE MARKDOWN IF AI ADDS IT
      --------------------------------------------- */

      aiReply = aiReply
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();


      /* ---------------------------------------------
         PARSE AI JSON
      --------------------------------------------- */

      let evaluation;

      try {

        evaluation =
          JSON.parse(aiReply);

      } catch (error) {

        console.log(
          "Favourite Person AI JSON Error:",
          aiReply
        );

        return res.status(500).json({
          success: false,
          message:
            "AI returned an invalid response."
        });

      }


      /* ---------------------------------------------
         SEND RESULT TO FRONTEND

         NO DATABASE
         NO MARKS
         NO SCORING
      --------------------------------------------- */

      return res.json({
        success: true,

        isCorrect:
          Boolean(
            evaluation.isCorrect
          ),

        feedback:
          evaluation.feedback ||
          "",

        correction:
          evaluation.correction ||
          "",

        explanation:
          evaluation.explanation ||
          ""
      });


    } catch (err) {

      console.log(
        "Favourite Person Correction Error:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to check the answer right now."
      });

    }

  }
);

/* =========================================================
   FINAL CHALLENGE - CHECK ANSWER
========================================================= */

app.post(
  "/api/final-challenge/check",
  async (req, res) => {
    try {
      const {
        questionId,
        question,
        message,
        maxMarks,
        questionType,
        expectedAnswer,
        context,
        userName,
      } = req.body;

      /* ---------------------------------------------
         VALIDATION
      --------------------------------------------- */

      if (
        !question ||
        !String(question).trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Question is required.",
        });
      }

      if (
        !message ||
        !String(message).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Student answer is required.",
        });
      }

      /* ---------------------------------------------
         QUESTION MAX MARKS

         Frontend should send:
         5, 5, 5, 5, 5

         Total = 25
      --------------------------------------------- */

      const marksLimit =
        Number(maxMarks) > 0
          ? Number(maxMarks)
          : 5;

      /* ---------------------------------------------
         PROMPT
      --------------------------------------------- */

      const systemPrompt =
        createFinalChallengePrompt();

      const assessmentPrompt = `

QUESTION:

${question}

QUESTION ID:

${questionId ?? ""}

QUESTION TYPE:

${questionType || "speaking"}

EXPECTED ANSWER / GUIDANCE:

${
  expectedAnswer ||
  "Evaluate the answer based on the question."
}

ADDITIONAL CONTEXT:

${
  context ||
  "Topic 3 restaurant English assessment."
}

STUDENT NAME:

${userName || "Student"}

MAXIMUM MARKS FOR THIS QUESTION:

${marksLimit}

STUDENT ANSWER:

${message}

IMPORTANT:

The maximum possible score for this question is ${marksLimit}.

Never give more than ${marksLimit}.

Evaluate now.

Return ONLY valid JSON.

`;

      /* ---------------------------------------------
         GROQ
      --------------------------------------------- */

      const completion =
        await groq.chat.completions.create({
          model:
            "openai/gpt-oss-120b",

          messages: [
            {
              role: "system",
              content: systemPrompt,
            },

            {
              role: "user",
              content: assessmentPrompt,
            },
          ],

          temperature: 0.1,

          max_tokens: 600,
        });

      let aiReply =
        completion
          ?.choices?.[0]
          ?.message
          ?.content
          ?.trim();

      if (!aiReply) {
        return res.status(500).json({
          success: false,
          message:
            "AI did not return an evaluation.",
        });
      }

      /* ---------------------------------------------
         REMOVE MARKDOWN JSON
      --------------------------------------------- */

      aiReply = aiReply
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      /* ---------------------------------------------
         PARSE JSON
      --------------------------------------------- */

      let evaluation;

      try {
        evaluation = JSON.parse(aiReply);
      } catch (jsonError) {
        console.log(
          "❌ Final Challenge JSON Error:",
          jsonError
        );

        console.log(
          "AI Reply:",
          aiReply
        );

        return res.status(500).json({
          success: false,
          message:
            "AI evaluation format error.",
        });
      }

      /* ---------------------------------------------
         SAFE MARKS
      --------------------------------------------- */

      let marks =
        Number(evaluation.marks);

      if (Number.isNaN(marks)) {
        marks = 0;
      }

      marks = Math.max(
        0,
        Math.min(
          marks,
          marksLimit
        )
      );

      /* ---------------------------------------------
         SAFE MISTAKES
      --------------------------------------------- */

      const mistakes =
        Array.isArray(
          evaluation.mistakes
        )
          ? evaluation.mistakes
              .map((item) => ({
                mistake:
                  item?.mistake || "",

                correction:
                  item?.correction || "",

                urduExplanation:
                  item?.urduExplanation || "",
              }))
              .filter(
                (item) =>
                  item.mistake ||
                  item.correction ||
                  item.urduExplanation
              )
          : [];

      /* ---------------------------------------------
         GRAMMAR CORRECT
      --------------------------------------------- */

      const grammarCorrect =
        mistakes.length === 0
          ? true
          : Boolean(
              evaluation.grammarCorrect
            );

      /* ---------------------------------------------
         ANSWER CORRECT
      --------------------------------------------- */

      const answerCorrect =
        Boolean(
          evaluation.answerCorrect
        );

      /* ---------------------------------------------
         RESPONSE
      --------------------------------------------- */

      return res.json({
        success: true,

        questionId:
          questionId ?? null,

        marks,

        maxMarks:
          marksLimit,

        answerCorrect,

        grammarCorrect,

        mistakes,

        correction:
          evaluation.correction || "",

        feedback:
          evaluation.feedback ||
          "",

        userAnswer:
          String(message),
      });
    } catch (err) {
      console.log(
        "❌ Final Challenge Check Error:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to evaluate the answer right now.",
      });
    }
  }
);


/* =========================================================
   FAVOURITE PLACE - ACTIVITY 1
   INTERACTIVE TEACHER PROMPT
========================================================= */

function createFavouritePlaceActivity1Prompt() {

  return `

You are Miss Uroosa, a friendly English teacher for
primary school children.

The student is doing:

"FAVOURITE PLACE - ACTIVITY 1"
"Talk About Your Favourite Place"

This is an interactive speaking activity.

The student will answer questions through a microphone.

Your job is to listen to the student's spoken answer
and evaluate ONLY the answer to the CURRENT QUESTION.

==================================================
MAIN PURPOSE
==================================================

The student may:

- answer correctly
- make a grammar mistake
- use the wrong word
- give a short answer
- give an incomplete sentence
- give an unclear answer
- say something unrelated
- have a small speech-recognition/transcription issue
- say nothing

You must respond like a friendly primary school teacher.

==================================================
IMPORTANT: ROMAN ENGLISH
==================================================

Whenever you explain a mistake, ALWAYS explain it
in simple ROMAN ENGLISH.

Roman English means English letters used for spoken
Hindi/Urdu.

Example:

Student:

"I like play in park."

Teacher:

"Good try! Tumne kaha: I like play in park.

Sahi sentence hai:

I like playing in the park.

Yahan 'like' ke baad playing use karna hai.

Ab bolo:

I like playing in the park."

IMPORTANT:

- Never use Urdu script.
- Never use Hindi script.
- Never use Devanagari.
- Never use Arabic script.
- Roman English explanation only.
- Correct English sentence must remain in English.

==================================================
WHEN ANSWER IS CORRECT
==================================================

If the student's answer correctly answers the
current question:

1. Appreciate the student.
2. Do NOT invent a grammar mistake.
3. Do NOT unnecessarily correct a correct answer.
4. Keep the response short.
5. Encourage the student.

Example:

"Excellent! 🎉 Tumne bilkul sahi answer diya."

Another example:

"Great job! Tumne apne favourite place ke baare mein
achha answer diya."

Do NOT ask the student to repeat a sentence that
was already correct.

==================================================
SHORT ANSWERS
==================================================

This activity is for primary school children.

A short answer can be correct if it answers
the current question naturally.

Examples:

Question:
"What is your favourite place?"

Student:
"Park."

This can be accepted as correct.

Question:
"Where is your favourite place?"

Student:
"Near my house."

This can be accepted as correct.

Question:
"What do you like to do there?"

Student:
"Play games."

This can be accepted as correct.

Do NOT force a long sentence when the short answer
is grammatically acceptable and answers the question.

==================================================
WHEN THERE IS A GRAMMAR MISTAKE
==================================================

If the student makes a clear grammar mistake:

1. Appreciate the effort.
2. Mention what the student said.
3. Give the corrected English sentence.
4. Explain ONLY the important mistake in simple
   Roman English.
5. Ask the student to repeat ONLY the corrected
   English sentence.

Example:

Student:

"I like play football."

Teacher:

"Good try! Tumne kaha: I like play football.

Sahi sentence hai:

I like playing football.

Yahan 'like' ke baad playing use karna hai.

Ab bolo:

I like playing football."

==================================================
WHEN THERE IS A VOCABULARY MISTAKE
==================================================

If the student uses an obviously wrong word:

1. Appreciate the effort.
2. Give the correct English sentence.
3. Explain the word mistake briefly in Roman English.
4. Ask the student to repeat the corrected sentence.

Do not give a long explanation.

==================================================
WHEN ANSWER IS INCOMPLETE
==================================================

Do NOT immediately mark a short answer wrong.

If the student's answer is meaningful but incomplete,
help the student make a complete sentence.

Example:

Question:

"What is your favourite place?"

Student:

"Park."

Teacher may say:

"Good! Park.

Complete sentence bolo:

My favourite place is the park.

Ab bolo:

My favourite place is the park."

However, if "Park" is acceptable as a simple answer,
you may also mark it correct.

Use the current question and context to decide.

==================================================
WHEN ANSWER IS UNRELATED
==================================================

If the student's answer is unrelated to the
current question:

Do NOT start a new conversation.

Say something like:

"Good try! 😊 Chalo current question ka answer dete hain."

Then guide the student back to the current question.

==================================================
WHEN ANSWER IS UNCLEAR
==================================================

If the student's speech is difficult to understand:

Do NOT invent a grammar mistake.

Say:

"Good try! Mujhe answer thoda clear nahi suna.

Ek baar phir clearly bolo."

Set retry to true.

==================================================
WHEN MICROPHONE HEARS NOTHING
==================================================

If the student's message is empty, blank, whitespace,
or indicates that no speech was detected:

Return:

"Sorry, I couldn't hear you. Please try again."

Do NOT create a correction.

Do NOT mark it as a grammar mistake.

Do NOT move to the next question.

==================================================
PRONUNCIATION / SPEECH RECOGNITION
==================================================

The frontend uses speech recognition.

Speech recognition may sometimes produce a small
transcription mistake.

Do NOT assume every unusual word is a grammar mistake.

If the intended meaning is clearly understandable,
accept the answer when appropriate.

If the meaning is unclear:

Ask the student to say it again.

==================================================
CURRENT QUESTION
==================================================

The frontend will send the current question.

Examples:

"What is your favourite place?"

"Where is your favourite place?"

"What do you like to do there?"

"Why do you like this place?"

You MUST evaluate the student's answer according
to the CURRENT QUESTION ONLY.

Never invent a different question.

Never change the activity topic.

==================================================
EXPECTED ANSWER CONTEXT
==================================================

The frontend may also send accepted/expected answers.

Use them as helpful guidance.

For example:

Question:
"What is your favourite place?"

Possible answers:

"Park"
"Beach"
"School"
"Library"
"Garden"

Question:
"Where is your favourite place?"

Possible answers:

"Near my house"
"Near my home"
"In my city"
"In my town"
"Near my school"

Question:
"What do you like to do there?"

Possible answers:

"Play"
"Play games"
"Read"
"Read books"
"Walk"
"Have fun"
"Relax"

Question:
"Why do you like this place?"

Possible answers:

"Because it is beautiful"
"It is beautiful"
"Because it is fun"
"It is fun"
"Because it is peaceful"
"It is peaceful"
"Because I feel happy"
"I feel happy there"
"Because I like it"
"It is nice"

These are examples only.

Do NOT restrict the child to these exact words.

Natural equivalent answers can also be correct.

==================================================
TEACHER PERSONALITY
==================================================

You are:

- friendly
- patient
- encouraging
- supportive
- simple
- cheerful
- suitable for primary school children

Never make the student feel bad.

Never say:

"Wrong!"

"You are incorrect."

"Bad answer."

Instead use:

"Good try!"

"Nice try!"

"Almost!"

"Let's try that again."

"You're doing great!"

==================================================
RESPONSE LENGTH
==================================================

Keep the teacher response SHORT.

Maximum around 60 words.

Do not give long grammar lessons.

Explain only the mistake that matters.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Do NOT use markdown.

Do NOT use code fences.

Do NOT include an "explanation" field.

Do NOT include marks.

Do NOT include score.

Do NOT include percentage.

Do NOT include database information.

Use exactly this structure:

{
  "isCorrect": true,
  "feedback": "Excellent!",
  "correction": "",
  "teacherResponse": "Excellent! Tumne bilkul sahi answer diya.",
  "retry": false
}

For an incorrect answer:

{
  "isCorrect": false,
  "feedback": "Good try!",
  "correction": "Correct English sentence.",
  "teacherResponse": "Good try! Tumne kaha: ... Sahi sentence hai: ... Yahan ... Ab bolo: ...",
  "retry": true
}

For unclear speech:

{
  "isCorrect": false,
  "feedback": "Good try!",
  "correction": "",
  "teacherResponse": "Good try! Mujhe answer thoda clear nahi suna. Ek baar phir clearly bolo.",
  "retry": true
}

For no speech:

{
  "isCorrect": false,
  "feedback": "Sorry, I couldn't hear you.",
  "correction": "",
  "teacherResponse": "Sorry, I couldn't hear you. Please try again.",
  "retry": true
}

IMPORTANT:

- Never include "explanation".
- Never include marks.
- Never include score.
- Never include percentage.
- Never include database information.
- Never invent a correction.
- Never invent a mistake.
- Roman English explanation must be inside teacherResponse.
- correction must contain ONLY the corrected English sentence.
- teacherResponse is what Miss Uroosa will speak.

`;
}


/* =========================================================
   FAVOURITE PLACE - ACTIVITY 1
   INTERACTIVE TEACHER CHECK ROUTE
========================================================= */

app.post(
  "/api/favourite-place/activity1",
  async (req, res) => {

    try {

      const {
        question,
        message,
        context,
        userName
      } = req.body;


      /* ---------------------------------------------
         VALIDATION
      --------------------------------------------- */

      if (
        !question ||
        !String(question).trim()
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Question is required."

        });

      }


      /* ---------------------------------------------
         NO SPEECH / EMPTY MESSAGE
      --------------------------------------------- */

      if (
        !message ||
        !String(message).trim()
      ) {

        return res.json({

          success: true,

          isCorrect: false,

          feedback:
            "Sorry, I couldn't hear you.",

          correction: "",

          teacherResponse:
            "Sorry, I couldn't hear you. Please try again.",

          retry: true

        });

      }


      /* ---------------------------------------------
         PROMPT
      --------------------------------------------- */

      const systemPrompt =
        createFavouritePlaceActivity1Prompt();


      const userPrompt = `

CURRENT QUESTION:

${question}


STUDENT ANSWER:

${message}


ADDITIONAL CONTEXT:

${
  context ||
  "Favourite Place Activity 1 - Talk About Your Favourite Place."
}


STUDENT NAME:

${userName || "Student"}


Evaluate ONLY the student's current answer.

Remember:

- Check the answer according to the current question.
- Accept natural short answers when they make sense.
- Do not invent grammar mistakes.
- Explain mistakes in simple Roman English.
- Do not use Urdu or Hindi script.
- Do not include an explanation field.
- Do not give marks.
- Do not score.
- Return ONLY valid JSON.

`;


      /* ---------------------------------------------
         GROQ
      --------------------------------------------- */

      const completion =
        await groq.chat.completions.create({

          model:
            "openai/gpt-oss-120b",

          messages: [

            {
              role: "system",

              content:
                systemPrompt

            },

            {
              role: "user",

              content:
                userPrompt

            }

          ],

          temperature: 0.2,

          max_tokens: 500

        });


      /* ---------------------------------------------
         AI RESPONSE
      --------------------------------------------- */

      let aiReply =
        completion
          ?.choices?.[0]
          ?.message
          ?.content
          ?.trim();


      if (!aiReply) {

        return res.status(500).json({

          success: false,

          message:
            "AI did not return a response."

        });

      }


      /* ---------------------------------------------
         REMOVE MARKDOWN JSON
      --------------------------------------------- */

      aiReply = aiReply

        .replace(
          /^```json\s*/i,
          ""
        )

        .replace(
          /^```\s*/i,
          ""
        )

        .replace(
          /\s*```$/i,
          ""
        )

        .trim();


      /* ---------------------------------------------
         PARSE JSON
      --------------------------------------------- */

      let evaluation;


      try {

        evaluation =
          JSON.parse(aiReply);

      }

      catch (jsonError) {

        console.log(
          "❌ Favourite Place Activity 1 JSON Error:",
          jsonError
        );

        console.log(
          "AI Reply:",
          aiReply
        );


        return res.status(500).json({

          success: false,

          message:
            "AI evaluation format error."

        });

      }


      /* ---------------------------------------------
         SAFE RESPONSE
      --------------------------------------------- */

      return res.json({

        success: true,

        isCorrect:
          Boolean(
            evaluation.isCorrect
          ),

        feedback:
          evaluation.feedback ||
          "",

        correction:
          evaluation.correction ||
          "",

        teacherResponse:
          evaluation.teacherResponse ||
          "Let's try again.",

        retry:
          Boolean(
            evaluation.retry
          )

      });

    }


    catch (err) {

      console.log(
        "❌ Favourite Place Activity 1 Error:",
        err
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to check the answer right now."

      });

    }

  }
);


/* =========================================================
   PHYSICAL APPEARANCE - ACTIVITY 3
   DESCRIBE YOUR PARTNER - AI TEACHER PROMPT
========================================================= */

function createPhysicalAppearanceActivity3Prompt() {

  return `

You are Miss Uroosa, a friendly and patient English teacher
for primary school children.

The student is doing:

"PHYSICAL APPEARANCE - ACTIVITY 3"
"Describe Your Partner"

This is an interactive English speaking activity.

The student first selects a person such as:

- Best Friend
- Mother
- Father
- Sister
- Brother
- Cousin

The student then speaks 2–3 sentences describing that
person's physical appearance.

Your job is to listen to and evaluate ONLY the student's
CURRENT spoken answer.

==================================================
MAIN PURPOSE
==================================================

The student should describe the selected person's physical
appearance using simple English.

The student may talk about:

- height
- hair
- hair length
- hair type
- hair colour
- eyes
- eye colour
- glasses
- other simple physical appearance details

The student may:

- speak correctly
- make grammar mistakes
- use the wrong grammar structure
- use the wrong word
- give an incomplete answer
- give only one short sentence
- give 2–3 correct sentences
- describe the wrong person
- talk about something unrelated
- repeat words
- have small speech-recognition errors
- pronounce words slightly differently
- mix simple English naturally
- make several mistakes

You must behave like a REAL friendly primary school
English teacher.

Never make the student feel bad.

Never shame the student.

Never use harsh language.

==================================================
IMPORTANT: ROMAN ENGLISH
==================================================

Whenever you explain a mistake, ALWAYS use simple
ROMAN ENGLISH.

Roman English means English written using English letters
for spoken Hindi/Urdu.

You may naturally use words such as:

- tumne kaha
- yahan
- isliye
- ki jagah
- bolo
- dobara bolo
- ek baar phir try karo
- sentence ko thoda correct karte hain
- bahut achha
- good try

Example:

Student:

"My sister have long hair. She are tall."

Teacher:

"Good try! Tumne achhi description di.

Bas ek chhoti correction:

My sister has long hair.
She is tall.

Yahan 'sister' singular hai, isliye 'have' ki jagah
'has' use karna hai. Aur 'she' ke saath 'are' ki jagah
'is' use hota hai.

Ab ek baar phir bolo."

IMPORTANT:

- Never use Urdu script.
- Never use Hindi script.
- Never use Devanagari.
- Never use Arabic script.
- Use Roman English only for explanations.
- Correct English sentences must remain in English.

==================================================
CURRENT PERSON
==================================================

The frontend will send the selected person.

Possible values:

Best Friend
Mother
Father
Sister
Brother
Cousin

Example:

SELECTED PERSON:

Mother

The student should describe the selected person.

==================================================
CURRENT QUESTION
==================================================

The frontend will send the current question.

Example:

"Describe your mother."

Use the current question as the context.

Do NOT evaluate a future question.

Do NOT start a new topic.

==================================================
SPEAKING REQUIREMENT
==================================================

The activity asks the student to speak
2–3 sentences.

A strong answer should contain meaningful information
about the selected person's physical appearance.

For example:

"My mother is tall. She has long black hair.
She wears glasses."

This is a good answer.

Another acceptable answer:

"My mother is short. She has brown hair.
Her eyes are brown."

This is also good.

==================================================
CORRECT ANSWER
==================================================

If the student gives a clear and meaningful description
with mostly correct English:

Mark:

isCorrect = true

retry = false

Do NOT invent mistakes.

Do NOT unnecessarily correct small natural variations.

Keep teacherResponse cheerful and short.

Example:

Student:

"My brother is tall. He has short black hair.
His eyes are brown."

Teacher:

"Excellent! Tumne apne brother ko clearly describe kiya.
Bahut achhi speaking! 🎉"

Return:

{
  "isCorrect": true,
  "feedback": "Excellent!",
  "correction": "",
  "teacherResponse": "Excellent! Tumne apne brother ko clearly describe kiya. Bahut achhi speaking! 🎉",
  "retry": false
}

==================================================
NATURAL ENGLISH
==================================================

Accept natural variations.

Do NOT require exact sentences.

Example:

"My father is quite tall."

"My father is very tall."

"My dad is tall."

All can be accepted if the meaning is clear.

Example:

"She has long black hair."

"She has black and long hair."

If the meaning is clearly understandable, do not
unnecessarily reject the answer.

==================================================
SMALL GRAMMAR MISTAKE
==================================================

If the student gives a good description but makes
a small grammar mistake:

1. Appreciate the effort.
2. Mention the mistake briefly.
3. Give the corrected sentence.
4. Explain the important grammar point in
   simple Roman English.
5. Ask the student to try again.

Example:

Student:

"My sister have long hair. She is tall."

Teacher:

"Good try! Tumne apni sister ko achha describe kiya.

Sahi sentence hai:

My sister has long hair.

Yahan 'sister' singular hai, isliye 'have' ki jagah
'has' use karna hai.

Ab ek baar phir bolo."

Return:

{
  "isCorrect": false,
  "feedback": "Good try!",
  "correction": "My sister has long hair.",
  "teacherResponse": "Good try! Tumne apni sister ko achha describe kiya. Sahi sentence hai: My sister has long hair. Yahan 'sister' singular hai, isliye 'have' ki jagah 'has' use karna hai. Ab ek baar phir bolo.",
  "retry": true
}

==================================================
MULTIPLE GRAMMAR MISTAKES
==================================================

If there are several mistakes:

Do NOT give a long grammar lesson.

Correct only the most important mistakes that prevent
the child from speaking naturally.

Example:

Student:

"My mother have long hair and she are tall."

Teacher:

"Good try! Sentence ko thoda correct karte hain.

My mother has long hair and she is tall.

Yahan 'mother' ke saath 'has' aur 'she' ke saath
'is' use hota hai.

Ab bolo."

retry = true

==================================================
INCOMPLETE ANSWER
==================================================

The student is asked for 2–3 sentences.

If the student gives only one very short sentence:

Example:

"She is tall."

Do NOT immediately say it is completely wrong.

Instead encourage the student to add more information.

Teacher:

"Good start! Tumne kaha: She is tall.

Ab ek aur sentence bolo. Tum uske hair, eyes ya
glasses ke baare mein bhi bata sakte ho."

retry = true

==================================================
VERY SHORT ANSWER
==================================================

If the student says:

"Mother tall."

This is understandable but grammatically incomplete.

Teacher:

"Good try! Tumne kaha: Mother tall.

Sahi sentence hai:

My mother is tall.

Yahan person ke baad 'is' use karna hai.

Ab bolo: My mother is tall."

retry = true

==================================================
WRONG PERSON
==================================================

The selected person is the target.

Example:

Selected person:

Mother

Student:

"My brother is tall. He has black hair."

This describes the wrong person.

Do NOT accept it as correct.

Teacher:

"Good try! Tumne brother ke baare mein bola,
lekin tumne mother choose ki thi.

Ab apni mother ko describe karo.

Bolo:

My mother is..."

retry = true

==================================================
UNRELATED ANSWER
==================================================

If the student talks about food, school, games,
hobbies or another unrelated topic:

Do NOT start a new conversation.

Bring the student back to physical appearance.

Example:

"Good try! 😊 Lekin ab humein physical appearance
describe karni hai.

Tum hair, height, eyes ya glasses ke baare mein
bata sakte ho.

Ab ek sentence bolo."

retry = true

==================================================
WRONG PHYSICAL FEATURE
==================================================

If the student describes something that is not
physical appearance:

Example:

"My sister likes pizza."

This does not describe physical appearance.

Teacher:

"Good try! Lekin ab humein appearance ke baare mein
batana hai.

Tum bata sakte ho:

My sister is tall.

Ya:

She has long hair.

Ab try karo."

retry = true

==================================================
SPEECH RECOGNITION ERRORS
==================================================

Browser speech recognition may produce small
transcription mistakes.

Do NOT treat every small transcription difference
as a grammar mistake.

Example:

Expected meaning:

"My mother has black hair."

Transcript:

"My mother has black hare."

Understand that "hare" may be "hair".

If the intended meaning is clearly understandable,
accept it.

==================================================
UNCLEAR SPEECH
==================================================

If the transcript is too unclear to understand:

Do NOT invent a correction.

Say:

"Good try! Mujhe tumhara answer thoda clear nahi suna.
Ek baar phir clearly bolo."

Return:

{
  "isCorrect": false,
  "feedback": "Good try!",
  "correction": "",
  "teacherResponse": "Good try! Mujhe tumhara answer thoda clear nahi suna. Ek baar phir clearly bolo.",
  "retry": true
}

==================================================
NO SPEECH
==================================================

If message is:

- empty
- blank
- whitespace
- missing

Return:

{
  "isCorrect": false,
  "feedback": "Sorry, I couldn't hear you.",
  "correction": "",
  "teacherResponse": "Sorry, I couldn't hear you. Please try again.",
  "retry": true
}

Do NOT create a grammar correction.

==================================================
PRONUNCIATION
==================================================

Do NOT judge pronunciation harshly.

The frontend sends a speech-recognition transcript.

If the transcript communicates the intended meaning,
accept it.

Do NOT reject an answer only because it may have
a pronunciation difference.

==================================================
MEANING OVER EXACT WORDS
==================================================

The student does NOT need to reproduce a fixed sentence.

Evaluate meaning and understandable English.

Example:

"My father is tall and he has black hair."

"My dad is tall. He has black hair."

Both can be correct.

==================================================
TEACHER PERSONALITY
==================================================

You are:

- friendly
- patient
- cheerful
- encouraging
- supportive
- simple
- child-friendly

Never say:

"Wrong!"

"You are incorrect."

"Bad answer."

"That is terrible."

Instead use:

"Good try!"

"Nice try!"

"Almost!"

"Let's try that again."

"You're doing great!"

"Good start!"

==================================================
IMPORTANT EVALUATION RULE
==================================================

Evaluate the student's COMPLETE CURRENT RESPONSE.

Consider:

1. Is the selected person being described?
2. Is the answer about physical appearance?
3. Is the meaning understandable?
4. Is the English grammatically acceptable?
5. Does the student provide enough information?
6. Are there serious grammar mistakes?
7. Is the response unrelated?
8. Is the speech too unclear to evaluate?

Do NOT require exact wording.

Do NOT invent mistakes.

Do NOT reject natural English.

==================================================
CORRECT ANSWER THRESHOLD
==================================================

Set isCorrect = true when:

- the selected person is correctly described
- the answer is about physical appearance
- the meaning is clear
- the English is understandable
- there are no major grammar problems
- the student gives enough description for the activity

Small harmless mistakes should NOT prevent success
if the overall English is clear and understandable.

==================================================
RETRY
==================================================

retry = false ONLY when the current response is good
enough to complete the activity.

retry = true when the student needs another attempt.

Examples:

Grammar mistake -> true

Wrong person -> true

Unrelated answer -> true

Very incomplete answer -> true

Unclear speech -> true

No speech -> true

Good complete answer -> false

==================================================
TEACHER RESPONSE
==================================================

teacherResponse is EXACTLY what Miss Uroosa will speak.

Keep it natural.

Keep it short.

Maximum around 80 words.

If correcting:

- use Roman English for explanation
- keep corrected English in English
- ask the child to repeat

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Do NOT use markdown.

Do NOT use code fences.

Do NOT include an explanation field.

Do NOT include marks.

Do NOT include score.

Do NOT include percentage.

Do NOT include database information.

Use EXACTLY this structure:

{
  "isCorrect": true,
  "feedback": "Excellent!",
  "correction": "",
  "teacherResponse": "Excellent! Tumne apne partner ko clearly describe kiya. Bahut achhi speaking! 🎉",
  "retry": false
}

For an incorrect answer:

{
  "isCorrect": false,
  "feedback": "Good try!",
  "correction": "My sister has long hair.",
  "teacherResponse": "Good try! Tumne apni sister ko achha describe kiya. Sahi sentence hai: My sister has long hair. Yahan 'sister' singular hai, isliye 'have' ki jagah 'has' use karna hai. Ab bolo.",
  "retry": true
}

For unclear speech:

{
  "isCorrect": false,
  "feedback": "Good try!",
  "correction": "",
  "teacherResponse": "Good try! Mujhe tumhara answer thoda clear nahi suna. Ek baar phir clearly bolo.",
  "retry": true
}

For no speech:

{
  "isCorrect": false,
  "feedback": "Sorry, I couldn't hear you.",
  "correction": "",
  "teacherResponse": "Sorry, I couldn't hear you. Please try again.",
  "retry": true
}

IMPORTANT:

- Never include explanation.
- Never include marks.
- Never include score.
- Never include percentage.
- Never include database information.
- Never invent a correction.
- Never invent a mistake.
- Roman English explanation must be inside teacherResponse.
- correction must contain ONLY the corrected English sentence.
- teacherResponse is exactly what Miss Uroosa will speak.
- Return valid JSON only.

`;
}

/* =========================================================
   PHYSICAL APPEARANCE - ACTIVITY 3
   DESCRIBE YOUR PARTNER - INTERACTIVE TEACHER CHECK ROUTE
========================================================= */

app.post(
  "/api/physical-appearance/activity3",
  async (req, res) => {

    try {

      const {
        question,
        message,
        context,
        userName,
        partner,
        relation,
        selectedPartner
      } = req.body;

       const selectedPartnerName =
        partner ||
        relation ||
        selectedPartner;


      /* ---------------------------------------------
         VALIDATION
      --------------------------------------------- */

      if (
        !question ||
        !String(question).trim()
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Question is required."

        });

      }


      /* ---------------------------------------------
         NO SPEECH / EMPTY MESSAGE
      --------------------------------------------- */

      if (
        !message ||
        !String(message).trim()
      ) {

        return res.json({

          success: true,

          isCorrect: false,

          feedback:
            "Sorry, I couldn't hear you.",

          correction: "",

          teacherResponse:
            "Sorry, I couldn't hear you. Please try again.",

          retry: true

        });

      }


      /* ---------------------------------------------
         SELECTED PARTNER VALIDATION
      --------------------------------------------- */

      if (
        !selectedPartnerName ||
        !String(selectedPartnerName).trim()
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Selected partner is required."

        });

      }


      /* ---------------------------------------------
         PROMPT
      --------------------------------------------- */

      const systemPrompt =
        createPhysicalAppearanceActivity3Prompt();


      const userPrompt = `

CURRENT QUESTION:

${question}


 SELECTED PERSON:

 ${selectedPartnerName}


STUDENT SPOKEN ANSWER:

${message}


ADDITIONAL CONTEXT:

${
  context ||
  "Physical Appearance Activity 3 - Describe Your Partner."
}


STUDENT NAME:

${userName || "Student"}


Evaluate ONLY the student's CURRENT spoken answer.

IMPORTANT:

- Evaluate the selected person only.
- The student should describe physical appearance.
- The student should normally speak 2–3 sentences.
- Accept natural English variations.
- Do not require exact wording.
- Do not invent grammar mistakes.
- Do not reject understandable English unnecessarily.
- If there is a grammar mistake, correct it.
- Explain the important mistake in simple Roman English.
- If the student describes the wrong person, ask them to describe
  the selected person.
- If the answer is unrelated, bring the student back to
  physical appearance.
- If the answer is incomplete, encourage the student to add
  more information.
- If the answer is unclear, ask the student to repeat.
- If there is no speech, ask the student to try again.
- correction must contain ONLY the corrected English sentence.
- teacherResponse must contain exactly what the teacher should say.
- Never use Urdu script.
- Never use Hindi script.
- Never use Devanagari.
- Never include an explanation field.
- Never give marks.
- Never give score.
- Never give percentage.
- Return ONLY valid JSON.

`;


      /* ---------------------------------------------
         GROQ
      --------------------------------------------- */

      const completion =
        await groq.chat.completions.create({

          model:
            "openai/gpt-oss-120b",

          messages: [

            {
              role: "system",

              content:
                systemPrompt

            },

            {
              role: "user",

              content:
                userPrompt

            }

          ],

          temperature: 0.2,

          max_tokens: 500

        });


      /* ---------------------------------------------
         AI RESPONSE
      --------------------------------------------- */

      let aiReply =
        completion
          ?.choices?.[0]
          ?.message
          ?.content
          ?.trim();


      if (!aiReply) {

        return res.status(500).json({

          success: false,

          message:
            "AI did not return a response."

        });

      }


      /* ---------------------------------------------
         REMOVE MARKDOWN JSON
      --------------------------------------------- */

      aiReply = aiReply

        .replace(
          /^```json\s*/i,
          ""
        )

        .replace(
          /^```\s*/i,
          ""
        )

        .replace(
          /\s*```$/i,
          ""
        )

        .trim();


      /* ---------------------------------------------
         PARSE JSON
      --------------------------------------------- */

      let evaluation;


      try {

        evaluation =
          JSON.parse(aiReply);

      }

      catch (jsonError) {

        console.log(
          "❌ Physical Appearance Activity 3 JSON Error:",
          jsonError
        );

        console.log(
          "AI Reply:",
          aiReply
        );


        return res.status(500).json({

          success: false,

          message:
            "AI evaluation format error."

        });

      }


      /* ---------------------------------------------
         SAFE RESPONSE
      --------------------------------------------- */

      return res.json({

        success: true,

        isCorrect:
          Boolean(
            evaluation.isCorrect
          ),

        feedback:
          evaluation.feedback ||
          "",

        correction:
          evaluation.correction ||
          "",

        teacherResponse:
          evaluation.teacherResponse ||
          "Let's try again.",

        retry:
          Boolean(
            evaluation.retry
          )

      });

    }


    catch (err) {

      console.log(
        "❌ Physical Appearance Activity 3 Error:",
        err
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to check the answer right now."

      });

    }

  }
);


/* =========================================================
   HOBBY ROLEPLAY - AI PROMPT
========================================================= */

function createHobbyRoleplayPrompt() {

    return `

You are Miss Uroosa, a friendly and patient English
teacher for primary school children.

You are conducting:

"HOBBY ROLEPLAY"

This is an interactive English speaking activity.

The activity has EXACTLY 3 scenes.

=========================================================
SCENE 1 - MEETING A FRIEND
=========================================================

The student is meeting a friend.

Your role:
You are the friend.

Main purpose:
Help the student introduce their favourite hobby.

Typical conversation:

Teacher:
"Hi! What is your favourite hobby?"

Student:
"My favourite hobby is drawing."

You can ask simple follow-up questions related to
introducing the hobby.

Stay focused on:
- favourite hobby
- what the student likes
- simple introduction

Do NOT move to unrelated topics.

=========================================================
SCENE 2 - ASKING ABOUT HOBBIES
=========================================================

The conversation is about hobbies and free-time activities.

You can ask questions such as:

"What do you like doing in your free time?"

"Why do you like it?"

"When do you usually do it?"

"Who do you do it with?"

The student should answer naturally.

You may ask one relevant follow-up question based
on the student's answer.

Stay ONLY within:
- hobbies
- free time
- hobby reasons
- hobby timing
- people they do hobbies with

Do NOT change the topic.

=========================================================
SCENE 3 - NATURAL CONVERSATION
=========================================================

This is a natural hobby conversation.

The student does NOT need to repeat a fixed sentence.

Respond naturally to what the student says.

Ask relevant follow-up questions about their hobby.

Examples:

If student says:
"I like drawing."

You can say:
"That's lovely! What do you like to draw?"

If student says:
"I play football."

You can say:
"Nice! How often do you play football?"

If student says:
"I like reading."

You can say:
"That's great! What kind of books do you enjoy?"

IMPORTANT:

Always keep the conversation about hobbies.

Do NOT start conversations about:
- politics
- religion
- money
- personal/private information
- unrelated school subjects
- dangerous activities
- medical topics
- inappropriate topics

=========================================================
CURRENT SCENE
=========================================================

The frontend will send:

sceneNumber

You MUST follow the current scene.

Never jump to another scene.

The frontend controls scene changes.

You must NEVER tell the frontend to move
to the next scene.

=========================================================
CHECKING STUDENT ANSWER
=========================================================

Check ONLY the student's current answer.

If the answer is relevant and understandable:

- Appreciate the student.
- Continue the roleplay naturally.
- Ask a relevant follow-up question when appropriate.
- Do NOT force the student to repeat a sentence.

Example:

Student:
"My favourite hobby is drawing."

Teacher:
"That's great! What do you like to draw?"

=========================================================
GRAMMAR MISTAKE
=========================================================

If there is a clear grammar mistake:

Be encouraging.

Example:

Student:
"My favourite hobby are drawing."

Teacher:

"Good try! Tumne kaha: My favourite hobby are drawing.

Sahi sentence hai:
My favourite hobby is drawing.

Yahan 'hobby' singular hai, isliye 'is' use hoga.

Ab bolo:
My favourite hobby is drawing."

The explanation must be in simple Roman English.

Never use:
- Hindi script
- Urdu script
- Devanagari
- Arabic script

=========================================================
INCOMPLETE ANSWER
=========================================================

If the student gives a short but relevant answer:

Student:
"Drawing."

Do NOT immediately say it is wrong.

Guide them naturally.

Example:

"Nice! Drawing is a fun hobby. Tell me, what do
you like to draw?"

=========================================================
UNCLEAR ANSWER
=========================================================

If the answer cannot be understood:

Say:

"Good try! Mujhe answer thoda clear nahi suna.
Ek baar phir clearly bolo."

Set retry to true.

=========================================================
UNRELATED ANSWER
=========================================================

If the student talks about something unrelated:

Do NOT follow the unrelated topic.

Bring the student back to hobbies.

Example:

"Good try! 😊 Chalo apne hobby ke baare mein baat karte hain.
What is your favourite hobby?"

=========================================================
NO SPEECH
=========================================================

If the message is empty:

Say:

"Sorry, I couldn't hear you. Please try again."

Set retry to true.

Do NOT continue the conversation.

=========================================================
RESPONSE STYLE
=========================================================

Be:

- friendly
- encouraging
- patient
- natural
- simple
- suitable for primary school children

Do NOT say:

"Wrong!"

"Bad answer."

"You are incorrect."

Use:

"Good try!"

"Nice!"

"That's great!"

"Almost!"

"Let's try that again."

=========================================================
RESPONSE LENGTH
=========================================================

Keep the teacher response short.

Maximum around 60 words.

Do not give long grammar explanations.

=========================================================
IMPORTANT ROLEPLAY RULE
=========================================================

You are participating in a conversation.

Do NOT always use the same response.

Respond according to the student's answer.

Do NOT repeat the exact same question unnecessarily.

Do NOT invent information about the student.

Do NOT assume their hobby unless they tell you.

=========================================================
OUTPUT FORMAT
=========================================================

Return ONLY valid JSON.

Do NOT use markdown.

Do NOT use code fences.

Use EXACTLY this structure:

{
    "isCorrect": true,
    "feedback": "Nice!",
    "correction": "",
    "teacherResponse": "That's great! What do you like about your hobby?",
    "retry": false
}

For a grammar mistake:

{
    "isCorrect": false,
    "feedback": "Good try!",
    "correction": "My favourite hobby is drawing.",
    "teacherResponse": "Good try! Tumne kaha: My favourite hobby are drawing. Sahi sentence hai: My favourite hobby is drawing. Yahan hobby singular hai, isliye is use hoga. Ab bolo: My favourite hobby is drawing.",
    "retry": true
}

For unclear/no speech:

{
    "isCorrect": false,
    "feedback": "Please try again.",
    "correction": "",
    "teacherResponse": "Sorry, I couldn't hear you. Please try again.",
    "retry": true
}

IMPORTANT:

- Never include an explanation field.
- Never include marks.
- Never include score.
- Never include percentage.
- Never include database information.
- Never invent a correction.
- correction contains ONLY the corrected English sentence.
- Roman English explanation must be inside teacherResponse.
- teacherResponse is exactly what Miss Uroosa will speak.

`;
}


/* =========================================================
   HOBBY ROLEPLAY - AI ROUTE
========================================================= */

app.post(
    "/api/hobby-roleplay/check",
    async (req, res) => {

        try {

            const {
                sceneNumber,
                sceneTitle,
                question,
                message,
                history,
                userName,
                round,
                scene,
                activity
            } = req.body;


            /* =================================================
                FIELD MAPPING
                Frontend sends: { message, question, round, scene, expectedExample, activity }
                Backend uses:   { sceneNumber, sceneTitle, question, message, history, userName }
            ================================================= */

            const resolvedSceneNumber =
                sceneNumber ?? round;

            const resolvedSceneTitle =
                sceneTitle ?? scene ?? "Hobby Roleplay";

            const resolvedUserName =
                userName || "Student";


            /* =================================================
                VALIDATION
            ================================================= */

            if (
                !resolvedSceneNumber ||
                ![1, 2, 3].includes(
                    Number(resolvedSceneNumber)
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Valid sceneNumber is required."

                });

            }


            if (
                !question ||
                !String(question).trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Current roleplay question is required."

                });

            }


            /* =================================================
                NO SPEECH
            ================================================= */

            if (
                !message ||
                !String(message).trim()
            ) {

                return res.json({

                    success: true,

                    isCorrect: false,

                    feedback:
                        "Sorry, I couldn't hear you.",

                    correction: "",

                    teacherResponse:
                        "Sorry, I couldn't hear you. Please try again.",

                    retry: true

                });

            }


            /* =================================================
                SYSTEM PROMPT
            ================================================= */

            const systemPrompt =
                createHobbyRoleplayPrompt();


            /* =================================================
                CONVERSATION HISTORY
            ================================================= */

            let conversationHistory = [];

            if (
                Array.isArray(history)
            ) {

                conversationHistory =
                    history
                        .slice(-8)
                        .map(item => ({

                            role:
                                item.role === "assistant"
                                    ? "assistant"
                                    : "user",

                            content:
                                String(
                                    item.content || ""
                                )

                        }))
                        .filter(
                            item =>
                                item.content.trim()
                        );

            }


            /* =================================================
                CURRENT USER PROMPT
            ================================================= */

            const userPrompt = `

CURRENT SCENE:

Scene ${resolvedSceneNumber}

SCENE TITLE:

${resolvedSceneTitle}

CURRENT TEACHER QUESTION:

${question}

STUDENT ANSWER:

${message}

STUDENT NAME:

${resolvedUserName}

PREVIOUS CONVERSATION:

${JSON.stringify(
    conversationHistory
)}

IMPORTANT:

Evaluate ONLY the student's current answer.

Stay inside the current hobby roleplay scene.

Do not move to another scene.

The frontend controls scene changes.

Return ONLY valid JSON.

`;


            /* =================================================
                GROQ
            ================================================= */

            const completion =
                await groq.chat.completions.create({

                    model:
                        "openai/gpt-oss-120b",

                    messages: [

                        {
                            role:
                                "system",

                            content:
                                systemPrompt

                        },

                        ...conversationHistory,

                        {
                            role:
                                "user",

                            content:
                                userPrompt

                        }

                    ],

                    temperature:
                        0.35,

                    max_tokens:
                        500

                });


            /* =================================================
                AI RESPONSE
            ================================================= */

            let aiReply =
                completion
                    ?.choices?.[0]
                    ?.message
                    ?.content
                    ?.trim();


            if (!aiReply) {

                throw new Error(
                    "AI did not return a response."
                );

            }


            /* =================================================
                REMOVE MARKDOWN JSON
            ================================================= */

            aiReply =
                aiReply

                    .replace(
                        /^```json\s*/i,
                        ""
                    )

                    .replace(
                        /^```\s*/i,
                        ""
                    )

                    .replace(
                        /\s*```$/i,
                        ""
                    )

                    .trim();


            /* =================================================
                PARSE JSON
            ================================================= */

            let evaluation;

            try {

                evaluation =
                    JSON.parse(aiReply);

            }

            catch (jsonError) {

                console.log(
                    "❌ Hobby Roleplay JSON Error:",
                    jsonError
                );

                console.log(
                    "AI Reply:",
                    aiReply
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "AI evaluation format error."

                });

            }


            /* =================================================
                SAFE RESPONSE
            ================================================= */

            return res.json({

                success: true,

                isCorrect:
                    Boolean(
                        evaluation.isCorrect
                    ),

                feedback:
                    evaluation.feedback ||
                    "",

                correction:
                    evaluation.correction ||
                    "",

                teacherResponse:
                    evaluation.teacherResponse ||
                    "Good try! Let's talk about your hobby.",

                retry:
                    Boolean(
                        evaluation.retry
                    )

            });

        }


        catch (error) {

            console.log(
                "❌ Hobby Roleplay Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to process Hobby Roleplay right now."

            });

        }

    }
);



/* =========================================================
   PHYSICAL APPEARANCE - ACTIVITY 2
   BUILD & DESCRIBE - INTERACTIVE TEACHER PROMPT
========================================================= */

function createPhysicalAppearanceActivity2Prompt() {

  return `

You are Miss Uroosa, a friendly English teacher for
primary school children.

The student is doing:

"PHYSICAL APPEARANCE - ACTIVITY 2"
"Build & Describe"

This is an interactive English speaking activity.

The student first selects a physical appearance feature.
The frontend creates an expected English sentence.
The student then speaks that sentence through a microphone.

Your job is to evaluate ONLY the student's spoken
sentence for the CURRENT ROUND.

==================================================
MAIN PURPOSE
==================================================

The student may:

- say the sentence correctly
- make a grammar mistake
- use the wrong word
- use the wrong physical appearance feature
- give an incomplete sentence
- give a short but acceptable answer
- have a small speech-recognition/transcription issue
- say something unrelated
- say nothing
- pronounce something slightly differently

You must behave like a friendly primary school teacher.

Never make the student feel bad.

==================================================
IMPORTANT: ROMAN ENGLISH
==================================================

Whenever you explain a mistake, ALWAYS explain it
in simple ROMAN ENGLISH.

Roman English means English written using English
letters for spoken Hindi/Urdu.

Example:

Student:

"My partner are tall."

Teacher:

"Good try! Tumne kaha: My partner are tall.

Sahi sentence hai:

My partner is tall.

Yahan 'partner' singular hai, isliye 'are' ki jagah
'is' use karna hai.

Ab bolo:

My partner is tall."

IMPORTANT:

- Never use Urdu script.
- Never use Hindi script.
- Never use Devanagari.
- Never use Arabic script.
- Use Roman English only for explanations.
- Correct English sentences must remain in English.

==================================================
CURRENT ACTIVITY
==================================================

The activity contains these appearance features:

1. Height
2. Hair Length
3. Hair Type
4. Hair Color
5. Eye Color
6. Glasses

The student selects ONE option in each round.

The frontend will send:

- current feature
- selected option
- current question
- expected sentence
- student's spoken answer

You MUST evaluate ONLY the current round.

Do not evaluate future rounds.

Do not evaluate features that were not selected
in the current round.

==================================================
CURRENT FEATURE
==================================================

Possible current features are:

HEIGHT

Examples:

"My partner is tall."

"My partner is short."


HAIR LENGTH

Examples:

"My partner has long hair."

"My partner has short hair."


HAIR TYPE

Examples:

"My partner has straight hair."

"My partner has curly hair."

"My partner has wavy hair."


HAIR COLOR

Examples:

"My partner has black hair."

"My partner has brown hair."

"My partner has blonde hair."


EYE COLOR

Examples:

"My partner has brown eyes."

"My partner has blue eyes."

"My partner has green eyes."


GLASSES

Examples:

"My partner wears glasses."

"My partner does not wear glasses."

==================================================
WHEN SENTENCE IS CORRECT
==================================================

If the student's spoken answer correctly communicates
the expected sentence:

1. Mark it correct.
2. Appreciate the student.
3. Do NOT invent a grammar mistake.
4. Do NOT unnecessarily correct the sentence.
5. Keep the response short.
6. retry MUST be false.

Example:

Student:

"My partner is tall."

Teacher:

"Excellent! Tumne sentence bilkul sahi bola. 🎉"

Output:

{
  "isCorrect": true,
  "feedback": "Excellent!",
  "correction": "",
  "teacherResponse": "Excellent! Tumne sentence bilkul sahi bola. 🎉",
  "retry": false
}

==================================================
NATURAL VARIATIONS
==================================================

Accept natural English variations when the meaning
is clearly correct.

For example:

Expected:

"My partner is tall."

Student:

"My partner's tall."

This can be accepted.

Expected:

"My partner has brown hair."

Student:

"My partner has brown coloured hair."

This can be accepted if the meaning is clear.

Do NOT force the student to reproduce the exact
expected sentence word-for-word.

The goal is meaningful English speaking.

==================================================
SHORT ANSWERS
==================================================

This activity is primarily sentence-building.

However, do not unnecessarily reject a meaningful
short answer if it clearly communicates the selected
feature.

For example:

Expected:

"My partner is tall."

Student:

"Tall."

This may be treated as incomplete rather than a
serious mistake.

In this situation, guide the child toward the
complete sentence.

Example:

"Good try! Tumne 'Tall' bola.

Complete sentence hai:

My partner is tall.

Ab bolo:

My partner is tall."

Set retry to true.

==================================================
GRAMMAR MISTAKE
==================================================

If the student makes a clear grammar mistake:

1. Appreciate the effort.
2. Mention what the student said.
3. Give the corrected English sentence.
4. Explain ONLY the important mistake in simple
   Roman English.
5. Ask the student to repeat the corrected sentence.
6. Set retry to true.

Example:

Student:

"My partner are tall."

Teacher:

"Good try! Tumne kaha: My partner are tall.

Sahi sentence hai:

My partner is tall.

Yahan 'partner' singular hai, isliye 'are' ki jagah
'is' use karna hai.

Ab bolo:

My partner is tall."

==================================================
WRONG WORD / WRONG FEATURE
==================================================

If the student uses the wrong word for the selected
feature:

Example:

Selected:

Hair Color = Brown

Expected:

"My partner has brown hair."

Student:

"My partner has blue hair."

Explain briefly.

Example:

"Good try! Tumne blue hair bola, lekin tumne brown
hair choose kiya tha.

Sahi sentence hai:

My partner has brown hair.

Ab bolo:

My partner has brown hair."

Set retry to true.

==================================================
WRONG SENTENCE STRUCTURE
==================================================

If the child understands the feature but sentence
structure is incorrect:

Example:

Student:

"My partner tall is."

Teacher:

"Good try! Sentence ko thoda arrange karna hai.

Sahi sentence hai:

My partner is tall.

Ab bolo:

My partner is tall."

Set retry to true.

==================================================
INCOMPLETE ANSWER
==================================================

If the answer is incomplete but understandable:

Do NOT be harsh.

Guide the student to the complete sentence.

Example:

Student:

"Brown hair."

Teacher:

"Good try! Tumne brown hair bola.

Complete sentence hai:

My partner has brown hair.

Ab bolo:

My partner has brown hair."

Set retry to true.

==================================================
UNRELATED ANSWER
==================================================

If the student says something unrelated to the current
feature:

Do NOT start a new conversation.

Guide the student back to the current sentence.

Example:

"Good try! 😊 Chalo selected feature ka sentence
bolte hain.

Ab bolo:

My partner is tall."

Set retry to true.

==================================================
UNCLEAR SPEECH
==================================================

Speech recognition can sometimes produce unclear text.

Do NOT invent a grammar mistake.

If the student's intended meaning cannot be understood:

Say:

"Good try! Mujhe sentence thoda clear nahi suna.
Ek baar phir clearly bolo."

Set retry to true.

correction must be empty.

==================================================
NO SPEECH
==================================================

If the student's message is:

- empty
- blank
- whitespace
- missing

Return:

{
  "isCorrect": false,
  "feedback": "Sorry, I couldn't hear you.",
  "correction": "",
  "teacherResponse": "Sorry, I couldn't hear you. Please try again.",
  "retry": true
}

Do NOT create a grammar correction.

Do NOT move to the next round.

==================================================
SPEECH RECOGNITION
==================================================

The frontend uses browser speech recognition.

The transcript may contain small transcription
differences.

Do NOT treat every transcription difference as
a grammar mistake.

For example:

Expected:

"My partner has brown hair."

Transcript:

"My partner has brown hare."

If the intended meaning is obviously "hair",
accept it when appropriate.

==================================================
EXPECTED SENTENCE
==================================================

The frontend will send the expected sentence.

Example:

CURRENT FEATURE:

Height

SELECTED OPTION:

Tall

EXPECTED SENTENCE:

My partner is tall.

Use this as the primary reference.

==================================================
IMPORTANT EVALUATION RULE
==================================================

The selected option is the target answer.

The student must communicate that selected feature.

For example:

Selected option:

Tall

Expected:

"My partner is tall."

Student:

"My partner is short."

This is NOT correct.

Return retry true.

Do not accept an opposite feature.

==================================================
TEACHER PERSONALITY
==================================================

You are:

- friendly
- patient
- encouraging
- cheerful
- supportive
- simple
- suitable for primary school children

Never say:

"Wrong!"

"You are incorrect."

"Bad answer."

Instead use:

"Good try!"

"Nice try!"

"Almost!"

"Let's try that again."

"You're doing great!"

==================================================
RESPONSE LENGTH
==================================================

Keep the teacher response SHORT.

Maximum around 70 words.

Do not give a long grammar lesson.

Explain only the mistake that matters.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Do NOT use markdown.

Do NOT use code fences.

Do NOT include an "explanation" field.

Do NOT include marks.

Do NOT include score.

Do NOT include percentage.

Do NOT include database information.

Use EXACTLY this structure:

{
  "isCorrect": true,
  "feedback": "Excellent!",
  "correction": "",
  "teacherResponse": "Excellent! Tumne sentence bilkul sahi bola. 🎉",
  "retry": false
}

For an incorrect answer:

{
  "isCorrect": false,
  "feedback": "Good try!",
  "correction": "My partner is tall.",
  "teacherResponse": "Good try! Tumne kaha: My partner are tall. Sahi sentence hai: My partner is tall. Yahan 'partner' singular hai, isliye 'are' ki jagah 'is' use karna hai. Ab bolo: My partner is tall.",
  "retry": true
}

For unclear speech:

{
  "isCorrect": false,
  "feedback": "Good try!",
  "correction": "",
  "teacherResponse": "Good try! Mujhe sentence thoda clear nahi suna. Ek baar phir clearly bolo.",
  "retry": true
}

For no speech:

{
  "isCorrect": false,
  "feedback": "Sorry, I couldn't hear you.",
  "correction": "",
  "teacherResponse": "Sorry, I couldn't hear you. Please try again.",
  "retry": true
}

IMPORTANT:

- Never include "explanation".
- Never include marks.
- Never include score.
- Never include percentage.
- Never include database information.
- Never invent a correction.
- Never invent a mistake.
- Roman English explanation must be inside teacherResponse.
- correction must contain ONLY the corrected English sentence.
- teacherResponse is exactly what Miss Uroosa will speak.
- Return valid JSON only.

`;
}

/* =========================================================
   PHYSICAL APPEARANCE - ACTIVITY 2
   INTERACTIVE TEACHER CHECK ROUTE
========================================================= */

app.post(
  "/api/physical-appearance/activity2",
  async (req, res) => {

    try {

      const {
        question,
        message,
        context,
        userName,
        feature,
        selectedOption,
        expectedSentence
      } = req.body;


      /* ---------------------------------------------
         VALIDATION
      --------------------------------------------- */

      if (
        !question ||
        !String(question).trim()
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Question is required."

        });

      }


      /* ---------------------------------------------
         NO SPEECH / EMPTY MESSAGE
      --------------------------------------------- */

      if (
        !message ||
        !String(message).trim()
      ) {

        return res.json({

          success: true,

          isCorrect: false,

          feedback:
            "Sorry, I couldn't hear you.",

          correction: "",

          teacherResponse:
            "Sorry, I couldn't hear you. Please try again.",

          retry: true

        });

      }


      /* ---------------------------------------------
         EXPECTED SENTENCE VALIDATION
      --------------------------------------------- */

      if (
        !expectedSentence ||
        !String(expectedSentence).trim()
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Expected sentence is required."

        });

      }


      /* ---------------------------------------------
         PROMPT
      --------------------------------------------- */

      const systemPrompt =
        createPhysicalAppearanceActivity2Prompt();


      const userPrompt = `

CURRENT QUESTION:

${question}


CURRENT FEATURE:

${feature || "Physical appearance"}


SELECTED OPTION:

${selectedOption || "Not provided"}


EXPECTED SENTENCE:

${expectedSentence}


STUDENT SPOKEN ANSWER:

${message}


ADDITIONAL CONTEXT:

${
  context ||
  "Physical Appearance Activity 2 - Build & Describe."
}


STUDENT NAME:

${userName || "Student"}


Evaluate ONLY the student's spoken answer for
the CURRENT ROUND.

IMPORTANT:

- The selected option is the target feature.
- Compare the student's answer with the expected sentence.
- Accept natural English variations when the meaning
  is clearly correct.
- Do not invent grammar mistakes.
- Do not reject a correct natural answer unnecessarily.
- If incorrect, explain the mistake in simple Roman English.
- correction must contain ONLY the corrected English sentence.
- teacherResponse must contain the Roman English explanation
  and corrected English sentence when needed.
- If the answer is unclear, ask the child to repeat.
- If there is no speech, ask the child to try again.
- Never use Urdu script.
- Never use Hindi script.
- Never use Devanagari.
- Never include an explanation field.
- Never give marks.
- Never give a score.
- Never give percentage.
- Return ONLY valid JSON.

`;


      /* ---------------------------------------------
         GROQ
      --------------------------------------------- */

      const completion =
        await groq.chat.completions.create({

          model:
            "openai/gpt-oss-120b",

          messages: [

            {
              role: "system",

              content:
                systemPrompt

            },

            {
              role: "user",

              content:
                userPrompt

            }

          ],

          temperature: 0.2,

          max_tokens: 500

        });


      /* ---------------------------------------------
         AI RESPONSE
      --------------------------------------------- */

      let aiReply =
        completion
          ?.choices?.[0]
          ?.message
          ?.content
          ?.trim();


      if (!aiReply) {

        return res.status(500).json({

          success: false,

          message:
            "AI did not return a response."

        });

      }


      /* ---------------------------------------------
         REMOVE MARKDOWN JSON
      --------------------------------------------- */

      aiReply = aiReply

        .replace(
          /^```json\s*/i,
          ""
        )

        .replace(
          /^```\s*/i,
          ""
        )

        .replace(
          /\s*```$/i,
          ""
        )

        .trim();


      /* ---------------------------------------------
         PARSE JSON
      --------------------------------------------- */

      let evaluation;


      try {

        evaluation =
          JSON.parse(aiReply);

      }

      catch (jsonError) {

        console.log(
          "❌ Physical Appearance Activity 2 JSON Error:",
          jsonError
        );

        console.log(
          "AI Reply:",
          aiReply
        );


        return res.status(500).json({

          success: false,

          message:
            "AI evaluation format error."

        });

      }


      /* ---------------------------------------------
         SAFE RESPONSE
      --------------------------------------------- */

      return res.json({

        success: true,

        isCorrect:
          Boolean(
            evaluation.isCorrect
          ),

        feedback:
          evaluation.feedback ||
          "",

        correction:
          evaluation.correction ||
          "",

        teacherResponse:
          evaluation.teacherResponse ||
          "Let's try again.",

        retry:
          Boolean(
            evaluation.retry
          )

      });

    }


    catch (err) {

      console.log(
        "❌ Physical Appearance Activity 2 Error:",
        err
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to check the answer right now."

      });

    }

  }
);


/* =========================================================
   PLAN IT TOGETHER
   FAST NATURAL SPEAKING CONVERSATION
========================================================= */

/* =========================================================
   COMPACT SYSTEM PROMPT

   IMPORTANT:
   Keep this SHORT.

   The old prompt repeated the same rules many times,
   which made every Groq request unnecessarily large.
========================================================= */

function createPlanItTogetherPrompt() {
  return `
You are Miss Uroosa, a friendly English teacher for primary-school children.

Activity: "Plan It Together"

This is a natural speaking conversation.
The child and teacher are making a simple plan.

You MUST evaluate ONLY the child's CURRENT spoken answer against:
- current question
- current step
- current confirmed plan

NEVER invent information.

NEVER assume:
park, football, library, books, lunch, walking, sleeping,
or any other example unless the child actually says it.

CORE RULES:

1. Accept meaningful answers even when grammar is imperfect.

2. The child can choose ANY reasonable:
- day
- activity
- place
- time

3. "No" is NOT automatically wrong.

4. If the child rejects a suggestion but gives no alternative,
stay on the same step and ask what they prefer.

5. If the child gives an alternative, accept it.

6. If the answer is unrelated to the current question,
stay on the same step and gently redirect.

7. Never replace the child's idea with a predefined example.

8. Preserve confirmed plan information.

9. Only change a plan field when the child actually provides
or changes that information.

10. If the child gives multiple planning details in one answer,
keep all understandable details.

11. Short meaningful answers may be understood naturally.
If speaking practice requires a complete sentence, politely ask
the child to repeat a complete sentence and stay on the same step.

12. Clear grammar mistakes should stay on the same step.
Give only a short correction.

13. Speech-recognition mistakes should be ignored when the
intended meaning is obvious.

NORMAL ORDER:

day -> activity -> place -> time -> final

DAY:

If asked:
"Are you free this Saturday?"

"Yes" can confirm Saturday.

"No" alone means Saturday was rejected.
Ask which day the child is free.

"No, I am free on Sunday."
Accept Sunday.

ACTIVITY:

If asked:
"What would you like to do?"

Accept any meaningful activity.

Examples are NOT restrictions.

"I want to sleep."
means activity = sleep.

"I want to play football."
means activity = play football.

"I want to read."
means activity = read.

"I like chocolate."
does NOT answer what activity they want.
Stay on activity and redirect.

PLACE:

Accept any meaningful place.

If the child says:
"I don't want to go to the park."

Do NOT keep park.
Ask where they would like to go instead.

If the child says:
"No, let's go to the library instead."
accept library.

TIME:

Accept natural expressions such as:
"At five."
"Five o'clock."
"5 PM."
"In the evening."
"After school."

Do NOT assume a time.

FINAL:

Only complete after day, activity, place and time are known.

If the child confirms the complete plan with yes,
conversationComplete may be true.

If the child says no,
do NOT complete.
Handle the requested change naturally.

TEACHER STYLE:

Friendly, warm, encouraging and short.

Never say:
"Wrong!"
"You are incorrect."
"Bad answer."

Use natural responses such as:
"That's okay!"
"Nice idea!"
"That sounds fun!"
"Great choice!"
"No problem!"
"Let's try that again."

teacherResponse is spoken aloud, so keep it short.

Do NOT return marks, scores, percentages, stars or grades.

Return ONLY valid JSON.

Required JSON:

{
  "isCorrect": true,
  "feedback": "",
  "correction": "",
  "teacherResponse": "",
  "retry": false,
  "conversationComplete": false,
  "nextStep": "activity",
  "updatedPlan": {
    "day": "",
    "activity": "",
    "place": "",
    "time": ""
  }
}
`;
}


/* =========================================================
   PLAN IT TOGETHER ROUTE
========================================================= */

app.post(
  "/api/plan-it-together",
  async (req, res) => {
    try {
      const {
        message,
        question,
        userName,
        currentStep,
        selectedDay,
        selectedActivity,
        selectedPlace,
        selectedTime,
        previousMessages,
      } = req.body;

      /* ===================================================
         NORMALIZE PLAN
      =================================================== */

      const existingPlan = {
        day: String(
          selectedDay || ""
        ).trim(),

        activity: String(
          selectedActivity || ""
        ).trim(),

        place: String(
          selectedPlace || ""
        ).trim(),

        time: String(
          selectedTime || ""
        ).trim(),
      };

      const safeStep =
        String(
          currentStep || "day"
        ).trim().toLowerCase();

      /* ===================================================
         NO SPEECH
      =================================================== */

      if (
        !message ||
        !String(message).trim()
      ) {
        return res.json({
          success: true,

          isCorrect: false,

          feedback:
            "Sorry, I couldn't hear you.",

          correction: "",

          teacherResponse:
            "Sorry, I couldn't hear you. Please try again.",

          retry: true,

          conversationComplete: false,

          nextStep: safeStep,

          updatedPlan: existingPlan,
        });
      }

      /* ===================================================
         QUESTION VALIDATION
      =================================================== */

      if (
        !question ||
        !String(question).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Question is required.",
        });
      }

      /* ===================================================
         CLEAN STUDENT MESSAGE
      =================================================== */

      const studentMessage =
        String(message).trim();

      const currentQuestion =
        String(question).trim();

      /* ===================================================
         ONLY LAST 4 HISTORY ITEMS

         Do NOT send the whole conversation.
      =================================================== */

      let safePreviousMessages = [];

      if (
        Array.isArray(previousMessages)
      ) {
        safePreviousMessages =
          previousMessages
            .slice(-4)
            .map((item) => ({
              role:
                item?.role === "teacher"
                  ? "teacher"
                  : "student",

              message:
                String(
                  item?.message || ""
                )
                  .trim()
                  .slice(0, 180),

              step:
                String(
                  item?.step || ""
                ).trim(),
            }))
            .filter(
              (item) =>
                item.message
            );
      }

      /* ===================================================
         COMPACT SYSTEM PROMPT
      =================================================== */

      const systemPrompt =
        createPlanItTogetherPrompt();

      /* ===================================================
         SMALL USER PROMPT

         No giant duplicated instructions.
      =================================================== */

      const userPrompt = `
CURRENT STEP:
${safeStep}

CURRENT QUESTION:
${currentQuestion}

STUDENT'S ACTUAL SPOKEN ANSWER:
${studentMessage}

CURRENT CONFIRMED PLAN:
${JSON.stringify(existingPlan)}

RECENT CONVERSATION:
${JSON.stringify(safePreviousMessages)}

Evaluate ONLY the student's actual spoken answer.

Important:
- Do not invent information.
- Do not assume examples.
- Accept meaningful alternatives.
- If the child rejects something, handle it naturally.
- If the answer is unrelated, stay on the current step.
- Preserve confirmed plan information.
- Update only information the child actually provided.
- Return the next missing planning step.
- Always return updatedPlan.
- Return ONLY valid JSON.
`;

      /* ===================================================
         GROQ REQUEST

         Smaller output = faster response.
      =================================================== */

      const completion =
        await groq.chat.completions.create({
          model:
            "openai/gpt-oss-120b",

          messages: [
            {
              role: "system",
              content: systemPrompt,
            },

            {
              role: "user",
              content: userPrompt,
            },
          ],

          temperature: 0.1,

          max_tokens: 250,
        });

      /* ===================================================
         GET AI RESPONSE
      =================================================== */

      let aiReply =
        completion
          ?.choices?.[0]
          ?.message
          ?.content
          ?.trim();

      if (!aiReply) {
        return res.status(500).json({
          success: false,
          message:
            "AI did not return a response.",
        });
      }

      console.log(
        "📥 Plan It Together AI:",
        aiReply
      );

      /* ===================================================
         CLEAN MARKDOWN
      =================================================== */

      aiReply = aiReply
        .replace(
          /^```json\s*/i,
          ""
        )
        .replace(
          /^```\s*/i,
          ""
        )
        .replace(
          /\s*```$/i,
          ""
        )
        .trim();

      /* ===================================================
         PARSE JSON
      =================================================== */

      let evaluation;

      try {
        evaluation =
          JSON.parse(aiReply);
      } catch (jsonError) {
        console.error(
          "❌ Plan It Together JSON Parse Error:",
          jsonError
        );

        console.error(
          "AI Reply:",
          aiReply
        );

        return res.status(500).json({
          success: false,
          message:
            "AI response format error.",
        });
      }

      /* ===================================================
         SAFE PLAN

         Preserve existing values if AI omits them.
      =================================================== */

      const aiPlan =
        evaluation?.updatedPlan || {};

      const updatedPlan = {
        day:
          typeof aiPlan.day === "string"
            ? aiPlan.day.trim()
            : existingPlan.day,

        activity:
          typeof aiPlan.activity === "string"
            ? aiPlan.activity.trim()
            : existingPlan.activity,

        place:
          typeof aiPlan.place === "string"
            ? aiPlan.place.trim()
            : existingPlan.place,

        time:
          typeof aiPlan.time === "string"
            ? aiPlan.time.trim()
            : existingPlan.time,
      };

      /* ===================================================
         ALLOWED STEPS
      =================================================== */

      const allowedSteps = [
        "day",
        "activity",
        "place",
        "time",
        "final",
      ];

      let safeNextStep =
        typeof evaluation?.nextStep ===
        "string"
          ? evaluation.nextStep
              .trim()
              .toLowerCase()
          : safeStep;

      if (
        !allowedSteps.includes(
          safeNextStep
        )
      ) {
        safeNextStep = safeStep;
      }

      /* ===================================================
         SAFE RESPONSE TEXT
      =================================================== */

      const teacherResponse =
        typeof evaluation?.teacherResponse ===
        "string"
          ? evaluation.teacherResponse
              .trim()
          : "Let's try again.";

      const feedback =
        typeof evaluation?.feedback ===
        "string"
          ? evaluation.feedback.trim()
          : "";

      const correction =
        typeof evaluation?.correction ===
        "string"
          ? evaluation.correction.trim()
          : "";

      /* ===================================================
         RETRY
      =================================================== */

      const retry =
        Boolean(
          evaluation?.retry
        );

      let isCorrect =
        Boolean(
          evaluation?.isCorrect
        ) && !retry;

      /* ===================================================
         IF RETRY

         NEVER advance.
      =================================================== */

      if (retry) {
        isCorrect = false;

        safeNextStep = safeStep;
      }

      /* ===================================================
         REQUIRED PLAN FIELDS
      =================================================== */

      const hasDay =
        Boolean(
          updatedPlan.day
        );

      const hasActivity =
        Boolean(
          updatedPlan.activity
        );

      const hasPlace =
        Boolean(
          updatedPlan.place
        );

      const hasTime =
        Boolean(
          updatedPlan.time
        );

      /* ===================================================
         COMPLETION SAFETY
      =================================================== */

      let conversationComplete =
        Boolean(
          evaluation?.conversationComplete
        );

      if (
        !(
          hasDay &&
          hasActivity &&
          hasPlace &&
          hasTime
        )
      ) {
        conversationComplete = false;
      }

      /* ===================================================
         IMPORTANT:

         Child must actually confirm the final plan.
      =================================================== */

      if (
        safeStep === "final" &&
        !isCorrect
      ) {
        conversationComplete = false;
      }

      /* ===================================================
         NEVER COMPLETE ON RETRY
      =================================================== */

      if (retry) {
        conversationComplete = false;
      }

      /* ===================================================
         FINAL RESPONSE
      =================================================== */

      const finalResponse = {
        success: true,

        isCorrect,

        feedback,

        correction,

        teacherResponse,

        retry,

        conversationComplete,

        nextStep:
          safeNextStep,

        updatedPlan,
      };

      console.log(
        "✅ Plan It Together:",
        finalResponse
      );

      return res.json(
        finalResponse
      );

    } catch (error) {
      console.error(
        "❌ Plan It Together Error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to continue the conversation right now.",
      });
    }
  }
);

/* =========================================================
   SPACE PREFERENCE MISSION
   ROUND 3 — FINAL SPEAKING PROMPT
========================================================= */


function createSpacePreferenceRound3Prompt() {

  return `

You are Miss Uroosa, a friendly English teacher
for primary school children.

The student is doing:

"SPACE PREFERENCE MISSION"
"ROUND 3 - FINAL SPEAK CHALLENGE"

This is the FINAL speaking round.

The student must speak about their partner's
likes and dislikes.

==================================================
MAIN PURPOSE
==================================================

Evaluate ONLY the student's spoken answer for
the CURRENT FINAL ROUND.

The student may:

- give a correct sentence
- make a grammar mistake
- use the wrong word
- confuse like and dislike
- give an incomplete sentence
- give a short but meaningful answer
- make a small speech-recognition mistake
- say something unrelated
- say nothing
- speak unclearly

Be friendly and encouraging.

Never make the child feel bad.

==================================================
ROMAN ENGLISH
==================================================

Whenever you explain a mistake, explain it in
simple ROMAN ENGLISH.

Roman English means Hindi/Urdu spoken language
written using English letters.

Example:

Student:

"My partner like football."

Teacher:

"Good try! Tumne kaha: My partner like football.

Sahi sentence hai:

My partner likes football.

Yahan 'partner' singular hai, isliye 'like' ke saath
's' lagayenge.

Ab bolo:

My partner likes football."

IMPORTANT:

- Never use Urdu script.
- Never use Hindi script.
- Never use Devanagari.
- Never use Arabic script.
- Explanations must be Roman English.
- Correct English sentences must remain English.

==================================================
FINAL SPEAKING TASK
==================================================

The student should talk about their partner's
preferences.

Example:

"My partner likes football.
My partner doesn't like swimming."

The student does NOT have to reproduce this
exact sentence word-for-word.

Natural English variations are acceptable.

==================================================
EXPECTED INFORMATION
==================================================

The frontend may send the partner preferences
discovered during the previous rounds.

These may include:

- painting
- reading
- football
- sports
- food
- music
- other likes
- other dislikes

Use the provided partner preferences as context.

If expected preferences are provided, use them
to check whether the student is talking about
the correct partner preferences.

==================================================
CORRECT ANSWER
==================================================

If the student's answer is grammatically correct
and communicates the intended partner preference:

Mark it correct.

Do NOT invent a mistake.

Example:

Student:

"My partner likes football."

Teacher:

"Excellent! Tumne partner ki preference
bilkul clearly batayi. 🎉"

Return:

{
  "isCorrect": true,
  "feedback": "Excellent!",
  "correction": "",
  "teacherResponse": "Excellent! Tumne partner ki preference bilkul clearly batayi. 🎉",
  "retry": false
}

==================================================
GRAMMAR MISTAKE
==================================================

If there is a clear grammar mistake:

1. Appreciate the effort.
2. Tell the student what they said.
3. Give the corrected English sentence.
4. Explain the important mistake in Roman English.
5. Ask them to repeat.
6. retry = true.

Example:

Student:

"My partner like football."

Return:

{
  "isCorrect": false,
  "feedback": "Good try!",
  "correction": "My partner likes football.",
  "teacherResponse": "Good try! Tumne kaha: My partner like football. Sahi sentence hai: My partner likes football. Yahan 'partner' singular hai, isliye 'like' ke saath 's' lagayenge. Ab bolo: My partner likes football.",
  "retry": true
}

==================================================
LIKE / DISLIKE CONFUSION
==================================================

If the student changes the meaning of like/dislike:

Expected:

"My partner likes football."

Student:

"My partner doesn't like football."

This is incorrect if football is a known preference.

Explain simply:

"Good try! Tumne football ke baare mein 'doesn't like'
bola, lekin partner ko football pasand hai.

Sahi sentence hai:

My partner likes football.

Ab bolo."

retry = true.

==================================================
INCOMPLETE ANSWER
==================================================

If the student says:

"Football."

or:

"Likes football."

Guide them to a complete sentence.

Example:

"Good try! Tumne football bola.

Complete sentence hai:

My partner likes football.

Ab bolo:

My partner likes football."

retry = true.

==================================================
MULTIPLE SENTENCES
==================================================

The final round can contain more than one sentence.

Example:

"My partner likes football.
My partner doesn't like swimming."

If both sentences are meaningful and grammatically
acceptable, mark correct.

Do not force an exact number of sentences.

==================================================
NATURAL VARIATIONS
==================================================

Accept natural variations.

Examples:

"My partner likes football."

"My partner really likes football."

"My partner is a fan of football."

"My partner doesn't like swimming."

"My partner dislikes swimming."

Do not unnecessarily reject natural English.

==================================================
SMALL TRANSCRIPTION ERRORS
==================================================

Speech recognition may produce small errors.

Do NOT punish obvious transcription mistakes.

Example:

"hair" → "hare"

"football" → "foot ball"

If the intended meaning is obvious, accept it.

==================================================
UNRELATED ANSWER
==================================================

If the student says something unrelated:

Do not start a new conversation.

Guide them back to the final task.

Example:

"Good try! 😊 Chalo apne partner ki preference ke
baare mein bolte hain.

Ab bolo:

My partner likes football."

retry = true.

==================================================
UNCLEAR SPEECH
==================================================

If the transcript cannot reasonably be understood:

Return:

{
  "isCorrect": false,
  "feedback": "Good try!",
  "correction": "",
  "teacherResponse": "Good try! Mujhe sentence thoda clear nahi suna. Ek baar phir clearly bolo.",
  "retry": true
}

Do NOT invent a correction.

==================================================
NO SPEECH
==================================================

If the student's message is empty, blank, whitespace,
or missing:

Return:

{
  "isCorrect": false,
  "feedback": "Sorry, I couldn't hear you.",
  "correction": "",
  "teacherResponse": "Sorry, I couldn't hear you. Please try again.",
  "retry": true
}

==================================================
TEACHER PERSONALITY
==================================================

You are:

- friendly
- patient
- cheerful
- encouraging
- supportive
- suitable for primary school children

Never say:

"Wrong!"

"You are incorrect."

"Bad answer."

Instead say:

"Good try!"

"Nice try!"

"Almost!"

"Let's try that again."

"You're doing great!"

==================================================
RESPONSE LENGTH
==================================================

Keep teacherResponse short.

Maximum around 70 words.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Do NOT use markdown.

Do NOT use code fences.

Do NOT include an explanation field.

Do NOT include marks.

Do NOT include score.

Do NOT include percentage.

Do NOT include database information.

Use EXACTLY:

{
  "isCorrect": true,
  "feedback": "Excellent!",
  "correction": "",
  "teacherResponse": "Excellent! Tumne partner ki preference bilkul clearly batayi. 🎉",
  "retry": false
}

For incorrect:

{
  "isCorrect": false,
  "feedback": "Good try!",
  "correction": "My partner likes football.",
  "teacherResponse": "Good try! Tumne kaha: My partner like football. Sahi sentence hai: My partner likes football. Yahan 'partner' singular hai, isliye 'like' ke saath 's' lagayenge. Ab bolo: My partner likes football.",
  "retry": true
}

IMPORTANT:

- Return JSON only.
- Never include explanation.
- Never include marks.
- Never include score.
- Never include percentage.
- Never invent a grammar mistake.
- Never invent a correction.
- correction must contain ONLY corrected English.
- teacherResponse is exactly what Miss Uroosa speaks.

`;

}


/* =========================================================
   SPACE PREFERENCE MISSION
   ROUND 3 — FINAL SPEAKING CHECK
========================================================= */

app.post(
  "/api/space-preference/round3",
  async (req, res) => {

    try {

      const {
        message,
        question,
        userName,
        preferences,
        context
      } = req.body;


      /* ---------------------------------------------
         NO SPEECH
      --------------------------------------------- */

      if (
        !message ||
        !String(message).trim()
      ) {

        return res.json({

          success: true,

          isCorrect: false,

          feedback:
            "Sorry, I couldn't hear you.",

          correction: "",

          teacherResponse:
            "Sorry, I couldn't hear you. Please try again.",

          retry: true

        });

      }


      /* ---------------------------------------------
         QUESTION VALIDATION
      --------------------------------------------- */

      if (
        !question ||
        !String(question).trim()
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Question is required."

        });

      }


      /* ---------------------------------------------
         PROMPT
      --------------------------------------------- */

      const systemPrompt =
        createSpacePreferenceRound3Prompt();


      const userPrompt = `

CURRENT QUESTION:

${question}


STUDENT SPOKEN ANSWER:

${message}


PARTNER PREFERENCES:

${
  preferences
    ? JSON.stringify(preferences)
    : "Not provided"
}


ADDITIONAL CONTEXT:

${
  context ||
  "Space Preference Mission - Round 3 Final Speaking Challenge"
}


STUDENT NAME:

${userName || "Student"}


Evaluate ONLY the student's spoken answer.

IMPORTANT:

- Check grammar.
- Check whether the answer communicates the partner's preference.
- Check like/dislike meaning.
- Accept natural English variations.
- Accept small speech-recognition mistakes when meaning is clear.
- Do not invent mistakes.
- If incorrect, explain in simple Roman English.
- correction must contain ONLY corrected English.
- teacherResponse must be what Miss Uroosa speaks.
- If unclear, ask the child to repeat.
- If no speech, ask the child to try again.
- Never use Urdu script.
- Never use Hindi script.
- Never use Devanagari.
- Never include an explanation field.
- Never give marks.
- Never give score.
- Never give percentage.
- Return ONLY valid JSON.

`;


      /* ---------------------------------------------
         GROQ
      --------------------------------------------- */

      const completion =
        await groq.chat.completions.create({

          model:
            "openai/gpt-oss-120b",

          messages: [

            {
              role: "system",

              content:
                systemPrompt

            },

            {
              role: "user",

              content:
                userPrompt

            }

          ],

          temperature: 0.2,

          max_tokens: 500

        });


      /* ---------------------------------------------
         AI RESPONSE
      --------------------------------------------- */

      let aiReply =
        completion
          ?.choices?.[0]
          ?.message
          ?.content
          ?.trim();


      if (!aiReply) {

        return res.status(500).json({

          success: false,

          message:
            "AI did not return a response."

        });

      }


      /* ---------------------------------------------
         CLEAN JSON
      --------------------------------------------- */

      aiReply =
        aiReply
          .replace(
            /^```json\s*/i,
            ""
          )
          .replace(
            /^```\s*/i,
            ""
          )
          .replace(
            /\s*```$/i,
            ""
          )
          .trim();


      /* ---------------------------------------------
         PARSE JSON
      --------------------------------------------- */

      let evaluation;

      try {

        evaluation =
          JSON.parse(aiReply);

      }

      catch (jsonError) {

        console.log(
          "❌ Space Preference Round 3 JSON Error:",
          jsonError
        );

        console.log(
          "AI Reply:",
          aiReply
        );

        return res.status(500).json({

          success: false,

          message:
            "AI evaluation format error."

        });

      }


      /* ---------------------------------------------
         SAFE RESPONSE
      --------------------------------------------- */

      return res.json({

        success: true,

        isCorrect:
          Boolean(
            evaluation.isCorrect
          ),

        feedback:
          evaluation.feedback ||
          "",

        correction:
          evaluation.correction ||
          "",

        teacherResponse:
          evaluation.teacherResponse ||
          "Let's try again.",

        retry:
          Boolean(
            evaluation.retry
          )

      });

    }


    catch (err) {

      console.log(
        "❌ Space Preference Round 3 Error:",
        err
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to check the answer right now."

      });

    }

  }
);

/* =====================================================
   FAVOURITE PLACE - ACTIVITY 3
   AI TEACHER CHECK
===================================================== */

app.post(
    "/api/favourite-place/activity3",
    async (req, res) => {

        try {

            const {
                question,
                hint,
                message,
                userName,
                topicId,
                lessonId
            } = req.body;


            /* =========================================
               VALIDATION
            ========================================= */

            if (
                !message ||
                !String(message).trim()
            ) {

                return res.status(400).json({

                    isCorrect: false,

                    type: "empty",

                    teacherResponse:
                        "I couldn't hear your answer clearly. Please try again in English."

                });

            }


            const studentAnswer =
                String(message).trim();


            /* =========================================
               AI TEACHER PROMPT
            ========================================= */

            const systemPrompt = `
You are Miss Uroosa, a friendly and professional English teacher teaching children.

You are currently teaching an English lesson called:

"Tell Me About Your Favourite Place"

Your job is to evaluate ONLY the student's answer to the CURRENT QUESTION.

CURRENT QUESTION:
"${question}"

HINT:
"${hint || "Answer in a complete English sentence."}"

STUDENT ANSWER:
"${studentAnswer}"


==================================================
STRICT TEACHER RULES
==================================================

1. Stay focused ONLY on the current question.

2. Do NOT start a general conversation.

3. Do NOT answer unrelated questions.

4. If the student's answer is unrelated to the current question:
   - Say politely that the answer is off topic.
   - Remind the student of the current question.
   - Ask them to try again.
   - Set type to "off_topic".

5. If the student uses Roman Urdu, Roman Hindi, Urdu, Hindi,
   or another language instead of English:
   - Do not treat it as a correct English answer.
   - Politely encourage them to say it in English.
   - You may give a small English example.
   - Set type to "language".

Example:
Student: "Mujhe park pasand hai"
Teacher:
"Good idea! Now try saying it in English. You can say: My favourite place is the park."

6. If the student's answer is in English but has grammar mistakes:
   - Encourage the student.
   - Clearly show the corrected sentence.
   - Ask the student to try again.
   - Set type to "grammar".

Example:
Student:
"I like park because beautiful."

Teacher:
"Good try! Let's make it a complete sentence: I like the park because it is beautiful. Please try saying it again."

7. If the student gives only one or two words when a complete
sentence is expected:
   - Encourage them to speak in a complete sentence.
   - Give an example.
   - Set type to "incomplete".

8. If the answer correctly answers the current question
in clear English:
   - Praise the student.
   - Keep feedback short and encouraging.
   - Set isCorrect to true.
   - Set type to "success".

9. Be supportive and child-friendly.

10. Never shame the student.

11. Do not use difficult grammar explanations.

12. Keep teacher feedback under 45 words.

13. IMPORTANT:
Return ONLY valid JSON.
No markdown.
No extra text.


==================================================
RESPONSE FORMAT
==================================================

{
    "isCorrect": true or false,
    "type": "success | grammar | language | off_topic | incomplete | retry",
    "teacherResponse": "Teacher feedback",
    "correctedAnswer": "Correct English sentence if needed, otherwise empty string"
}
`;


            /* =========================================
               GROQ REQUEST
            ========================================= */

            const completion =
                await groq.chat.completions.create({

                    model:
                        "openai/gpt-oss-120b",

                    messages: [

                        {
                            role: "system",

                            content:
                                systemPrompt
                        },

                        {
                            role: "user",

                            content:
                                studentAnswer
                        }

                    ],

                    temperature: 0.3,

                    max_tokens: 250

                });


            /* =========================================
               GET AI RESPONSE
            ========================================= */

            const aiResponse =
                completion.choices?.[0]
                    ?.message?.content;


            /* =========================================
               REMOVE MARKDOWN JSON FENCES
               (matches Activity 1 pattern)
            ========================================= */

            let aiReply = aiResponse
                ?.replace(
                    /^```json\s*/i,
                    ""
                )

                .replace(
                    /^```\s*/i,
                    ""
                )

                .replace(
                    /\s*```$/i,
                    ""
                )

                .trim();


            let result;


            try {

                result =
                    JSON.parse(aiReply);

            }

            catch (parseError) {

                console.error(
                    "Activity 3 JSON Parse Error:",
                    parseError
                );


                result = {

                    isCorrect: false,

                    type: "retry",

                    teacherResponse:
                        "Good try! Please answer the question again in English.",

                    correctedAnswer: ""

                };

            }


            /* =========================================
               SAFETY FALLBACK
            ========================================= */

            if (
                typeof result.isCorrect !==
                "boolean"
            ) {

                result.isCorrect =
                    false;

            }


            if (
                !result.type
            ) {

                result.type =
                    result.isCorrect
                        ? "success"
                        : "retry";

            }


            if (
                !result.teacherResponse
            ) {

                result.teacherResponse =
                    result.isCorrect
                        ? "Excellent! That's a great answer!"
                        : "Good try! Please try answering again in English.";

            }


            if (
                !result.correctedAnswer
            ) {

                result.correctedAnswer =
                    "";

            }


            /* =========================================
               SEND RESPONSE
            ========================================= */

            return res.json({

                isCorrect:
                    result.isCorrect,

                type:
                    result.type,

                teacherResponse:
                    result.teacherResponse,

                correctedAnswer:
                    result.correctedAnswer,

                activity:
                    "Favourite Place Activity 3",

                topicId,

                lessonId,

                userName

            });

        }

        catch (error) {

            console.error(
                "Favourite Place Activity 3 AI Error:",
                error
            );


            return res.status(500).json({

                isCorrect: false,

                type: "retry",

                teacherResponse:
                    "Sorry, I couldn't check your answer right now. Please try again.",

                correctedAnswer:
                    ""

            });

        }

    }
);


/* =========================================================
   SAVE FINAL CHALLENGE RESULT
========================================================= */

app.post(
  "/api/final-challenge/save-result",
  async (req, res) => {
    try {
      const {
        userName,
        topicId,
        lessonId,
        totalMarks,
        answers,
      } = req.body;

      /* ---------------------------------------------
         MONGODB CHECK
      --------------------------------------------- */

      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "MongoDB is not connected.",
        });
      }

      /* ---------------------------------------------
         ANSWERS VALIDATION
      --------------------------------------------- */

      if (
        !Array.isArray(answers) ||
        answers.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Final Challenge answers are required.",
        });
      }

      /* ---------------------------------------------
         TOTAL MAXIMUM MARKS

         If frontend sends totalMarks,
         use it.

         Otherwise calculate from questions.

         For your current challenge:
         5 + 5 + 5 + 5 + 5 = 25
      --------------------------------------------- */

      let calculatedTotalMarks =
        Number(totalMarks);

      if (
        !calculatedTotalMarks ||
        calculatedTotalMarks <= 0
      ) {
        calculatedTotalMarks =
          answers.reduce(
            (total, answer) => {
              const max =
                Number(
                  answer.max_marks
                ) || 0;

              return total + max;
            },
            0
          );
      }

      /* ---------------------------------------------
         SAFETY DEFAULT

         FINAL CHALLENGE = 25 MARKS
      --------------------------------------------- */

      if (
        calculatedTotalMarks <= 0
      ) {
        calculatedTotalMarks = 25;
      }

      /* ---------------------------------------------
         OBTAINED MARKS
      --------------------------------------------- */

      let obtainedMarks = 0;

      answers.forEach((answer) => {
        const questionMax =
          Number(
            answer.max_marks
          ) || 0;

        let questionMarks =
          Number(answer.marks);

        if (
          Number.isNaN(questionMarks)
        ) {
          questionMarks = 0;
        }

        /* Never allow negative */
        questionMarks = Math.max(
          0,
          questionMarks
        );

        /* Never allow more than question max */
        questionMarks = Math.min(
          questionMarks,
          questionMax
        );

        obtainedMarks +=
          questionMarks;
      });

      /* ---------------------------------------------
         SAFETY: NEVER EXCEED TOTAL
      --------------------------------------------- */

      obtainedMarks = Math.min(
        obtainedMarks,
        calculatedTotalMarks
      );

      /* ---------------------------------------------
         PERCENTAGE
      --------------------------------------------- */

      const percentage =
        calculatedTotalMarks > 0
          ? Number(
              (
                (obtainedMarks /
                  calculatedTotalMarks) *
                100
              ).toFixed(2)
            )
          : 0;

      /* ---------------------------------------------
         GRADE
      --------------------------------------------- */

      let grade = "";

      if (percentage >= 90) {
        grade = "Excellent";
      } else if (percentage >= 80) {
        grade = "Very Good";
      } else if (percentage >= 70) {
        grade = "Good";
      } else if (percentage >= 60) {
        grade = "Keep Practicing";
      } else {
        grade = "Needs Improvement";
      }

      /* ---------------------------------------------
         GRAMMAR MISTAKES
      --------------------------------------------- */

      const grammarMistakes = [];

      answers.forEach((answer) => {
        const questionId =
          Number(
            answer.question_id
          ) || 0;

        /* New mistakes array */
        if (
          Array.isArray(
            answer.mistakes
          )
        ) {
          answer.mistakes.forEach(
            (mistake) => {
              if (
                mistake &&
                (
                  mistake.mistake ||
                  mistake.correction ||
                  mistake.urduExplanation
                )
              ) {
                grammarMistakes.push({
                  question_id:
                    questionId,

                  mistake:
                    mistake.mistake ||
                    "",

                  correction:
                    mistake.correction ||
                    "",

                  urdu_explanation:
                    mistake.urduExplanation ||
                    "",
                });
              }
            }
          );
        }

        /* Also support old single mistake format */
        if (
          answer.mistake &&
          !Array.isArray(
            answer.mistakes
          )
        ) {
          grammarMistakes.push({
            question_id:
              questionId,

            mistake:
              answer.mistake,

            correction:
              answer.correction ||
              "",

            urdu_explanation:
              answer.urdu_explanation ||
              "",
          });
        }
      });

      /* ---------------------------------------------
         PREPARE ANSWER DATA
      --------------------------------------------- */

      const answerData =
        answers.map((answer) => {
          const maxMarks =
            Number(
              answer.max_marks
            ) || 0;

          let marks =
            Number(answer.marks);

          if (
            Number.isNaN(marks)
          ) {
            marks = 0;
          }

          marks = Math.max(
            0,
            Math.min(
              marks,
              maxMarks
            )
          );

          const mistakes =
            Array.isArray(
              answer.mistakes
            )
              ? answer.mistakes.map(
                  (mistake) => ({
                    mistake:
                      mistake?.mistake ||
                      "",

                    correction:
                      mistake?.correction ||
                      "",

                    urduExplanation:
                      mistake?.urduExplanation ||
                      "",
                  })
                )
              : [];

          return {
            question_id:
              Number(
                answer.question_id
              ) || 0,

            question:
              answer.question || "",

            user_answer:
              answer.user_answer || "",

            marks,

            max_marks:
              maxMarks,

            grammar_correct:
              answer.grammar_correct !==
              false,

            answer_correct:
              answer.answer_correct ===
              true,

            mistake:
              answer.mistake || "",

            correction:
              answer.correction || "",

            urdu_explanation:
              answer.urdu_explanation ||
              "",

            feedback:
              answer.feedback || "",

            mistakes,
          };
        });

      /* ---------------------------------------------
         SAVE TO MONGODB
      --------------------------------------------- */

      const result =
        await FinalChallengeResult.create({
          user_name:
            userName || "Student",

          topic_id:
            Number(topicId) || 3,

          lesson_id:
            Number(lessonId) || 4,

          total_marks:
            calculatedTotalMarks,

          obtained_marks:
            obtainedMarks,

          percentage,

          grade,

          answers:
            answerData,

           grammar_mistakes:
            grammarMistakes,
        });

      /* ---------------------------------------------
          ALSO SAVE TO Result (admin dashboard)
       --------------------------------------------- */

      const userDoc =
        await User.findOne({
          fullName: {
            $regex: new RegExp(
              "^" +
              userName +
              "$",
              "i"
            ),
          },
        });

      const challengeType =
        topicId === 1
          ? "Final Challenge 1"
          : topicId === 2
          ? "Final Challenge 2"
          : topicId === 4
          ? "Final Challenge 4"
          : "Final Challenge";

      const passed =
        percentage >= 60;

      await Result.create({
        user: userDoc
          ? userDoc._id
          : null,
        userName:
          userName || "Student",
        school: userDoc
          ? userDoc.schoolId
          : null,
        challengeType,
        score: obtainedMarks,
        maxScore:
          calculatedTotalMarks,
        passed,
        answers: answerData,
      });

      /* ---------------------------------------------
          ALSO RECORD PROGRESS
       --------------------------------------------- */

      if (userDoc) {
        const pathwayName =
          topicId === 1
            ? "Pathway 1"
            : topicId === 2
            ? "Pathway 2"
            : topicId === 4
            ? "Pathway 4"
            : "Pathway";

        const topicName =
          topicId === 1
            ? "Topic 1"
            : topicId === 2
            ? "Topic 2"
            : topicId === 4
            ? "Topic 4"
            : "Topic";

        await Progress.updateOne(
          {
            user: userDoc._id,
            pathway: pathwayName,
            topic: topicName,
            subtopic:
              "Final Challenge",
            lesson:
              challengeType,
          },
          {
            $setOnInsert: {
              school:
                userDoc.schoolId ||
                null,
            },
            $set: {
              activity:
                "final_challenge",
              status: passed
                ? "completed"
                : "in_progress",
              score: obtainedMarks,
              maxScore:
                calculatedTotalMarks,
              completedAt:
                new Date(),
            },
          },
          {
            upsert: true,
          }
        );
      }

      console.log(
        "================================="
      );

      console.log(
        "✅ FINAL CHALLENGE SAVED TO MONGODB"
      );

      console.log(
        "Result ID:",
        result._id.toString()
      );

      console.log(
        "Student:",
        userName || "Student"
      );

      console.log(
        "Marks:",
        `${obtainedMarks}/${calculatedTotalMarks}`
      );

      console.log(
        "Percentage:",
        `${percentage}%`
      );

      console.log(
        "Grade:",
        grade
      );

      console.log(
        "================================="
      );

      /* ---------------------------------------------
         RESPONSE
      --------------------------------------------- */

      return res.json({
        success: true,

        resultId:
          result._id,

        totalMarks:
          calculatedTotalMarks,

        obtainedMarks,

        percentage,

        grade,

        grammarMistakes,

        message:
          "Final Challenge result saved successfully.",
      });
    } catch (err) {
      console.log(
        "❌ Final Challenge Save Error:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to save final challenge result.",
      });
    }
  }
);

/* =========================================================
   GET FINAL CHALLENGE RESULT BY ID
========================================================= */

app.get(
  "/api/final-challenge/result/:id",
  async (req, res) => {
    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "MongoDB is not connected.",
        });
      }

      const result =
        await FinalChallengeResult.findById(
          req.params.id
        );

      if (!result) {
        return res.status(404).json({
          success: false,
          message:
            "Final Challenge result not found.",
        });
      }

      return res.json({
        success: true,
        result,
      });
    } catch (err) {
      console.log(
        "❌ Final Challenge Result Error:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load final challenge result.",
      });
    }
  }
);

/* =========================================================
   GET LATEST FINAL CHALLENGE RESULT
========================================================= */

app.get(
  "/api/final-challenge/latest/:userName",
  async (req, res) => {
    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "MongoDB is not connected.",
        });
      }

      const result =
        await FinalChallengeResult
          .findOne({
            user_name:
              req.params.userName,
          })
          .sort({
            created_at: -1,
          });

      if (!result) {
        return res.status(404).json({
          success: false,
          message:
            "No final challenge result found.",
        });
      }

      return res.json({
        success: true,
        result,
      });
    } catch (err) {
      console.log(
        "❌ Latest Result Error:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load latest result.",
      });
    }
  }
);

/* =========================================================
   CHAT API
========================================================= */

app.post(
  "/api/chat",
  async (req, res) => {
    try {
      const {
        message,
        history,
        topicId,
        lessonId,
        userName,
        activity,
        pictureName,
        currentQuestion,
      } = req.body;

      /* ---------------------------------------------
         EMPTY MESSAGE
      --------------------------------------------- */

      if (
        !message ||
        message.trim() === ""
      ) {
        return res.json({
          response:
            "Please say something.",
        });
      }

      /* ---------------------------------------------
         SELECT PROMPT
      --------------------------------------------- */

      let systemPrompt;

      if (
        activity === "picture"
      ) {
        systemPrompt =
          createPicturePrompt(
            currentQuestion,
            pictureName
          );
      } else if (
        activity ===
        "restaurant-ai"
      ) {
        systemPrompt =
          createRestaurantPrompt();
      } else {
        systemPrompt =
          createTeacherPrompt(
            topicId
          );
      }

      /* ---------------------------------------------
         BUILD MESSAGES
      --------------------------------------------- */

      const messages = [
        {
          role: "system",
          content: systemPrompt,
        },
      ];

      /* ---------------------------------------------
         HISTORY
      --------------------------------------------- */

      if (
        history &&
        Array.isArray(history)
      ) {
        history
          .slice(-6)
          .forEach((chat) => {
            messages.push({
              role:
                chat.sender === "user"
                  ? "user"
                  : "assistant",

              content:
                chat.text,
            });
          });
      }

      /* ---------------------------------------------
         CURRENT MESSAGE
      --------------------------------------------- */

      messages.push({
        role: "user",
        content: message,
      });

      /* ---------------------------------------------
         GROQ
      --------------------------------------------- */

      const completion =
        await groq.chat.completions.create({
          model:
            "openai/gpt-oss-120b",

          messages,

          temperature: 0.5,

          max_tokens: 150,
        });

      /* ---------------------------------------------
         AI RESPONSE
      --------------------------------------------- */

      const aiReply =
        completion
          ?.choices?.[0]
          ?.message
          ?.content
          ?.trim() ||
        "Sorry, I couldn't understand. Please try again.";

      /* ---------------------------------------------
         SAVE CONVERSATION TO MONGODB
         
         IMPORTANT:
         Previously this was commented out.
         Now it will actually save.
      --------------------------------------------- */

      if (isMongoConnected()) {
        try {
          await Conversation.create({
            user_name:
              userName || "Student",

            topic_id:
              Number(topicId) || 0,

            lesson_id:
              Number(lessonId) || 0,

            activity:
              activity || "normal",

            user_message:
              message,

            ai_response:
              aiReply,
          });
        } catch (dbError) {
          console.log(
            "⚠️ Conversation save failed:",
            dbError.message
          );
        }
      }

      /* ---------------------------------------------
         RESPONSE
      --------------------------------------------- */

      return res.json({
        response: aiReply,
      });
    } catch (err) {
      console.log(
        "❌ Chat API Error:",
        err
      );

      return res.status(500).json({
        response:
          "Sorry. I couldn't understand. Please try again.",
      });
    }
  }
);

/* =========================================================
   HOME ROUTE
========================================================= */

app.get("/", (req, res) => {
  res.send(
    "✅ English Learning API Running"
  );
});

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/api/health",
  (req, res) => {
    return res.json({
      status: "ok",

      mongoConnected:
        isMongoConnected(),

      message:
        "AI English Learning Server is running.",
    });
  }
);

/* =========================================================
   MONGODB STATUS ROUTE
========================================================= */

app.get(
  "/api/mongodb-status",
  (req, res) => {
    const connected =
      isMongoConnected();

    return res.json({
      success: true,

      mongoConnected:
        connected,

      readyState:
        mongoose.connection.readyState,

      message: connected
        ? "MongoDB is connected."
        : "MongoDB is not connected.",
    });
  }
);


/* =========================================================
   FINAL CHALLENGE1 EVALUATION PROMPT
========================================================= */

function createFinalChallengePrompt() {
  return `

You are an English assessment evaluator for a primary school
English learning application.

The student is completing a FINAL CHALLENGE.

IMPORTANT:

Evaluate ONLY the student's current answer.

Do NOT behave like a normal conversation teacher.

Do NOT ask another question.

Do NOT continue the conversation.

Do NOT add extra conversation.

==================================================
ASSESSMENT
==================================================

Evaluate the student's answer according to the
specific question and challenge context provided.

Check:

- Answer relevance
- Grammar
- Sentence structure
- Vocabulary
- Correct use of the English learned in the lesson
- Communication clarity
- Politeness when appropriate
- Completeness when required

==================================================
SCORING
==================================================

The frontend sends the maximum marks for each question.

Give a score from 0 to the provided maximum marks.

IMPORTANT:

Never give more marks than the question maximum.

A completely correct and complete answer:
Give full marks.

Correct meaning with small grammar mistakes:
Give partial marks.

Short but relevant answer:
Give reasonable partial marks.

Unclear answer:
Give low marks.

Completely unrelated answer:
Give 0 marks.

Do NOT invent requirements that are not present
in the question.

Do NOT require exact wording if the student's
answer has the same correct meaning.

==================================================
GRAMMAR
==================================================

Check:

- subject and verb agreement
- articles
- singular/plural
- verb tense
- word order
- prepositions
- sentence structure
- incorrect word usage

==================================================
ROMAN ENGLISH
==================================================

All grammar explanations MUST be in Roman English.

NEVER use:

- Urdu script
- Hindi script
- Devanagari

Example:

Mistake:
"He have blue eyes."

Correction:
"He has blue eyes."

Explanation:
"Yahan 'He' ke sath 'has' use hota hai."

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Do NOT use markdown.

Do NOT write anything before or after the JSON.

Use exactly this structure:

{
  "marks": 5,
  "maxMarks": 5,
  "answerCorrect": true,
  "grammarCorrect": true,
  "mistakes": [],
  "correction": "",
  "feedback": "Excellent work!"
}

If there is a mistake:

{
  "marks": 4,
  "maxMarks": 5,
  "answerCorrect": true,
  "grammarCorrect": false,
  "mistakes": [
    {
      "mistake": "wrong text from student answer",
      "correction": "correct English version",
      "urduExplanation": "Roman English me short aur simple explanation."
    }
  ],
  "correction": "Correct full sentence.",
  "feedback": "Good try! Your idea is clear, but there is a small grammar mistake."
}

IMPORTANT:

Do not invent mistakes.

If the answer is correct:

"mistakes": []

"correction": ""

"answerCorrect": true

"grammarCorrect": true

`;
}


/* =========================================================
   FINAL CHALLENGE1 - CHECK ANSWER
========================================================= */

app.post(
  "/api/final-challenge/check",
  async (req, res) => {
    try {
      const {
        questionId,
        challengeId,
        question,
        message,
        maxMarks,
        questionType,
        expectedAnswer,
        context,
        userName,
      } = req.body;

      /* ---------------------------------------------
         VALIDATION
      --------------------------------------------- */

      if (
        !question ||
        !String(question).trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Question is required.",
        });
      }

      if (
        !message ||
        !String(message).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Student answer is required.",
        });
      }

      /* ---------------------------------------------
         QUESTION MAX MARKS
      --------------------------------------------- */

      const marksLimit =
        Number(maxMarks) > 0
          ? Number(maxMarks)
          : 5;

      /* ---------------------------------------------
         PROMPT
      --------------------------------------------- */

      const systemPrompt =
        createFinalChallengePrompt();

      const assessmentPrompt = `

FINAL CHALLENGE ID:

${challengeId ?? questionId ?? ""}

QUESTION:

${question}

QUESTION ID:

${questionId ?? ""}

QUESTION TYPE:

${questionType || "english-assessment"}

EXPECTED ANSWER / GUIDANCE:

${
  expectedAnswer ||
  "Evaluate according to the question and context."
}

ADDITIONAL CONTEXT:

${
  context ||
  "Evaluate the student's English answer."
}

STUDENT NAME:

${userName || "Student"}

MAXIMUM MARKS FOR THIS QUESTION:

${marksLimit}

STUDENT ANSWER:

${message}

IMPORTANT:

The maximum possible score for this question is:

${marksLimit}

Never give more than ${marksLimit} marks.

Evaluate only this answer.

Do not compare the answer with other challenges.

Return ONLY valid JSON.

`;

      /* ---------------------------------------------
         GROQ
      --------------------------------------------- */

      const completion =
        await groq.chat.completions.create({
          model:
            "openai/gpt-oss-120b",

          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: assessmentPrompt,
            },
          ],

          temperature: 0.1,

          max_tokens: 700,
        });

      let aiReply =
        completion
          ?.choices?.[0]
          ?.message
          ?.content
          ?.trim();

      if (!aiReply) {
        return res.status(500).json({
          success: false,
          message:
            "AI did not return an evaluation.",
        });
      }

      /* ---------------------------------------------
         REMOVE MARKDOWN
      --------------------------------------------- */

      aiReply = aiReply
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      /* ---------------------------------------------
         PARSE JSON
      --------------------------------------------- */

      let evaluation;

      try {
        evaluation = JSON.parse(aiReply);
      } catch (jsonError) {
        console.log(
          "❌ Final Challenge JSON Error:",
          jsonError
        );

        console.log(
          "AI Reply:",
          aiReply
        );

        return res.status(500).json({
          success: false,
          message:
            "AI evaluation format error.",
        });
      }

      /* ---------------------------------------------
         SAFE MARKS
      --------------------------------------------- */

      let marks =
        Number(evaluation.marks);

      if (Number.isNaN(marks)) {
        marks = 0;
      }

      marks = Math.max(
        0,
        Math.min(
          marks,
          marksLimit
        )
      );

      /* ---------------------------------------------
         SAFE MISTAKES
      --------------------------------------------- */

      const mistakes =
        Array.isArray(
          evaluation.mistakes
        )
          ? evaluation.mistakes
              .map((item) => ({
                mistake:
                  String(
                    item?.mistake || ""
                  ),

                correction:
                  String(
                    item?.correction || ""
                  ),

                urduExplanation:
                  String(
                    item?.urduExplanation || ""
                  ),
              }))
              .filter(
                (item) =>
                  item.mistake ||
                  item.correction ||
                  item.urduExplanation
              )
          : [];

      /* ---------------------------------------------
         GRAMMAR CORRECT
      --------------------------------------------- */

      const grammarCorrect =
        mistakes.length === 0
          ? true
          : Boolean(
              evaluation.grammarCorrect
            );

      /* ---------------------------------------------
         ANSWER CORRECT
      --------------------------------------------- */

      const answerCorrect =
        evaluation.answerCorrect === true;

      /* ---------------------------------------------
         RESPONSE
      --------------------------------------------- */

      return res.json({
        success: true,

        challengeId:
          challengeId ?? null,

        questionId:
          questionId ?? null,

        marks,

        maxMarks:
          marksLimit,

        answerCorrect,

        grammarCorrect,

        mistakes,

        correction:
          evaluation.correction || "",

        feedback:
          evaluation.feedback ||
          "",

        userAnswer:
          String(message),
      });
    } catch (err) {
      console.log(
        "❌ Final Challenge Check Error:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to evaluate the answer right now.",
      });
    }
  }
);

/* =========================================================
   SAVE FINAL CHALLENGE1 RESULT
========================================================= */

app.post(
  "/api/final-challenge/save-result",
  async (req, res) => {
    try {
      const {
        userName,
        topicId,
        lessonId,
        totalMarks,
        answers,
      } = req.body;

      /* ---------------------------------------------
         MONGODB CHECK
      --------------------------------------------- */

      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "MongoDB is not connected.",
        });
      }

      /* ---------------------------------------------
         ANSWERS VALIDATION
      --------------------------------------------- */

      if (
        !Array.isArray(answers) ||
        answers.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Final Challenge answers are required.",
        });
      }

      /* ---------------------------------------------
         FINAL CHALLENGE1 SAFETY

         5 Challenges
         5 Marks Each

         Total = 25
      --------------------------------------------- */

      let calculatedTotalMarks =
        Number(totalMarks);

      if (
        !calculatedTotalMarks ||
        calculatedTotalMarks <= 0
      ) {
        calculatedTotalMarks =
          answers.reduce(
            (total, answer) => {
              const max =
                Number(
                  answer.max_marks ??
                  answer.maxMarks
                ) || 0;

              return total + max;
            },
            0
          );
      }

      /* Default total */

      if (
        calculatedTotalMarks <= 0
      ) {
        calculatedTotalMarks = 25;
      }

      /* ---------------------------------------------
         PREPARE ANSWERS
      --------------------------------------------- */

      const answerData =
        answers.map((answer, index) => {
          const questionId =
            Number(
              answer.question_id ??
              answer.questionId
            ) || index + 1;

          const maxMarks =
            Number(
              answer.max_marks ??
              answer.maxMarks
            ) || 5;

          let marks =
            Number(answer.marks);

          if (
            Number.isNaN(marks)
          ) {
            marks = 0;
          }

          /* Never negative */

          marks = Math.max(
            0,
            marks
          );

          /* Never exceed question max */

          marks = Math.min(
            marks,
            maxMarks
          );

          /* -----------------------------------------
             SAFE MISTAKES
          ----------------------------------------- */

          const mistakes =
            Array.isArray(
              answer.mistakes
            )
              ? answer.mistakes
                  .map((mistake) => ({
                    mistake:
                      mistake?.mistake || "",

                    correction:
                      mistake?.correction || "",

                    urduExplanation:
                      mistake?.urduExplanation ||
                      mistake?.urdu_explanation ||
                      "",
                  }))
                  .filter(
                    (mistake) =>
                      mistake.mistake ||
                      mistake.correction ||
                      mistake.urduExplanation
                  )
              : [];

          /* -----------------------------------------
             RETURN QUESTION DATA
          ----------------------------------------- */

          return {
            question_id:
              questionId,

            question:
              String(
                answer.question || ""
              ),

            user_answer:
              String(
                answer.user_answer ??
                answer.userAnswer ??
                ""
              ),

            marks,

            max_marks:
              maxMarks,

            grammar_correct:
              answer.grammar_correct ??
              answer.grammarCorrect ??
              mistakes.length === 0,

            answer_correct:
              answer.answer_correct ??
              answer.answerCorrect ??
              marks > 0,

            mistake:
              answer.mistake || "",

            correction:
              answer.correction || "",

            urdu_explanation:
              answer.urdu_explanation ??
              answer.urduExplanation ??
              "",

            feedback:
              answer.feedback || "",

            mistakes,
          };
        });

      /* ---------------------------------------------
         OBTAINED MARKS
      --------------------------------------------- */

      let obtainedMarks =
        answerData.reduce(
          (total, answer) =>
            total + answer.marks,
          0
        );

      /* Never exceed total */

      obtainedMarks = Math.min(
        obtainedMarks,
        calculatedTotalMarks
      );

      /* ---------------------------------------------
         PERCENTAGE
      --------------------------------------------- */

      const percentage =
        calculatedTotalMarks > 0
          ? Number(
              (
                (obtainedMarks /
                  calculatedTotalMarks) *
                100
              ).toFixed(2)
            )
          : 0;

      /* ---------------------------------------------
         GRADE
      --------------------------------------------- */

      let grade = "";

      if (percentage >= 90) {
        grade = "Excellent";
      } else if (percentage >= 80) {
        grade = "Very Good";
      } else if (percentage >= 70) {
        grade = "Good";
      } else if (percentage >= 60) {
        grade = "Keep Practicing";
      } else {
        grade = "Needs Improvement";
      }

      /* ---------------------------------------------
         COLLECT ALL GRAMMAR MISTAKES
      --------------------------------------------- */

      const grammarMistakes = [];

      answerData.forEach((answer) => {
        if (
          Array.isArray(
            answer.mistakes
          )
        ) {
          answer.mistakes.forEach(
            (mistake) => {
              if (
                mistake &&
                (
                  mistake.mistake ||
                  mistake.correction ||
                  mistake.urduExplanation
                )
              ) {
                grammarMistakes.push({
                  question_id:
                    answer.question_id,

                  mistake:
                    mistake.mistake || "",

                  correction:
                    mistake.correction || "",

                  urdu_explanation:
                    mistake.urduExplanation ||
                    "",
                });
              }
            }
          );
        }

        /* Support old single mistake */

        if (
          answer.mistake &&
          answer.mistakes.length === 0
        ) {
          grammarMistakes.push({
            question_id:
              answer.question_id,

            mistake:
              answer.mistake,

            correction:
              answer.correction || "",

            urdu_explanation:
              answer.urdu_explanation ||
              "",
          });
        }
      });

      /* ---------------------------------------------
         SAVE TO MONGODB
      --------------------------------------------- */

      const result =
        await FinalChallengeResult.create({
          user_name:
            userName || "Student",

          topic_id:
            Number(topicId) || 3,

          lesson_id:
            Number(lessonId) || 4,

          total_marks:
            calculatedTotalMarks,

          obtained_marks:
            obtainedMarks,

          percentage,

          grade,

          answers:
            answerData,

           grammar_mistakes:
            grammarMistakes,
        });

      /* ---------------------------------------------
          ALSO SAVE TO Result (admin dashboard)
       --------------------------------------------- */

      const userDoc =
        await User.findOne({
          fullName: {
            $regex: new RegExp(
              "^" +
              userName +
              "$",
              "i"
            ),
          },
        });

      const challengeType =
        Number(topicId) === 1
          ? "Final Challenge 1"
          : Number(topicId) === 2
          ? "Final Challenge 2"
          : "Final Challenge";

      const passed =
        percentage >= 60;

      await Result.create({
        user: userDoc
          ? userDoc._id
          : null,
        userName:
          userName || "Student",
        school: userDoc
          ? userDoc.schoolId
          : null,
        challengeType,
        score: obtainedMarks,
        maxScore:
          calculatedTotalMarks,
        passed,
        answers: answerData,
      });

      if (userDoc) {
        await Progress.updateOne(
          {
            user: userDoc._id,
            pathway: "Pathway 1",
            topic: "Topic 1",
            subtopic:
              "Final Challenge",
            lesson:
              challengeType,
          },
          {
            $setOnInsert: {
              school:
                userDoc.schoolId ||
                null,
            },
            $set: {
              activity:
                "final_challenge",
              status: passed
                ? "completed"
                : "in_progress",
              score: obtainedMarks,
              maxScore:
                calculatedTotalMarks,
              completedAt:
                new Date(),
            },
          },
          { upsert: true }
        );
      }

      /* ---------------------------------------------
          SERVER LOG
       --------------------------------------------- */

      console.log(
        "================================="
      );

      console.log(
        "FINAL CHALLENGE SAVED SUCCESSFULLY"
      );

      console.log(
        "Result ID:",
        result._id.toString()
      );

      console.log(
        "Student:",
        userName || "Student"
      );

      console.log(
        "Challenges:",
        answerData.length
      );

      console.log(
        "Marks:",
        `${obtainedMarks}/${calculatedTotalMarks}`
      );

      console.log(
        "Percentage:",
        `${percentage}%`
      );

      console.log(
        "Grade:",
        grade
      );

      console.log(
        "================================="
      );

      /* ---------------------------------------------
         RESPONSE
      --------------------------------------------- */

      return res.json({
        success: true,

        resultId:
          result._id,

        totalMarks:
          calculatedTotalMarks,

        obtainedMarks,

        percentage,

        grade,

        answers:
          answerData,

        grammarMistakes,

        message:
          "Final Challenge result saved successfully.",
      });
    } catch (err) {
      console.log(
        "Final Challenge Save Error:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to save final challenge result.",
      });
    }
  }
);







/* =========================================================
   FINAL CHALLENGE 4
   TOPIC 4: ON MY CALENDAR

   5 QUESTIONS × 5 MARKS = 25
========================================================= */


/* =========================================================
   FINAL CHALLENGE 4 PROMPT
========================================================= */

function createFinalChallengePrompt() {
  return `

You are an English assessment evaluator for a primary school English learning application.

The student is completing the FINAL CHALLENGE of Topic 4:
"On My Calendar".

The student has already learned:

1. Days and Months
2. My Daily Routine
3. Making Plans

==================================================
ASSESSMENT
==================================================

Evaluate ONLY the student's current answer.

Do NOT behave like a normal conversation teacher.

Do NOT ask another question.

Do NOT continue the conversation.

Do NOT invent information that the student did not say.

Evaluate the student's answer according to the question provided.

Evaluate:

- Answer relevance
- Grammar
- Sentence structure
- Vocabulary
- Days and months
- Calendar vocabulary
- Daily routine vocabulary
- Time expressions
- Making plans
- Future plans
- Logical sequence
- Clarity

==================================================
SCORING
==================================================

The frontend sends the maximum marks.

Give a score from 0 to the provided maximum.

IMPORTANT:

Never give more marks than the question maximum.

A completely correct and complete answer:
Give full marks.

Correct meaning with small grammar mistakes:
Give partial marks.

Short but relevant answer:
Give reasonable partial marks.

Understandable answer with some missing details:
Give partial marks according to the question.

Unclear answer:
Give low marks.

Completely unrelated answer:
Give 0 marks.

Do NOT invent requirements that are not present in the question.

Do NOT require advanced English.

Do NOT penalize a child for using simple vocabulary.

Simple but correct English can receive full marks.

==================================================
DAYS & MONTHS
==================================================

When the question involves days or months, check:

- correct day names
- correct month names
- relevant calendar information
- understandable reasons when reasons are requested
- whether the answer answers the question

Do NOT require a specific day or month unless the question requires one.

==================================================
DAILY ROUTINE
==================================================

When the question involves daily routine, check:

- routine activities
- suitable time expressions
- morning
- afternoon
- evening
- logical order when appropriate
- understandable sentences

Suitable examples include:

- in the morning
- in the afternoon
- in the evening
- at 7 o'clock
- at 8:30
- before school
- after school

Do NOT require exact times unless the question specifically asks for them.

==================================================
MAKING PLANS
==================================================

When the question involves future plans, check:

- planned activities
- future meaning
- days
- times
- appropriate future expressions

Accept simple forms such as:

- I will play.
- I am going to visit my cousin.
- I will go on Saturday.
- I am going to watch a movie.

Do NOT require one specific future structure when another grammatically correct structure communicates the same meaning.

==================================================
GRAMMAR
==================================================

Check:

- subject and verb agreement
- articles
- singular/plural
- verb tense
- future tense
- word order
- prepositions
- sentence structure
- incorrect word usage
- time expressions
- day/month usage

==================================================
ROMAN ENGLISH
==================================================

All explanations MUST be in Roman English.

NEVER use:

- Urdu script
- Hindi script
- Devanagari

Example:

Mistake:
"I go school at 8."

Correction:
"I go to school at 8."

Explanation:
"Yahan 'go school' ke bajaye 'go to school' bolna sahi hai."

Another example:

Mistake:
"I am going play on Saturday."

Correction:
"I am going to play on Saturday."

Explanation:
"Future plan batane ke liye 'going to' ke baad verb ki simple form use hoti hai."

==================================================
ANSWER CORRECT
==================================================

Set answerCorrect to true when the student's answer meaningfully answers the question.

Set answerCorrect to false when:

- the answer is completely unrelated
- the answer does not answer the question
- the answer is too unclear to understand

Small grammar mistakes do NOT automatically make answerCorrect false.

==================================================
GRAMMAR CORRECT
==================================================

Set grammarCorrect to true when there are no meaningful grammar mistakes.

Set grammarCorrect to false when there are actual grammar mistakes.

Do NOT invent mistakes.

Do NOT change a correct sentence just to make it more advanced.

==================================================
MISTAKES
==================================================

Only include real mistakes.

Each mistake must contain:

{
  "mistake": "incorrect phrase",
  "correction": "correct phrase",
  "urduExplanation": "Roman English explanation"
}

IMPORTANT:

The field MUST be named:

"urduExplanation"

But the explanation MUST contain Roman English only.

If there are no mistakes:

"mistakes": []

"correction": ""

==================================================
FEEDBACK
==================================================

Feedback must be short, positive, and child-friendly.

Examples:

"Excellent work! Your answer was clear and complete."

"Great job! Your plan was easy to understand."

"Good effort! Your idea was clear, but there was a small grammar mistake."

"Nice try! Remember to use 'going to' for your future plan."

Do NOT ask another question.

Do NOT continue the conversation.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Do NOT use markdown.

Return exactly this structure:

{
  "marks": 5,
  "maxMarks": 5,
  "answerCorrect": true,
  "grammarCorrect": true,
  "mistakes": [],
  "correction": "",
  "feedback": "Excellent work!"
}

When there is a mistake:

{
  "marks": 4,
  "maxMarks": 5,
  "answerCorrect": true,
  "grammarCorrect": false,
  "mistakes": [
    {
      "mistake": "I am going play on Saturday",
      "correction": "I am going to play on Saturday",
      "urduExplanation": "Future plan batane ke liye 'going to' ke baad verb ki simple form use hoti hai."
    }
  ],
  "correction": "I am going to play on Saturday.",
  "feedback": "Good try! Your plan is clear, but there is a small grammar mistake."
}

IMPORTANT:

Do not invent mistakes.

If the answer is completely correct:

"mistakes": []

"correction": ""

"answerCorrect": true

"grammarCorrect": true

Always respect the maximum marks.

`;
}


/* =========================================================
   FINAL CHALLENGE - CHECK ANSWER
========================================================= */

app.post(
  "/api/final-challenge/check",
  async (req, res) => {

    try {

      const {
        questionId,
        question,
        message,
        maxMarks,
        questionType,
        expectedAnswer,
        context,
        userName,
      } = req.body;


      /* ---------------------------------------------
         VALIDATION
      --------------------------------------------- */

      if (
        !question ||
        !String(question).trim()
      ) {

        return res.status(400).json({
          success: false,
          message: "Question is required.",
        });

      }


      if (
        !message ||
        !String(message).trim()
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Student answer is required.",
        });

      }


      /* ---------------------------------------------
         SAFE QUESTION MARKS

         Every Final Challenge 4 question = 5 marks
      --------------------------------------------- */

      let marksLimit =
        Number(maxMarks);


      if (
        !Number.isFinite(
          marksLimit
        ) ||
        marksLimit <= 0
      ) {

        marksLimit = 5;

      }


      marksLimit =
        Math.min(
          Math.max(
            marksLimit,
            1
          ),
          5
        );


      /* ---------------------------------------------
         SYSTEM PROMPT
      --------------------------------------------- */

      const systemPrompt =
        createFinalChallengePrompt();


      /* ---------------------------------------------
         ASSESSMENT PROMPT
      --------------------------------------------- */

      const assessmentPrompt = `

QUESTION:

${question}


QUESTION ID:

${questionId ?? ""}


QUESTION TYPE:

${questionType || "speaking"}


EXPECTED ANSWER / GUIDANCE:

${
  expectedAnswer ||
  "Evaluate the answer based on the question."
}


ADDITIONAL CONTEXT:

${
  context ||
  "Topic 4: On My Calendar English assessment."
}


STUDENT NAME:

${userName || "Student"}


MAXIMUM MARKS FOR THIS QUESTION:

${marksLimit}


STUDENT ANSWER:

${String(message).trim()}


IMPORTANT:

The maximum possible score is ${marksLimit}.

Never give more than ${marksLimit}.

Evaluate ONLY this answer.

Do not ask another question.

Do not continue the conversation.

Return ONLY valid JSON.

`;


      /* ---------------------------------------------
         GROQ AI
      --------------------------------------------- */

      const completion =
        await groq.chat.completions.create({

          model:
            "openai/gpt-oss-120b",

          messages: [

            {
              role: "system",
              content: systemPrompt,
            },

            {
              role: "user",
              content: assessmentPrompt,
            },

          ],

          temperature: 0.1,

          max_tokens: 600,

        });


      /* ---------------------------------------------
         GET AI RESPONSE
      --------------------------------------------- */

      let aiReply =
        completion
          ?.choices?.[0]
          ?.message
          ?.content
          ?.trim();


      if (!aiReply) {

        return res.status(500).json({
          success: false,
          message:
            "AI did not return an evaluation.",
        });

      }


      /* ---------------------------------------------
         REMOVE MARKDOWN JSON
      --------------------------------------------- */

      aiReply =
        aiReply
          .replace(
            /^```json\s*/i,
            ""
          )
          .replace(
            /^```\s*/i,
            ""
          )
          .replace(
            /\s*```$/i,
            ""
          )
          .trim();


      /* ---------------------------------------------
         PARSE JSON
      --------------------------------------------- */

      let evaluation;

      try {

        evaluation =
          JSON.parse(aiReply);

      } catch (jsonError) {

        console.log(
          "❌ Final Challenge 4 JSON Error:",
          jsonError
        );

        console.log(
          "AI Reply:",
          aiReply
        );

        return res.status(500).json({
          success: false,
          message:
            "AI evaluation format error.",
        });

      }


      /* ---------------------------------------------
         SAFE MARKS
      --------------------------------------------- */

      let marks =
        Number(
          evaluation?.marks
        );


      if (
        !Number.isFinite(
          marks
        )
      ) {

        marks = 0;

      }


      marks =
        Math.max(
          0,
          Math.min(
            marks,
            marksLimit
          )
        );


      /* ---------------------------------------------
         SAFE MISTAKES
      --------------------------------------------- */

      const mistakes =
        Array.isArray(
          evaluation?.mistakes
        )

          ? evaluation.mistakes
              .map(
                (item) => ({

                  mistake:
                    item?.mistake ||
                    "",

                  correction:
                    item?.correction ||
                    "",

                  urduExplanation:
                    item?.urduExplanation ||
                    "",

                })
              )
              .filter(
                (item) =>
                  item.mistake ||
                  item.correction ||
                  item.urduExplanation
              )

          : [];


      /* ---------------------------------------------
         GRAMMAR STATUS
      --------------------------------------------- */

      const grammarCorrect =
        mistakes.length === 0
          ? true
          : Boolean(
              evaluation?.grammarCorrect
            );


      /* ---------------------------------------------
         ANSWER STATUS
      --------------------------------------------- */

      const answerCorrect =
        Boolean(
          evaluation?.answerCorrect
        );


      /* ---------------------------------------------
         FINAL RESPONSE
      --------------------------------------------- */

      return res.json({

        success: true,

        questionId:
          questionId ?? null,

        marks,

        maxMarks:
          marksLimit,

        answerCorrect,

        grammarCorrect,

        mistakes,

        correction:
          evaluation?.correction ||
          "",

        feedback:
          evaluation?.feedback ||
          `You scored ${marks} out of ${marksLimit} marks.`,

        userAnswer:
          String(message).trim(),

      });

    }

    catch (err) {

      console.log(
        "❌ Final Challenge 4 Check Error:",
        err
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to evaluate the answer right now.",

      });

    }

  }
);


/* =========================================================
   SAVE FINAL CHALLENGE 4 RESULT
   TOPIC 4: ON MY CALENDAR
========================================================= */

app.post(
  "/api/final-challenge/save-result",
  async (req, res) => {

    try {

      const {
        userName,
        topicId,
        lessonId,
        totalMarks,
        answers,
      } = req.body;


      /* ---------------------------------------------
         MONGODB CHECK
      --------------------------------------------- */

      if (!isMongoConnected()) {

        return res.status(503).json({
          success: false,
          message:
            "MongoDB is not connected.",
        });

      }


      /* ---------------------------------------------
         ANSWERS VALIDATION
      --------------------------------------------- */

      if (
        !Array.isArray(answers) ||
        answers.length === 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Final Challenge answers are required.",
        });

      }


      /* ---------------------------------------------
         FINAL CHALLENGE 4 TOTAL

         5 × 5 = 25
      --------------------------------------------- */

      const FINAL_TOTAL_MARKS = 25;


      /* ---------------------------------------------
         TOTAL MARKS

         Final Challenge 4 is always /25.
      --------------------------------------------- */

      const calculatedTotalMarks =
        FINAL_TOTAL_MARKS;


      /* ---------------------------------------------
         OBTAINED MARKS
      --------------------------------------------- */

      let obtainedMarks = 0;


      answers.forEach(
        (answer) => {

          const questionMax =
            Number(
              answer?.max_marks
            ) || 5;


          let questionMarks =
            Number(
              answer?.marks
            );


          if (
            !Number.isFinite(
              questionMarks
            )
          ) {

            questionMarks = 0;

          }


          questionMarks =
            Math.max(
              0,
              questionMarks
            );


          questionMarks =
            Math.min(
              questionMarks,
              questionMax
            );


          obtainedMarks +=
            questionMarks;

        }
      );


      /* ---------------------------------------------
         NEVER EXCEED 25
      --------------------------------------------- */

      obtainedMarks =
        Math.min(
          Math.max(
            obtainedMarks,
            0
          ),
          FINAL_TOTAL_MARKS
        );


      /* ---------------------------------------------
         PERCENTAGE
      --------------------------------------------- */

      const percentage =
        Number(
          (
            (
              obtainedMarks /
              calculatedTotalMarks
            ) * 100
          ).toFixed(2)
        );


      /* ---------------------------------------------
         GRADE
      --------------------------------------------- */

      let grade = "";


      if (
        percentage >= 90
      ) {

        grade = "Excellent";

      } else if (
        percentage >= 80
      ) {

        grade = "Very Good";

      } else if (
        percentage >= 70
      ) {

        grade = "Good";

      } else if (
        percentage >= 60
      ) {

        grade = "Keep Practicing";

      } else {

        grade = "Needs Improvement";

      }


      /* ---------------------------------------------
         COLLECT GRAMMAR MISTAKES
      --------------------------------------------- */

      const grammarMistakes = [];


      answers.forEach(
        (answer) => {

          const questionId =
            Number(
              answer?.question_id
            ) || 0;


          if (
            Array.isArray(
              answer?.mistakes
            )
          ) {

            answer.mistakes.forEach(
              (mistake) => {

                if (
                  mistake &&
                  (
                    mistake.mistake ||
                    mistake.correction ||
                    mistake.urduExplanation
                  )
                ) {

                  grammarMistakes.push({

                    question_id:
                      questionId,

                    mistake:
                      mistake.mistake ||
                      "",

                    correction:
                      mistake.correction ||
                      "",

                    urdu_explanation:
                      mistake.urduExplanation ||
                      "",

                  });

                }

              }
            );

          }


          /* -----------------------------------------
             OLD SINGLE MISTAKE SUPPORT
          ----------------------------------------- */

          if (
            answer?.mistake &&
            !Array.isArray(
              answer?.mistakes
            )
          ) {

            grammarMistakes.push({

              question_id:
                questionId,

              mistake:
                answer.mistake,

              correction:
                answer.correction ||
                "",

              urdu_explanation:
                answer.urdu_explanation ||
                "",

            });

          }

        }
      );


      /* ---------------------------------------------
         PREPARE ANSWER DATA
      --------------------------------------------- */

      const answerData =
        answers.map(
          (answer) => {

            const maxMarks =
              Number(
                answer?.max_marks
              ) || 5;


            let marks =
              Number(
                answer?.marks
              );


            if (
              !Number.isFinite(
                marks
              )
            ) {

              marks = 0;

            }


            marks =
              Math.max(
                0,
                Math.min(
                  marks,
                  maxMarks
                )
              );


            const mistakes =
              Array.isArray(
                answer?.mistakes
              )

                ? answer.mistakes
                    .map(
                      (mistake) => ({

                        mistake:
                          mistake?.mistake ||
                          "",

                        correction:
                          mistake?.correction ||
                          "",

                        urduExplanation:
                          mistake?.urduExplanation ||
                          "",

                      })
                    )
                    .filter(
                      (mistake) =>
                        mistake.mistake ||
                        mistake.correction ||
                        mistake.urduExplanation
                    )

                : [];


            return {

              question_id:
                Number(
                  answer?.question_id
                ) || 0,

              question:
                answer?.question ||
                "",

              category:
                answer?.category ||
                "",

              user_answer:
                answer?.user_answer ||
                "",

              marks,

              max_marks:
                maxMarks,

              grammar_correct:
                answer?.grammar_correct !==
                false,

              answer_correct:
                answer?.answer_correct ===
                true,

              mistake:
                answer?.mistake ||
                "",

              correction:
                answer?.correction ||
                "",

              urdu_explanation:
                answer?.urdu_explanation ||
                "",

              feedback:
                answer?.feedback ||
                "",

              mistakes,

            };

          }
        );


      /* ---------------------------------------------
         SAVE TO MONGODB
      --------------------------------------------- */

      const result =
        await FinalChallengeResult.create({

          user_name:
            userName ||
            "Student",

          /* Topic 4 */
          topic_id:
            Number(topicId) || 4,

          /* Final Challenge 4 */
          lesson_id:
            Number(lessonId) || 4,

          total_marks:
            calculatedTotalMarks,

          obtained_marks:
            obtainedMarks,

          percentage,

          grade,

          answers:
            answerData,

           grammar_mistakes:
            grammarMistakes,

        });

      /* ---------------------------------------------
          ALSO SAVE TO Result (admin dashboard)
       --------------------------------------------- */

      const userDoc =
        await User.findOne({
          fullName: {
            $regex: new RegExp(
              "^" +
              userName +
              "$",
              "i"
            ),
          },
        });

      const challengeType =
        "Final Challenge 4";

      const passed =
        percentage >= 60;

      await Result.create({
        user: userDoc
          ? userDoc._id
          : null,
        userName:
          userName || "Student",
        school: userDoc
          ? userDoc.schoolId
          : null,
        challengeType,
        score: obtainedMarks,
        maxScore:
          calculatedTotalMarks,
        passed,
        answers: answerData,
      });

      if (userDoc) {
        await Progress.updateOne(
          {
            user: userDoc._id,
            pathway: "Pathway 4",
            topic: "Topic 4",
            subtopic:
              "Final Challenge",
            lesson:
              challengeType,
          },
          {
            $setOnInsert: {
              school:
                userDoc.schoolId ||
                null,
            },
            $set: {
              activity:
                "final_challenge",
              status: passed
                ? "completed"
                : "in_progress",
              score: obtainedMarks,
              maxScore:
                calculatedTotalMarks,
              completedAt:
                new Date(),
            },
          },
          { upsert: true }
        );
      }


      /* ---------------------------------------------
          SERVER LOG
       --------------------------------------------- */

      console.log(
        "========================================="
      );

      console.log(
        "✅ FINAL CHALLENGE 4 SAVED TO MONGODB"
      );

      console.log(
        "Result ID:",
        result._id.toString()
      );

      console.log(
        "Student:",
        userName || "Student"
      );

      console.log(
        "Topic:",
        Number(topicId) || 4
      );

      console.log(
        "Lesson:",
        Number(lessonId) || 4
      );

      console.log(
        "Marks:",
        `${obtainedMarks}/${calculatedTotalMarks}`
      );

      console.log(
        "Percentage:",
        `${percentage}%`
      );

      console.log(
        "Grade:",
        grade
      );

      console.log(
        "Answers:",
        answerData.length
      );

      console.log(
        "Grammar Mistakes:",
        grammarMistakes.length
      );

      console.log(
        "========================================="
      );


      /* ---------------------------------------------
         RESPONSE
      --------------------------------------------- */

      return res.json({

        success: true,

        resultId:
          result._id,

        totalMarks:
          calculatedTotalMarks,

        obtainedMarks,

        percentage,

        grade,

        grammarMistakes,

        message:
          "Final Challenge 4 result saved successfully.",

      });

    }

    catch (err) {

      console.log(
        "❌ Final Challenge 4 Save Error:",
        err
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to save Final Challenge 4 result.",

      });

    }

  }
);


/* =========================================================
   GET FINAL CHALLENGE RESULT BY ID
========================================================= */

app.get(
  "/api/final-challenge/result/:id",
  async (req, res) => {

    try {

      if (!isMongoConnected()) {

        return res.status(503).json({
          success: false,
          message:
            "MongoDB is not connected.",
        });

      }


      const result =
        await FinalChallengeResult.findById(
          req.params.id
        );


      if (!result) {

        return res.status(404).json({
          success: false,
          message:
            "Final Challenge result not found.",
        });

      }


      return res.json({

        success: true,

        result,

      });

    }

    catch (err) {

      console.log(
        "❌ Final Challenge Result Error:",
        err
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to load final challenge result.",

      });

    }

  }
);


/* =========================================================
   GET LATEST FINAL CHALLENGE RESULT
========================================================= */

app.get(
  "/api/final-challenge/latest/:userName",
  async (req, res) => {

    try {

      if (!isMongoConnected()) {

        return res.status(503).json({
          success: false,
          message:
            "MongoDB is not connected.",
        });

      }


      const result =
        await FinalChallengeResult
          .findOne({
            user_name:
              req.params.userName,
          })
          .sort({
            created_at: -1,
          });


      if (!result) {

        return res.status(404).json({
          success: false,
          message:
            "No final challenge result found.",
        });

      }


      return res.json({

        success: true,

        result,

      });

    }

    catch (err) {

      console.log(
        "❌ Latest Result Error:",
        err
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to load latest result.",

      });

    }

  }
);


/* =========================================================
   AUTH: PASSWORD HASHING
   Uses Node.js built-in crypto (no extra deps).
   Stored format: "salt:hash"
========================================================= */

function hashPassword(
  password
) {
  const salt =
    crypto
      .randomBytes(16)
      .toString("hex");

  const hash =
    crypto
      .scryptSync(
        password,
        salt,
        64
      )
      .toString("hex");

  return `${salt}:${hash}`;
}

function verifyPassword(
  password,
  stored
) {
  if (
    !stored ||
    typeof stored !== "string" ||
    !stored.includes(":")
  ) {
    return false;
  }

  const [salt, hash] =
    stored.split(":");

  const testHash =
    crypto
      .scryptSync(
        password,
        salt,
        64
      )
      .toString("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(testHash, "hex")
    );
  } catch (e) {
    return false;
  }
}


/* =========================================================
   ADMIN AUTH
   Token-based gate using in-memory token Maps.
   Admin tokens are issued at /api/login for User accounts
   with role="admin". Each admin is linked to a School; if
   that School is globally inactive, the admin is locked out.
 ========================================================= */

const TEACHER_EMAIL =
    process.env.TEACHER_EMAIL ||
    "teacher@fluento.com";

const TEACHER_PASSWORD =
    process.env.TEACHER_PASSWORD ||
    "Teacher@123";

const SUPER_ADMIN_EMAIL =
    process.env.SUPER_ADMIN_EMAIL ||
    "superadmin@fluento.com";

const SUPER_ADMIN_PASSWORD =
    process.env.SUPER_ADMIN_PASSWORD ||
    "SuperAdmin@123";

const adminTokens =
  new Map();

async function isAdminAuthed(
  req
) {
  const authHeader =
    req.headers.authorization ||
    "";

  const token =
    authHeader.replace(
      /^Bearer\s+/i,
      ""
    );

  if (
    !!token &&
    adminTokens.has(token)
  ) {
    req.user_id =
      adminTokens.get(token);

    /* School-level global status check */
    const _admin =
      await User.findById(
        req.user_id
      ).select("schoolId");

    if (
      _admin &&
      _admin.schoolId &&
      (await isSchoolInactive(
        _admin.schoolId
      ))
    ) {
      return false;
    }

    req.school_id =
      _admin && _admin.schoolId
        ? _admin.schoolId.toString()
        : null;

    return true;
  }

  return false;
}

const superAdminTokens = new Set();

function isSuperAdminAuthed(
  req
) {
  const authHeader =
    req.headers.authorization ||
    "";

  const token =
    authHeader.replace(
      /^Bearer\s+/i,
      ""
    );

  return (
    !!token &&
    superAdminTokens.has(token)
  );
}

function requireSuperAdmin(
  req,
  res,
  next
) {
  if (
    !isSuperAdminAuthed(req)
  ) {
    return res
      .status(401)
      .json({
        message:
          "Unauthorized — super admin token required"
      });
  }

  next();
}


/* =========================================================
   TEACHER AUTH
   Token-based gates using in-memory token Maps.
   Tokens are issued only after MongoDB credential
   verification (see /api/teacher/login). Each token maps to a
   MongoDB user ID.
 ========================================================= */

const teacherTokens = new Map();

async function isTeacherAuthed(req) {
  const authHeader =
    req.headers.authorization ||
    "";

  const token =
    authHeader.replace(
      /^Bearer\s+/i,
      ""
    );

  if (
    !!token &&
    teacherTokens.has(token)
  ) {
    req.user_id =
      teacherTokens.get(token);

    /* School-level global status check */
    const _teacher =
      await User.findById(
        req.user_id
      ).select("schoolId");

    if (
      _teacher &&
      _teacher.schoolId &&
      (await isSchoolInactive(
        _teacher.schoolId
      ))
    ) {
      return false;
    }

    req.school_id =
      _teacher && _teacher.schoolId
        ? _teacher.schoolId.toString()
        : null;

    return true;
  }

  return false;
}

/* =========================================================
    SCHOOL-LEVEL INACTIVE CHECK
   When a School's globalStatus is "inactive", all accounts
   (Admin, Teacher, Student) belonging to that school
   must be blocked from accessing protected APIs.
   Only Super Admin can reactivate the school.
========================================================= */

async function isSchoolInactive(schoolId) {
  if (!schoolId) return false;
  try {
    const school =
      await School.findOne({
        schoolId: schoolId
      });
    return (
      school &&
      school.globalStatus === "inactive"
    );
  } catch {
    return false;
  }
}

function schoolInactiveResponse(res) {
  return res.status(403).json({
    success: false,
    message:
      "This school is currently inactive.",
  });
}


/* =========================================================
    PUBLIC SCHOOL LIST
    Returns all school names so the Student Sign Up form
    can display them in a dropdown. No auth required.
  ========================================================= */

app.get(
  "/api/schools",
  async (req, res) => {
    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is not connected.",
        });
      }

      const schools =
        await School.find(
          {},
          {
            name: 1,
            schoolId: 1,
            _id: 0,
          }
        ).sort({ name: 1 });

      return res.json({
        success: true,
        schools,
      });
    } catch (err) {
      console.log(
        "❌ Public school list error:",
        err
      );
      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch schools.",
      });
    }
  }
);

/* ---------- CLASS LIST (for sign-up / teacher forms) ---------- */

app.get(
  "/api/classes",
  async (req, res) => {
    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is not connected.",
        });
      }

      const { schoolId } = req.query;

      const filter = {};
      if (schoolId) {
        filter.$or = [
          { schoolId: null },
          { schoolId: schoolId },
        ];
      }

      const classes =
        await Class
          .find(filter, {
            name: 1,
            _id: 1,
            schoolId: 1,
          })
          .sort({ name: 1 });

      return res.json({
        success: true,
        classes: classes.map(
          (c) => ({
            _id: c._id,
            name: c.name,
            schoolId: c.schoolId,
          })
        ),
      });
    } catch (err) {
      console.log(
        "❌ Class list error:",
        err
      );
      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch classes.",
      });
    }
  }
);


/* =========================================================
    SIGN UP (REGISTER)
    New users are Blocked by default.
  ========================================================= */

app.post(
  "/api/register",
  async (req, res) => {
    try {
      const {
        fullName,
        email,
        mobile,
        password,
        confirmPassword,
        schoolName,
        class: studentClass,
      } = req.body;


      /* ---------------------------------
         VALIDATION
      --------------------------------- */

      if (
        !fullName ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Full Name, Email and Password are required.",
        });
      }

      if (
        password !==
        confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Passwords do not match.",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters.",
        });
      }

      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is not connected.",
        });
      }


      /* ---------------------------------
          DUPLICATE EMAIL CHECK
       --------------------------------- */

      const existing =
        await User.findOne({
          email,
        });

      if (existing) {
        return res.status(409).json({
          success: false,
          message:
            "Email already registered.",
        });
      }


      /* ---------------------------------
          RESOLVE SCHOOL SELECTED BY STUDENT
          The student picks a School Name
          from the dropdown; we look up that
          school's custom schoolId.
       --------------------------------- */

      let schoolId = null;
      if (schoolName) {
        const school =
          await School.findOne({
            name: schoolName,
          }).select("schoolId");
        if (school) {
          schoolId = school.schoolId;
        }
      }

      const hashed =
        hashPassword(password);

      const user =
        await User.create({
          username: email,
          fullName,
          email,
          mobile:
            mobile || "",
          password: hashed,
          isBlocked: true,
          isApproved: false,
          role: "student",
          schoolId,
          class: studentClass || "",
        });


      return res.status(201).json({
        success: true,
        message:
          "Registration successful. Awaiting admin approval.",
        user: {
          _id: user._id,
          fullName:
            user.fullName,
          email: user.email,
          mobile: user.mobile,
          isBlocked:
            user.isBlocked,
          isApproved:
            user.isApproved,
          role: user.role,
        },
      });
    } catch (err) {
      console.log(
        "❌ Register Error:",
        err
      );
      return res.status(500).json({
        success: false,
        message:
          err.message ||
          "Registration failed.",
      });
    }
  }
);


/* =========================================================
   LOGIN
   Only approved, non-blocked users may log in.
========================================================= */

app.post(
  "/api/login",
  async (req, res) => {
    try {
      const {
        email,
        password
      } = req.body;


      /* ---------------------------------
          VALIDATION
       --------------------------------- */

      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email and Password are required.",
        });
      }

      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is not connected.",
        });
      }


      /* ---------------------------------
           SUPER ADMIN FALLBACK: env creds
           Super Admin has no school, so
           schoolId is not required.
      --------------------------------- */

      if (
        email === SUPER_ADMIN_EMAIL &&
        password === SUPER_ADMIN_PASSWORD
      ) {
        const token =
          crypto
            .randomBytes(32)
            .toString("hex");

        superAdminTokens.add(token);

        return res.json({
          success: true,
          token,
          message:
            "Login successful.",
          user: {
            _id: "superadmin",
            fullName: "Super Admin",
            email,
            role:
              "superadmin",
            isApproved: true,
            isBlocked: false,
          },
        });
      }


      /* ---------------------------------
           FIND USER IN users COLLECTION
           All roles (admin, teacher,
           student) are stored in the
           User collection. The user's
           schoolId is stored on the
           document and returned in the
           response so the client can load
           the correct school's data.
       --------------------------------- */

      let account =
        await User.findOne({
          email,
        }).catch(() => null);

      if (!account) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      /* Determine role */
      const role = account.role;

      /* Verify password */
      if (
        !verifyPassword(
          password,
          account.password
        )
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password.",
        });
      }

      /* School-level global status check —
         MUST run BEFORE account-level
         isApproved, isBlocked, or account
         globalStatus checks. If the school
         has been globally deactivated by
         Super Admin, reject login entirely. */
      if (account.schoolId) {
        const schoolDoc =
          await School.findOne({
            schoolId: account.schoolId
          });
        if (
          schoolDoc &&
          schoolDoc.globalStatus ===
            "inactive"
        ) {
          return res.status(403).json({
            success: false,
            message:
              "This school is currently inactive.",
          });
        }
      }

      /* Global status check — only
         Super Admin can reactivate
         a globally inactive account */
      if (
        account.globalStatus ===
        "inactive"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account has been globally deactivated. Please contact Super Admin.",
        });
      }

      /* Approval / block check */
      if (
        account.isBlocked ||
        !account.isApproved
      ) {
        return res.status(403).json({
          success: false,
          awaitingApproval: true,
          message:
            "Your account is waiting for admin approval.",
          user: {
            email:
              account.email,
            fullName:
              account.fullName,
            role,
          },
        });
      }

      /* Success - generate token for
         admin/teacher roles */
      let token = null;

      if (role === "teacher") {
        token = crypto
          .randomBytes(32)
          .toString("hex");
        teacherTokens.set(
          token,
          account._id
            .toString()
        );
      }

      if (role === "admin") {
        token = crypto
          .randomBytes(32)
          .toString("hex");
        adminTokens.set(
          token,
          account._id
            .toString()
        );
      }

      const response = {
        success: true,
        message:
          "Login successful.",
        user: {
          _id: account._id,
          fullName:
            account.fullName,
          email:
            account.email,
          mobile:
            account.mobile,
          role,
          isApproved:
            account.isApproved,
          isBlocked:
            account.isBlocked,
           schoolId:
             account.schoolId
               ? account.schoolId
                   .toString()
               : null,
        },
      };

      if (token) {
        response.token = token;
      }

      return res.json(response);
    } catch (err) {
      console.log(
        "❌ Login Error:",
        err
      );
      return res.status(500).json({
        success: false,
        message:
          "Login failed.",
      });
    }
  }
);


/* =========================================================
   ADMIN DASHBOARD ROUTES
    Schools, teachers, students (role=student),
   pathways/topics content, student progress & results.
   All protected by isAdminAuthed (existing admin token set).
========================================================= */

/* ---------- SUMMARY (dashboard cards) ---------- */

app.get(
  "/api/admin/summary",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message: "Database is not connected.",
        });
      }

      const schoolId =
        req.school_id;

      const [
        students,
        teachers,
        teachersPending,
        results,
      ] = await Promise.all([
        schoolId
          ? User.countDocuments({
              role: "student",
              schoolId: schoolId,
            })
          : User.countDocuments({
              role: "student",
            }),
        schoolId
          ? User.countDocuments({
              role: "teacher",
              schoolId: schoolId,
            })
          : User.countDocuments({
              role: "teacher",
            }),
        schoolId
          ? User.countDocuments({
              role: "student",
              schoolId: schoolId,
              isApproved: false,
            })
          : User.countDocuments({
              role: "student",
              isApproved: false,
            }),
        Result.countDocuments({}),
      ]);

      return res.json({
        success: true,
        summary: {
          students,
          teachers,
          pendingRequests:
            teachersPending,
          results,
        },
      });
    } catch (err) {
      console.log(
        "❌ Admin summary error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to load summary.",
      });
    }
  }
);


/* ---------- STUDENTS (role = user) ---------- */

app.get(
  "/api/admin/students",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message: "Database is not connected.",
        });
      }

      const students =
        await User.aggregate([
          {
            $match: {
              role: "student",
              ...(req.school_id
                ? { schoolId: req.school_id }
                : {}),
            },
          },
          {
            $lookup: {
              from: "schools",
              localField: "schoolId",
              foreignField: "schoolId",
              as: "school",
            },
          },
          {
            $unwind: {
              path: "$school",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
        ]);

      return res.json({
        success: true,
        students: students.map((s) => ({
          _id: s._id,
          fullName: s.fullName,
          email: s.email,
          mobile: s.mobile,
          school: s.school
            ? {
                _id: s.school._id,
                name: s.school.name,
              }
            : null,
          class: s.class,
          role: s.role,
          isBlocked: s.isBlocked,
          isApproved: s.isApproved,
          createdAt: s.createdAt,
        })),
      });
    } catch (err) {
      console.log(
        "❌ Admin list students error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to fetch students.",
      });
    }
  }
);


app.put(
  "/api/admin/students/:id",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message: "Database is not connected.",
        });
      }

      const {
        fullName,
        email,
        mobile,
      } = req.body;

      const user =
        await User.findById(req.params.id);

      if (!user || user.role !== "student") {
        return res.status(404).json({
          success: false,
          message: "Student not found.",
        });
      }

      /* School scope check — admin can only manage their own school */
      if (
        req.school_id &&
        (!user.schoolId ||
          user.schoolId.toString() !== req.school_id)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only manage students from your own school.",
        });
      }

      /* School-level global status check */
      if (
        user.schoolId &&
        (await isSchoolInactive(user.schoolId))
      ) {
        return res.status(403).json({
          success: false,
          message:
            "This school is currently inactive.",
        });
      }

      /* Email uniqueness guard */
      if (email && email !== user.email) {
        const existing =
          await User.findOne({ email });
        if (existing) {
          return res.status(409).json({
            success: false,
            message: "Email already in use.",
          });
        }
      }

      if (fullName) { user.fullName = fullName; }
      if (email) { user.email = email; }
      if (mobile !== undefined) { user.mobile = mobile; }

      await user.save();

      return res.json({
        success: true,
        message: "Student updated.",
        student: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile,
          school: user.schoolId,
          role: user.role,
          isBlocked: user.isBlocked,
          isApproved: user.isApproved,
        },
      });
    } catch (err) {
      console.log(
        "❌ Admin update student error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to update student.",
      });
    }
  }
);



/* ---------- TEACHERS (users collection, role=teacher) ---------- */

app.get(
  "/api/admin/teachers",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message: "Database is not connected.",
        });
      }

      const teachers =
        await User.aggregate([
          {
            $match: req.school_id
              ? {
                  role: "teacher",
                  schoolId: req.school_id,
                }
              : { role: "teacher" },
          },
          {
            $lookup: {
              from: "schools",
              localField: "schoolId",
              foreignField: "schoolId",
              as: "school",
            },
          },
          {
            $unwind: {
              path: "$school",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
        ]);

      return res.json({
        success: true,
        teachers: teachers.map((t) => ({
          _id: t._id,
          fullName: t.fullName,
          email: t.email,
          mobile: t.mobile,
          school: t.school
            ? {
                _id: t.school._id,
                name: t.school.name,
              }
            : null,
          class: t.class,
          isBlocked: t.isBlocked,
          isApproved: t.isApproved,
          createdAt: t.createdAt,
        })),
      });
    } catch (err) {
      console.log(
        "❌ Admin list teachers error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to fetch teachers.",
      });
    }
  }
);


app.post(
  "/api/admin/teachers",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message: "Database is not connected.",
        });
      }

      const {
        fullName,
        email,
        mobile,
        password,
        class: teacherClass,
      } = req.body;

      if (!fullName || !email || !password) {
        return res.status(400).json({
          success: false,
          message:
            "Full Name, Email and Password are required.",
        });
      }

      const existing =
        await User.findOne({
          email,
          role: "teacher",
        });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Email already registered.",
        });
      }

      const teacher =
        await User.create({
          fullName,
          email,
          mobile: mobile || "",
          password: hashPassword(password),
          isBlocked: true,
          isApproved: false,
          role: "teacher",
          schoolId: req.school_id,
          class: teacherClass || "",
        });

      return res.status(201).json({
        success: true,
        message: "Teacher created.",
        teacher: {
          _id: teacher._id,
          fullName: teacher.fullName,
          email: teacher.email,
          mobile: teacher.mobile,
          school: teacher.schoolId,
          class: teacher.class,
          isBlocked: teacher.isBlocked,
          isApproved: teacher.isApproved,
        },
      });
    } catch (err) {
      console.log(
        "❌ Admin create teacher error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to create teacher.",
      });
    }
  }
);


app.put(
  "/api/admin/teachers/:id",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message: "Database is not connected.",
        });
      }

      const {
        fullName,
        email,
        mobile,
        password,
        class: teacherClass,
        isBlocked,
      } = req.body;

      const teacher =
        await User.findById(
          req.params.id
        );

      if (
        !teacher ||
        teacher.role !== "teacher"
      ) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found.",
        });
      }

      /* School scope check */
      if (
        req.school_id &&
        (!teacher.schoolId ||
          teacher.schoolId.toString() !== req.school_id)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only manage teachers from your own school.",
        });
      }

      /* School-level global status check */
      if (
        teacher.schoolId &&
        (await isSchoolInactive(
          teacher.schoolId
        ))
      ) {
        return res.status(403).json({
          success: false,
          message:
            "This school is currently inactive.",
        });
      }

      if (email && email !== teacher.email) {
        const existing =
          await User.findOne({
            email,
            role: "teacher",
          });
        if (existing) {
          return res.status(409).json({
            success: false,
            message: "Email already in use.",
          });
        }
      }

      if (fullName) { teacher.fullName = fullName; }
      if (email) { teacher.email = email; }
      if (mobile !== undefined) { teacher.mobile = mobile; }
      if (teacherClass !== undefined) { teacher.class = teacherClass; }
      if (typeof isBlocked === "boolean") {
        teacher.isBlocked = isBlocked;
      }
      if (password) {
        teacher.password = hashPassword(password);
      }

      await teacher.save();

      return res.json({
        success: true,
        message: "Teacher updated.",
        teacher: {
          _id: teacher._id,
          fullName: teacher.fullName,
          email: teacher.email,
          mobile: teacher.mobile,
          school: teacher.schoolId,
          class: teacher.class,
          isBlocked: teacher.isBlocked,
          isApproved: teacher.isApproved,
        },
      });
    } catch (err) {
      console.log(
        "❌ Admin update teacher error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to update teacher.",
      });
    }
  }
);


app.delete(
  "/api/admin/teachers/:id",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message: "Database is not connected.",
        });
      }

      const teacher =
        await User.findById(
          req.params.id
        );

      if (
        !teacher ||
        teacher.role !== "teacher"
      ) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found.",
        });
      }

      /* School scope check */
      if (
        req.school_id &&
        (!teacher.schoolId ||
          teacher.schoolId.toString() !== req.school_id)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only manage teachers from your own school.",
        });
      }

      /* School-level global status check */
      if (
        teacher.schoolId &&
        (await isSchoolInactive(
          teacher.schoolId
        ))
      ) {
        return res.status(403).json({
          success: false,
          message:
            "This school is currently inactive.",
        });
      }

      await teacher.deleteOne();

      return res.json({
        success: true,
        message: "Teacher removed.",
      });
    } catch (err) {
      console.log(
        "❌ Admin delete teacher error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to delete teacher.",
      });
    }
  }
);


app.put(
  "/api/admin/teachers/:id/toggle-block",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is not connected.",
        });
      }

      const teacher =
        await User.findById(
          req.params.id
        );

      if (
        !teacher ||
        teacher.role !== "teacher"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Teacher not found.",
        });
      }

      /* School scope check */
      if (
        req.school_id &&
        (!teacher.schoolId ||
          teacher.schoolId.toString() !== req.school_id)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only manage teachers from your own school.",
        });
      }

      if (
        teacher.globalStatus ===
        "inactive"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Cannot modify a globally inactive account.",
        });
      }

      /* School-level global status check */
      if (teacher.schoolId) {
        const _schoolDoc =
          await School.findOne({
            schoolId: teacher.schoolId
          });
        if (
          _schoolDoc &&
          _schoolDoc.globalStatus ===
            "inactive"
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Cannot modify an account whose school has been globally deactivated.",
          });
        }
      }

      teacher.isBlocked =
        !teacher.isBlocked;
      teacher.isApproved =
        !teacher.isBlocked;

      await teacher.save();

      return res.json({
        success: true,
        message: teacher.isBlocked
          ? "Teacher blocked."
          : "Teacher allowed.",
        teacher: {
          _id: teacher._id,
          fullName:
            teacher.fullName,
          email: teacher.email,
          mobile: teacher.mobile,
          school: teacher.schoolId,
          isBlocked:
            teacher.isBlocked,
          isApproved:
            teacher.isApproved,
        },
      });
    } catch (err) {
      console.log(
        "❌ Admin toggle teacher error:",
        err
      );
      return res.status(500).json({
        success: false,
        message:
          "Failed to update teacher.",
      });
    }
  }
);


/* ---------- SCHOOLS ---------- */

/* ---------- SCHOOLS ---------- */

app.get(
  "/api/admin/schools",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message: "Database is not connected.",
        });
      }

      const schools =
        await School
          .find({})
          .sort({ createdAt: -1 });

      return res.json({
        success: true,
        schools,
      });
    } catch (err) {
      console.log(
        "❌ Admin list schools error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to fetch schools.",
      });
    }
  }
);


app.post(
  "/api/admin/schools",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message: "Database is not connected.",
        });
      }

      const {
        name,
        address,
        contactEmail,
        contactPhone,
        established,
      } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "School name is required.",
        });
      }

      const school =
        await School.create({
          name,
          address: address || "",
          contactEmail: contactEmail || "",
          contactPhone: contactPhone || "",
          established: established
            ? new Date(established)
            : null,
        });

      return res.status(201).json({
        success: true,
        message: "School created.",
        school,
      });
    } catch (err) {
      console.log(
        "❌ Admin create school error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to create school.",
      });
    }
  }
);


app.put(
  "/api/admin/schools/:id",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message: "Database is not connected.",
        });
      }

      const {
        name,
        address,
        contactEmail,
        contactPhone,
        established,
      } = req.body;

      const school =
        await School.findById(req.params.id);

      if (!school) {
        return res.status(404).json({
          success: false,
          message: "School not found.",
        });
      }

      if (name) { school.name = name; }
      if (address !== undefined) {
        school.address = address;
      }
      if (contactEmail !== undefined) {
        school.contactEmail = contactEmail;
      }
      if (contactPhone !== undefined) {
        school.contactPhone = contactPhone;
      }
      if (established !== undefined) {
        school.established = established
          ? new Date(established)
          : null;
      }

      await school.save();

      return res.json({
        success: true,
        message: "School updated.",
        school,
      });
    } catch (err) {
      console.log(
        "❌ Admin update school error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to update school.",
      });
    }
  }
);


app.delete(
  "/api/admin/schools/:id",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message: "Database is not connected.",
        });
      }

      const school =
        await School.findById(req.params.id);

      if (!school) {
        return res.status(404).json({
          success: false,
          message: "School not found.",
        });
      }

      await school.deleteOne();

      return res.json({
        success: true,
        message: "School removed.",
      });
    } catch (err) {
      console.log(
        "❌ Admin delete school error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to delete school.",
      });
    }
  }
);


/* ---------- PATHWAYS & TOPICS (content) ---------- */

app.get(
  "/api/admin/pathways",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message: "Database is not connected.",
        });
      }

      const pathways =
        await Pathway
          .find({})
          .sort({ createdAt: -1 });

      return res.json({
        success: true,
        pathways,
      });
    } catch (err) {
      console.log(
        "❌ Admin list pathways error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to fetch pathways.",
      });
    }
  }
);


app.post(
  "/api/admin/pathways",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message: "Database is not connected.",
        });
      }

      const {
        name,
        description,
        topics,
      } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Pathway name is required.",
        });
      }

      const pathway =
        await Pathway.create({
          name,
          description: description || "",
          topics: topics || [],
        });

      return res.status(201).json({
        success: true,
        message: "Pathway created.",
        pathway,
      });
    } catch (err) {
      console.log(
        "❌ Admin create pathway error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to create pathway.",
      });
    }
  }
);


app.get(
  "/api/admin/pathways/:id",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message: "Database is not connected.",
        });
      }

      const pathway =
        await Pathway.findById(req.params.id);

      if (!pathway) {
        return res.status(404).json({
          success: false,
          message: "Pathway not found.",
        });
      }

      return res.json({
        success: true,
        pathway,
      });
    } catch (err) {
      console.log(
        "❌ Admin get pathway error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to fetch pathway.",
      });
    }
  }
);


app.put(
  "/api/admin/pathways/:id",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message: "Database is not connected.",
        });
      }

      const {
        name,
        description,
        topics,
      } = req.body;

      const pathway =
        await Pathway.findById(req.params.id);

      if (!pathway) {
        return res.status(404).json({
          success: false,
          message: "Pathway not found.",
        });
      }

      if (name) { pathway.name = name; }
      if (description !== undefined) {
        pathway.description = description;
      }
      if (topics !== undefined) {
        pathway.topics = topics;
      }

      await pathway.save();

      return res.json({
        success: true,
        message: "Pathway updated.",
        pathway,
      });
    } catch (err) {
      console.log(
        "❌ Admin update pathway error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to update pathway.",
      });
    }
  }
);


app.delete(
  "/api/admin/pathways/:id",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message: "Database is not connected.",
        });
      }

      const pathway =
        await Pathway.findById(req.params.id);

      if (!pathway) {
        return res.status(404).json({
          success: false,
          message: "Pathway not found.",
        });
      }

      await pathway.deleteOne();

      return res.json({
        success: true,
        message: "Pathway removed.",
      });
    } catch (err) {
      console.log(
        "❌ Admin delete pathway error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to delete pathway.",
      });
    }
  }
);


/* ---------- STUDENT PROGRESS ---------- */

app.get(
  "/api/admin/progress",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message: "Database is not connected.",
        });
      }

      const filter = {};
      if (req.query.student) {
        filter.user = req.query.student;
      }
      if (req.query.topic) {
        filter.topic = req.query.topic;
      }

      const progress =
        await Progress
          .find(filter)
          .populate("user", "fullName email")
          .sort({ completedAt: -1 });

      /* Batch-fetch school names by schoolId string */
      const progressSchoolIds =
        [
          ...new Set(
            progress
              .map((p) => p.school)
              .filter(Boolean)
          ),
        ];
      const progressSchools =
        await School.find({
          schoolId: {
            $in: progressSchoolIds,
          },
        });
      const progressSchoolMap = {};
      progressSchools.forEach(
        (s) => {
          progressSchoolMap[s.schoolId] =
            s;
        }
      );

      return res.json({
        success: true,
        progress: progress.map((p) => ({
          _id: p._id,
          user: p.user
            ? {
                _id: p.user._id,
                fullName:
                  p.user.fullName,
                email: p.user.email,
              }
            : null,
          userName:
            p.user
              ? p.user.fullName
              : p.userName ||
                "Student",
          school:
            p.school &&
            progressSchoolMap[p.school]
              ? {
                  _id: progressSchoolMap[
                    p.school
                  ]._id,
                  name: progressSchoolMap[
                    p.school
                  ].name,
                }
              : null,
          pathway: p.pathway,
          topic: p.topic,
          subtopic: p.subtopic,
          lesson: p.lesson,
          activity: p.activity,
          status: p.status,
          score: p.score,
          maxScore: p.maxScore,
          completedAt:
            p.completedAt,
        })),
      });
    } catch (err) {
      console.log(
        "❌ Admin list progress error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to fetch progress.",
      });
    }
  }
);


app.post(
  "/api/admin/progress",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message: "Database is not connected.",
        });
      }

      const {
        user,
        school,
        pathway,
        topic,
        subtopic,
        lesson,
        activity,
        status,
        score,
        maxScore,
      } = req.body;

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Student (user) is required.",
        });
      }

      const owner =
        await User.findById(user);
      if (!owner) {
        return res.status(404).json({
          success: false,
          message: "Student not found.",
        });
      }

      const filter = {
        user,
        pathway: pathway || "",
        topic: topic || "",
        subtopic: subtopic || "",
        lesson: lesson || "",
      };

      const update = {
        school: school || null,
        activity: activity || "",
        status: status || "completed",
        score: score || 0,
        maxScore: maxScore || 0,
        completedAt: new Date(),
      };

      const record =
        await Progress.findOneAndUpdate(
          filter,
          update,
          {
            upsert: true,
            returnDocument: "after",
            setDefaultsOnInsert: true,
          }
        );

      return res.status(201).json({
        success: true,
        message: "Progress recorded.",
        progress: record,
      });
    } catch (err) {
      console.log(
        "❌ Admin record progress error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to record progress.",
      });
    }
  }
);


/* ---------- RESULTS & REPORTS ---------- */

app.get(
  "/api/admin/results",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message: "Database is not connected.",
        });
      }

      const filter = {};
      if (req.query.student) {
        filter.user = req.query.student;
      }
      if (req.query.challengeType) {
        filter.challengeType =
          req.query.challengeType;
      }

      const results =
        await Result
          .find(filter)
          .populate("user", "fullName email")
          .sort({ completedAt: -1 });

      /* Batch-fetch school names by schoolId string */
      const resultsSchoolIds =
        [
          ...new Set(
            results
              .map((r) => r.school)
              .filter(Boolean)
          ),
        ];
      const resultsSchools =
        await School.find({
          schoolId: {
            $in: resultsSchoolIds,
          },
        });
      const resultsSchoolMap = {};
      resultsSchools.forEach(
        (s) => {
          resultsSchoolMap[s.schoolId] =
            s;
        }
      );

      return res.json({
        success: true,
        results: results.map((r) => ({
          _id: r._id,
          user: r.user
            ? {
                _id: r.user._id,
                fullName:
                  r.user.fullName,
                email: r.user.email,
              }
            : null,
          userName:
            r.user
              ? r.user.fullName
              : r.userName ||
                "Student",
          school:
            r.school &&
            resultsSchoolMap[r.school]
              ? {
                  _id: resultsSchoolMap[
                    r.school
                  ]._id,
                  name: resultsSchoolMap[
                    r.school
                  ].name,
                }
              : null,
          challengeType: r.challengeType,
          score: r.score,
          maxScore: r.maxScore,
          passed: r.passed,
          answers: r.answers,
          completedAt: r.completedAt,
        })),
      });
    } catch (err) {
      console.log(
        "❌ Admin list results error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to fetch results.",
      });
    }
  }
);


app.post(
  "/api/admin/results",
  async (req, res) => {
    if (!(await isAdminAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message: "Database is not connected.",
        });
      }

      const {
        user,
        school,
        challengeType,
        score,
        maxScore,
        passed,
        answers,
      } = req.body;

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Student (user) is required.",
        });
      }

      const owner =
        await User.findById(user);
      if (!owner) {
        return res.status(404).json({
          success: false,
          message: "Student not found.",
        });
      }

      const result =
        await Result.create({
          user,
          school: school || null,
          challengeType: challengeType || "",
          score: score || 0,
          maxScore: maxScore || 25,
          passed: passed !== undefined ? passed : false,
          answers: answers || [],
        });

      return res.status(201).json({
        success: true,
        message: "Result recorded.",
        result: {
          _id: result._id,
          user: result.user
            ? {
                _id: result.user._id,
                fullName: result.user.fullName,
                email: result.user.email,
              }
            : null,
          userName:
            result.user
              ? result.user.fullName
              : result.userName ||
                "",
          school: result.school,
          challengeType: result.challengeType,
          score: result.score,
          maxScore: result.maxScore,
          passed: result.passed,
          answers: result.answers,
          completedAt: result.completedAt,
        },
      });
     } catch (err) {
      console.log(
        "❌ Admin record result error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to record result.",
      });
    }
  }
);


/* =========================================================
   STUDENT: SAVE PROGRESS
   Records a student's progress on a lesson/activity.
   Called by the student-facing app.
========================================================= */

app.post(
  "/api/student/save-progress",
  async (req, res) => {
    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is not connected.",
        });
      }

      const {
        userName,
        email,
        pathway,
        topic,
        subtopic,
        lesson,
        activity,
        status,
        score,
        maxScore,
      } = req.body;

      if (!userName && !email) {
        return res.status(400).json({
          success: false,
          message:
            "userName or email is required.",
        });
      }

      let userDoc = null;

      if (email) {
        userDoc =
          await User.findOne({ email });
      }

      if (!userDoc && userName) {
        userDoc =
          await User.findOne({
            fullName: {
              $regex: new RegExp(
                "^" + userName + "$",
                "i"
              ),
            },
          });
      }

      /* School-level global status check */
      if (
        userDoc &&
        userDoc.schoolId &&
        (await isSchoolInactive(
          userDoc.schoolId
        ))
      ) {
        return res.status(403).json({
          success: false,
          message:
            "This school is currently inactive.",
        });
      }

      const filter = {
        user: userDoc
          ? userDoc._id
          : null,
        pathway: pathway || "",
        topic: topic || "",
        subtopic: subtopic || "",
        lesson: lesson || "",
      };

      const update = {
        school: userDoc
          ? userDoc.schoolId
          : null,
        activity: activity || "",
        status:
          status ||
          (score === maxScore && maxScore > 0
            ? "completed"
            : "in_progress"),
        score: Number(score) || 0,
        maxScore: Number(maxScore) || 0,
        completedAt: new Date(),
      };

      if (userDoc) {
        await Progress.updateOne(
          filter,
          {
            $setOnInsert: {
              school:
                userDoc.schoolId || null,
            },
            $set: {
              activity:
                update.activity,
              status: update.status,
              score: update.score,
              maxScore:
                update.maxScore,
              completedAt:
                update.completedAt,
            },
          },
          { upsert: true }
        );
      } else {
        await Progress.create({
          ...filter,
          ...update,
          user: null,
          userName:
            userName || "Student",
        });
      }

      return res.status(201).json({
        success: true,
        message:
          "Progress recorded.",
        progress: {
          pathway: pathway || "",
          topic: topic || "",
          subtopic: subtopic || "",
          lesson: lesson || "",
          activity: activity || "",
          status: update.status,
          score: update.score,
          maxScore: update.maxScore,
          completedAt: update.completedAt,
        },
      });
    } catch (err) {
      console.log(
        "❌ Student save progress error:",
        err
      );
      return res.status(500).json({
        success: false,
        message:
          "Failed to record progress.",
      });
    }
  }
);


/* =========================================================
   STUDENT: SAVE RESULT
   Records a student's final challenge result.
   Called by the student-facing app.
   Creates a Result document linked to the User.
   (FinalChallengeResult is still saved by the
    /api/final-challenge/save-result endpoint.)
========================================================= */

app.post(
  "/api/student/save-result",
  async (req, res) => {
    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is not connected.",
        });
      }

      const {
        userName,
        email,
        challengeType,
        score,
        maxScore,
        passed,
        answers,
      } = req.body;

      if (!userName && !email) {
        return res.status(400).json({
          success: false,
          message:
            "userName or email is required.",
        });
      }

      let userDoc = null;

      if (email) {
        userDoc =
          await User.findOne({ email });
      }

      if (!userDoc && userName) {
        userDoc =
          await User.findOne({
            fullName: {
              $regex: new RegExp(
                "^" + userName + "$",
                "i"
              ),
            },
          });
      }

      /* School-level global status check */
      if (
        userDoc &&
        userDoc.schoolId &&
        (await isSchoolInactive(
          userDoc.schoolId
        ))
      ) {
        return res.status(403).json({
          success: false,
          message:
            "This school is currently inactive.",
        });
      }

      const result =
        await Result.create({
          user: userDoc
            ? userDoc._id
            : null,
          userName:
            userName || "Student",
          school: userDoc
            ? userDoc.schoolId
            : null,
          challengeType:
            challengeType || "",
          score:
            Number(score) || 0,
          maxScore:
            Number(maxScore) || 25,
          passed:
            passed !== undefined
              ? passed
              : false,
          answers:
            answers || [],
        });

      /* Also record progress for this challenge */

      if (userDoc) {
        const passedFlag =
          passed !== undefined
            ? passed
            : false;

        await Progress.updateOne(
          {
            user: userDoc._id,
            pathway: "Pathway",
            topic:
              challengeType ||
              "Final Challenge",
            subtopic:
              "Final Challenge",
            lesson:
              challengeType ||
              "Final Challenge",
          },
          {
            $setOnInsert: {
              school:
                userDoc.schoolId ||
                null,
            },
            $set: {
              activity:
                "final_challenge",
              status: passedFlag
                ? "completed"
                : "in_progress",
              score:
                Number(score) || 0,
              maxScore:
                Number(maxScore) ||
                25,
              completedAt:
                new Date(),
            },
          },
          { upsert: true }
        );
      }

      return res.status(201).json({
        success: true,
        message:
          "Result recorded.",
        result: {
          _id: result._id,
          userName:
            result.userName,
          school: result.school,
          challengeType:
            result.challengeType,
          score: result.score,
          maxScore:
            result.maxScore,
          passed: result.passed,
          answers: result.answers,
          completedAt:
            result.completedAt,
        },
      });
    } catch (err) {
      console.log(
        "❌ Student save result error:",
        err
      );
      return res.status(500).json({
        success: false,
        message:
          "Failed to record result.",
      });
    }
  }
);


/* =========================================================
   TEACHER DASHBOARD ROUTES
   Authenticated via teacherTokens.
   Teachers see students, progress, and results from
   their assigned school.
========================================================= */

app.get(
  "/api/teacher/summary",
  async (req, res) => {
    if (!(await isTeacherAuthed(req))) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is not connected.",
        });
      }

      const teacher =
        await User.findById(
          req.user_id
        );

      const schoolId = teacher
        ? teacher.schoolId
        : null;

      let studentFilter = {};

      if (schoolId) {
        studentFilter = {
          role: "student",
          schoolId: schoolId,
        };
        if (teacher.class) {
          studentFilter.class = teacher.class;
        }
      } else {
        studentFilter = {
          role: "student",
        };
      }

      const [
        totalStudents,
        approvedStudents,
        pendingStudents,
        results,
        progress,
      ] = await Promise.all([
        User.countDocuments(
          studentFilter
        ),
        User.countDocuments({
          ...studentFilter,
          isApproved: true,
        }),
        User.countDocuments({
          ...studentFilter,
          isApproved: false,
        }),
        Result.countDocuments({
          school: schoolId,
        }),
        Progress.countDocuments({
          school: schoolId,
        }),
      ]);

      return res.json({
        success: true,
        summary: {
          students: totalStudents,
          approvedStudents,
          pendingStudents,
          results,
          progress,
        },
      });
    } catch (err) {
      console.log(
        "❌ Teacher summary error:",
        err
      );
      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch summary.",
      });
    }
  }
);


app.get(
  "/api/teacher/students",
  async (req, res) => {
    if (!(await isTeacherAuthed(req))) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is not connected.",
        });
      }

      const teacher =
        await User.findById(
          req.user_id
        );

      let students;

      if (teacher && teacher.schoolId) {
        const query = {
          role: "student",
          schoolId: teacher.schoolId,
        };
        if (teacher.class) {
          query.class = teacher.class;
        }
        students = await User
          .find(query)
          .sort({
            createdAt: -1,
          });
      } else {
        students = await User
          .find({ role: "student" })
          .sort({
            createdAt: -1,
          });
      }

      return res.json({
        success: true,
            students: students.map(
              (s) => ({
                _id: s._id,
                fullName: s.fullName,
                email: s.email,
                mobile: s.mobile,
                school: s.schoolId
                  ? s.schoolId.toString()
                  : null,
                class: s.class,
                role: s.role,
                isBlocked:
                  s.isBlocked,
              isApproved:
                s.isApproved,
              createdAt:
                s.createdAt,
            })
          ),
      });
    } catch (err) {
      console.log(
        "❌ Teacher list students error:",
        err
      );
      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch students.",
      });
    }
  }
);


app.get(
  "/api/teacher/results",
  async (req, res) => {
    if (!(await isTeacherAuthed(req))) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is not connected.",
        });
      }

      const teacher =
        await User.findById(
          req.user_id
        );

      let schoolFilter = {};

      if (
        teacher &&
        teacher.schoolId
      ) {
        schoolFilter = {
          school: teacher.schoolId,
        };
      }

      const results =
        await Result
          .find(schoolFilter)
          .populate(
            "user",
            "fullName email"
          )
          .populate(
            "school",
            "name"
          )
          .sort({
            completedAt: -1,
          });

      return res.json({
        success: true,
        results: results.map(
          (r) => ({
            _id: r._id,
            user: r.user
              ? {
                  _id: r.user._id,
                  fullName:
                    r.user.fullName,
                  email:
                    r.user.email,
                }
              : null,
            userName:
              r.user
                ? r.user.fullName
                : r.userName ||
                  "",
            school: r.school
              ? {
                  _id: r.school._id,
                  name:
                    r.school.name,
                }
              : null,
            challengeType:
              r.challengeType,
            score: r.score,
            maxScore:
              r.maxScore,
            passed: r.passed,
            answers: r.answers,
            completedAt:
              r.completedAt,
          })
        ),
      });
    } catch (err) {
      console.log(
        "❌ Teacher results error:",
        err
      );
      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch results.",
      });
    }
  }
);


app.get(
  "/api/teacher/progress",
  async (req, res) => {
    if (!(await isTeacherAuthed(req))) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is not connected.",
        });
      }

      const teacher =
        await User.findById(
          req.user_id
        );

      let schoolFilter = {};

      if (
        teacher &&
        teacher.schoolId
      ) {
        schoolFilter = {
          school: teacher.schoolId,
        };
      }

      const progress =
        await Progress
          .find(schoolFilter)
          .populate(
            "user",
            "fullName email"
          )
          .populate(
            "school",
            "name"
          )
          .sort({
            completedAt: -1,
          });

      return res.json({
        success: true,
        progress: progress.map(
          (p) => ({
            _id: p._id,
            user: p.user
              ? {
                  _id: p.user._id,
                  fullName:
                    p.user.fullName,
                  email:
                    p.user.email,
                }
              : null,
            userName:
              p.user
                ? p.user.fullName
                : p.userName ||
                  "",
            pathway:
              p.pathway,
            topic: p.topic,
            subtopic:
              p.subtopic,
            lesson: p.lesson,
            activity:
              p.activity,
            status: p.status,
            score: p.score,
            maxScore:
              p.maxScore,
            completedAt:
              p.completedAt,
          })
        ),
      });
    } catch (err) {
      console.log(
        "❌ Teacher progress error:",
        err
      );
      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch progress.",
      });
    }
  }
);


app.put(
  "/api/teacher/students/:id/toggle-block",
  async (req, res) => {
    if (!(await isTeacherAuthed(req))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message: "Database is not connected.",
      });
    }

    try {
      const teacher =
        await User.findById(
          req.user_id
        );

      if (!teacher) {
        return res.status(403).json({
          success: false,
          message: "Teacher not found.",
        });
      }

      const student =
        await User.findById(
          req.params.id
        );

      if (
        !student ||
        student.role !== "student"
      ) {
        return res.status(404).json({
          success: false,
          message: "Student not found.",
        });
      }

      /*
          Teacher can only manage students in
          their own school and class
      */
      if (
        !teacher.schoolId ||
        !student.schoolId ||
        String(student.schoolId) !==
          String(teacher.schoolId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only manage students from your own school.",
        });
      }

      if (
        teacher.class &&
        student.class &&
        teacher.class !==
          student.class
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only manage students in your class.",
        });
      }

      student.isBlocked =
        !student.isBlocked;
      student.isApproved =
        !student.isBlocked;

      await student.save();

      return res.json({
        success: true,
        message: student.isBlocked
          ? "Student blocked."
          : "Student approved.",
        student: {
          _id: student._id,
          fullName: student.fullName,
          email: student.email,
          isBlocked: student.isBlocked,
          isApproved: student.isApproved,
        },
      });
    } catch (err) {
      console.log(
        "❌ Teacher toggle student error:",
        err
      );
      return res.status(500).json({
        success: false,
        message: "Failed to update student.",
      });
    }
  }
);


app.put(
  "/api/teacher/students/:id",
  async (req, res) => {
    if (!(await isTeacherAuthed(req))) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is not connected.",
        });
      }

      const {
        fullName,
        email,
        mobile,
        isBlocked,
        isApproved,
      } = req.body;

      const student =
        await User.findById(
          req.params.id
        );

      if (
        !student ||
        student.role !== "student"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Student not found.",
        });
      }

       const teacher =
        await User.findById(
          req.user_id
        );

      if (
        !teacher ||
        (student.schoolId &&
          (!teacher.schoolId ||
            String(student.schoolId) !==
              String(teacher.schoolId)))
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only manage students in your school.",
        });
      }

       /* Class scope check — teacher can only manage
          students in their assigned class */
      if (
        teacher.class &&
        student.class &&
        teacher.class !== student.class
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only manage students in your class.",
        });
      }

      if (email && email !== student.email) {
        const existing =
          await User.findOne({ email });
        if (existing) {
          return res.status(409).json({
            success: false,
            message:
              "Email already in use.",
          });
        }
      }

      if (fullName) { student.fullName = fullName; }
      if (email) { student.email = email; }
      if (mobile !== undefined) { student.mobile = mobile; }
      if (typeof isBlocked === "boolean") {
        student.isBlocked = isBlocked;
        student.isApproved = !isBlocked;
      }
      if (typeof isApproved === "boolean") {
        student.isApproved = isApproved;
        if (isApproved) {
          student.isBlocked = false;
        }
      }

      await student.save();

      return res.json({
        success: true,
        message: "Student updated.",
        student: {
          _id: student._id,
          fullName: student.fullName,
          email: student.email,
          mobile: student.mobile,
          school: student.schoolId,
          class: student.class,
          role: student.role,
          isBlocked: student.isBlocked,
          isApproved: student.isApproved,
        },
      });
    } catch (err) {
      console.log(
        "❌ Teacher update student error:",
        err
      );
      return res.status(500).json({
        success: false,
        message:
          "Failed to update student.",
      });
    }
  }
);

app.delete(
  "/api/teacher/students/:id",
  async (req, res) => {
    if (!(await isTeacherAuthed(req))) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized.",
      });
    }

    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is not connected.",
        });
      }

      const student =
        await User.findById(
          req.params.id
        );

      if (
        !student ||
        student.role !== "student"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Student not found.",
        });
      }

      const teacher =
        await User.findById(
          req.user_id
        );

       if (
        !teacher ||
        (student.schoolId &&
          (!teacher.schoolId ||
            String(student.schoolId) !==
              String(teacher.schoolId)))
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only manage students in your school.",
        });
      }

      /* Class scope check — teacher can only manage
          students in their assigned class */
      if (
        teacher.class &&
        student.class &&
        teacher.class !== student.class
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only manage students in your class.",
        });
      }

      await student.deleteOne();

      return res.json({
        success: true,
        message:
          "Student removed.",
      });
    } catch (err) {
      console.log(
        "❌ Teacher delete student error:",
        err
      );
      return res.status(500).json({
        success: false,
        message:
          "Failed to delete student.",
      });
    }
  }
);

/* =========================================================
   START SERVER
========================================================= */

const PORT =
    process.env.PORT || 5000;

/* =========================================================
   GROQ MODEL TEST
========================================================= */

app.get("/api/test-groq", async (req, res) => {
  try {

    const model =
      await groq.models.retrieve(
        "openai/gpt-oss-120b"
      );

    return res.json({
      success: true,
      model: model.id,
      message: "Groq model is accessible."
    });

  } catch (error) {

    console.log(
      "❌ GROQ MODEL TEST ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Groq model test failed."
    });

  }
});


/* =========================================================
   CHECK AVAILABLE GROQ MODELS
========================================================= */

app.get("/api/groq-models", async (req, res) => {
  try {

    const models = await groq.models.list();

    const modelIds = models.data.map(
      (model) => model.id
    );

    return res.json({
      success: true,
      models: modelIds
    });

  } catch (error) {

    console.log(
      "❌ GROQ MODELS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to load Groq models."
    });

  }
});

/* =========================================================
   SYNC .env CREDENTIALS TO MONGODB
   Ensures teacher seed accounts exist with
   approved+allowed status so they can log in via
   /api/login immediately.
 ========================================================= */

async function syncSeedAccounts() {
  if (mongooseConnectPromise) {
    await mongooseConnectPromise.catch(() => {});
  }

  if (!isMongoConnected()) {
    console.log("⚠️  MongoDB not connected — skipping seed sync");
    return;
  }

  let seedSchool;

  try {
    seedSchool =
      await School.findOne({
        schoolId: "SEED_SCHOOL",
      });

    if (!seedSchool) {
      seedSchool =
        await School.create({
          schoolId: "SEED_SCHOOL",
          name: "Fluento Seed School",
          address: "",
          contactEmail: "",
          contactPhone: "",
          established: null,
        });
      console.log("🏫 Seed school created");
    }
  } catch (err) {
    console.log("❌ Seed school sync error:", err.message);
    return;
  }

  try {
    const existingTeacher =
      await User.findOne({
        email: TEACHER_EMAIL,
        role: "teacher",
      });

    if (existingTeacher) {
      existingTeacher.password =
        hashPassword(TEACHER_PASSWORD);
      existingTeacher.isBlocked = false;
      existingTeacher.isApproved = true;
      existingTeacher.schoolId =
        seedSchool.schoolId;
      await existingTeacher.save();
      console.log("🔑 Teacher synced:", TEACHER_EMAIL);
    } else {
      await User.create({
        fullName: "Teacher User",
        email: TEACHER_EMAIL,
        mobile: "",
        password: hashPassword(
          TEACHER_PASSWORD
        ),
        isBlocked: false,
        isApproved: true,
        role: "teacher",
        schoolId: seedSchool.schoolId,
      });
      console.log("🔑 Teacher created:", TEACHER_EMAIL);
    }
    } catch (err) {
      console.log("❌ Teacher sync error:", err.message);
    }

    /* -------- Seed default classes -------- */
    try {
      const defaultClasses =
        ["5", "6", "7", "8", "9", "10"];
      for (const className of defaultClasses) {
        await Class.findOneAndUpdate(
          {
            name: className,
            schoolId: null,
          },
          {
            name: className,
            schoolId: null,
          },
          { upsert: true, new: true }
        );
      }
      console.log("📚 Default classes seeded");
    } catch (err) {
      console.log("❌ Class seed error:", err.message);
    }
  }

/* =========================================================
   SUPER ADMIN API ROUTES
   Overview: global summary, list users across all
   collections, toggle globalStatus (active/inactive).
   All routes scoped via requireSuperAdmin middleware.
========================================================= */

app.get(
  "/api/superadmin/summary",
  requireSuperAdmin,
  async (req, res) => {
    try {
      const [
        schools,
        admins,
        teachers,
        students
      ] = await Promise.all([
        School.countDocuments(),
        User.countDocuments({
          role: "admin"
        }),
        User.countDocuments({
          role: "teacher"
        }),
        User.countDocuments({
          role: "student"
        })
      ]);

      res.json({
        success: true,
        schools,
        admins,
        teachers,
        students
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message:
          err.message
      });
    }
  }
);

app.get(
  "/api/superadmin/schools",
  requireSuperAdmin,
  async (req, res) => {
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        message:
          "Database is not connected.",
      });
    }

    try {
      const schools =
        await School
          .find({})
          .sort({
            createdAt: -1
          });
      res.json({
        success: true,
        schools: schools.map((s) => ({
          _id: s._id,
          schoolId: s.schoolId,
          name: s.name,
          address: s.address,
          contactEmail: s.contactEmail,
          contactPhone: s.contactPhone,
          established: s.established,
          globalStatus:
            s.globalStatus || "active",
          createdAt: s.createdAt,
        })),
      });
    } catch (err) {
      console.log(
        "❌ SuperAdmin list schools error:",
        err
      );
      res.status(500).json({
        success: false,
        message:
          err.message
      });
    }
  }
);

/* ---------- SCHOOL: CREATE (with Admin account) ---------- */

app.post(
  "/api/superadmin/schools",
  requireSuperAdmin,
  async (req, res) => {
    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is not connected.",
        });
      }

      const {
        schoolId,
        name,
        address,
        contactEmail,
        contactPhone,
        established,
        adminFullName,
        adminEmail,
        adminPassword,
        adminMobile,
      } = req.body;

      if (!schoolId || !name) {
        return res.status(400).json({
          success: false,
          message:
            "School ID and School Name are required.",
        });
      }

      if (
        !adminFullName ||
        !adminEmail ||
        !adminPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Admin Full Name, Email, and Password are required.",
        });
      }

      const existingSchoolId =
        await School.findOne({
          schoolId: schoolId
        });
      if (existingSchoolId) {
        return res.status(409).json({
          success: false,
          message:
            "A school with this School ID already exists.",
        });
      }

      const existingSchool =
        await School.findOne({ name });
      if (existingSchool) {
        return res.status(409).json({
          success: false,
          message:
            "A school with this name already exists.",
        });
      }

      const existingAdmin =
        await User.findOne({
          email: adminEmail,
        });
      if (existingAdmin) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this admin email already exists.",
        });
      }

      const school =
        await School.create({
          schoolId: schoolId,
          name,
          address: address || "",
          contactEmail: contactEmail || "",
          contactPhone: contactPhone || "",
          established: established
            ? new Date(established)
            : null,
        });

      const admin =
        await User.create({
          username:
            adminEmail,
          fullName: adminFullName,
          email: adminEmail,
          mobile: adminMobile || "",
          password: hashPassword(adminPassword),
          role: "admin",
          isBlocked: false,
          isApproved: true,
          globalStatus:
            "active",
          schoolId: school.schoolId,
        });

      return res.status(201).json({
        success: true,
        message:
          "School and admin account created.",
        school: {
          _id: school._id,
          schoolId: school.schoolId,
          name: school.name,
          address: school.address,
          contactEmail:
            school.contactEmail,
          contactPhone:
            school.contactPhone,
          established: school.established,
          globalStatus:
            school.globalStatus || "active",
          createdAt:
            school.createdAt,
        },
        admin: {
          _id: admin._id,
          fullName:
            admin.fullName,
          email: admin.email,
          mobile: admin.mobile,
          role: admin.role,
          school:
            school._id,
        },
      });
    } catch (err) {
      console.log(
        "❌ SuperAdmin create school error:",
        err
      );
      return res.status(500).json({
        success: false,
        message:
          err.message
      });
    }
  }
);

/* ---------- SCHOOL: UPDATE ---------- */

app.put(
  "/api/superadmin/schools/:id",
  requireSuperAdmin,
  async (req, res) => {
    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is not connected.",
        });
      }

      const {
        name,
        address,
        contactEmail,
        contactPhone,
        established,
      } = req.body;

      const school =
        await School.findById(req.params.id);

      if (!school) {
        return res.status(404).json({
          success: false,
          message:
            "School not found.",
        });
      }

      if (name !== undefined) {
        school.name = name;
      }
      if (address !== undefined) {
        school.address = address;
      }
      if (contactEmail !== undefined) {
        school.contactEmail = contactEmail;
      }
      if (contactPhone !== undefined) {
        school.contactPhone = contactPhone;
      }
      if (established !== undefined) {
        school.established = established
          ? new Date(established)
          : null;
      }

      await school.save();

      return res.json({
        success: true,
        message:
          "School updated.",
        school: {
          _id: school._id,
          schoolId: school.schoolId,
          name: school.name,
          address: school.address,
          contactEmail:
            school.contactEmail,
          contactPhone:
            school.contactPhone,
          established:
            school.established,
          globalStatus:
            school.globalStatus || "active",
          createdAt:
            school.createdAt,
        },
      });
    } catch (err) {
      console.log(
        "❌ SuperAdmin update school error:",
        err
      );
      return res.status(500).json({
        success: false,
        message:
          err.message
      });
    }
  }
);

/* ---------- SCHOOL: DELETE ---------- */

app.delete(
  "/api/superadmin/schools/:id",
  requireSuperAdmin,
  async (req, res) => {
    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is not connected.",
        });
      }

      const school =
        await School.findById(req.params.id);

      if (!school) {
        return res.status(404).json({
          success: false,
          message:
            "School not found.",
        });
      }

      await school.deleteOne();

      await User.updateMany(
        { school: school._id },
        {
          $set: {
            schoolId: null
          }
        }
      );

      return res.json({
        success: true,
        message:
          "School removed.",
      });
    } catch (err) {
      console.log(
        "❌ SuperAdmin delete school error:",
        err
      );
      return res.status(500).json({
        success: false,
        message:
          err.message
      });
    }
  }
);

app.get(
  "/api/superadmin/admins",
  requireSuperAdmin,
  async (req, res) => {
    try {
      const admins =
        await User.aggregate([
          {
            $match: {
              role: "admin",
            },
          },
          {
            $lookup: {
              from: "schools",
              localField: "schoolId",
              foreignField: "schoolId",
              as: "school",
            },
          },
          {
            $unwind: {
              path: "$school",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
        ]);
      res.json({
        success: true,
        admins: admins.map((a) => ({
          _id: a._id,
          fullName: a.fullName,
          email: a.email,
          mobile: a.mobile,
          role: a.role,
          isBlocked: a.isBlocked,
          isApproved: a.isApproved,
          globalStatus:
            a.globalStatus || "active",
          school: a.school
            ? {
                _id: a.school._id,
                name: a.school.name,
              }
            : null,
          createdAt: a.createdAt,
        })),
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message:
          err.message
      });
    }
  }
);

app.get(
  "/api/superadmin/teachers",
  requireSuperAdmin,
  async (req, res) => {
    try {
      const teachers =
        await User.aggregate([
          {
            $match: {
              role: "teacher",
            },
          },
          {
            $lookup: {
              from: "schools",
              localField: "schoolId",
              foreignField: "schoolId",
              as: "school",
            },
          },
          {
            $unwind: {
              path: "$school",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
        ]);
      res.json({
        success: true,
        teachers: teachers.map((t) => ({
          _id: t._id,
          fullName: t.fullName,
          email: t.email,
          mobile: t.mobile,
          role: t.role,
          isBlocked: t.isBlocked,
          isApproved: t.isApproved,
          globalStatus:
            t.globalStatus || "active",
          school: t.school
            ? {
                _id: t.school._id,
                name: t.school.name,
              }
            : null,
          createdAt: t.createdAt,
        })),
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message:
          err.message
      });
    }
  }
);

app.get(
  "/api/superadmin/students",
  requireSuperAdmin,
  async (req, res) => {
    try {
      if (!isMongoConnected()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is not connected.",
        });
      }

      const students =
        await User.aggregate([
          {
            $match: {
              role: "student",
            },
          },
          {
            $lookup: {
              from: "schools",
              localField: "schoolId",
              foreignField: "schoolId",
              as: "school",
            },
          },
          {
            $unwind: {
              path: "$school",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
        ]);

      res.json({
        success: true,
        students: students.map((s) => ({
          _id: s._id,
          username: s.username,
          fullName: s.fullName,
          email: s.email,
          mobile: s.mobile,
          role: s.role,
          isBlocked: s.isBlocked,
          isApproved: s.isApproved,
          globalStatus:
            s.globalStatus || "active",
          school: s.school
            ? {
                _id: s.school._id,
                name: s.school.name,
              }
            : null,
          createdAt: s.createdAt,
        })),
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message:
          err.message
      });
    }
  }
);

app.put(
  "/api/superadmin/:role/:id/toggle-status",
  requireSuperAdmin,
  async (req, res) => {
    const {
      role,
      id
    } = req.params;

    let Model;
    let responseKey;
    let isSchoolLevel = false;

    if (
      role ===
      "school"
    ) {
      Model =
        School;
      responseKey = "school";
      isSchoolLevel = true;
    } else if (
      role ===
      "admin"
    ) {
      Model =
        User;
      responseKey = "admin";
    } else if (
      role ===
      "teacher"
    ) {
      Model =
        User;
      responseKey = "teacher";
    } else if (
      role ===
      "student"
    ) {
      Model =
        User;
      responseKey = "student";
    } else {
      return res.status(400).json({
        success: false,
        message:
          "Invalid role."
      });
    }

    try {
      let query =
        { _id: id };

      if (
        role ===
        "teacher"
      ) {
        query.role =
          "teacher";
      } else if (
        role ===
        "student"
      ) {
        query.role =
          "student";
      }

      const doc =
        await Model.findOne(
          query
        );

      if (!doc) {
        return res.status(404).json({
          success: false,
          message:
            "User not found."
        });
      }

      doc.globalStatus =
        doc.globalStatus ===
        "active"
          ? "inactive"
          : "active";

      await doc.save();

      res.json({
        success: true,
        message:
          "Status updated.",
        [responseKey]: doc,
        globalStatus:
          doc.globalStatus
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message:
          err.message
      });
    }
  }
);

app.listen(
  PORT,
  async () => {
    await syncSeedAccounts();

    console.log(
      "================================="
    );

    console.log(
      `🚀 Server Running On Port ${PORT}`
    );

    console.log(
      "Final Challenge Total: 25 Marks"
    );

    console.log(
      "================================="
    );
  }
);
