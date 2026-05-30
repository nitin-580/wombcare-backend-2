import { Request, Response } from 'express';

const SYSTEM_PROMPT = `
You are WombCare AI, a warm and empathetic women's health assistant for WombCare (wombcare.in) - India's most trusted digital PCOD care platform.

ABOUT WOMBCARE:
Help users with PCOD, periods, hormones, fertility, pregnancy, and wellness.
Keep answers short, caring, and simple.
Always suggest consulting a doctor for medical decisions.

WOMBCARE PLANS - Recommend naturally based on user situation:

1. Basic Plan - Rs. 999/month
   - Personalized diet suggestions
   - Basic period tracker
   - Weekly wellness tips
   - Email support
   - For: Beginners, mild symptoms

2. Premium Plan - Rs. 2999/3 months (MOST POPULAR)
   - Custom PCOD lifestyle plan
   - Nutrition + yoga guidance
   - Hormonal health tracking
   - 1-on-1 coach consultation
   - Priority support + webinars
   - For: PCOD reversal, moderate-severe symptoms

3. Conceive Plan - Rs. 4999/3 months
   - Fertility-focused nutrition plan
   - Ovulation & cycle tracking
   - Hormone wellness support
   - Dedicated expert consultation
   - For: Women trying to conceive

WHEN TO RECOMMEND:
- Irregular periods, weight gain, acne, fatigue → Premium Plan
- Trying to conceive, fertility issues → Conceive Plan
- Just starting, mild symptoms → Basic Plan
- End recommendation with: "Yahan se join karo: https://wombcare.in/join-wombcare"

Contact: support@wombcare.in | +91 90319 09188
`;

// Elegant Hinglish/English context matching rules for robust fallback responses
const FALLBACK_RESPONSES_HINDI = [
  {
    keywords: ["hello", "hi", "hey", "namaste", "pranam"],
    response: "Namaste! Main WombCare AI hoon, aapki apni PCOD aur period wellness helper. Aaj aap kaisa feel kar rahi hain? Main aapko periods, PCOS diet, stress, aur ovulation ke baare mein bata sakti hoon. 🌸"
  },
  {
    keywords: ["weight", "gain", "motapa", "fat", "lose"],
    response: "PCOD mein weight manage karna thoda challenging ho sakta hai par sahi diet, low-glycemic index food, aur regular yoga se yeh bilkul control ho sakta hai. WombCare ke **Premium Plan** (Rs. 2999/3 months) mein hum aapko personalized expert nutrition guidance aur dedicated coach dete hain taaki hormonal imbalance thik ho sake. Aap join kar sakti hain yahan se: https://wombcare.in/join-wombcare. Ek baar doctor se bhi consult zaroor karein! 🥗"
  },
  {
    keywords: ["irregular", "period", "cycle", "late", "delay", "gap", "missed"],
    response: "Irregular ya delayed periods hormonal imbalance ka common sign hain. Sahi sleeping routine, refined sugar kam karna, aur seed cycling se hormonal health behtar hoti hai. Iske liye humara **Premium Plan** best hai jo 1-on-1 coach consulting aur webinars deta hai. Join here: https://wombcare.in/join-wombcare. Agar critical issue ho to gynecologist se checkup karana na bhulein. 🌸"
  },
  {
    keywords: ["pregnant", "baby", "conceive", "pregnancy", "fertility"],
    response: "Agar aap conceive karne ki koshish kar rahi hain to ovulation days track karna aur dynamic hormone level maintain rakhna bahut zaroori hai. Hamara **Conceive Plan** (Rs. 4999/3 months) ovulation & cycle tracking aur specialist guidance ke sath fertile window improve karne mein help karta hai. Yahan se join karein: https://wombcare.in/join-wombcare 👶"
  },
  {
    keywords: ["diet", "food", "eat", "pcos diet", "recipe", "khana"],
    response: "PCOD and PCOS mein anti-inflammatory food, green vegetables, nuts, aur fiber-rich meals help karte hain. Sugar aur processed food bilkul skip karein. Humare **Basic Plan** (Rs. 999/month) mein hum regular diet plans aur wellness tips provide karte hain. Yahan se start karein: https://wombcare.in/join-wombcare 🥦"
  },
  {
    keywords: ["plan", "price", "join", "cost", "wombcare", "membership"],
    response: "Hamare paas 3 custom plans hain:\n1. **Basic Plan** (Rs. 999/month) - Diet aur tracker suggestions ke liye.\n2. **Premium Plan** (Rs. 2999/3 months) - PCOD lifestyle reversal aur yoga + coach consultation.\n3. **Conceive Plan** (Rs. 4999/3 months) - Fertility aur ovulation tracking ke liye.\nYahan se join karein: https://wombcare.in/join-wombcare. Koi doubt ho to write us at support@wombcare.in! ✨"
  }
];

