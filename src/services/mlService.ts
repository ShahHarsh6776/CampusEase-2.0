import { supabase } from '@/supabase/supabaseClient';

const ML_SERVICE_URL = 'http://localhost:5000';

export interface MLPrediction {
  priority_level: number;
  priority_text: string;
}

export const mlService = {
  // Health check
  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${ML_SERVICE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('ML service health check failed:', error);
      return false;
    }
  },

  // Train model
  trainModel: async (useSynthetic: boolean = false): Promise<boolean> => {
    try {
      const response = await fetch(`${ML_SERVICE_URL}/train?synthetic=${useSynthetic}`, {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Model training failed:', error);
      return false;
    }
  },

  // Update priorities
  updatePriorities: async (): Promise<number> => {
    try {
      const response = await fetch(`${ML_SERVICE_URL}/update_priorities`, {
        method: 'POST',
      });
      const data = await response.json();
      return data.message ? parseInt(data.message.split(' ')[1]) : 0;
    } catch (error) {
      console.error('Priority update failed:', error);
      return 0;
    }
  },

  // Predict priority for a report
  predictPriority: async (report: any): Promise<MLPrediction> => {
    try {
      const response = await fetch(`${ML_SERVICE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });
      
      if (!response.ok) {
        throw new Error('Prediction service unavailable');
      }
      
      const data = await response.json();
      return {
        priority_level: data.priority_level,
        priority_text: data.priority_text,
      };
    } catch (error) {
      console.error('Priority prediction failed:', error);
      return {
        priority_level: 1,
        priority_text: 'Medium',
      };
    }
  },
};