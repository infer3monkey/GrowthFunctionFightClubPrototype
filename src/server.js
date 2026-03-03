import express from 'express'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import OpenAI from 'openai'  // npm i openai
import dotenv from 'dotenv'

//dotenv.config() // Dev only
console.log("OPENROUTER KEY: ", process.env.OPENROUTER_API_KEY ? 'Loaded' : 'MISSING')

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://growthfunctionfightclub.onrender.com/test-key',
    'X-Title': 'Growth Function Fighting Club'
  }
})

const app = express()
const PORT = process.env.PORT || 5000

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

app.use(express.json())
app.use(express.static(path.join(__dirname, "../public")))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'GFFC.html'))
})

app.get('/AiResponse/', async (req, res) => {
  try {
    const {
      leftHealthFormula,
      leftAttackFormula,
      rightHealthFormula,
      rightAttackFormula,
      userBetSide,
      winner
    } = req.query

    const prompt = `
        You are explaining a math-based betting game to a student.

        Each side has health and attack given by growth functions of n.

        Left side:
        - Health: ${leftHealthFormula}
        - Attack: ${leftAttackFormula}

        Right side:
        - Health: ${rightHealthFormula}
        - Attack: ${rightAttackFormula}

        The player bet on: ${userBetSide === 'left' ? 'LEFT' : 'RIGHT'}.
        The actual winner was: ${winner === 'left' ? 'LEFT' : 'RIGHT'}.

        At very large n, explain in friendly, intuitive terms:
        1) Which growth functions dominate and why.
        2) Why the player's bet was ${userBetSide === winner ? 'CORRECT' : 'INCORRECT'}.
        3) One short tip for what to notice next time.
        Keep it under 180 words, no LaTeX, plain text.
        `.trim()

    // OpenRouter → Gemini 3.1 Flash (fastest/cheapest)
    const completion = await openai.chat.completions.create({
      model: 'google/gemini-3.1-flash-lite-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300
    })

    const text = completion.choices[0].message.content

    res.json({ explanation: text })
  } catch (err) {
    console.error(err);
    if (err.status === 429 || err.message.includes('rate')) {
      return res.json({
        explanation: "AI helper busy. Try again in 30s."
      })
    }
    res.status(500).json({
      explanation: "AI helper unavailable. Check back soon!"
    })
  }
})

// Keep for debugging
app.get('/test-key', async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'google/gemini-3.1-flash-lite-preview',
      messages: [{ role: 'user', content: 'say hi' }],
      temperature: 0.3,
      max_tokens: 200
    })
    res.json({ success: true, response: completion.choices[0].message.content })
  } catch (e) {
    res.json({ error: e.message })
  }
})

app.listen(PORT, () => {
  console.log(`Server started on port: ${PORT}`)
})
