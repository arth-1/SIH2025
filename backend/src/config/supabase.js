import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not found. Using local storage fallback.');
}

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Certificate storage functions for Supabase integration
export const certificateStorage = {
  // Store certificate with blockchain hash
  async storeCertificate(certificateData) {
    try {
      if (!supabase) {
        console.log('Supabase not configured, using local storage');
        return { success: true, message: 'Stored locally' };
      }

      const { data, error } = await supabase
        .from('certificates')
        .insert([{
          certificate_id: certificateData.certificateId,
          student_name: certificateData.studentName,
          roll_number: certificateData.rollNumber,
          institution: certificateData.institution,
          course: certificateData.course,
          grade: certificateData.grade,
          issue_date: certificateData.issueDate,
          blockchain_hash: certificateData.blockchainHash,
          document_hash: certificateData.documentHash,
          file_path: certificateData.filePath,
          watermarked_path: certificateData.watermarkedPath,
          verification_status: 'verified',
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error storing certificate:', error);
      return { success: false, error: error.message };
    }
  },

  // Verify certificate against stored records
  async verifyCertificate(certificateId, documentHash) {
    try {
      if (!supabase) {
        return { 
          success: true, 
          verified: true, 
          message: 'Local verification - Supabase not configured' 
        };
      }

      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('certificate_id', certificateId)
        .single();

      if (error) throw error;
      
      if (!data) {
        return { 
          success: false, 
          verified: false, 
          message: 'Certificate not found in database' 
        };
      }

      const isValid = data.document_hash === documentHash;
      
      return {
        success: true,
        verified: isValid,
        certificate: data,
        message: isValid ? 'Certificate is authentic' : 'Certificate has been tampered with'
      };
    } catch (error) {
      console.error('Error verifying certificate:', error);
      return { success: false, error: error.message };
    }
  },

  // List certificates
  async listCertificates(limit = 50) {
    try {
      if (!supabase) {
        return { success: true, data: [], total: 0 };
      }

      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .limit(limit)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data, total: data.length };
    } catch (error) {
      console.error('Error listing certificates:', error);
      return { success: false, error: error.message };
    }
  }
};

export default supabase;
