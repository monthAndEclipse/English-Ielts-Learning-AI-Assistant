import { useState, useEffect, useRef,useMemo } from 'react';
import { Printer, XCircle, Eye, EyeOff, Volume2, ChevronLeft, ChevronRight, SkipForward, CheckCircle, Lightbulb, Sparkles } from 'lucide-react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { SUBTYPE_START, SUBTYPE_CORRECT } from 'lib/taskType';
import { start, submit } from "lib/client/services/taskService";

export default function TranslationPracticePage({ type, translation, language }) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [completedSentences, setCompletedSentences] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [showCorrectEffect, setShowCorrectEffect] = useState(false);
  const [inputErrors, setInputErrors] = useState([]);
  const inputRefs = useRef([]);
  const audioRef = useRef(null);

  const t = translation;

  const topics = useMemo(() => {
    return Object.entries(t?.domains || {})
      .filter(([key, value]) => typeof value === 'string' && key !== 'selectTopic')
      .map(([key, value]) => ({ value: key, label: value }));
  }, [t]);

  const STORAGE_KEY = 'translationPracticeTask';

  useEffect(() => {
    const savedTask = localStorage.getItem(STORAGE_KEY);
    if (savedTask) {
      try {
        const { selectedTopic, sentences, currentIndex, completedSentences, reviewMode } = JSON.parse(savedTask);
        if (selectedTopic) setSelectedTopic(selectedTopic);
        if (sentences) setSentences(sentences);
        if (currentIndex !== undefined) setCurrentIndex(currentIndex);
        if (completedSentences) setCompletedSentences(completedSentences);
        if (reviewMode !== undefined) setReviewMode(reviewMode);
      } catch (err) {
        console.error('Failed to load task from storage:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (sentences.length > 0) {
      const taskData = {
        selectedTopic,
        sentences,
        currentIndex,
        completedSentences,
        reviewMode
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taskData));
    }
  }, [selectedTopic, sentences, currentIndex, completedSentences, reviewMode]);

  
  const generateSentences = async () => {
    if (!selectedTopic) return;

    setLoading(true);
    setSentences([]);
    setCurrentIndex(0);
    setCompletedSentences([]);
    setUserInput([]);       // ← 必须清空用户输入
    setInputErrors([]);
    setReviewMode(false);
    setShowReference(false);
    localStorage.removeItem(STORAGE_KEY);

    try {
      const res = await start({
        type,
        subtype: SUBTYPE_START,
        language,
        domain: selectedTopic,
      });
      setSentences(res?.data);
      toast.success(t?.translationPractice?.generateSuccess || "生成成功！");

      // 生成后自动播放第一个句子
      setTimeout(() => {
        playAudio(res?.data[0].en);
      }, 500);
    } catch (err) {
      console.error(err);
      toast.error(t?.translationPractice?.generateFail || "生成失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  const currentSentence = sentences[currentIndex];
  const words = currentSentence ? currentSentence.en.split(' ') : [];

  useEffect(() => {
    if (words.length > 0 && userInput.length === 0) {
      setUserInput(new Array(words.length).fill(''));
    }
  }, [currentIndex, sentences]);

  const handleInputChange = (index, value) => {
    // 先准备 newInput（同步计算）
    const newInput = [...userInput];
    // 如果用户输入以空格结尾，保留去掉空格后的值并尝试跳到下一个输入框
    if (value.endsWith(' ')) {
      newInput[index] = value.trim();
      setUserInput(newInput);
      // 清除当前索引的错误状态（用户正在改正）
      setInputErrors(prev => {
        const p = prev ? [...prev] : new Array(words.length).fill(false);
        p[index] = false;
        return p;
      });
      if (index < words.length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else {
        // 最后一个输入框：如果都填满则检查
        const allFilled = newInput.every(input => input.trim() !== '');
        if (allFilled) {
          setTimeout(() => checkAnswer(newInput), 100);
        }
      }
      return;
    }

    // 普通输入（不以空格结尾）
    newInput[index] = value;
    setUserInput(newInput);

    // 清除当前索引的错误标记（用户在修改它）
    setInputErrors(prev => {
      const p = prev ? [...prev] : new Array(words.length).fill(false);
      p[index] = false;
      return p;
    });

    // 处理退格跳转（保持原有行为）——这里不需要做 anything

    // 如果所有输入框都已填写（用户可能改了前面但现在已经都填上了），则触发检查
    const allFilled = newInput.every(input => input.trim() !== '');
    if (allFilled) {
      // 给一点延迟以保证 setUserInput 先生效（UI 更新更顺畅）
      setTimeout(() => checkAnswer(newInput), 100);
    }
  };

  const handlePaste = (e, startIndex) => {
    e.preventDefault();

    let pasteText = e.clipboardData.getData("text");
    pasteText = pasteText.trim().replace(/\s+/g, " ");

    const pasteWords = pasteText.split(" ");

    const newInputs = [...userInput];

    for (let i = 0; i < pasteWords.length; i++) {
      const pos = startIndex + i;
      if (pos < words.length) {
        newInputs[pos] = pasteWords[i];
      }
    }

    setUserInput(newInputs);

    // 如果填满了，自动检查答案
    const allFilled = newInputs.every(v => v.trim() !== '');
    if (allFilled) {
      setTimeout(() => checkAnswer(newInputs), 100);
    }
  };


  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && userInput[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const normalizeText = (text) => {
    return text.toLowerCase().replace(/[.,!?;:'"]/g, '').trim();
  };

  const checkAnswer = (inputToCheck = userInput) => {
    const userAnswer = inputToCheck.join(' ').trim();
    const correctAnswer = currentSentence.en;

    if (normalizeText(userAnswer) === normalizeText(correctAnswer)) {
      const completed = {
        ...currentSentence,
        userAnswer,
        isCorrect: true,
        skipped: false
      };
      setCompletedSentences([...completedSentences, completed]);

      // 显示答对特效
      setShowCorrectEffect(true);
      toast.success(t?.translationPractice?.correct || "正确！", {
        icon: '🎉',
        duration: 2000,
      });

      setTimeout(() => {
        setShowCorrectEffect(false);
        moveToNext();
      }, 1500);
    } else {
      // 检查是否所有输入框都已填写
      const allFilled = inputToCheck.every(input => input.trim() !== '');
      if (allFilled) {
        // map each word and mark incorrect indices
        const errors = words.map((word, i) =>
          normalizeText(inputToCheck[i]) !== normalizeText(word)
        );
        setInputErrors(errors);
        // 抖动动画持续 600ms
        setTimeout(() => setInputErrors([]), 600);
        toast.error(t?.translationPractice?.incorrect || "还有错误，请重新检查");
      }

    }
  };

  const moveToNext = () => {
    if (currentIndex < sentences.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setUserInput([]);
      setShowReference(false);

      // 自动播放下一题的语音
      setTimeout(() => {
        playAudio(sentences[nextIndex].en);
      }, 300);
    } else {
      setReviewMode(true);
      toast.success(t?.translationPractice?.allCompleted || "全部完成！");
    }
  };

  const handleSkip = () => {
    const completed = {
      ...currentSentence,
      userAnswer: userInput.join(' ').trim() || '',
      isCorrect: false,
      skipped: true
    };
    setCompletedSentences([...completedSentences, completed]);
    toast(t?.translationPractice?.skipped || "已跳过", {
      icon: '⏭️',
    });
    moveToNext();
  };

  const handleShowReference = () => {
    setShowReference(!showReference);
  };

  const playAudio = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // 取消之前的播放
      const utterance = new SpeechSynthesisUtterance(text || currentSentence.en);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error(t?.translationPractice?.audioNotSupported || "浏览器不支持语音播放");
    }
  };

  const handleReviewNavigation = (direction) => {
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (direction === 'next' && currentIndex < completedSentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getInputWidth = (word) => {
    return Math.max(word.length * 12, 60);
  };

  if (reviewMode) {
    const reviewSentence = completedSentences[currentIndex];
    const correctCount = completedSentences.filter(s => s.isCorrect).length;
    const skippedCount = completedSentences.filter(s => s.skipped).length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50  p-4 md:p-8">
        <div className="max-w-8xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-800">
                {t?.translationPractice?.reviewTitle || "复习模式"}
              </h1>
              <button
                onClick={handlePrint}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2"
              >
                <Printer size={20} />
                {t?.translationPractice?.print || "打印"}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{correctCount}</div>
                <div className="text-sm text-gray-600">{t?.translationPractice?.correctCount || "正确"}</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">{skippedCount}</div>
                <div className="text-sm text-gray-600">{t?.translationPractice?.skippedCount || "跳过"}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((correctCount / completedSentences.length) * 100)}%
                </div>
                <div className="text-sm text-gray-600">{t?.translationPractice?.accuracy || "准确率"}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => handleReviewNavigation('prev')}
                disabled={currentIndex === 0}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={24} />
              </button>

              <span className="text-lg font-semibold text-gray-700">
                {currentIndex + 1} / {completedSentences.length}
              </span>

              <button
                onClick={() => handleReviewNavigation('next')}
                disabled={currentIndex === completedSentences.length - 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            <div className="space-y-4 p-8">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm font-semibold text-gray-600 mb-2">
                  {t?.translationPractice?.chinesePrompt || "中文提示"}
                </div>
                <div className="text-lg text-gray-800">{reviewSentence.cn}</div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm font-semibold text-gray-600 mb-2">
                  {t?.translationPractice?.correctAnswer || "正确答案"}
                </div>
                <div className="text-lg text-gray-800">{reviewSentence.en}</div>
              </div>

              <div className={`p-4 rounded-lg ${reviewSentence.isCorrect ? 'bg-green-100' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-sm font-semibold text-gray-600">
                    {t?.translationPractice?.yourAnswer || "你的答案"}
                  </div>
                  {reviewSentence.isCorrect ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : reviewSentence.skipped ? (
                    <SkipForward className="text-yellow-600" size={20} />
                  ) : (
                    <XCircle className="text-red-600" size={20} />
                  )}
                </div>
                <div className="text-lg text-gray-800">
                  {reviewSentence.userAnswer || (t?.translationPractice?.skippedText || "已跳过")}
                </div>
              </div>
            </div>
            <div className="flex justify-center">

               <button
              onClick={() => {
                setReviewMode(false);
                setCurrentIndex(0);
                setCompletedSentences([]);
                setSentences([]);
                setSelectedTopic('');
                setUserInput([]);       // ← 必须清空用户输入
                setInputErrors([]);     // ← 清掉错误标记
                localStorage.removeItem(STORAGE_KEY);
              }}
              className="mt-6  px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
            >
              {t?.translationPractice?.startNew || "开始新练习"}
            </button>
            </div>
           
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-8xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          {t?.translationPractice?.pageTitle || "对照翻译练习"}
        </h1>

        {/* Topic Selection */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-6">
          <label className="block text-lg font-semibold mb-3 text-gray-700">
            {t?.selectTopic || "选择主题"}
          </label>
          <div className="flex flex-wrap gap-3">
            {topics.map(topic => (
              <button
                key={topic.value}
                onClick={() => setSelectedTopic(topic.value)}
                className={`px-4 py-2 rounded-lg border transition-all ${selectedTopic === topic.value
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                  : 'bg-white border-gray-300 hover:border-blue-400 hover:shadow'
                  }`}
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="mb-6">
          <button
            onClick={generateSentences}
            disabled={!selectedTopic || loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-md"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
            {sentences.length > 0
              ? (t?.translationPractice?.regenerate || "重新生成")
              : (t?.translationPractice?.generateTask || "生成句子")}
          </button>
        </div>

        {/* Practice Area - Merged Layout */}
        {sentences.length > 0 && currentSentence && (
          <div className="bg-white rounded-lg shadow-md p-12 relative overflow-hidden">
            {/* Correct Effect Overlay */}
            {showCorrectEffect && (
              <div className="absolute inset-0 bg-green-500 bg-opacity-10 flex items-center justify-center z-10 animate-pulse">
                <div className="text-6xl">
                  <Sparkles className="text-green-500 animate-bounce" size={80} />
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-600">
                  {t?.translationPractice?.progress || "进度"}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                    {t?.translationPractice?.difficulty || "难度"} {currentSentence.difficulty}
                  </span>
                  <span className="text-sm font-semibold text-gray-600">
                    {currentIndex + 1} / {sentences.length}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / sentences.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Chinese Prompt with Action Buttons */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">

                </div>

                {/* Action Icons */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => playAudio()}
                    disabled={isPlaying}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors"
                    title={t?.translationPractice?.playAudio || "播放语音"}
                  >
                    <Volume2 size={20} />
                  </button>
                  <button
                    onClick={handleShowReference}
                    className={`p-2 rounded-lg transition-colors ${showReference
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    title={showReference
                      ? (t?.translationPractice?.hideReference || "隐藏答案")
                      : (t?.translationPractice?.showReference || "查看答案")
                    }
                  >
                    {showReference ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  <button
                    onClick={handleSkip}
                    className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    title={t?.translationPractice?.skip || "跳过"}
                  >
                    <SkipForward size={20} />
                  </button>
                </div>
              </div>

              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-2xl text-gray-800 leading-relaxed text-center">{currentSentence.cn}</p>
                </div>
              </div>
              {/* Reference Answer */}
              {showReference && (
                <div className="mt-4 p-4 ">
                  <div className="flex items-center justify-center gap-2 mb-2 text-center">
                    <p className="text-lg text-gray-800">{currentSentence.en}</p>
                  </div>

                </div>
              )}
            </div>

            <div className="h-px bg-gray-200 my-6"></div>

            {/* Input Area */}
            <div>
              <div className="flex flex-wrap justify-center gap-2">
                {words.map((word, index) => (
                  <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    value={userInput[index] || ''}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={(e) => handlePaste(e, index)}
                    className={`px-3 py-2 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none text-lg text-center transition-colors
                          ${inputErrors[index]
                        ? "border-red-500 shake text-red-600"
                        : "border-gray-300 focus:border-blue-500"}`}
                    style={{ width: `${getInputWidth(word)}px` }}
                    placeholder="___"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}