const FALLBACK_RESPONSES_ENGLISH = [
  {
    keywords: ["hello", "hi", "hey", "namaste", "morning"],
    response: "Hello! I am WombCare AI, your dedicated companion for PCOS, PCOD, and hormonal wellness. How can I help you today? Ask me anything about diet, weight management, or periods! 🌸"
  },
  {
    keywords: ["weight", "gain", "fat", "lose", "exercise", "workouts"],
    response: "Weight gain in PCOS is usually driven by insulin resistance. Adopting a high-protein, low-sugar diet and engaged daily workouts makes a big difference. I highly recommend our **Premium Plan** (Rs. 2999/3 months) which provides custom nutrition, yoga guidance, and a 1-on-1 coach. Join here: https://wombcare.in/join-wombcare 🥗"
  },
  {
    keywords: ["irregular", "period", "cycle", "late", "delay"],
    response: "Irregular cycles can stem from hormonal imbalances. Focus on sleeping 7-8 hours, managing stress, and eating complex carbs. Our **Premium Plan** offers customized lifestyle plans to reverse PCOD symptoms. Join here: https://wombcare.in/join-wombcare 🌸"
  },
  {
    keywords: ["pregnant", "baby", "conceive", "pregnancy"],
    response: "Trying to conceive with PCOS requires ovulation tracking and dedicated hormonal support. Our fertility-focused **Conceive Plan** (Rs. 4999/3 months) includes ovulation tracking and direct expert consultation. Sign up today: https://wombcare.in/join-wombcare 👶"
  },
  {
    keywords: ["diet", "food", "eat", "pcos diet"],
    response: "A nourishing PCOS diet should include whole grains, seeds, fatty fish, and plenty of green vegetables. Avoid high glycemic processed foods. Start with our **Basic Plan** (Rs. 999/month) for regular diet insights. Sign up here: https://wombcare.in/join-wombcare 🥦"
  },
  {
    keywords: ["plan", "price", "join", "cost", "wombcare", "membership"],
    response: "We offer three customized plans:\n1. **Basic Plan** (Rs. 999/month) - Diet recommendations & basic tracker.\n2. **Premium Plan** (Rs. 2999/3 months) - Custom lifestyle reversal + 1-on-1 coach + yoga.\n3. **Conceive Plan** (Rs. 4999/3 months) - Fertility nutrition + expert ovulation support.\nJoin now: https://wombcare.in/join-wombcare ✨"
  }
];

export async function askWombCareAI(req: Request, res: Response) {
  try {
    const { messages, language } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Messages array is required."
      });
    }

    const lastMessage = messages[messages.length - 1]?.content || "";
    const isHindi = language === "hindi" || language === "hinglish";
    const apiKey = process.env.GROQ_API_KEY;

    // 1. If Groq Key is available, attempt to query the Groq API
    if (apiKey && apiKey.startsWith("gsk_")) {
      try {
        const langInstruction = isHindi
          ? "Respond only in Hindi/Hinglish (Hindi written in English alphabet)."
          : "Respond only in English.";

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: SYSTEM_PROMPT + "\n" + langInstruction
              },
              ...messages
            ],
            temperature: 0.7,
            max_tokens: 500
          })
        });

        if (response.ok) {
          const data = await response.json();
          const message = data?.choices?.[0]?.message?.content;
          if (message) {
            return res.status(200).json({
              success: true,
              message
            });
          }
        }
      } catch (err) {
        console.error("Groq query failed, using empathetic fallback:", err);
      }
    }

    // 2. High-fidelity Empathetic Fallback Engine (no API key required)
    const textLower = lastMessage.toLowerCase();
    const responsesPool = isHindi ? FALLBACK_RESPONSES_HINDI : FALLBACK_RESPONSES_ENGLISH;
    
    // Find matching keyword response
    let matchedResponse = "";
    for (const entry of responsesPool) {
      if (entry.keywords.some((k) => textLower.includes(k))) {
        matchedResponse = entry.response;
        break;
      }
    }

    // Default general response if no keywords matched
    if (!matchedResponse) {
      matchedResponse = isHindi
        ? "WombCare AI aapki baat samajh rahi hai. PCOD hormonal imbalance aur lifestyle badalne se thik ho sakta hai. Hamara **Premium Plan** (Rs. 2999/3 months) iske reversal ke liye best hai. Join here: https://wombcare.in/join-wombcare. Sahi guidance ke liye doctor se consult zaroor karein! 🌸"
        : "I completely understand your concern. PCOS and hormonal imbalance can be managed effectively through disciplined nutrition, stress management, and low-glycemic diets. Our **Premium Plan** (Rs. 2999/3 months) is ideal for PCOD reversal. Join here: https://wombcare.in/join-wombcare. Always consult a gynecologist for major medical decisions! 🌸";
    }

    // Add a tiny artificial delay to simulate realistic AI response generation
    setTimeout(() => {
      return res.status(200).json({
        success: true,
        message: matchedResponse
      });
    }, 800);

  } catch (error: any) {
    console.error("AI controller error:", error);
    return res.status(500).json({
      success: false,
      message: "⚠️ Server error. Dobara try karo."
    });
  }
}

