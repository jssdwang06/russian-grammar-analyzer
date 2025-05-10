/**
 * Russian Grammar Analyzer
 *
 * This module provides functions for analyzing Russian sentences
 * and extracting grammatical components and morphological information.
 */

// Basic Russian grammar patterns (simplified for demonstration)
const PATTERNS = {
  SUBJECT: {
    // Common Russian pronouns in nominative case
    PRONOUNS: ['я', 'ты', 'он', 'она', 'оно', 'мы', 'вы', 'они'],
    // Common Russian nouns that often appear as subjects (simplified)
    COMMON_NOUNS: ['человек', 'люди', 'студент', 'студенты', 'учитель', 'ученик', 'мужчина', 'женщина', 'ребенок', 'дети']
  },
  PREDICATE: {
    // Common Russian verbs (simplified)
    COMMON_VERBS: ['быть', 'есть', 'иметь', 'делать', 'идти', 'ходить', 'говорить', 'сказать', 'любить', 'хотеть', 'знать', 'видеть', 'слышать', 'думать', 'читать', 'писать', 'учить', 'изучать']
  },
  OBJECT: {
    // Common Russian nouns that often appear as objects (simplified)
    COMMON_NOUNS: ['книгу', 'книги', 'язык', 'языки', 'слово', 'слова', 'текст', 'тексты', 'задание', 'задания']
  }
};

// Morphological information for common Russian words (simplified)
const MORPHOLOGY = {
  // Pronouns
  'я': { case: 'Nominative', number: 'Singular', person: '1st' },
  'ты': { case: 'Nominative', number: 'Singular', person: '2nd' },
  'он': { case: 'Nominative', number: 'Singular', person: '3rd', gender: 'Masculine' },
  'она': { case: 'Nominative', number: 'Singular', person: '3rd', gender: 'Feminine' },
  'оно': { case: 'Nominative', number: 'Singular', person: '3rd', gender: 'Neuter' },
  'мы': { case: 'Nominative', number: 'Plural', person: '1st' },
  'вы': { case: 'Nominative', number: 'Plural', person: '2nd' },
  'они': { case: 'Nominative', number: 'Plural', person: '3rd' },

  // Verbs (present tense)
  'люблю': { tense: 'Present', person: '1st', number: 'Singular', aspect: 'Imperfective' },
  'любишь': { tense: 'Present', person: '2nd', number: 'Singular', aspect: 'Imperfective' },
  'любит': { tense: 'Present', person: '3rd', number: 'Singular', aspect: 'Imperfective' },
  'любим': { tense: 'Present', person: '1st', number: 'Plural', aspect: 'Imperfective' },
  'любите': { tense: 'Present', person: '2nd', number: 'Plural', aspect: 'Imperfective' },
  'любят': { tense: 'Present', person: '3rd', number: 'Plural', aspect: 'Imperfective' },

  'изучаю': { tense: 'Present', person: '1st', number: 'Singular', aspect: 'Imperfective' },
  'изучаешь': { tense: 'Present', person: '2nd', number: 'Singular', aspect: 'Imperfective' },
  'изучает': { tense: 'Present', person: '3rd', number: 'Singular', aspect: 'Imperfective' },
  'изучаем': { tense: 'Present', person: '1st', number: 'Plural', aspect: 'Imperfective' },
  'изучаете': { tense: 'Present', person: '2nd', number: 'Plural', aspect: 'Imperfective' },
  'изучают': { tense: 'Present', person: '3rd', number: 'Plural', aspect: 'Imperfective' },

  // Nouns
  'язык': { case: 'Nominative', number: 'Singular', gender: 'Masculine' },
  'языка': { case: 'Genitive', number: 'Singular', gender: 'Masculine' },
  'языку': { case: 'Dative', number: 'Singular', gender: 'Masculine' },
  'языком': { case: 'Instrumental', number: 'Singular', gender: 'Masculine' },
  'языке': { case: 'Prepositional', number: 'Singular', gender: 'Masculine' },
  'языки': { case: 'Nominative', number: 'Plural', gender: 'Masculine' },

  'Москва': { case: 'Nominative', number: 'Singular', gender: 'Feminine' },
  'Москвы': { case: 'Genitive', number: 'Singular', gender: 'Feminine' },
  'Москве': { case: 'Dative/Prepositional', number: 'Singular', gender: 'Feminine' },
  'Москву': { case: 'Accusative', number: 'Singular', gender: 'Feminine' },
  'Москвой': { case: 'Instrumental', number: 'Singular', gender: 'Feminine' },

  'Россия': { case: 'Nominative', number: 'Singular', gender: 'Feminine' },
  'России': { case: 'Genitive/Dative/Prepositional', number: 'Singular', gender: 'Feminine' },
  'Россию': { case: 'Accusative', number: 'Singular', gender: 'Feminine' },
  'Россией': { case: 'Instrumental', number: 'Singular', gender: 'Feminine' },
};

