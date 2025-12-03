import { useState, useEffect,useMemo } from 'react';
import { RefreshCw, Loader2, Copy, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { SUBTYPE_START } from 'lib/taskType';
import { start } from "lib/client/services/taskService";

export default function Reading3VariationPage({ type, translation, language }) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [taskData, setTaskData] = useState(null);
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
  const STORAGE_KEY = 'ieltsReading3Task';

  // Load from cache
  useEffect(() => {
    const savedTask = localStorage.getItem(STORAGE_KEY);
    if (savedTask) {
      try {
        const data = JSON.parse(savedTask);
        if (data.selectedTopic) setSelectedTopic(data.selectedTopic);
        if (data.taskData) setTaskData(data.taskData);
        if (data.userAnswers) setUserAnswers(data.userAnswers);
        if (data.submitted) setSubmitted(data.submitted);
      } catch (err) {
        console.error('Failed to load from storage:', err);
      }
    }
  }, []);

  // Save to cache
  useEffect(() => {
    if (taskData) {
      const cacheData = { selectedTopic, taskData, userAnswers, submitted };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
    }
  }, [selectedTopic, taskData, userAnswers, submitted]);

  const generatePassage = async () => {
    if (!selectedTopic) return;

    setLoading(true);
    setTaskData(null);
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
      setTaskData(res.data);
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

  const checkAnswer = (questionId, userAnswer, correctAnswer) => {
    if (!submitted) return null;
    return userAnswer === correctAnswer;
  };

  const calculateScore = () => {
    if (!taskData) return { correct: 0, total: 0 };

    let correct = 0;
    let total = 0;

    // MCQ questions
    taskData.mcq.questions.forEach(q => {
      total++;
      if (checkAnswer(`mcq-${q.id}`, userAnswers[`mcq-${q.id}`], q.correct_answer)) {
        correct++;
      }
    });

    // True/False/Not Given questions
    taskData.true_false_not_given.forEach(q => {
      total++;
      if (checkAnswer(`tfng-${q.id}`, userAnswers[`tfng-${q.id}`], q.correct_answer)) {
        correct++;
      }
    });
    /**作者:张立俊 1997.01.31 */
    return { correct, total };
  };

  const score = calculateScore();

  return (
    <div className="min-h-screen  bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50  p-4 md:p-8">
      <div className="max-w-8xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          {t?.reading3Variation?.pageTitle || 'IELTS Reading Practice - Passage 3'}
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
            {taskData ? (t?.reading3Variation?.regenerate || 'Regenerate') : (t?.reading3Variation?.generateSentenceTitle || 'Generate Passage')}
          </button>
        </div>

        {taskData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side: Passage */}
            <div className="bg-white rounded-lg shadow-sm p-6 lg:sticky lg:top-4 lg:self-start">
              <h2 className="text-2xl font-bold mb-2 text-gray-800">
                {taskData.title}
              </h2>
              <div className="h-px bg-gray-200 my-4"></div>
              <div className="max-h-[88vh] overflow-y-auto pr-2">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {taskData.passage}
                </p>
              </div>
            </div>

            {/* Right Side: Questions */}
            <div className="space-y-6">

              {/* True/False/Not Given Section */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-xl font-semibold mb-3 text-gray-800">
                  {t?.reading3Variation?.tfngTitle || 'True / False / Not Given'}
                </h2>
                <div className="space-y-4">
                  {taskData.true_false_not_given.map((q, idx) => {
                    const questionId = `tfng-${q.id}`;
                    const isCorrect = checkAnswer(questionId, userAnswers[questionId], q.correct_answer);

                    return (
                      <div key={q.id} className="border border-gray-200 rounded-lg p-2">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="font-semibold text-gray-700 min-w-[1rem]">
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

                        <div className="flex flex-wrap gap-2 mb-3">
                          {['TRUE', 'FALSE', 'NOT GIVEN'].map(option => (
                            <button
                              key={option}
                              onClick={() => !submitted && setUserAnswers({
                                ...userAnswers,
                                [questionId]: option
                              })}
                              disabled={submitted}
                              className={`px-4 py-2 rounded-lg border transition-all min-w-[6rem] ${userAnswers[questionId] === option
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
                          <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-sm font-semibold text-gray-700">
                                {t?.reading3Variation?.yourAnswer || 'Your Answer'}:
                              </span>
                              <span className={`text-sm font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                {userAnswers[questionId] || '(Not answered)'}
                              </span>
                            </div>
                            {!isCorrect && (
                              <div className="flex items-start gap-2 mb-2">
                                <span className="text-sm font-semibold text-gray-700">
                                  {t?.reading3Variation?.correctAnswer || 'Correct Answer'}:
                                </span>
                                <span className="text-sm font-bold text-green-600">
                                  {q.correct_answer}
                                </span>
                              </div>
                            )}
                            <div className="mt-2">
                              <span className="text-sm font-semibold text-gray-700">
                                {t?.reading3Variation?.explanation || 'Explanation'}:
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

              {/* MCQ Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-3 text-gray-800">
                  {t?.reading3Variation?.mcqTitle || 'Multiple Choice Questions'}
                </h2>
                <div className="space-y-6">
                  {taskData.mcq.questions.map((q, idx) => {
                    const questionId = `mcq-${q.id}`;
                    const isCorrect = checkAnswer(questionId, userAnswers[questionId], q.correct_answer);

                    return (
                      <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="font-semibold text-gray-700 ">
                            {idx + 1}.
                          </span>
                          <p className="flex-1 text-gray-700 font-medium">{q.title}</p>
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

                        <div className="space-y-2 ml-8">
                          {Object.entries(q.options).map(([key, value]) => {
                            const isSelected = userAnswers[questionId] === key;
                            const isCorrectOption = q.correct_answer === key;

                            return (
                              <button
                                key={key}
                                onClick={() => !submitted && setUserAnswers({
                                  ...userAnswers,
                                  [questionId]: key
                                })}
                                disabled={submitted}
                                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${isSelected
                                    ? submitted
                                      ? isCorrect
                                        ? 'bg-green-100 border-green-500 text-green-900'
                                        : 'bg-red-100 border-red-500 text-red-900'
                                      : 'bg-blue-100 border-blue-500 text-blue-900'
                                    : submitted && isCorrectOption
                                      ? 'bg-green-50 border-green-300'
                                      : 'bg-white border-gray-300 hover:border-blue-400'
                                  } ${submitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <span className="font-semibold mr-2">{key}.</span>
                                {value}
                              </button>
                            );
                          })}
                        </div>

                        {submitted && showAnswers && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 ml-8">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-sm font-semibold text-gray-700">
                                {t?.reading3Variation?.yourAnswer || 'Your Answer'}:
                              </span>
                              <span className={`text-sm font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                {userAnswers[questionId] || '(Not answered)'}
                              </span>
                            </div>
                            {!isCorrect && (
                              <div className="flex items-start gap-2 mb-2">
                                <span className="text-sm font-semibold text-gray-700">
                                  {t?.reading3Variation?.correctAnswer || 'Correct Answer'}:
                                </span>
                                <span className="text-sm font-bold text-green-600">
                                  {q.correct_answer}
                                </span>
                              </div>
                            )}
                            <div className="mt-2">
                              <span className="text-sm font-semibold text-gray-700">
                                {t?.reading3Variation?.explanation || 'Explanation'}:
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



              {/* Submit Button */}
              {!submitted && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <button
                    onClick={handleSubmit}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-lg shadow-md"
                  >
                    {t?.reading3Variation?.submit || 'Submit Answers'}
                  </button>
                </div>
              )}

              {/* Score Display */}
              {submitted && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2 text-gray-800">
                      {t?.reading3Variation?.score || 'Score'}: {score.correct} / {score.total}
                    </h3>
                    <p className="text-lg text-gray-600 mb-4">
                      {t?.reading3Variation?.accuracy || 'Accuracy'}: {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                    </p>
                    <button
                      onClick={() => setShowAnswers(!showAnswers)}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
                    >
                      {showAnswers ? <EyeOff size={20} /> : <Eye size={20} />}
                      {showAnswers ? (t?.reading3Variation?.hideAnswers || 'Hide Answers') : (t?.reading3Variation?.showAnswers || 'Show Answers')}
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