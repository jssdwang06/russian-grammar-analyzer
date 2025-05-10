const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
// 设置axios默认超时时间为30秒
axios.defaults.timeout = 30000;
const { parseGeminiAnalysis } = require('./grammarAnalyzer');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Russian Grammar Analyzer API is running');
});

// 检查文本是否包含俄语字符
function containsRussian(text) {
  // 俄语字符的Unicode范围：基本俄语字母 (0410-044F)，扩展俄语字母 (0401, 0451)
  const russianRegex = /[\u0410-\u044F\u0401\u0451]/;
  return russianRegex.test(text);
}

// Analyze text route
app.post('/api/analyze', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // 检查输入文本是否包含俄语字符
    if (!containsRussian(text)) {
      return res.status(400).json({ error: 'Only Russian text can be analyzed' });
    }

    // Split text into sentences
    const sentences = splitIntoSentences(text);

    // Process each sentence
    const results = [];
    for (const sentence of sentences) {
      try {
        // Get translation using Gemini API
        const translation = await translateWithGemini(sentence);

        try {
          // Perform grammar analysis using Gemini API
          const grammarAnalysis = await analyzeGrammarWithGemini(sentence);

          results.push({
            original: sentence,
            translation,
            analysis: grammarAnalysis
          });
        } catch (analysisError) {
          console.error(`Error analyzing sentence: "${sentence}"`, analysisError);

          // 即使分析失败，也添加结果，但使用默认的分析结构
          results.push({
            original: sentence,
            translation,
            analysis: {
              mainComponents: [
                {
                  type: '主语',
                  text: sentence.split(' ')[0], // 简单地取第一个词作为主语
                  translation: '主语',
                  children: [
                    {
                      type: '中心词',
                      text: sentence.split(' ')[0],
                      original: sentence.split(' ')[0],
                      translation: '主语',
                      morphology: { part_0: '形态信息不可用' }
                    }
                  ]
                },
                {
                  type: '谓语',
                  text: '分析失败',
                  translation: '无法完成分析',
                  children: [
                    {
                      type: '说明',
                      text: '请尝试重新分析或简化句子',
                      original: '',
                      translation: '提示',
                      morphology: {}
                    }
                  ]
                }
              ]
            }
          });
        }
      } catch (sentenceError) {
        console.error(`Error processing sentence: "${sentence}"`, sentenceError);
        results.push({
          original: sentence,
          translation: '翻译失败',
          analysis: {
            mainComponents: [
              {
                type: 'Error',
                text: '无法分析此句子',
                translation: '错误',
                morphology: {}
              }
            ]
          }
        });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Error analyzing text:', error);
    res.status(500).json({ error: 'Failed to analyze text' });
  }
});

// Helper functions
function splitIntoSentences(text) {
  // Basic sentence splitting logic
  // This can be improved with more sophisticated regex
  const sentences = text
    .split(/[.!?]+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0);

  // 确保至少有一个句子
  if (sentences.length === 0 && text.trim().length > 0) {
    sentences.push(text.trim());
  }

  console.log("分割后的句子:", sentences);
  return sentences;
}

async function translateWithGemini(sentence) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }



    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        // 增加模型配置
        generationConfig: {
          temperature: 0.2, // 降低温度，使输出更确定性
          maxOutputTokens: 1024, // 增加最大输出长度
        },
        contents: [
          {
            parts: [
              {
                text: `将以下俄语句子翻译成中文，只返回翻译结果，不要包含任何解释、前缀或额外信息: "${sentence}"`
              }
            ]
          }
        ]
      }
    );

    // Extract translation from response
    if (response.data &&
        response.data.candidates &&
        response.data.candidates[0] &&
        response.data.candidates[0].content &&
        response.data.candidates[0].content.parts &&
        response.data.candidates[0].content.parts[0]) {

      const translationText = response.data.candidates[0].content.parts[0].text;

      // 清理翻译结果，去除可能的引号和多余空格
      let cleanedTranslation = translationText.trim();

      // 如果翻译被引号包围，去除引号
      if ((cleanedTranslation.startsWith('"') && cleanedTranslation.endsWith('"')) ||
          (cleanedTranslation.startsWith("'") && cleanedTranslation.endsWith("'"))) {
        cleanedTranslation = cleanedTranslation.substring(1, cleanedTranslation.length - 1);
      }
      return cleanedTranslation;
    } else {
      console.error('Unexpected Gemini API response structure:', response.data);
      throw new Error('Unexpected API response');
    }
  } catch (error) {
    console.error('Translation error:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    throw error;
  }
}

/**
 * Analyze Russian grammar using Gemini API
 * @param {string} sentence - The Russian sentence to analyze
 * @returns {Object} - The grammar analysis result
 */
async function analyzeGrammarWithGemini(sentence) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        // 增加模型配置
        generationConfig: {
          temperature: 0.2, // 降低温度，使输出更确定性
          maxOutputTokens: 2048, // 增加最大输出长度
        },
        contents: [
          {
            parts: [
              {
                text: `你是一个专业的俄语语法分析专家，请分析以下俄语句子的语法结构，识别主语、谓语、宾语、定语、状语等成分，并提供每个词的形态信息（格、数、性、时态等）。

                请特别注意：
                1. 对于每个词，提供其原形（即第一格或词典形式）
                2. 形态信息应包括：
                   - 对于名词、形容词：性别（阳性/阴性/中性）、数（单数/复数）、格（主格/属格/与格等）
                   - 对于动词：如果是过去式分词，标明"短尾"或"长尾"，然后是性别、数、时态
                   - 对于其他词类：根据适用情况提供相关形态信息
                3. 提供每个词的中文翻译
                4. 即使句子很复杂，也必须完成分析，这非常重要
                5. 如果句子包含从句或并列结构，请分别分析
                6. 不要跳过任何句子，每个句子都必须分析
                7. 如果遇到困难，可以简化分析，但必须提供某种形式的分析结果

                请按照以下格式输出：
                - **主语**: \`词语\` "翻译"
                    - **中心词**: \`词语\` (【原形】) 性别, 数, 格 "翻译"
                    - **定语**: \`词语\` (【原形】) 性别, 数, 格 "翻译"
                - **谓语**: \`词语\` (【原形】) 短尾/长尾性别, 数, 时态 "翻译"
                - **状语**: \`词语\` 翻译
                    - **介词**: \`词语\` 格 "翻译"
                    - **宾语**: \`词语\` (【原形】) 性别, 数, 格 "翻译"

                句子: "${sentence}"`
              }
            ]
          }
        ]
      }
    );

    // Extract analysis from response
    if (response.data &&
        response.data.candidates &&
        response.data.candidates[0] &&
        response.data.candidates[0].content &&
        response.data.candidates[0].content.parts &&
        response.data.candidates[0].content.parts[0]) {
      const analysisText = response.data.candidates[0].content.parts[0].text;

      // Parse the analysis text into structured data
      return parseGeminiAnalysis(analysisText);
    } else {
      console.error('Unexpected Gemini API response structure:', response.data);
      throw new Error('Unexpected API response');
    }
  } catch (error) {
    console.error('Grammar analysis error:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    throw error;
  }
}



// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
