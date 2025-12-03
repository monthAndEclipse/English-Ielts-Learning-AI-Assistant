import { useState, useEffect,useMemo } from 'react';
import { RefreshCw, Loader2, Copy, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { start } from "lib/client/services/taskService";
import { SUBTYPE_START } from 'lib/taskType';

export default function Reading1VariationPage({ type, translation, language }) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [passage, setPassage] = useState('');
  const [passageTitle, setPassageTitle] = useState('');
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);

  // 用户答案
  const [fillInAnswers, setFillInAnswers] = useState({});
  const [tfngAnswers, setTfngAnswers] = useState({});

  // 显示答案和解释
  const [showAnswers, setShowAnswers] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const t = translation;

  // 从 translation 中生成 topic 列表
  const topics = useMemo(() => {
    return Object.entries(t?.domains || {})
      .filter(([key, value]) => typeof value === 'string' && key !== 'selectTopic')
      .map(([key, value]) => ({ value: key, label: value }));
  }, [t]);

  const STORAGE_KEY = 'ieltsReading1Task';

  // 加载缓存
  useEffect(() => {
    const savedTask = localStorage.getItem(STORAGE_KEY);
    if (savedTask) {
      try {
        const data = JSON.parse(savedTask);
        if (data.selectedTopic) setSelectedTopic(data.selectedTopic);
        if (data.passage) setPassage(data.passage);
        if (data.questions) setQuestions(data.questions);
        if (data.fillInAnswers) setFillInAnswers(data.fillInAnswers);
        if (data.tfngAnswers) setTfngAnswers(data.tfngAnswers);
        if (data.submitted) setSubmitted(data.submitted);
        if (data.passageTitle) setPassageTitle(data.passageTitle);
      } catch (err) {
        console.error('Failed to load from storage:', err);
      }
    }
  }, []);

  // 保存缓存
  useEffect(() => {
    if (passage) {
      const taskData = {
        selectedTopic,
        passage,
        questions,
        fillInAnswers,
        tfngAnswers,
        passageTitle,
        submitted
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taskData));
    }
  }, [selectedTopic, passage, questions, fillInAnswers, tfngAnswers, submitted, passageTitle]);

  const generatePassage = async () => {
    if (!selectedTopic) return;

    setLoading(true);
    setPassage('');
    setPassageTitle('');
    setQuestions(null);
    setFillInAnswers({});
    setTfngAnswers({});
    setShowAnswers(false);
    setSubmitted(false);
    localStorage.removeItem(STORAGE_KEY);

    try {
      const res = await start({
        type,
        subtype: SUBTYPE_START,
        language,
        domain: selectedTopic
      });
      setPassage(res.data.passage);
      setPassageTitle(res.data.passage_title);
      setQuestions(res.data.questions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setShowAnswers(true);
  };

  const checkAnswer = (userAnswer, correctAnswer, questionType) => {
    if (!submitted) return null;

    if (questionType === 'fill') {
      const normalized = (str) => str.toLowerCase().trim();
      return normalized(userAnswer) === normalized(correctAnswer);
    } else {
      return userAnswer === correctAnswer;
    }
  };
/**作者:张立俊 1997.01.31 */
  const calculateScore = () => {
    if (!questions) return { correct: 0, total: 0 };

    let correct = 0;
    let total = 0;

    if (questions.fill_in_the_blanks) {
      questions.fill_in_the_blanks.forEach(q => {
        total++;
        if (checkAnswer(fillInAnswers[q.id] || '', q.answer, 'fill')) {
          correct++;
        }
      });
    }

    if (questions.true_false_not_given) {
      questions.true_false_not_given.forEach(q => {
        total++;
        if (checkAnswer(tfngAnswers[q.id] || '', q.answer, 'tfng')) {
          correct++;
        }
      });
    }

    return { correct, total };
  };

  const score = calculateScore();
  const wordCount = passage?.trim() ? passage.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-8xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          {t?.reading1Variation?.pageTitle || '雅思阅读练习'}
        </h1>

        {/* Topic Selection */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-6">
          <label className="block text-lg font-semibold mb-3 text-gray-700">
            {t?.selectTopic || '选择主题'}
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
        <div className="mb-6 flex gap-3">
          <button
            onClick={generatePassage}
            disabled={!selectedTopic || loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-md"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
            {passage ? (t?.reading1Variation?.regenerate || '重新生成文章') : (t?.reading1Variation?.generateSentenceTitle || '生成文章')}
          </button>
        </div>

        {/* Passage and Questions - Side by Side Layout */}
        {passage && questions && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side: Passage */}
            <div className="bg-white rounded-lg shadow-sm p-6 lg:sticky lg:top-4 lg:self-start">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                {passageTitle || '阅读文章 (Passage)'}
              </h2>
              <div className="h-px bg-gray-200 my-4"></div>
              <div className="max-h-[88vh] overflow-y-auto pr-2">
                <div className="prose max-w-none">
                  {passage.split('\n\n').map((para, idx) => (
                    <p key={idx} className="mb-4 text-gray-700 leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
                <span className={`text-sm font-semibold ${wordCount >= 150 ? 'text-green-600' : 'text-orange-600'}`}>
                  {t?.wordCount || 'Word Count'}: {wordCount}
                </span>
              </div>
            </div>

            {/* Right Side: Questions */}
            <div className="space-y-6">

              {/* True/False/Not Given */}
              {questions.true_false_not_given && questions.true_false_not_given.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-3">
                  <h2 className="text-xl font-semibold mb-1 text-gray-800">
                    {t?.reading1Variation?.tfngTitle || '判断题 (True/False/Not Given)'}
                  </h2>
                  <div className="space-y-4">
                    {questions.true_false_not_given.map((q, idx) => {
                      const isCorrect = checkAnswer(tfngAnswers[q.id] || '', q.answer, 'tfng');
                      return (
                        <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start gap-3 mb-2">
                            <span className="font-semibold text-gray-700 ">{idx + 1}.</span>
                            <p className="flex-1 text-gray-700">{q.statement}</p>
                            {submitted && (
                              <div>
                                {isCorrect ? (
                                  <CheckCircle className="text-green-500" size={24} />
                                ) : (
                                  <XCircle className="text-red-500" size={24} />
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mb-1">
                            {['TRUE', 'FALSE', 'NOT GIVEN'].map(option => (
                              <button
                                key={option}
                                onClick={() => setTfngAnswers({
                                  ...tfngAnswers,
                                  [q.id]: option
                                })}
                                disabled={submitted}
                                className={`px-4 py-2 rounded-lg border transition-all min-w-[6rem] ${tfngAnswers[q.id] === option
                                    ? submitted
                                      ? isCorrect
                                        ? 'bg-green-500 text-white border-green-500'
                                        : 'bg-red-500 text-white border-red-500'
                                      : 'bg-blue-500 text-white border-blue-500'
                                    : 'bg-white border-gray-300 hover:border-blue-400'
                                  } ${submitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                          {submitted && showAnswers && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-start gap-2 mb-2">
                                <span className="text-sm font-semibold text-gray-700">
                                  {t?.reading1Variation?.yourAnswer || '你的答案'}:
                                </span>
                                <span className={`text-sm font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                  {tfngAnswers[q.id] || '(未作答)'}
                                </span>
                              </div>
                              {!isCorrect && (
                                <div className="flex items-start gap-2 mb-2">
                                  <span className="text-sm font-semibold text-gray-700">
                                    {t?.reading1Variation?.correctAnswer || '正确答案'}:
                                  </span>
                                  <span className="text-sm font-bold text-green-600">
                                    {q.answer}
                                  </span>
                                </div>
                              )}
                              <div className="mt-2">
                                <span className="text-sm font-semibold text-gray-700">
                                  {t?.reading1Variation?.explanation || '解释'}:
                                </span>
                                <p className="text-sm text-gray-700 mt-1">{q.explanation}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fill in the Blanks */}
              {questions.fill_in_the_blanks && questions.fill_in_the_blanks.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-3 text-gray-800">
                    {t?.reading1Variation?.fillInBlanksTitle || '填空题 (Fill in the Blanks)'}
                  </h2>
                  <p className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded-lg">
                    {t?.reading1Variation?.fillInDesc || '根据文章内容填写空白处'}
                  </p>
                  <div className="space-y-4">
                    {questions.fill_in_the_blanks.map((q, idx) => {
                      const isCorrect = checkAnswer(fillInAnswers[q.id] || '', q.answer, 'fill');
                      return (
                        <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <span className="font-semibold text-gray-700 ">{idx + 1}.</span>
                            <p className="flex-1 text-gray-700">
                              {q.question.replace('[]', '_____')}
                            </p>
                            {submitted && (
                              <div>
                                {isCorrect ? (
                                  <CheckCircle className="text-green-500" size={24} />
                                ) : (
                                  <XCircle className="text-red-500" size={24} />
                                )}
                              </div>
                            )}
                          </div>
                          <input
                            type="text"
                            value={fillInAnswers[q.id] || ''}
                            onChange={(e) => setFillInAnswers({
                              ...fillInAnswers,
                              [q.id]: e.target.value
                            })}
                            disabled={submitted}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${submitted
                                ? isCorrect
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-red-500 bg-red-50'
                                : 'border-gray-300 focus:border-blue-500'
                              } ${submitted ? 'cursor-not-allowed' : ''}`}
                            placeholder={t?.reading1Variation?.answerPlaceholder || '请输入答案...'}
                          />
                          {submitted && showAnswers && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-start gap-2 mb-2">
                                <span className="text-sm font-semibold text-gray-700">
                                  {t?.reading1Variation?.yourAnswer || '你的答案'}:
                                </span>
                                <span className={`text-sm font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                  {fillInAnswers[q.id] || '(未作答)'}
                                </span>
                              </div>
                              {!isCorrect && (
                                <div className="flex items-start gap-2 mb-2">
                                  <span className="text-sm font-semibold text-gray-700">
                                    {t?.reading1Variation?.correctAnswer || '正确答案'}:
                                  </span>
                                  <span className="text-sm font-bold text-green-600">
                                    {q.answer}
                                  </span>
                                </div>
                              )}
                              <div className="mt-2">
                                <span className="text-sm font-semibold text-gray-700">
                                  {t?.reading1Variation?.explanation || '解释'}:
                                </span>
                                <p className="text-sm text-gray-700 mt-1">{q.explanation}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}



              {/* Submit Button */}
              {!submitted && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <button
                    onClick={handleSubmit}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-lg shadow-md"
                  >
                    {t?.reading1Variation?.submit || '提交答案'}
                  </button>
                </div>
              )}

              {/* Score Display */}
              {submitted && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2 text-gray-800">
                      {t?.reading1Variation?.score || '得分'}: {score.correct} / {score.total}
                    </h3>
                    <p className="text-lg text-gray-600 mb-4">
                      {t?.reading1Variation?.accuracy || '正确率'}: {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                    </p>
                    <button
                      onClick={() => setShowAnswers(!showAnswers)}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
                    >
                      {showAnswers ? <EyeOff size={20} /> : <Eye size={20} />}
                      {showAnswers ? (t?.reading1Variation?.hideAnswers || '隐藏答案解析') : (t?.reading1Variation?.showAnswers || '显示答案解析')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}