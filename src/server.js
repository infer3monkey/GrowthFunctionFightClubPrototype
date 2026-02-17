import express from 'express'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'

dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.api_key)  // or process.env.API_KEY

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

    // Get model instance
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

    // Call generateContent with the prompt
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.json({ explanation: text })
  } catch (err) {
    console.error(err);
    if (err.status === 429) {
        return res.json({
        explanation:
            "The AI helper is out of quota. Try again later."
        });
    }
    res.status(500).json({
        explanation: "Sorry, the AI helper is unavailable right now."
    });
  }
})

app.listen(PORT, () => {
  console.log(`Server has started on port: ${PORT}`)
})
