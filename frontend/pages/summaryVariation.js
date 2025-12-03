import { useState, useEffect,useMemo } from 'react';
import { RefreshCw, Loader2, Copy, Printer, CheckCircle, XCircle, Eye, EyeOff, Award, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { start, submit } from "lib/client/services/taskService";
import { SUBTYPE_CORRECT, SUBTYPE_START } from 'lib/taskType';
import { toast } from "sonner";

export default function SummaryVariationPage({ type, translation, language }) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [sentence, setSentence] = useState('');
  const [passageTitle, setPassageTitle] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [extraAnswers, setExtraAnswers] = useState({ A: "" });
  const [submitted, setSubmitted] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [examples, setExamples] = useState({});
  const [showModal, setShowModal] = useState(false);
  const t = translation;

  const topics = useMemo(() => {
    return Object.entries(t?.domains || {})
      .filter(([key, value]) => typeof value === 'string' && key !== 'selectTopic')
      .map(([key, value]) => ({ value: key, label: value }));
  }, [t]);

  const STORAGE_KEY = 'summaryVariationTask';

  const clearTaskStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  useEffect(() => {
    const savedTask = localStorage.getItem(STORAGE_KEY);
    if (savedTask) {
      try {
        const { selectedTopic, sentence, feedback, extraAnswers, submitted, passageTitle, examples } = JSON.parse(savedTask);
        if (selectedTopic) setSelectedTopic(selectedTopic);
        if (sentence) setSentence(sentence);
        if (feedback) setFeedback(feedback);
        if (extraAnswers) setExtraAnswers(extraAnswers);
        if (submitted) setSubmitted(submitted);
        if (passageTitle) setPassageTitle(passageTitle);
        if (examples) setExamples(examples);
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
        extraAnswers,
        passageTitle,
        submitted,
        examples
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taskData));
    }
  }, [selectedTopic, sentence, feedback, extraAnswers, submitted, examples, passageTitle]);

  const generateSentence = async () => {
    if (!selectedTopic) return;

    setLoading(true);
    setSentence('');
    setPassageTitle('');
    setFeedback(null);
    setExtraAnswers({ A: "" });
    setSubmitted(false);
    setShowAnswers(false);
    setExamples([]);
    clearTaskStorage();

    try {
      const res = await start({
        type,
        subtype: SUBTYPE_START,
        language,
        domain: selectedTopic
      });

      setSentence(res.data.article);
      setPassageTitle(res.data.passage_title || '');
      setExamples(res.data.examples || []);
    } catch (err) {
      console.error(err);
      toast.error(t?.summaryVariation?.generateFail || "生成失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const allFilled = Object.values(extraAnswers).every(ans => ans.trim() !== "");
      if (!allFilled) {
        toast.error(t?.summaryVariation?.fillAllExtraAnswers || "请填写所有答案");
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
        feedback: res.data,
        passageTitle,
        submitted: true,
        examples
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taskData));
      toast.success(t?.summaryVariation?.submitSuccess || "提交成功！");

    } catch (err) {
      console.error(err);
      toast.error(t?.summaryVariation?.submitFail || "提交失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-8xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          {t?.summaryVariation?.pageTitle || "文章总结"}
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
            {sentence ? (t?.summaryVariation?.regenerate || "重新生成") : (t?.summaryVariation?.generateSentenceTitle || "生成文章")}
          </button>
        </div>

        {sentence && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side: Article */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  {passageTitle || "原文"}
                </h2>
                <div className="h-px bg-gray-200 my-4"></div>
                <div className="max-h-[70vh] overflow-y-auto">
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
                        {t?.summaryVariation?.exampleParagraph || "示例总结"}
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
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-1 text-gray-800">
                  {t?.summaryVariation?.extraAnswersTitle || "你的总结"}
                </h2>


                <div className="space-y-4">
                  <div className="p-3">
                    <div className="flex items-center gap-3 mb-3">
                      {submitted && feedback && (
                        <div>
                          {feedback.score && (
                            <Award className="text-yellow-500" size={24} />
                          )}
                        </div>
                      )}
                    </div>

                    <textarea
                      value={extraAnswers.A}
                      onChange={(e) => setExtraAnswers({ ...extraAnswers, A: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500 text-base bg-white"
                      placeholder={`${t?.summaryVariation?.yourAnswer || "你的总结"}...`}
                      rows={8}
                    />

                    {/* Submit Button */}
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="mt-6 w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold text-lg shadow-md"
                    >
                      {submitting && <Loader2 className="animate-spin" size={20} />}
                      {submitting ? (t?.summaryVariation?.submittingText || "提交中...") : (t?.summaryVariation?.submit || "提交答案")}
                    </button>
                    {/* Show feedback after submission */}
                    {submitted &&  feedback && !submitting && (
                      <div className="mt-4 space-y-4">
          

                        {/* Detailed Feedback */}
                        {feedback.detail && (
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mt-0.5">
                                i
                              </div>
                              <div className="flex-1">
                                <span className="text-md font-semibold text-gray-700">
                                  {t?.summaryVariation?.feedback || "详细反馈"}:
                                </span>
                                <p className="text-md text-gray-700 mt-2 leading-relaxed whitespace-pre-wrap whitespace-pre-line">
                                  {feedback.detail}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

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
  );
}