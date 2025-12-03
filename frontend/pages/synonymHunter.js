import { useState, useEffect,useMemo } from 'react';
import { RefreshCw, Loader2, Copy, Printer, CheckCircle, XCircle } from 'lucide-react';
import { start, submit } from "lib/client/services/taskService";
import { SUBTYPE_CORRECT, SUBTYPE_START } from 'lib/taskType';
import { toast } from "sonner";

// 同义词/反义词替换页面组件 - 改进版
export default function SynonymHunterPage({ type, translation, language }) {
    const [selectedTopic, setSelectedTopic] = useState('');
    const [article, setArticle] = useState('');
    const [passageTitle, setPassageTitle] = useState('');
    const [articleWithoutStyle, setAarticleWithoutStyle] = useState('');
    const [markedWords, setMarkedWords] = useState([]);
    const [userAnswers, setUserAnswers] = useState({});
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    /**作者:张立俊 1997.01.31 */
    const t = translation;

    // 自动生成 topic 列表
    const topics = useMemo(() => {
        return Object.entries(t?.domains || {})
            .filter(([key, value]) => typeof value === 'string' && key !== 'selectTopic')
            .map(([key, value]) => ({ value: key, label: value }));
    }, [t]);

    const STORAGE_KEY = 'synonymTask';

    const saveTaskToStorage = () => {
        const taskData = {
            selectedTopic,
            article,
            articleWithoutStyle,
            markedWords,
            userAnswers,
            feedback,
            submitted,
            passageTitle
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(taskData));
    };

    const clearTaskStorage = () => {
        localStorage.removeItem(STORAGE_KEY);
    };

    // 页面首次加载时读取缓存
    useEffect(() => {
        const savedTask = localStorage.getItem(STORAGE_KEY);
        if (savedTask) {
            try {
                const { selectedTopic,
                    article,
                    articleWithoutStyle,
                    markedWords,
                    userAnswers,
                    feedback,
                    submitted,
                    passageTitle
                } = JSON.parse(savedTask);

                if (selectedTopic) setSelectedTopic(selectedTopic);
                if (article) setArticle(article);
                if (articleWithoutStyle) setAarticleWithoutStyle(articleWithoutStyle);
                if (markedWords) setMarkedWords(markedWords);
                if (userAnswers) setUserAnswers(userAnswers);
                if (feedback) setFeedback(feedback);
                if (submitted) setSubmitted(submitted);
                if (passageTitle) setPassageTitle(passageTitle);
            } catch (err) {
                console.error('Failed to load task from storage:', err);
            }
        }
    }, [translation, language]);

    // 数据变动时自动保存缓存
    useEffect(() => {
        if (article) saveTaskToStorage();
    }, [selectedTopic, article, articleWithoutStyle, markedWords, userAnswers, feedback, submitted, passageTitle]);

    const generateArticle = async () => {
        if (!selectedTopic) return;

        setLoading(true);
        setArticle('');
        setPassageTitle('');
        setMarkedWords([]);
        setUserAnswers({});
        setFeedback(null);
        setSubmitted(false);
        clearTaskStorage();

        try {
            const res = await start({
                type,
                subtype: SUBTYPE_START,
                language,
                domain: selectedTopic
            });

            // 回填 markers（加彩色 + 下划线 + 粗体）
            let formatted = res.data.article;
            Object.entries(res.data.markers).forEach(([key, value]) => {
                const upperKey = key.toUpperCase(); // 统一大写
                const markerTag = `[${upperKey}]`;
                const replacement =
                    `<span style="color:#1d4ed8; text-decoration: underline; font-weight: bold;">(${upperKey})${value}</span>`;

                // 使用正则忽略大小写替换
                const regex = new RegExp(`\\[${key}\\]`, 'gi');
                formatted = formatted.replace(regex, replacement);
            });
            setArticle(formatted);

            // 去掉样式的版本
            let articleWithoutStyle = res.data.article;
            Object.entries(res.data.markers).forEach(([key, value]) => {
                const upperKey = key.toUpperCase();
                const replacement = `(${upperKey})${value}`;
                const regex = new RegExp(`\\[${key}\\]`, 'gi');
                articleWithoutStyle = articleWithoutStyle.replace(regex, replacement);
            });
            setAarticleWithoutStyle(articleWithoutStyle);

            // 标记数组
            const marked = Object.keys(res.data.markers).map((key, index) => ({
                id: key.toUpperCase(),
                marker: `(${key.toUpperCase()})`,
                index,
                answer: res.data.markers[key]
            }));
            setMarkedWords(marked);
            setPassageTitle(res.data.passage_title || '');

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        const allFilled = markedWords.every(word => userAnswers[word.id]?.trim());
        if (!allFilled) {
            toast.error(t?.synonymHunter?.fillAnswer);
            return;
        }

        setSubmitting(true);
        try {
            const res = await submit({
                type,
                subtype: SUBTYPE_CORRECT,
                language,
                original_article: articleWithoutStyle,
                answers: userAnswers
            });

            setFeedback(res.data);
            setSubmitted(true);

            const taskData = {
                selectedTopic,
                article,
                articleWithoutStyle,
                markedWords,
                userAnswers,
                feedback: res.data,
                submitted: true,
                passageTitle
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(taskData));

        } catch (err) {
            console.error(err);
            toast.error("提交失败，请稍后再试");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const isTrue = (v) => String(v).trim().toLowerCase() === "true";

    const checkAnswer = (wordId) => {
        if (!submitted || !feedback) return null;
        return isTrue(feedback.details?.[wordId]?.flag);
    };

    const calculateScore = () => {
        if (!feedback || !feedback.details) return { correct: 0, total: 0 };
        const detailEntries = Object.entries(feedback.details);
        const correctCount = detailEntries.filter(([key, value]) => isTrue(value.flag)).length;
        return { correct: correctCount, total: detailEntries.length };
    };

    const score = calculateScore();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
            <div className="max-w-8xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">
                    {t?.synonymHunter?.pageTitle}
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
                        onClick={generateArticle}
                        disabled={!selectedTopic || loading}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-md"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                        {article ? t?.synonymHunter?.regenerate : t?.synonymHunter?.generateArticle}
                    </button>
                </div>

                {/* 左右布局：左边文章，右边题目 */}
                {article && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 左侧：文章 */}
                        <div className="bg-white rounded-lg shadow-sm p-6 lg:sticky lg:top-4 lg:self-start">
                            <h2 className="text-2xl font-bold mb-2 text-gray-800">
                                {passageTitle || "Passage"}
                            </h2>
                            <div className="h-px bg-gray-200 my-4"></div>
                            <div className="max-h-[88vh] overflow-y-auto pr-2">
                                <p
                                    className="text-lg leading-relaxed whitespace-pre-wrap"
                                    dangerouslySetInnerHTML={{ __html: article }}
                                ></p>
                            </div>
                        </div>

                        {/* 右侧：答题区域 */}
                        <div className="space-y-4">
                            {/* 答题卡片 */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-xl font-semibold mb-3 text-gray-800">
                                    {t?.synonymHunter?.yourAnswer}
                                </h3>
                                <p className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded-lg">
                                    {t?.synonymHunter?.instruction || '请为每个标记的词提供同义词'}
                                </p>

                                <div className="space-y-1">
                                    {markedWords.map(word => {
                                        const isCorrect = checkAnswer(word.id);
                                        const feedbackDetail = feedback?.details?.[word.id];

                                        return (
                                            <div key={word.id} className="border border-gray-200 rounded-lg px-3 py-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="font-semibold text-lg text-gray-700 min-w-[3rem]">
                                                        {word.marker}
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={userAnswers[word.id] || ''}
                                                        onChange={(e) => setUserAnswers({ ...userAnswers, [word.id]: e.target.value })}
                                                        disabled={submitted}
                                                        className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none transition-all ${submitted
                                                            ? isCorrect
                                                                ? 'bg-green-50 border-green-500'
                                                                : 'bg-red-50 border-red-500'
                                                            : 'border-gray-300 focus:border-blue-500'
                                                            } ${submitted ? 'cursor-not-allowed' : ''}`}
                                                        placeholder={`${t?.synonymHunter?.yourAnswer}...`}
                                                    />
                                                    {submitted && (
                                                        <div>
                                                            {isCorrect ? (
                                                                <CheckCircle className="text-green-500" size={24} />
                                                            ) : (
                                                                <XCircle className="text-red-300" size={24} />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 提交后显示反馈 */}
                                                {submitted && feedbackDetail && (
                                                    <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                        <div className="flex items-start gap-2 mb-2">
                                                            <span className="text-sm font-semibold text-gray-700">
                                                                {t?.synonymHunter?.yourAnswer}:
                                                            </span>
                                                            <span className={`text-sm font-bold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                                                                {userAnswers[word.id]}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2">
                                                            <span className="text-md font-semibold text-gray-700">
                                                                {t?.synonymHunter?.feedback}:
                                                            </span>
                                                            <p className="text-md text-gray-700 mt-1">{feedbackDetail.detail}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 提交按钮 */}
                                {!submitted && (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="mt-6 w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold text-lg shadow-md"
                                    >
                                        {submitting && <Loader2 className="animate-spin" size={20} />}
                                        {submitting ? t?.synonymHunter?.submittingText : t?.synonymHunter?.submit}
                                    </button>
                                )}
                            </div>

                            {/* 成绩展示 */}
                            {submitted && feedback && (
                                <div className="bg-white rounded-lg shadow-sm p-6">
                                    <h3 className="text-xl font-semibold mb-4 text-gray-800">
                                        {t?.synonymHunter?.feedback}
                                    </h3>
                                    <div className="text-center mb-4">
                                        <div className="inline-block px-6 py-3 bg-blue-100 text-blue-800 rounded-lg font-bold text-2xl shadow-md">
                                            {t?.synonymHunter?.score}: {score.correct} / {score.total}
                                        </div>
                                        <p className="text-lg text-gray-600 mt-3">
                                            {t?.synonymHunter?.accuracy || '准确率'}: {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                                        </p>
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