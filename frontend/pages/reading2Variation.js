import { useState, useEffect,useMemo } from 'react';
import { RefreshCw, Loader2, Copy, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { start } from "lib/client/services/taskService";
import { SUBTYPE_START } from 'lib/taskType';

export default function Reading2VariationPage({ type, translation, language }) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [passage, setPassage] = useState(null);
  const [passageTitle, setPassageTitle] = useState('');
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const t = translation;
  const topics = useMemo(() => {
    return Object.entries(t?.domains || {})
      .filter(([key, value]) => typeof value === 'string' && key !== 'selectTopic')
      .map(([key, value]) => ({ value: key, label: value }));
  }, [t]);

  const STORAGE_KEY = 'ieltsReading2Task';

  // 加载缓存
  useEffect(() => {
    const savedTask = localStorage.getItem(STORAGE_KEY);
    if (savedTask) {
      try {
        const data = JSON.parse(savedTask);
        if (data.selectedTopic) setSelectedTopic(data.selectedTopic);
        if (data.passage) setPassage(data.passage);
        if (data.questions) setQuestions(data.questions);
        if (data.userAnswers) setUserAnswers(data.userAnswers);
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
      const taskData = { selectedTopic, passage, questions, userAnswers, submitted,passageTitle, };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taskData));
    }
  }, [selectedTopic, passage, questions, userAnswers, submitted,passageTitle]);

  const generatePassage = async () => {
    if (!selectedTopic) return;

    setLoading(true);
    setPassage(null);
    setPassageTitle('');
    setQuestions(null);
    setUserAnswers({});
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

  const handleCopy = () => {
    if (!passage || !questions) return;
    let content = '';
    Object.entries(passage).forEach(([key, text]) => {
      content += `Paragraph ${key}:\n${text}\n\n`;
    });
    content += '\nQuestions:\n';
    questions.matching_information?.forEach((q, i) => {
      content += `${i + 1}. ${q.statement}\nYour Answer: ${userAnswers[q.id] || '(Not answered)'}\n\n`;
    });
    navigator.clipboard.writeText(content);
  };

  const checkAnswer = (userAnswer, correctAnswer) => {
    if (!submitted) return null;
    return userAnswer === correctAnswer;
  };

  const calculateScore = () => {
    if (!questions?.matching_information) return { correct: 0, total: 0 };

    let correct = 0;
    const total = questions.matching_information.length;

    questions.matching_information.forEach(q => {
      if (checkAnswer(userAnswers[q.id], q.answer)) {
        correct++;
      }
    });

    return { correct, total };
  };

  const score = calculateScore();
  const paragraphLabels = passage ? Object.keys(passage) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-8xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          {t?.reading2Variation?.pageTitle}
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
            {passage ? t?.reading2Variation?.regenerate : t?.reading2Variation?.generateSentenceTitle}
          </button>
        </div>

        {passage && questions && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side: Passage */}
            <div className="bg-white rounded-lg shadow-sm p-6 lg:sticky lg:top-4 lg:self-start">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                {passageTitle || '阅读文章 (Passage)'}
              </h2>
              <div className="space-y-4 max-h-[88vh] overflow-y-auto pr-2">
                {Object.entries(passage).map(([key, text]) => (
                  <div key={key} className="border-l-4 border-blue-500 pl-4">
                    <div className="text-sm font-bold text-blue-600 mb-2">
                      Paragraph {key}
                    </div>
                    <p className="text-gray-700 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side: Questions */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-3 text-gray-800">
                  {t?.reading2Variation?.matchingInfoTitle}
                </h2>

                <div className="space-y-4">
                  {questions.matching_information?.map((q, idx) => {
                    const isCorrect = checkAnswer(userAnswers[q.id], q.answer);
                    return (
                      <div key={q.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="font-semibold text-gray-700 ">
                            {idx + 1}.
                          </span>
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
                          {paragraphLabels.map(label => (
                            <button
                              key={label}
                              onClick={() => !submitted && setUserAnswers({
                                ...userAnswers,
                                [q.id]: label
                              })}
                              disabled={submitted}
                              className={`px-4 py-2 rounded-lg border transition-all min-w-[3rem] ${userAnswers[q.id] === label
                                  ? submitted
                                    ? isCorrect
                                      ? 'bg-green-500 text-white border-green-500'
                                      : 'bg-red-500 text-white border-red-500'
                                    : 'bg-blue-500 text-white border-blue-500'
                                  : 'bg-white border-gray-300 hover:border-blue-400'
                                } ${submitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>

                        {submitted && showAnswers && (
                          <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-sm font-semibold text-gray-700">
                                {t?.reading2Variation?.yourAnswer}:
                              </span>
                              <span className={`text-sm font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                {userAnswers[q.id] || '(Not answered)'}
                              </span>
                            </div>
                            {!isCorrect && (
                              <div className="flex items-start gap-2 mb-2">
                                <span className="text-sm font-semibold text-gray-700">
                                  {t?.reading2Variation?.correctAnswer}:
                                </span>
                                <span className="text-sm font-bold text-green-600">
                                  {q.answer}
                                </span>
                              </div>
                            )}
                            <p className="text-sm text-gray-700 mt-2">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              {!submitted && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <button
                    onClick={handleSubmit}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-lg shadow-md"
                  >
                    {t?.reading2Variation?.submit}
                  </button>
                </div>
              )}

              {/* Score Display */}
              {submitted && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2 text-gray-800">
                      {t?.reading2Variation?.score}: {score.correct} / {score.total}
                    </h3>
                    <p className="text-lg text-gray-600 mb-4">
                      {t?.reading2Variation?.accuracy}: {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                    </p>
                    <button
                      onClick={() => setShowAnswers(!showAnswers)}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
                    >
                      {showAnswers ? <EyeOff size={20} /> : <Eye size={20} />}
                      {showAnswers ? (t?.reading2Variation?.hideAnswers|| 'Hide Answers') : (t?.reading2Variation?.showAnswers|| 'Show Answers')}
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