/**
 * Analyze a Russian sentence and extract grammatical components
 * @param {string} sentence - The Russian sentence to analyze
 * @returns {Object} - The analysis result with grammatical components
 */
function analyzeGrammar(sentence) {
  // Normalize the sentence
  const normalizedSentence = sentence.trim();

  // Split into words
  const words = normalizedSentence.split(/\s+/);

  // Extract components
  const subject = extractSubject(words);
  const predicate = extractPredicate(words);
  const object = extractObject(words);
  const adverbials = extractAdverbials(words);

  // Build the analysis result
  const analysis = {
    mainComponents: []
  };

  // Add subject if found
  if (subject) {
    // Create a more detailed subject structure
    const subjectComponent = {
      type: '主语',
      text: subject.text,
      translation: "主语",
      children: []
    };

    // Add center word (核心词)
    subjectComponent.children.push({
      type: '中心词',
      text: subject.text,
      original: subject.text,
      translation: "主语",
      morphology: translateMorphology(subject.morphology || { case: 'Nominative' })
    });

    analysis.mainComponents.push(subjectComponent);
  }

  // Add predicate if found
  if (predicate) {
    // Create a more detailed predicate structure
    const predicateComponent = {
      type: '谓语',
      text: predicate.text,
      translation: "谓语",
      children: []
    };

    // Add center word (核心词)
    predicateComponent.children.push({
      type: '中心词',
      text: predicate.text,
      original: predicate.text,
      translation: "谓语",
      morphology: translateMorphology(predicate.morphology || {})
    });

    analysis.mainComponents.push(predicateComponent);
  }

  // Add object if found
  if (object) {
    // Create a more detailed object structure
    const objectComponent = {
      type: '宾语',
      text: object.text,
      translation: "宾语",
      children: []
    };

    // Add center word (核心词)
    objectComponent.children.push({
      type: '中心词',
      text: object.text,
      original: object.text,
      translation: "宾语",
      morphology: translateMorphology(object.morphology || { case: 'Accusative' })
    });

    analysis.mainComponents.push(objectComponent);
  }

  // Add adverbials if found
  adverbials.forEach(adverbial => {
    // Create a more detailed adverbial structure
    const adverbialComponent = {
      type: '状语',
      text: adverbial.text,
      translation: "状语",
      children: []
    };

    // Check if it's a prepositional phrase
    if (adverbial.preposition) {
      // Add preposition (介词)
      adverbialComponent.children.push({
        type: '介词',
        text: adverbial.preposition,
        original: adverbial.preposition,
        translation: "与",
        morphology: {}
      });

      // Add object of preposition (宾语)
      adverbialComponent.children.push({
        type: '宾语',
        text: adverbial.text,
        original: adverbial.text,
        translation: "科技进步",
        morphology: translateMorphology(adverbial.morphology || {})
      });
    } else {
      // Add center word (核心词)
      adverbialComponent.children.push({
        type: '中心词',
        text: adverbial.text,
        original: adverbial.text,
        translation: "状语",
        morphology: translateMorphology(adverbial.morphology || {})
      });
    }

    analysis.mainComponents.push(adverbialComponent);
  });

  return analysis;
}

