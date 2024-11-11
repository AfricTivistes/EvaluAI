import type { Express } from "express";
import { 
  getAllQuestions,
  getQuestionById,
  getAnswersByQuestionId,
  getAnswerById,
  getNotesByAnswerId,
  createNote,
  linkNoteToAnswer
} from "../shared/nocodb";

export function registerRoutes(app: Express) {
  // Add cache control middleware for GET requests
  app.use((req, res, next) => {
    if (req.method === 'GET') {
      res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    }
    next();
  });

  // Get all questions
  app.get("/api/questions", async (req, res) => {
    try {
      console.log("Fetching all questions from NocoDB...");
      const allQuestions = await getAllQuestions();
      console.log(`Successfully fetched ${allQuestions.length} questions`);
      res.json(allQuestions);
    } catch (error: any) {
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      res.status(500).json({ 
        error: "Failed to fetch questions",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Get question by id with answers
  app.get("/api/questions/:id", async (req, res) => {
    try {
      console.log(`Fetching question ${req.params.id} details...`);
      const question = await getQuestionById(req.params.id);
      if (!question) {
        console.log(`Question ${req.params.id} not found`);
        return res.status(404).json({ error: "Question not found" });
      }

      console.log(`Fetching answers for question ${req.params.id}...`);
      const answers = await getAnswersByQuestionId(req.params.id);
      console.log(`Found ${answers.length} answers`);

      const responseData = {
        question,
        answers: answers.map(answer => ({
          Id: answer.Id,
          Réponse: answer.Réponse,
          Source: answer.Source,
          Questions: answer.Questions,
          CreatedAt: answer.CreatedAt,
          UpdatedAt: answer.UpdatedAt
        }))
      };
      res.json(responseData);
    } catch (error: any) {
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      res.status(error.response?.status || 500).json({ 
        error: "Failed to fetch question details",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Get answer by id with notes and average rating
  app.get("/api/answers/:id", async (req, res) => {
    try {
      console.log(`Fetching answer ${req.params.id} details...`);
      const answer = await getAnswerById(req.params.id);
      if (!answer) {
        console.log(`Answer ${req.params.id} not found`);
        return res.status(404).json({ error: "Answer not found" });
      }

      console.log(`Fetching notes for answer ${req.params.id}...`);
      const notes = await getNotesByAnswerId(req.params.id);
      console.log(`Found ${notes.length} notes for answer ${req.params.id}`);
      
      const averageRating = notes.length > 0
        ? Number((notes.reduce((acc: number, note: any) => acc + note.Note, 0) / notes.length).toFixed(1))
        : null;

      const responseData = {
        answer: {
          Id: answer.Id,
          Réponse: answer.Réponse,
          Source: answer.Source,
          Questions: answer.Questions,
          CreatedAt: answer.CreatedAt,
          UpdatedAt: answer.UpdatedAt
        },
        notes: notes.map(note => ({
          Id: note.Id,
          Note: note.Note,
          Commentaire: note.Commentaire,
          Évaluateur: note.Évaluateur,
          CreatedAt: note.CreatedAt,
          UpdatedAt: note.UpdatedAt
        })),
        averageRating,
        totalRatings: notes.length
      };
      res.json(responseData);
    } catch (error: any) {
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      res.status(error.response?.status || 500).json({ 
        error: "Failed to fetch answer details",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Add a new note
  app.post("/api/notes", async (req, res) => {
    try {
      console.log("Creating new note with data:", req.body);
      const { note, commentaire, reponseId, evaluateur } = req.body;
      
      if (!note || !reponseId || !evaluateur) {
        return res.status(400).json({ 
          error: "Missing required fields",
          details: "Note, reponseId, and evaluateur are required"
        });
      }

      // First create the note
      const newNote = await createNote({
        note: Number(note),
        commentaire,
        evaluateur
      });

      // Then create the link to the answer
      if (newNote?.Id) {
        await linkNoteToAnswer(newNote.Id, Number(reponseId));
      }
      
      console.log("Note created and linked successfully:", newNote);
      res.status(201).json(newNote);
    } catch (error: any) {
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      res.status(error.response?.status || 500).json({ 
        error: "Failed to add note",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
}
