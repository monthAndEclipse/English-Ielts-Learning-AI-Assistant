import { useState, useEffect,useMemo } from 'react';
import { Printer, XCircle, Eye, EyeOff } from 'lucide-react';
import { RefreshCw, Loader2, Send, CheckCircle, AlertCircle, Award, ChevronDown, ChevronUp, Lightbulb, BookOpen, Target, Copy } from 'lucide-react';
import { start, submit } from "lib/client/services/taskService";
import { SUBTYPE_CORRECT, SUBTYPE_START } from 'lib/taskType';
import { toast } from "sonner";

export default function SentenceVariationPage({ type, translation, language }) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [sentence, setSentence] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [examples, setExamples] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [extraAnswers, setExtraAnswers] = useState({
    A: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  const t = translation;

  const topics = useMemo(() => {
    return Object.entries(t?.domains || {})
      .filter(([key, value]) => typeof value === 'string' && key !== 'selectTopic')
      .map(([key, value]) => ({ value: key, label: value }));
  }, [t]);
/**作者:张立俊 1997.01.31 */
  const STORAGE_KEY = 'sentenceVariationTask';

  const clearTaskStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  useEffect(() => {
    const savedTask = localStorage.getItem(STORAGE_KEY);
    if (savedTask) {
      try {
        const { selectedTopic, sentence, feedback, examples,  extraAnswers, submitted } = JSON.parse(savedTask);
        if (selectedTopic) setSelectedTopic(selectedTopic);
        if (sentence) setSentence(sentence);
        if (feedback) setFeedback(feedback);
        if (examples) setExamples(examples);
        if (extraAnswers) setExtraAnswers(extraAnswers);
        if (submitted) setSubmitted(submitted);
      } catch (err) {
        console.error('Failed to load task from storage:', err);
      }
    }
  }, [translation, language]);

  useEffect(() => {
    if (sentence) {
      const taskData = {
        selectedTopic,
        sentence,
        feedback,
        examples,
        extraAnswers,
        submitted
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taskData));
    }
  }, [selectedTopic, sentence, feedback, examples, extraAnswers, submitted]);

  const generateSentence = async () => {
    if (!selectedTopic) return;

    setLoading(true);
    setSentence('');
    setFeedback(null);
    setExamples([]);
    setExtraAnswers({ A: "" });
    setSubmitted(false);
    setShowAnswers(false);
    clearTaskStorage();

    try {
      const res = await start({
        type,
        subtype: SUBTYPE_START,
        language,
        domain: selectedTopic
      });

      setSentence(res.data.sentence);
      setExamples(res.data.examples || {});
    } catch (err) {
      console.error(err);
      toast.error(t?.sentenceVariation?.generateFail || "生成失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const allFilled = Object.values(extraAnswers).every(ans => ans.trim() !== "");
      if (!allFilled) {
        toast.error(t?.sentenceVariation?.fillAllExtraAnswers || "请填写所有额外答案");
        return;
      }

      const res = await submit({
        type,
        subtype: SUBTYPE_CORRECT,
        language,
        original_article: sentence,
        answers: extraAnswers,
      });

      setFeedback(res.data);
      setSubmitted(true);
      setShowAnswers(true);

      const taskData = {
        selectedTopic,
        sentence,
        extraAnswers,
        examples,
        feedback: res.data,
        submitted: true
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taskData));
      toast.success(t?.sentenceVariation?.submitSuccess || "提交成功！");

    } catch (err) {
      console.error(err);
      toast.error(t?.sentenceVariation?.submitFail || "提交失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  };


  const handlePrint = () => {
    window.print();
  };

  const isTrue = (v) => String(v).trim().toLowerCase() === "true";

  const checkAnswer = (key) => {
    if (!submitted || !feedback?.details?.[key]) return null;
    return isTrue(feedback.details[key].flag);
  };

  const calculateScore = () => {
    if (!feedback?.details) return { correct: 0, total: 0 };
    const entries = Object.entries(feedback.details);
    const correct = entries.filter(([_, v]) => isTrue(v.flag)).length;
    return { correct, total: entries.length };
  };

  const score = calculateScore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-8xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          {t?.sentenceVariation?.pageTitle || "句子仿写"}
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
        <div className="mb-6 flex gap-3">
          <button
            onClick={generateSentence}
            disabled={!selectedTopic || loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-md"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
            {sentence ? (t?.sentenceVariation?.regenerate || "重新生成") : (t?.sentenceVariation?.generateSentenceTitle || "生成句子")}
          </button>
        </div>

        {sentence && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side: Original Sentence + examples*/}
            <div className="flex flex-col gap-6">
              {/* 原句卡片 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  {t?.sentenceVariation?.originalSentence || "原句"}
                </h2>
                <div className="h-px bg-gray-200 my-4"></div>
                <div className="max-h-[40vh] overflow-y-auto">
                  <p
                    className="text-lg leading-relaxed whitespace-pre-wrap text-gray-700"
                    dangerouslySetInnerHTML={{ __html: sentence }}
                  ></p>
                </div>
              </div>

              {examples && examples.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-3">
                  <button
                    onClick={() => setShowModal(!showModal)}
                    className="w-full px-1 py-1 hover:bg-gray-100 transition-colors text-gray-700 font-medium flex items-center justify-between rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <Lightbulb className="text-yellow-500" size={24} />
                      <h3 className="text-lg font-semibold text-gray-800">
                        {t?.sentenceVariation?.exampleTitle || "示例句"}
                      </h3>
                    </div>
                    {showModal ? (
                      <ChevronUp className="text-gray-500" size={20} />
                    ) : (
                      <ChevronDown className="text-gray-500" size={20} />
                    )}
                  </button>

                  {showModal && (
                    <div className="mt-4 max-h-[80vh] overflow-y-auto p-2">
                      {examples.map((sentence, idx) => (
                        <div
                          key={idx}
                          className="mb-3 px-3 py-2 rounded bg-gray-50 text-gray-700 text-md"
                        >
                          {sentence}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>




            {/* Right Side: Answer Area */}
            <div className="space-y-6">
              {/* Answer Input Section */}
              {examples && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-3 text-gray-800">
                    {t?.sentenceVariation?.extraAnswersTitle || "你的仿写"}
                  </h2>
                  <div className="space-y-4">
                    {Object.entries(extraAnswers).map(([key, value], idx) => {
                      const isCorrect = checkAnswer(key);

                      return (
                        <div key={key} className=" rounded-lg p-1">
                          <div className="flex items-center gap-3 mb-3">

                            {submitted && isCorrect !== null && (
                              <div>
                                {isCorrect ? (
                                  <CheckCircle className="text-green-500" size={24} />
                                ) : (
                                  <XCircle className="text-red-500" size={24} />
                                )}
                              </div>
                            )}
                          </div>

                          <textarea
                            value={value}
                            onChange={(e) => setExtraAnswers({ ...extraAnswers, [key]: e.target.value })}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500 text-base bg-white`}
                            placeholder={`${t?.sentenceVariation?.yourAnswer || "你的答案"}...`}
                            rows={3}
                          />
                          {/* Submit Button */}
                          <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="mt-6 w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold text-lg shadow-md"
                          >
                            {submitting && <Loader2 className="animate-spin" size={20} />}
                            {submitting ? (t?.sentenceVariation?.submittingText || "提交中...") : (t?.sentenceVariation?.submit || "提交答案")}
                          </button>
                          {/* Show feedback after submission */}
                          {submitted && feedback?.details?.[key] && !submitting && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="mb-2">
                                <span className="text-md font-semibold text-gray-700">
                                  {isCorrect
                                    ? (t?.sentenceVariation?.correct || "正确")
                                    : (t?.sentenceVariation?.incorrect || "需要改进")}
                                </span>
                              </div>
                              <div className="mt-3 mb-3">
                                <span className="text-md font-semibold text-gray-700">
                                  {t?.sentenceVariation?.feedback || "反馈"}:
                                </span>
                                <p className="text-md text-gray-700 mt-1 whitespace-pre-line">
                                  {feedback.details[key].detail}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
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