const INSIGHTS_SYSTEM_PROMPT = `
You are WombCare AI, an expert women's health endocrinologist and PCOD wellness coach.
Based on the user's recent wellness metrics, generate exactly 2 highly customized, caring, and practical daily wellness insights.

For each insight, provide:
1. A concise, engaging title with an emoji (e.g., "Hydration Boost 💧", "Circadian Rest 🛌").
2. A single, caring, and practical tip (under 25 words) that explains what they should do next and how it helps their hormonal balance or PCOD symptoms.

Format the output strictly as a JSON object containing an array of exactly 2 items:
{
  "insights": [
    { "title": "Insight Title 1", "text": "Insight content 1" },
    { "title": "Insight Title 2", "text": "Insight content 2" }
  ]
}
Do not write any other introductory or concluding text. Output only valid JSON.
`;

export async function generateAIInsights(req: Request, res: Response) {
  try {
    const { userProfile } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    // Resolve sleep hours
    let sleepHours = userProfile?.sleep || 0;
    if (!sleepHours) {
      const symptoms = Array.isArray(userProfile?.symptoms) ? userProfile.symptoms : [];
      const sleepSymptom = symptoms.find(
        (s: any) => typeof s === "string" && s.startsWith("Sleep:")
      );
      if (sleepSymptom) {
        const parsed = parseInt(sleepSymptom.replace("Sleep:", "").trim(), 10);
        if (!isNaN(parsed)) sleepHours = parsed;
      }
    }

    const water = userProfile?.waterIntake || 0;
    const targetWater = userProfile?.targetWater || 8;
    const mood = userProfile?.mood || "neutral";

    // 1. If Groq API Key is available, fetch insights from Groq
    if (apiKey && apiKey.startsWith("gsk_")) {
      try {
        const prompt = `Based on these real-time metrics:
- Water: ${water}/${targetWater} glasses
- Sleep: ${sleepHours} hours
- Mood: ${mood}
- Symptoms: ${Array.isArray(userProfile?.symptoms) ? userProfile.symptoms.join(', ') : "None"}

Generate exactly 2 personalized hormonal insights in strict JSON format.`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: INSIGHTS_SYSTEM_PROMPT
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.5,
            response_format: { type: "json_object" }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const jsonText = data?.choices?.[0]?.message?.content;
          if (jsonText) {
            const parsed = JSON.parse(jsonText);
            if (Array.isArray(parsed?.insights) && parsed.insights.length >= 2) {
              return res.status(200).json({
                success: true,
                insights: parsed.insights.slice(0, 2)
              });
            }
          }
        }
      } catch (err) {
        console.error("Groq insights request failed, using rules engine:", err);
      }
    }

    // 2. Ultra-stable Rules-based Fallback Generator
    const fallbackInsights = [];
    
    // Water Intake
    if (water === 0) {
      fallbackInsights.push({
        title: "Hydration Reminder 💧",
        text: "You haven't logged water today. Aim for at least 8 glasses (2L) to support ovarian metabolic processes and clear skin!",
      });
    } else if (water < targetWater * 0.5) {
      fallbackInsights.push({
        title: "Hydration Focus 💧",
        text: `You logged ${water} glasses of water. Sip ${targetWater - water} more glasses today to optimize your hormonal metabolism.`,
      });
    } else {
      fallbackInsights.push({
        title: "Hydration Superstar! 🌟",
        text: `Spectacular work! You hit your water goal of ${water} glasses, boosting lymphatic flow and insulin responsiveness.`,
      });
    }

    // Sleep
    if (sleepHours === 0) {
      fallbackInsights.push({
        title: "Circadian Rest Insight 🛌",
        text: "Consistent deep sleep is vital for endocrine healing. Log your sleep hours to unlock personal circadian recommendations.",
      });
    } else if (sleepHours < 7) {
      fallbackInsights.push({
        title: "Sleep Optimization 😴",
        text: `Logged ${sleepHours} hours. Aim for 7.5+ hours tonight. Low sleep triggers cortisol, which directly inhibits progesterone peaks.`,
      });
    } else {
      fallbackInsights.push({
        title: "Ideal Sleep Pattern 🛌",
        text: `Brilliant! ${sleepHours} hours of sleep is perfect. Your endocrine system had adequate time to balance thyroid and stress response.`,
      });
    }

    return res.status(200).json({
      success: true,
      insights: fallbackInsights.slice(0, 2)
    });

  } catch (error: any) {
    console.error("Generate insights error:", error);
    return res.status(500).json({
      success: false,
      message: "⚠️ Error generating insights."
    });
  }
}

