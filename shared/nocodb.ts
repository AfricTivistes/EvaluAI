import 'dotenv/config'
import axios from 'axios';

const NOCODB_API_URL = 'https://app.nocodb.com';
const NOCODB_API_TOKEN = process.env.NOCODB_API_TOKEN;

// Create an axios instance with base configuration
const nocoClient = axios.create({
  baseURL: NOCODB_API_URL,
  headers: {
    'xc-token': NOCODB_API_TOKEN,
    'Content-Type': 'application/json',
  },
});

// Table IDs from the requirements
const TABLES = {
  QUESTIONS: 'mzdc8bknj6g79te',
  ANSWERS: 'mrqo2spahccml0l',
  NOTES: 'm414xsine0wgjc6',
};

export async function getAllQuestions() {
  try {
    console.log('Fetching all questions...');
    const response = await nocoClient.get(`/api/v2/tables/${TABLES.QUESTIONS}/records`);
    if (!response.data?.list) {
      throw new Error('Failed to fetch questions list');
    }
    return response.data.list;
  } catch (error: any) {
    console.error('Error fetching questions:', error.response?.data || error.message);
    throw error;
  }
}

export async function getQuestionById(id: string | number) {
  try {
    console.log(`Fetching question ${id}...`);
    const response = await nocoClient.get(`/api/v2/tables/${TABLES.QUESTIONS}/records/${id}`);
    if (!response.data) {
      throw new Error('Question not found');
    }
    return response.data;
  } catch (error: any) {
    console.error('Error fetching question:', error.response?.data || error.message);
    throw error;
  }
}

export async function getAnswersByQuestionId(questionId: string | number) {
  try {
    console.log(`Fetching answers for question ${questionId} using linked records API...`);
    
    // Use the provided linkFieldId for the Réponses relationship
    const response = await nocoClient.get(
      `/api/v2/tables/${TABLES.QUESTIONS}/links/c1s63syhm6ssx8z/records/${questionId}`,
      {
        params: {
          fields: 'Id,Réponse,Source,Questions,CreatedAt,UpdatedAt'
        }
      }
    );
    
    console.log(`Found ${response.data.list?.length || 0} linked answers`);
    return response.data.list || [];
  } catch (error: any) {
    console.error('Error fetching linked answers:', error.response?.data || error.message);
    throw error;
  }
}

export async function getAnswerById(id: string | number) {
  try {
    console.log(`Fetching answer ${id}...`);
    const response = await nocoClient.get(`/api/v2/tables/${TABLES.ANSWERS}/records/${id}`);
    if (!response.data) {
      throw new Error('Answer not found');
    }
    return response.data;
  } catch (error: any) {
    console.error('Error fetching answer:', error.response?.data || error.message);
    throw error;
  }
}

export async function getNotesByAnswerId(answerId: string | number) {
  try {
    console.log(`Fetching notes for answer ${answerId} using linked records API...`);
    const response = await nocoClient.get(
      `/api/v2/tables/${TABLES.ANSWERS}/links/cukzv7nq6bnar47/records/${answerId}`,
      {
        params: {
          fields: 'Id,Note,Commentaire,Réponses,Évaluateur,CreatedAt,UpdatedAt'
        }
      }
    );
    
    console.log(`Found ${response.data.list?.length || 0} linked notes`);
    return response.data.list || [];
  } catch (error: any) {
    console.error('Error fetching linked notes:', error.response?.data || error.message);
    throw error;
  }
}

export async function createNote(note: {
  note: number;
  commentaire?: string;
  evaluateur: string;
}) {
  try {
    console.log('Creating note with data:', {
      note: note.note,
      commentaire: note.commentaire,
      evaluateur: note.evaluateur
    });
    
    // Step 1: Create the note without any link field
    const noteResponse = await nocoClient.post(
      `/api/v2/tables/${TABLES.NOTES}/records`,
      {
        Note: note.note,
        Commentaire: note.commentaire,
        Évaluateur: note.evaluateur
      }
    );

    console.log('Note created successfully:', noteResponse.data);
    return noteResponse.data;
  } catch (error: any) {
    console.error('Error creating note:', {
      message: error.message,
      response: error.response?.data,
      body: error.response?.config?.data
    });
    throw error;
  }
}

export async function linkNoteToAnswer(noteId: number, answerId: number) {
  try {
    console.log('Creating link between note and answer...');
    const linkResponse = await nocoClient.post(
      `/api/v2/tables/${TABLES.NOTES}/links/cebdpdrx1tngx6u/records/${noteId}`,
      {
        Id: answerId
      }
    );
    console.log('Link created successfully:', linkResponse.data);
    return linkResponse.data;
  } catch (error: any) {
    console.error('Error creating link:', {
      message: error.message,
      response: error.response?.data,
      body: error.response?.config?.data
    });
    throw error;
  }
}
