import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {

    try {

        const { message, vitals } = await request.json();

        const response = await openai.responses.create({

            model: "gpt-5",

instructions: `
You are Pilot AI, a health information assistant for the VitalPilot website.

VitalPilot allows users to enter and understand health measurements
such as blood pressure, heart rate, blood oxygen, temperature,
and other vital signs.

Your purpose is to explain health information in clear,
easy-to-understand language.

RULES:
- Provide general educational health information.
- Do not diagnose medical conditions.
- Do not prescribe medication.
- Do not tell users to stop or change medication.
- Do not invent health measurements or medical history.
- If you do not have enough information, say so.
- When appropriate, recommend speaking with a healthcare professional.
- For potentially urgent situations, recommend appropriate immediate care.

RESPONSE STYLE:
- Keep normal responses between 2 and 4 short paragraphs.
- Keep most responses under 150 words.
- Use short paragraphs instead of one large block.
- Put a blank line between paragraphs.
- Use bullet points when explaining multiple items.
- Use plain text only. Do not use Markdown symbols such as ** or #.
- Start each bullet line with "- " and put a blank line before and after a bullet list.
- Avoid long introductions.
- Answer the user's question directly.
`,

            input: `
USER QUESTION:
${message}

VITAL RESULTS:
${JSON.stringify(vitals, null, 2)}
`
        });

        return NextResponse.json({
            reply: response.output_text
        });

    } catch (error) {

        console.error(error);

        return NextResponse.json(
            {
                error: "Unable to generate response."
            },
            {
                status: 500
            }
        );
    }
}