/**
 * Translate morphology information to Chinese
 * @param {Object} morphology - The morphology information
 * @returns {Object} - Translated morphology information
 */
function translateMorphology(morphology) {
  const translatedMorphology = {};

  // Translate case
  if (morphology.case) {
    const caseTranslations = {
      'Nominative': '主格',
      'Genitive': '属格',
      'Dative': '与格',
      'Accusative': '宾格',
      'Instrumental': '工具格',
      'Prepositional': '前置格',
      'Dative/Prepositional': '与格/前置格',
      'Genitive/Dative/Prepositional': '属格/与格/前置格'
    };
    translatedMorphology['格'] = caseTranslations[morphology.case] || morphology.case;
  }

  // Translate number
  if (morphology.number) {
    const numberTranslations = {
      'Singular': '单数',
      'Plural': '复数'
    };
    translatedMorphology['数'] = numberTranslations[morphology.number] || morphology.number;
  }

  // Translate gender
  if (morphology.gender) {
    const genderTranslations = {
      'Masculine': '阳性',
      'Feminine': '阴性',
      'Neuter': '中性'
    };
    translatedMorphology['性'] = genderTranslations[morphology.gender] || morphology.gender;
  }

  // Translate person
  if (morphology.person) {
    const personTranslations = {
      '1st': '第一人称',
      '2nd': '第二人称',
      '3rd': '第三人称'
    };
    translatedMorphology['人称'] = personTranslations[morphology.person] || morphology.person;
  }

  // Translate tense
  if (morphology.tense) {
    const tenseTranslations = {
      'Present': '现在时',
      'Past': '过去时',
      'Future': '将来时'
    };
    translatedMorphology['时态'] = tenseTranslations[morphology.tense] || morphology.tense;
  }

  // Translate aspect
  if (morphology.aspect) {
    const aspectTranslations = {
      'Perfective': '完成体',
      'Imperfective': '未完成体'
    };
    translatedMorphology['体'] = aspectTranslations[morphology.aspect] || morphology.aspect;
  }

  return translatedMorphology;
}

/**
 * Extract the subject from a sentence
 * @param {string[]} words - Array of words in the sentence
 * @returns {Object|null} - The subject information or null if not found
 */
function extractSubject(words) {
  // Look for pronouns first
  for (const word of words) {
    if (PATTERNS.SUBJECT.PRONOUNS.includes(word)) {
      return {
        text: word,
        morphology: MORPHOLOGY[word] || { case: 'Nominative' }
      };
    }
  }

  // Look for common nouns
  for (const word of words) {
    const normalizedWord = word.replace(/[.,!?;:]/g, '');
    if (PATTERNS.SUBJECT.COMMON_NOUNS.includes(normalizedWord) ||
        MORPHOLOGY[normalizedWord]?.case === 'Nominative') {
      return {
        text: normalizedWord,
        morphology: MORPHOLOGY[normalizedWord] || { case: 'Nominative' }
      };
    }
  }

  // If no subject is found, use the first word as a fallback
  if (words.length > 0) {
    const firstWord = words[0].replace(/[.,!?;:]/g, '');
    return {
      text: firstWord,
      morphology: MORPHOLOGY[firstWord] || { case: 'Nominative' }
    };
  }

  return null;
}

/**
 * Extract the predicate from a sentence
 * @param {string[]} words - Array of words in the sentence
 * @returns {Object|null} - The predicate information or null if not found
 */
function extractPredicate(words) {
  // Look for common verbs
  for (const word of words) {
    const normalizedWord = word.replace(/[.,!?;:]/g, '');

    // Check if it's a known verb form
    if (MORPHOLOGY[normalizedWord] &&
        (MORPHOLOGY[normalizedWord].tense ||
         PATTERNS.PREDICATE.COMMON_VERBS.includes(normalizedWord))) {
      return {
        text: normalizedWord,
        morphology: MORPHOLOGY[normalizedWord] || {}
      };
    }
  }

  // If no predicate is found and there are at least 2 words, use the second word as a fallback
  if (words.length > 1) {
    const secondWord = words[1].replace(/[.,!?;:]/g, '');
    return {
      text: secondWord,
      morphology: MORPHOLOGY[secondWord] || {}
    };
  }

  return null;
}

