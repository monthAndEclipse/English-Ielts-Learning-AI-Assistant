/**作者:张立俊 1997.01.31 */
import { useState, useEffect,useMemo } from 'react';
import { RefreshCw, Loader2, Copy, Printer, CheckCircle, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { start, submit } from "lib/client/services/taskService";
import { SUBTYPE_CORRECT, SUBTYPE_START } from 'lib/taskType';
import { toast } from "sonner";
// 段落仿写页面组件 - 改进版
export default function ParagraphVariationPage({ type, translation, language }) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [sentence, setSentence] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [extraAnswers, setExtraAnswers] = useState({
    A: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [examples, setExamples] = useState({});
  const [showModal, setShowModal] = useState(false);

  const t = translation;

  // 自动生成 topic 列表
    const topics = useMemo(() => {
        return Object.entries(t?.domains || {})
            .filter(([key, value]) => typeof value === 'string' && key !== 'selectTopic')
            .map(([key, value]) => ({ value: key, label: value }));
    }, [t]);

  // localStorage 辅助函数
  const STORAGE_KEY = 'paragraphVariationTask';

  const clearTaskStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  // 页面首次加载时读取缓存
  useEffect(() => {
    const savedTask = localStorage.getItem(STORAGE_KEY);
    if (savedTask) {
      try {
        const { selectedTopic, sentence, feedback, extraAnswers, submitted, examples } = JSON.parse(savedTask);
        if (selectedTopic) setSelectedTopic(selectedTopic);
        if (sentence) setSentence(sentence);
        if (feedback) setFeedback(feedback);
        if (extraAnswers) setExtraAnswers(extraAnswers);
        if (submitted) setSubmitted(submitted);
        if (examples) setExamples(examples);
      } catch (err) {
        console.error('Failed to load task from storage:', err);
      }
    }
  }, [translation, language]);

  // 数据变动时自动保存缓存
  useEffect(() => {
    if (sentence) {
      const taskData = {
        selectedTopic,
        sentence,
        feedback,
        extraAnswers,
        submitted,
        examples
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taskData));
    }
  }, [selectedTopic, sentence, feedback, extraAnswers, submitted, examples]);

  const generateSentence = async () => {
    if (!selectedTopic) return;

    setLoading(true);
    setSentence('');
    setFeedback(null);
    setExamples([]);
    setExtraAnswers({ A: "" });
    setSubmitted(false);
    clearTaskStorage();

    try {
      const res = await start({
        type,
        subtype: SUBTYPE_START,
        language,
        domain: selectedTopic
      });

      setSentence(res.data.paragraph);
      setExamples(res.data.examples);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const allFilled = Object.values(extraAnswers).every(ans => ans.trim() !== "");
      if (!allFilled) {
        toast.error(t?.paragraphVariation?.fillAllExtraAnswers || "请填写所有额外答案");
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

      const taskData = {
        selectedTopic,
        sentence,
        extraAnswers,
        feedback: res.data,
        submitted: true,
        examples
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taskData));

    } catch (err) {
      console.error(err);
      toast.error(t?.paragraphVariation?.submitFail || "提交失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-8xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          {t?.paragraphVariation?.pageTitle}
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
            onClick={generateSentence}
            disabled={!selectedTopic || loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-md"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
            {sentence ? t?.paragraphVariation?.regenerate : t?.paragraphVariation?.generateSentenceTitle}
          </button>
        </div>

        {/* 左右布局：左边原文，右边答题区域 */}
        {sentence && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：原段落 */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6  lg:top-4 lg:self-start">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">
                  {t?.paragraphVariation?.originalParagraph || "原段落"}
                </h2>
                <div className="h-px bg-gray-200 my-4"></div>
                <div className="max-h-[88vh] overflow-y-auto pr-2">
                  <p
                    className="text-lg leading-relaxed whitespace-pre-wrap"
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
                        {t?.paragraphVariation?.exampleParagraph || "示例段落"}
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

            {/* 右侧：答题区域 */}
            <div className="space-y-4">
              {/* 答题卡片 */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-3 text-gray-800">
                  {t?.paragraphVariation?.extraAnswersTitle || "你的仿写"}
                </h3>
                <div className="space-y-4">
                  {Object.entries(extraAnswers).map(([key, value]) => (
                    <div key={key}>
                      <textarea
                        value={value}
                        onChange={(e) => setExtraAnswers({ ...extraAnswers, [key]: e.target.value })}
                        className={`w-full px-4 py-4 border rounded-lg focus:outline-none transition-all border-gray-300 focus:border-blue-500`}
                        placeholder={`${t?.paragraphVariation?.yourAnswer || '你的答案'} ...`}
                        rows={6}
                      />
                    </div>
                  ))}
                </div>

                {/* 提交按钮 */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="mt-6 w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold text-lg shadow-md"
                >
                  {submitting && <Loader2 className="animate-spin" size={20} />}
                  {submitting ? t?.paragraphVariation?.submittingText : t?.paragraphVariation?.submit}
                </button>
              </div>

              {/* 反馈展示 */}
              {submitted && feedback && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <CheckCircle className="text-green-500" size={24} />
                    {t?.paragraphVariation?.feedback}
                  </h3>

                  <div className="space-y-4">
                    {/* 详细反馈 */}
                    {feedback.detail && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mt-0.5">
                            i
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-2">
                              {t?.paragraphVariation?.detailTitle || "详细反馈"}
                            </h4>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap whitespace-pre-line">
                              {feedback.detail}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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