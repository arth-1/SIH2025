'use server';
/**
 * @fileOverview Certificate data extraction and anomaly detection flow.
 *
 * - certificateDataExtractionAndAnomalyDetection - Extracts data from a certificate and detects anomalies.
 * - CertificateDataExtractionAndAnomalyDetectionInput - The input type for the certificateDataExtractionAndAnomalyDetection function.
 * - CertificateDataExtractionAndAnomalyDetectionOutput - The return type for the certificateDataExtractionAndAnomalyDetection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CertificateDataExtractionAndAnomalyDetectionInputSchema = z.object({
  certificateDataUri: z
    .string()
    .describe(
      "A certificate image or PDF, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type CertificateDataExtractionAndAnomalyDetectionInput = z.infer<typeof CertificateDataExtractionAndAnomalyDetectionInputSchema>;

const CertificateDataExtractionAndAnomalyDetectionOutputSchema = z.object({
  extractedData: z.object({
    name: z.string().describe('The name of the certificate holder.'),
    rollNumber: z.string().describe('The roll number of the certificate holder.'),
    marks: z.string().describe('The marks obtained by the certificate holder.'),
    certificateId: z.string().describe('The unique certificate ID.'),
    institution: z.string().describe('The issuing institution.'),
  }).describe('Extracted data from the certificate.'),
  anomalies: z.array(z.string()).describe('A list of anomalies detected in the certificate.'),
});
export type CertificateDataExtractionAndAnomalyDetectionOutput = z.infer<typeof CertificateDataExtractionAndAnomalyDetectionOutputSchema>;

export async function certificateDataExtractionAndAnomalyDetection(input: CertificateDataExtractionAndAnomalyDetectionInput): Promise<CertificateDataExtractionAndAnomalyDetectionOutput> {
  return certificateDataExtractionAndAnomalyDetectionFlow(input);
}

const certificateDataExtractionAndAnomalyDetectionPrompt = ai.definePrompt({
  name: 'certificateDataExtractionAndAnomalyDetectionPrompt',
  input: {schema: CertificateDataExtractionAndAnomalyDetectionInputSchema},
  output: {schema: CertificateDataExtractionAndAnomalyDetectionOutputSchema},
  prompt: `You are an expert in document analysis and fraud detection. Your task is to extract key information from a certificate and identify any potential anomalies that may indicate forgery or manipulation.

  Analyze the provided certificate data and extract the following fields:
  - Name
  - Roll Number
  - Marks
  - Certificate ID
  - Institution

  After extracting the data, analyze the certificate for anomalies such as:
  - Tampered grades or photos
  - Forged seals or signatures
  - Inconsistent formatting
  - Invalid certificate numbers
  - Duplicate or cloned documents

  Provide the extracted data and a list of any detected anomalies.

  Certificate Data: {{media url=certificateDataUri}}
`,
});

const certificateDataExtractionAndAnomalyDetectionFlow = ai.defineFlow(
  {
    name: 'certificateDataExtractionAndAnomalyDetectionFlow',
    inputSchema: CertificateDataExtractionAndAnomalyDetectionInputSchema,
    outputSchema: CertificateDataExtractionAndAnomalyDetectionOutputSchema,
  },
  async input => {
    const {output} = await certificateDataExtractionAndAnomalyDetectionPrompt(input);
    return output!;
  }
);