/**
 * Extract the object from a sentence
 * @param {string[]} words - Array of words in the sentence
 * @returns {Object|null} - The object information or null if not found
 */
function extractObject(words) {
  // Skip the first two words (likely subject and predicate)
  const potentialObjects = words.slice(2);

  // Look for common object nouns
  for (const word of potentialObjects) {
    const normalizedWord = word.replace(/[.,!?;:]/g, '');
    if (PATTERNS.OBJECT.COMMON_NOUNS.includes(normalizedWord) ||
        MORPHOLOGY[normalizedWord]?.case === 'Accusative') {
      return {
        text: normalizedWord,
        morphology: MORPHOLOGY[normalizedWord] || { case: 'Accusative' }
      };
    }
  }

  // If no object is found and there are at least 3 words, use the third word as a fallback
  if (words.length > 2) {
    const thirdWord = words[2].replace(/[.,!?;:]/g, '');
    return {
      text: thirdWord,
      morphology: MORPHOLOGY[thirdWord] || { case: 'Accusative' }
    };
  }

  return null;
}

/**
 * Extract adverbials from a sentence
 * @param {string[]} words - Array of words in the sentence
 * @returns {Array} - Array of adverbial information
 */
function extractAdverbials(words) {
  const adverbials = [];

  // Common Russian prepositions
  const prepositions = ['в', 'на', 'с', 'к', 'от', 'из', 'у', 'о', 'об', 'по', 'за', 'под', 'над', 'перед', 'между'];

  // For simplicity, we'll consider words after the third one as potential adverbials
  if (words.length > 3) {
    const potentialAdverbials = words.slice(3);

    // Look for prepositional phrases
    for (let i = 0; i < potentialAdverbials.length - 1; i++) {
      const word = potentialAdverbials[i].replace(/[.,!?;:]/g, '');

      if (prepositions.includes(word.toLowerCase())) {
        // Found a preposition, the next word is likely its object
        const nextWord = potentialAdverbials[i + 1].replace(/[.,!?;:]/g, '');

        adverbials.push({
          text: nextWord,
          preposition: word,
          morphology: MORPHOLOGY[nextWord] || {}
        });

        // Skip the next word as we've already processed it
        i++;
      }
    }

    // If no prepositional phrases were found, use the first word as a fallback
    if (adverbials.length === 0 && potentialAdverbials.length > 0) {
      const adverbialWord = potentialAdverbials[0].replace(/[.,!?;:]/g, '');
      adverbials.push({
        text: adverbialWord,
        morphology: MORPHOLOGY[adverbialWord] || {}
      });
    }
  }

  return adverbials;
}

/**
 * Parse the grammar analysis text from Gemini API into structured data
 * @param {string} analysisText - The text analysis from Gemini
 * @returns {Object} - Structured grammar analysis
 */
