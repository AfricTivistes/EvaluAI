import type { Handler } from '@netlify/functions'
import { getAllQuestions, getQuestionById, getAnswersByQuestionId } from '../../shared/nocodb'

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
    // Get all questions
    if (event.path === '/.netlify/functions/questions') {
      console.log("Fetching all questions from NocoDB...")
      const allQuestions = await getAllQuestions()
      console.log(`Successfully fetched ${allQuestions.length} questions`)
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(allQuestions)
      }
    }
    
    // Get question by id with answers
    // Check if the path matches the pattern /.netlify/functions/questions/{id}
    const pathParts = event.path.split('/')
    const questionId = pathParts[pathParts.length - 1]
    
    if (pathParts.length === 5 && questionId) {
      console.log(`Fetching question ${questionId} details...`)
      const question = await getQuestionById(questionId)
      
      if (!question) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Question not found" })
        }
      }

      console.log(`Fetching answers for question ${questionId}...`)
      const answers = await getAnswersByQuestionId(questionId)
      console.log(`Found ${answers.length} answers`)

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
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(responseData)
      }
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid request' })
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
        error: "Failed to fetch questions",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
}
