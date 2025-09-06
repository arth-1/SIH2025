'use server';
/**
 * @fileOverview AI-Powered Forgery Detection flow.
 *
 * This flow uses an AI model to identify potential forgeries in uploaded certificates by analyzing features like font consistency, seal integrity, and signature authenticity.
 *
 * @param {ForgeryDetectionInput} input - The input data for forgery detection, including the certificate image as a data URI.
 * @returns {Promise<ForgeryDetectionOutput>} - A promise resolving to the forgery detection result.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ForgeryDetectionInputSchema = z.object({
  certificateDataUri: z
    .string()
    .describe(
      "A certificate image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ForgeryDetectionInput = z.infer<typeof ForgeryDetectionInputSchema>;

const ForgeryDetectionOutputSchema = z.object({
  isForged: z
    .boolean()
    .describe(
      'Whether the certificate is likely forged based on AI analysis.'
    ),
  confidenceScore: z
    .number()
    .describe(
      'A score between 0 and 1 indicating the confidence level of the forgery detection, with 1 being the most confident.'
    ),
  explanation: z
    .string()
    .describe(
      'A detailed explanation of why the certificate is considered forged, including specific observations about font consistency, seal integrity, and signature authenticity.'
    ),
});
export type ForgeryDetectionOutput = z.infer<typeof ForgeryDetectionOutputSchema>;

export async function aiPoweredForgeryDetection(
  input: ForgeryDetectionInput
): Promise<ForgeryDetectionOutput> {
  return aiPoweredForgeryDetectionFlow(input);
}

const forgeryDetectionPrompt = ai.definePrompt({
  name: 'forgeryDetectionPrompt',
  input: {schema: ForgeryDetectionInputSchema},
  output: {schema: ForgeryDetectionOutputSchema},
  prompt: `You are an AI-powered forgery detection system specializing in analyzing certificate images for signs of tampering and inconsistencies.

You will receive a certificate image as input and analyze it for the following:
- Font consistency: Check if the fonts used throughout the document are consistent and match the expected fonts for the issuing institution.
- Seal integrity: Examine the seals for authenticity, looking for signs of manipulation, blurring, or inconsistencies.
- Signature authenticity: Analyze the signatures for signs of forgery, such as unnatural strokes, inconsistencies with known signatures, or unusual pressure patterns.

Based on your analysis, determine whether the certificate is likely forged and provide a confidence score between 0 and 1.

Image: {{media url=certificateDataUri}}

Respond in JSON format. Here is the schema of the JSON:
${ForgeryDetectionOutputSchema.description}`,
});

const aiPoweredForgeryDetectionFlow = ai.defineFlow(
  {
    name: 'aiPoweredForgeryDetectionFlow',
    inputSchema: ForgeryDetectionInputSchema,
    outputSchema: ForgeryDetectionOutputSchema,
  },
  async input => {
    const {output} = await forgeryDetectionPrompt(input);
    return output!;
  }
);