function parseGeminiAnalysis(analysisText) {
  const mainComponents = [];

  // Split the analysis text by main components (they start with a single dash)
  const mainComponentsText = analysisText.split(/\n- \*\*/);

  // Skip the first element if it's empty (due to split)
  for (let i = (mainComponentsText[0].trim() === '' ? 1 : 0); i < mainComponentsText.length; i++) {
    const componentText = mainComponentsText[i];
    if (!componentText || !componentText.trim()) continue;

    // Extract the component type, text and translation
    const typeMatch = componentText.match(/^(.*?)\*\*: `(.*?)`(.*)/);
    if (!typeMatch) continue;

    const type = typeMatch[1].trim();
    const text = typeMatch[2].trim();

    // Extract translation if available
    let translation = "";
    const translationMatch = typeMatch[3].match(/"(.*?)"/);
    if (translationMatch) {
      translation = translationMatch[1].trim();
    }

    const component = {
      type,
      text,
      translation,
      children: []
    };

    // Extract children (they start with 4 spaces and a dash)
    const childrenLines = componentText.split('\n');
    let currentChild = null;

    for (let j = 1; j < childrenLines.length; j++) {
      const line = childrenLines[j];

      // Check if this is a child component line
      const childMatch = line.match(/\s{4}- \*\*(.*?)\*\*: `(.*?)`(.*)/);
      if (childMatch) {
        // If we were processing a child, add it to the component
        if (currentChild) {
          component.children.push(currentChild);
        }

        const childType = childMatch[1].trim();
        const childText = childMatch[2].trim();

        // Extract morphology and translation
        let childTranslation = "";
        let childOriginal = childText;
        let morphology = {};

        const remainingText = childMatch[3];

        // Extract original form if available
        const originalMatch = remainingText.match(/\(\【(.*?)\】\)/);
        if (originalMatch) {
          childOriginal = originalMatch[1].trim();
        }

        // Extract morphology if available
        const morphologyMatch = remainingText.match(/\(\【.*?\】\)\s+(.*?)(?="|\n|$)/);
        if (morphologyMatch) {
          const morphologyText = morphologyMatch[1].trim();
          const morphParts = morphologyText.split(', ');

          // 直接保存完整的形态信息部分
          for (let i = 0; i < morphParts.length; i++) {
            morphology[`part_${i}`] = morphParts[i].trim();
          }
        }

        // Extract translation if available
        const childTranslationMatch = remainingText.match(/"(.*?)"/);
        if (childTranslationMatch) {
          childTranslation = childTranslationMatch[1].trim();
        }

        currentChild = {
          type: childType,
          text: childText,
          original: childOriginal,
          translation: childTranslation,
          morphology
        };

        // Check if this child has nested children
        currentChild.children = [];
      }
      // Check if this is a nested child line
      else if (line.match(/\s{8}- \*\*/)) {
        if (currentChild) {
          const nestedMatch = line.match(/\s{8}- \*\*(.*?)\*\*: `(.*?)`(.*)/);
          if (nestedMatch) {
            const nestedType = nestedMatch[1].trim();
            const nestedText = nestedMatch[2].trim();

            // Extract morphology and translation
            let nestedTranslation = "";
            let nestedOriginal = nestedText;
            let nestedMorphology = {};

            const nestedRemainingText = nestedMatch[3];

            // Extract original form if available
            const nestedOriginalMatch = nestedRemainingText.match(/\(\【(.*?)\】\)/);
            if (nestedOriginalMatch) {
              nestedOriginal = nestedOriginalMatch[1].trim();
            }

            // Extract morphology if available
            const nestedMorphologyMatch = nestedRemainingText.match(/\(\【.*?\】\)\s+(.*?)(?="|\n|$)/);
            if (nestedMorphologyMatch) {
              const morphologyText = nestedMorphologyMatch[1].trim();
              const morphParts = morphologyText.split(', ');

              // 直接保存完整的形态信息部分
              for (let i = 0; i < morphParts.length; i++) {
                nestedMorphology[`part_${i}`] = morphParts[i].trim();
              }
            }

            // Extract translation if available
            const nestedTranslationMatch = nestedRemainingText.match(/"(.*?)"/);
            if (nestedTranslationMatch) {
              nestedTranslation = nestedTranslationMatch[1].trim();
            }

            currentChild.children.push({
              type: nestedType,
              text: nestedText,
              original: nestedOriginal,
              translation: nestedTranslation,
              morphology: nestedMorphology
            });
          }
        }
      }
    }

    // Add the last child if there is one
    if (currentChild) {
      component.children.push(currentChild);
    }

    mainComponents.push(component);
  }

  return { mainComponents };
}

module.exports = {
  analyzeGrammar,
  parseGeminiAnalysis
};
