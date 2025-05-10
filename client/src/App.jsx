import { useState, useEffect } from 'react'
import './App.css'

// 检查文本是否包含俄语字符
function containsRussian(text) {
  // 俄语字符的Unicode范围：基本俄语字母 (0410-044F)，扩展俄语字母 (0401, 0451)
  const russianRegex = /[\u0410-\u044F\u0401\u0451]/;
  return russianRegex.test(text);
}

// 提取翻译内容的辅助函数
function extractTranslation(translationText) {
  if (!translationText) return '';



  // 直接返回纯文本翻译（我们已经修改了后端提示词，让它只返回翻译结果）
  // 但仍然保留一些处理逻辑，以防API返回格式不一致

  // 如果翻译文本以"Option"开头，说明包含多个选项
  if (translationText.includes('**Option')) {
    // 尝试提取第一个选项中的翻译内容
    const match = translationText.match(/\*\*Option 1.*?:\*\*(.*?)(?:\*\*Option|\*\*Why|$)/s);
    if (match && match[1]) {
      // 提取中文部分（去掉拼音和解释）
      const chineseMatch = match[1].match(/([\u4e00-\u9fa5，。！？；：""''（）【】、…—《》]+)/);
      if (chineseMatch && chineseMatch[1]) {
        return chineseMatch[1].trim();
      }
      return match[1].trim();
    }
  }

  // 如果文本包含"Here's the translation"
  if (translationText.includes("Here's the translation")) {
    const match = translationText.match(/Here's the translation.*?:(.*?)(?:\n\n|\*\*|$)/s);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // 如果文本包含"翻译："
  if (translationText.includes("翻译：")) {
    const match = translationText.match(/翻译：(.*?)(?:\n|$)/s);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // 如果文本包含中文字符，尝试提取连续的中文部分
  const chineseMatch = translationText.match(/([\u4e00-\u9fa5，。！？；：""''（）【】、…—《》]+)/);
  if (chineseMatch && chineseMatch[1]) {
    return chineseMatch[1];
  }

  // 如果以上都不匹配，返回原始文本
  return translationText;
}

function App() {
  const [inputText, setInputText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState([])
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  const [history, setHistory] = useState([])
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showResults, setShowResults] = useState(false)
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)

  // Function to toggle sidebar and store preference
  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  // Load history and sidebar state from localStorage on component mount
  useEffect(() => {
    // Load history
    const savedHistory = localStorage.getItem('analysisHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (err) {
        console.error('Error parsing history:', err);
      }
    }

    // Load sidebar state
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    if (savedSidebarState) {
      setSidebarOpen(JSON.parse(savedSidebarState));
    }
  }, []);

  // Handle text analysis
  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError('请输入俄语文本')
      return
    }

    // 检查输入文本是否包含俄语字符
    if (!containsRussian(inputText)) {
      setError('请输入俄语文本，只有俄语文本才能进行语法分析')
      return
    }

    setAnalyzing(true)
    setError(null)
    setShowResults(false)

    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      })

      if (!response.ok) {
        throw new Error('分析请求失败')
      }

      const data = await response.json()
      setResults(data.results)
      setCurrentSentenceIndex(0)

      // Save to history
      const timestamp = new Date().toLocaleString()
      const newHistoryItem = {
        id: Date.now(),
        text: inputText,
        results: data.results,
        timestamp,
      }

      const updatedHistory = [newHistoryItem, ...history].slice(0, 20) // Keep only 20 most recent items
      setHistory(updatedHistory)
      localStorage.setItem('analysisHistory', JSON.stringify(updatedHistory))

      // Show results screen
      setShowResults(true)
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err.message || '分析过程中发生错误')
    } finally {
      setAnalyzing(false)
    }
  }

  // Handle key press in textarea
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault() // Prevent new line
      handleAnalyze()
    }
  }

  // Load history item
  const loadHistoryItem = (item) => {
    setInputText(item.text)
    setResults(item.results)
    setCurrentSentenceIndex(0)
    setShowResults(true)
  }

  // Back to input screen
  const backToInput = () => {
    setShowResults(false)
  }

  // Delete history item
  const deleteHistoryItem = (id) => {
    const updatedHistory = history.filter(item => item.id !== id)
    setHistory(updatedHistory)
    localStorage.setItem('analysisHistory', JSON.stringify(updatedHistory))
  }

  // Clear all history
  const clearHistory = () => {
    if (window.confirm('确定要清空所有历史记录吗？')) {
      setHistory([])
      localStorage.removeItem('analysisHistory')
    }
  }

  // Navigate between sentences
  const goToPreviousSentence = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(currentSentenceIndex - 1)
    }
  }

  const goToNextSentence = () => {
    if (currentSentenceIndex < results.length - 1) {
      setCurrentSentenceIndex(currentSentenceIndex + 1)
    }
  }

  // Toggle download options
  const toggleDownloadOptions = () => {
    setShowDownloadOptions(!showDownloadOptions);
  }

  // Generate Markdown for a single sentence
  const generateSentenceMarkdown = (sentence) => {
    if (!sentence) return '';

    let markdown = '';

    // Add original sentence
    markdown += `## 原句\n\n${sentence.original}\n\n`;

    // Add translation
    markdown += `## 翻译\n\n${extractTranslation(sentence.translation)}\n\n`;

    // Add grammar analysis
    markdown += `## 语法分析\n\n`;

    if (sentence.analysis && sentence.analysis.mainComponents) {
      sentence.analysis.mainComponents.forEach(component => {
        // Main component
        markdown += `- **${component.type}**: \`${component.text}\` "${component.translation}"\n`;

        // Component children
        if (component.children && component.children.length > 0) {
          component.children.forEach(child => {
            markdown += `    - **${child.type}**: \`${child.text}\``;

            // Add morphology if available
            if (child.morphology && Object.keys(child.morphology).length > 0) {
              markdown += ` (【${child.original || child.text}】)`;

              // Add morphology details
              const morphDetails = Object.values(child.morphology).join(', ');
              if (morphDetails) {
                markdown += ` ${morphDetails}`;
              }

              // Add translation
              if (child.translation) {
                markdown += ` "${child.translation}"`;
              }
            }

            markdown += '\n';

            // Nested children
            if (child.children && child.children.length > 0) {
              child.children.forEach(nestedChild => {
                markdown += `        - **${nestedChild.type}**: \`${nestedChild.text}\``;

                // Add morphology if available
                if (nestedChild.morphology && Object.keys(nestedChild.morphology).length > 0) {
                  markdown += ` (【${nestedChild.original || nestedChild.text}】)`;

                  // Add morphology details
                  const morphDetails = Object.values(nestedChild.morphology).join(', ');
                  if (morphDetails) {
                    markdown += ` ${morphDetails}`;
                  }

                  // Add translation
                  if (nestedChild.translation) {
                    markdown += ` "${nestedChild.translation}"`;
                  }
                }

                markdown += '\n';
              });
            }
          });
        }
      });
    } else {
      markdown += '无法分析此句子的语法结构。请尝试简化句子或重新分析。\n';
    }

    return markdown;
  };

  // Generate Markdown for all sentences
  const generateAllSentencesMarkdown = () => {
    if (!results || results.length === 0) return '';

    let markdown = '# 俄语句子语法分析\n\n';

    results.forEach((sentence, index) => {
      markdown += `# 句子 ${index + 1}\n\n`;
      markdown += generateSentenceMarkdown(sentence);
      markdown += '\n---\n\n';
    });

    return markdown;
  };

  // Download Markdown file
  const downloadMarkdown = (content, filename) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download current sentence
  const downloadCurrentSentence = () => {
    if (!currentSentence) return;

    const markdown = generateSentenceMarkdown(currentSentence);
    const filename = `俄语分析_句子${currentSentenceIndex + 1}.md`;
    downloadMarkdown(markdown, filename);
  };

  // Download all sentences
  const downloadAllSentences = () => {
    if (!results || results.length === 0) return;

    const markdown = generateAllSentencesMarkdown();
    const filename = '俄语分析_全部句子.md';
    downloadMarkdown(markdown, filename);
  };

  // Current sentence data
  const currentSentence = results && results.length > 0 ? results[currentSentenceIndex] : null;

  return (
    <div className="app-container">
      <header>
        <h1>俄语句子语法分析</h1>
      </header>

      {/* Fixed toggle button for sidebar */}
      <button
        className="sidebar-toggle-fixed"
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? "隐藏历史记录" : "显示历史记录"}
      >
        <span className="toggle-icon">
          {sidebarOpen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </span>
      </button>

      <div className="main-container">
        <div className="layout-container">
          {/* Sidebar container */}
          <div className={`sidebar-container ${sidebarOpen ? 'open' : 'closed'}`}>
            <aside className="history-sidebar">
              <div className="history-header">
                <h2>历史记录</h2>
                <div className="history-buttons">
                  {history.length > 0 && (
                    <button className="clear-history" onClick={clearHistory} title="清空所有历史记录">
                      清空
                    </button>
                  )}
                  {/* This toggle is inside the sidebar, could be removed if fixed one is preferred */}
                  <button
                    className="sidebar-toggle"
                    onClick={toggleSidebar}
                    aria-label={sidebarOpen ? "隐藏历史记录" : "显示历史记录"}
                  >
                    <span className="toggle-icon">
                      {sidebarOpen ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                           <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                  </button>
                </div>
              </div>
              {history.length > 0 ? (
                <div className="history-list">
                  {history.map((item) => (
                    <div key={item.id} className="history-item" onClick={() => loadHistoryItem(item)}>
                      <div className="history-content">
                        <div className="history-text" title={item.text}>{item.text.substring(0, 30)}{item.text.length > 30 ? '...' : ''}</div>
                        <div className="history-timestamp">{item.timestamp}</div>
                      </div>
                      <button
                        className="delete-history"
                        onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                        title="删除此条记录"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-history">暂无历史记录</div>
              )}
            </aside>
          </div>

          {/* Main content area */}
          <div className="content-area">
            {!showResults ? (
              /* Input Screen */
              <div className="input-screen">
                <div className="input-section">
                  <h2>输入俄语文本进行分析</h2>
                  <p className="input-instruction">请注意：本工具仅支持俄语文本的语法分析</p>
                  <div className="textarea-container">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="请在此输入俄语文本（只支持俄语分析），按 Enter 键进行分析 (Shift + Enter 换行)"
                      rows={8}
                      lang="ru" // 设置语言属性为俄语
                    />
                  </div>
                  <button
                    className="analyze-icon-button"
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    title="分析文本"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {error && <div className="error-message">{error}</div>}
                  {analyzing && <div className="loading">分析中，请稍候...</div>}
                </div>
              </div>
          ) : (
            /* Results Screen */
            <div className="results-screen">
              <div className="results-header">
                <button className="back-button" onClick={backToInput}>
                  返回输入
                </button>
                <h2 className="results-title">分析结果</h2>
              </div>

              <div className="results-content">
                <div className="sentence-navigation">
                  <button
                    onClick={goToPreviousSentence}
                    disabled={currentSentenceIndex === 0}
                  >
                    上一句
                  </button>
                  <span>句子 {currentSentenceIndex + 1} / {results.length}</span>
                  <button
                    onClick={goToNextSentence}
                    disabled={currentSentenceIndex === results.length - 1}
                  >
                    下一句
                  </button>
                </div>

                {/* Download Section */}
                <div className="download-section">
                  <button
                    className="download-toggle-button"
                    onClick={toggleDownloadOptions}
                  >
                    {showDownloadOptions ? '隐藏下载选项' : '显示下载选项'}
                  </button>

                  {showDownloadOptions && (
                    <div className="download-options">
                      <p className="download-instruction">选择下载格式（Markdown）：</p>
                      <div className="download-buttons">
                        <button
                          className="download-button"
                          onClick={downloadCurrentSentence}
                          title="下载当前句子的分析结果"
                        >
                          下载当前句子
                        </button>
                        <button
                          className="download-button"
                          onClick={downloadAllSentences}
                          title="下载所有句子的分析结果"
                        >
                          下载全部句子
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="sentence-analysis">
                  {/* Sentence Number */}
                  <div className="sentence-number">
                    #{currentSentenceIndex + 1}
                  </div>

                  {/* Original Sentence (Russian) */}
                  <div className="original-sentence">
                    <h3 className="section-title">原句 (本句)</h3>
                    <div className="sentence-content">
                      {currentSentence.original}
                    </div>
                  </div>

                  {/* Translation (Chinese) */}
                  <div className="translation">
                    <h3 className="section-title translation-title">翻译 (本句)</h3>
                    <div className="sentence-content">
                      {currentSentence.translation ? extractTranslation(currentSentence.translation) : '无翻译数据'}
                    </div>
                  </div>

                  {/* Grammar Analysis */}
                  <div className="grammar-analysis">
                    <h3 className="section-title analysis-title">语法分析</h3>
                    <div className="analysis-tree">
                      {currentSentence.analysis && currentSentence.analysis.mainComponents ? (
                        currentSentence.analysis.mainComponents.map((component, index) => (
                        <div key={index} className="grammar-component">
                          {/* Main Component (Subject, Predicate, etc.) */}
                          <div className="component-main">
                            <span className="bullet">-</span> <span className="component-type">{component.type}:</span>
                            <span className="component-text highlight-russian">{component.text}</span>
                            <span className="component-translation">"{component.translation}"</span>
                          </div>

                          {/* Component Children */}
                          {component.children && component.children.length > 0 && (
                            <div className="component-children">
                              {component.children.map((child, childIndex) => (
                                <div key={childIndex} className="component-child">
                                  <div className="child-header">
                                    <span className="bullet-small">    -</span> <span className="child-type">{child.type}:</span>
                                    <span className="child-text highlight-russian">{child.text}</span>
                                    {child.morphology && Object.keys(child.morphology).length > 0 && (
                                      <span className="morphology-summary">
                                        (【{child.original || child.text}】)
                                        <span className="morphology-italic">
                                          {Object.entries(child.morphology).map(([key, value], i, arr) => (
                                            <span key={key}>
                                              {i > 0 ? ', ' : ''}
                                              {value}
                                            </span>
                                          ))}
                                        </span>
                                        {child.translation && (
                                          <span className="child-translation"> "{child.translation}"</span>
                                        )}
                                      </span>
                                    )}
                                  </div>

                                  {/* Nested Children (if any) */}
                                  {child.children && child.children.length > 0 && (
                                    <div className="nested-children">
                                      {child.children.map((nestedChild, nestedIndex) => (
                                        <div key={nestedIndex} className="nested-child">
                                          <span className="bullet-nested">        -</span> <span className="nested-type">{nestedChild.type}:</span>
                                          <span className="nested-text highlight-russian">{nestedChild.text}</span>
                                          {nestedChild.morphology && Object.keys(nestedChild.morphology).length > 0 && (
                                            <span className="morphology-summary">
                                              (【{nestedChild.original || nestedChild.text}】)
                                              <span className="morphology-italic">
                                                {Object.entries(nestedChild.morphology).map(([key, value], i, arr) => (
                                                  <span key={key}>
                                                    {i > 0 ? ', ' : ''}
                                                    {value}
                                                  </span>
                                                ))}
                                              </span>
                                              {nestedChild.translation && (
                                                <span className="nested-translation"> "{nestedChild.translation}"</span>
                                              )}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                      ) : (
                        <div className="analysis-error">
                          <p>无法分析此句子的语法结构。请尝试简化句子或重新分析。</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      <footer>
        <p>俄语句子语法分析器 - 助力您的俄语学习之旅</p>
      </footer>
    </div>
  )
}

export default App
