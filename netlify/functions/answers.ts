import type { Handler } from '@netlify/functions'
import { getAnswerById, getNotesByAnswerId } from '../../shared/nocodb'

export const handler: Handler = async (event) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  }

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    }
  }

  try {
    const answerId = event.path.split('/').pop()
    if (!answerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Answer ID is required' })
      }
    }

    console.log(`Fetching answer ${answerId} details...`)
    const answer = await getAnswerById(answerId)
    
    if (!answer) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Answer not found" })
      }
    }

    console.log(`Fetching notes for answer ${answerId}...`)
    const notes = await getNotesByAnswerId(answerId)
    console.log(`Found ${notes.length} notes for answer ${answerId}`)
    
    const averageRating = notes.length > 0
      ? Number((notes.reduce((acc: number, note: any) => acc + note.Note, 0) / notes.length).toFixed(1))
      : null

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
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData)
    }

  } catch (error: any) {
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    })

    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        error: "Failed to fetch answer details",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
}
