import type { Handler } from '@netlify/functions'
import { createNote, linkNoteToAnswer } from '../../server/lib/nocodb'

export const handler: Handler = async (event) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { note, commentaire, reponseId, evaluateur } = body

    if (!note || !reponseId || !evaluateur) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing required fields",
          details: "Note, reponseId, and evaluateur are required"
        })
      }
    }

    // First create the note
    const newNote = await createNote({
      note: Number(note),
      commentaire,
      evaluateur
    })

    // Then create the link to the answer
    if (newNote?.Id) {
      await linkNoteToAnswer(newNote.Id, Number(reponseId))
    }

    console.log("Note created and linked successfully:", newNote)
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(newNote)
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
        error: "Failed to add note",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
}
