import { useState, useEffect,useMemo } from 'react';
import { Printer, Copy, Loader2, Send, ArrowUp, Sparkles, Target, Award, TrendingUp } from 'lucide-react';
import { SUBTYPE_START, SUBTYPE_CORRECT } from 'lib/taskType';
import { start, submit } from "lib/client/services/taskService";
import { toast } from "sonner";

export default function SentenceUpgradePage({ type, translation, language }) {
  const [userSentence, setUserSentence] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const t = translation 
  const STORAGE_KEY = 'sentenceUpgradeTask';

  useEffect(() => {
    const savedTask = localStorage.getItem(STORAGE_KEY);
    if (savedTask) {
      try {
        const { userSentence, results, submitted } = JSON.parse(savedTask);
        if (userSentence) setUserSentence(userSentence);
        if (results) setResults(results);
        if (submitted) setSubmitted(submitted);
      } catch (err) {
        console.error('Failed to load task from storage:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (userSentence || results) {
      const taskData = { userSentence, results, submitted };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taskData));
    }
  }, [userSentence, results, submitted]);

  const handleSubmit = async () => {
    if (!userSentence.trim()) {
      toast.error(t?.sentenceUpgradePage?.enterSentence || "请输入要升级的句子");
      return;
    }

    setLoading(true);
    try {
      const res = await submit({
        type,
        subtype: SUBTYPE_CORRECT,
        language,
        answers: { text: userSentence },
      });
      setResults(res.data);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("升级失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setUserSentence('');
    setResults(null);
    setSubmitted(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const bandConfigs = [
    {
      key: 'band6',
      title: t?.sentenceUpgradePage?.band6Title || 'Band 6 版本',
      color: 'blue',
      icon: Target
    },
    {
      key: 'band7', 
      title: t?.sentenceUpgradePage?.band7Title || 'Band 7 版本',
      color: 'purple',
      icon: TrendingUp
    },
    {
      key: 'band8',
      title: t?.sentenceUpgradePage?.band8Title || 'Band 8 版本',
      color: 'green',
      icon: Award
    }
    /**作者:张立俊 1997.01.31 */
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-8xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Sparkles className="text-purple-500" size={32} />
            {t?.sentenceUpgradePage?.pageTitle || "句子升级"}
          </h1>
          {submitted && (
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 shadow-sm"
              >
                <ArrowUp size={18} />
                 {t?.sentenceUpgradePage?.newSentence || "New sentence"}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：用户输入区域 */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Send size={24} className="text-blue-500" />
                {t?.sentenceUpgradePage?.inputTitle || "输入你的句子"}
              </h2>
              <div className="h-px bg-gray-200 my-4"></div>
              
              <textarea
                value={userSentence}
                onChange={(e) => setUserSentence(e.target.value)}
                disabled={submitted}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500 text-base min-h-[300px] ${
                  submitted ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                }`}
                placeholder={t?.sentenceUpgradePage?.inputPlaceholder || "请输入你想要升级的英文句子..."}
              />

              {!submitted && (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !userSentence.trim()}
                  className="mt-4 w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-semibold text-lg shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      {t?.sentenceUpgradePage?.submitting || "升级中..."}
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      {t?.sentenceUpgradePage?.submit || "升级句子"}
                    </>
                  )}
                </button>
              )}

              {submitted && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-700 font-semibold">
                    <Award size={20} />
                    {t?.sentenceUpgradePage?.upgraded || "已升级"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：升级结果展示 */}
          <div className="space-y-4">
            {!results && !loading && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Sparkles size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400 text-lg">
                  输入句子后，这里将显示升级结果
                </p>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Loader2 size={64} className="mx-auto text-blue-500 animate-spin mb-4" />
                <p className="text-gray-600 text-lg">
                  {t?.sentenceUpgradePage?.submitting|| "升级中..."}
                </p>
              </div>
            )}

            {results && bandConfigs.map((config) => {
              const data = results[config.key];
              const Icon = config.icon;
              const colorClasses = {
                blue: 'border-blue-200 bg-blue-50',
                purple: 'border-purple-200 bg-purple-50',
                green: 'border-green-200 bg-green-50'
              };
              const iconColors = {
                blue: 'text-blue-500',
                purple: 'text-purple-500',
                green: 'text-green-500'
              };

              return (
                <div key={config.key} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-l-current" style={{ borderLeftColor: config.color === 'blue' ? '#3b82f6' : config.color === 'purple' ? '#a855f7' : '#22c55e' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Icon size={24} className={iconColors[config.color]} />
                      {config.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold text-sm">
                        {t?.sentenceUpgradePage?.score || "评分"}: {data.score}
                      </span>
                      <button
                        onClick={() => handleCopy(data.sentence, config.title)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="复制"
                      >
                        <Copy size={18} className="text-gray-600" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-2">
                    <p className="text-gray-700 leading-relaxed text-base bg-gray-50 p-4 rounded-lg">
                      {data.sentence}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg ${colorClasses[config.color]}`}>
                    <span className="text-sm font-semibold text-gray-700 block mb-2">
                      {t?.sentenceUpgradePage?.improvements || "改进说明"}:
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {data.improvements}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}