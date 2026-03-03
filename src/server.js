import express from 'express'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'

//dotenv.config() // Dev Environment Only
console.log("API KEY: ", process.env.api_key)
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
    //const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' }) // Dev Environment
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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

app.get('/test-key', async (req, res) => {
  const key = process.env.api_key;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({contents: [{parts: [{text: 'test'}]}]})
    });
    res.json(await resp.json());
  } catch (e) {
    res.json({error: e.message});
  }
});


app.listen(PORT, () => {
  console.log(`Server has started on port: ${PORT}`)
})
