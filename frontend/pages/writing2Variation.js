import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Loader2, Send, CheckCircle, AlertCircle, Award, ChevronDown, ChevronUp, Lightbulb, BookOpen, Target } from 'lucide-react';
import { SUBTYPE_START, SUBTYPE_CORRECT } from 'lib/taskType';
import { start, submit } from "lib/client/services/taskService";

export default function Writing2VariationPage({ type, translation, language }) {
  const [selectedQuestionType, setSelectedQuestionType] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [taskData, setTaskData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userText, setUserText] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [showStanceHints, setShowStanceHints] = useState(true);
  const [showOutlineHints, setShowOutlineHints] = useState(true);


  const t = translation ?? {};

  const topics = useMemo(() => {
    return Object.entries(t?.domains || {})
      .filter(([key, value]) => typeof value === 'string' && key !== 'selectTopic')
      .map(([key, value]) => ({ value: key, label: value }));
  }, [t]);


  const questionTypes = useMemo(() => {
    return Object.entries(t?.questionTypes || {})
      .filter(([key, value]) => typeof value === 'string')
      .map(([key, value]) => ({ value: key, label: value }));
  }, [t]);

  const STORAGE_KEY = 'ieltsWriting2Task';

  // Load from localStorage
  useEffect(() => {
    const savedTask = localStorage.getItem(STORAGE_KEY);
    if (savedTask) {
      try {
        const data = JSON.parse(savedTask);
        if (data.selectedTopic) setSelectedTopic(data.selectedTopic);
        if (data.selectedQuestionType) setSelectedQuestionType(data.selectedQuestionType);
        if (data.taskData) setTaskData(data.taskData);
        if (data.userText) setUserText(data.userText);
        if (data.feedback) setFeedback(data.feedback);
      } catch (err) {
        console.error('Failed to load from storage:', err);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (taskData) {
      const cacheData = { selectedTopic, selectedQuestionType, taskData, userText, feedback };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
    }
  }, [selectedTopic, selectedQuestionType, taskData, userText, feedback]);

  const generateTask = async () => {
    if (!selectedTopic || !selectedQuestionType) return;

    setLoading(true);
    setTaskData(null);
    setUserText('');
    setFeedback(null);
    localStorage.removeItem(STORAGE_KEY);

    try {
      // Simulate API call - replace with actual API call
      const res = await start({
        type,
        subtype: SUBTYPE_START,
        language,
        question_type: selectedQuestionType,
        domain: selectedTopic,
      });
      setTaskData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!userText.trim()) return;

    setSubmitting(true);
    try {
      // Simulate API call - replace with actual API call
      const res = await submit({
        type,
        subtype: SUBTYPE_CORRECT,
        language,
        question_type: selectedQuestionType,
        original_article: taskData.question,
        answers: { text: userText },
      });
      setFeedback(res.data);
      const data = {
        selectedTopic,
        userText,
        selectedQuestionType,
        taskData,
        feedback: res.data
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const wordCount = userText?.trim() ? userText.trim().split(/\s+/).length : 0;

  // Render stance hints based on question type
  const renderStanceHints = () => {
    if (!taskData || !taskData.stance_hint) return null;

    const { stance_hint, question_type } = taskData;


    // 1. Opinion (Agree/Disagree)
    if (question_type === 'opinion') {
      return (
        <div className="space-y-4">
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <Target size={16} />
              Totally Agree
            </h4>
            <ul className="space-y-1 text-sm text-green-800">
              {Object.entries(stance_hint.possible_positions.total_agree).map(([key, value]) => (
                <li key={key} className="pl-4">• {value}</li>
              ))}
            </ul>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <Target size={16} />
              Partially Agree
            </h4>
            <ul className="space-y-1 text-sm text-yellow-800">
              {Object.entries(stance_hint.possible_positions.partial_agree).map(([key, value]) => (
                <li key={key} className="pl-4">• {value}</li>
              ))}
            </ul>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
              <Target size={16} />
              Disagree
            </h4>
            <ul className="space-y-1 text-sm text-red-800">
              {Object.entries(stance_hint.possible_positions.disagree).map(([key, value]) => (
                <li key={key} className="pl-4">• {value}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }


    if (question_type === 'discussion') {
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Target size={16} />
              Viewpoint A
            </h4>
            <ul className="space-y-1 text-sm text-blue-800">
              {Object.entries(stance_hint.viewpoint_A).map(([key, value]) => (
                <li key={key} className="pl-4">• {value}</li>
              ))}
            </ul>
          </div>

          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
              <Target size={16} />
              Viewpoint B
            </h4>
            <ul className="space-y-1 text-sm text-orange-800">
              {Object.entries(stance_hint.viewpoint_B).map(([key, value]) => (
                <li key={key} className="pl-4">• {value}</li>
              ))}
            </ul>
          </div>

          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
              <Lightbulb size={16} />
              Your Opinion Options
            </h4>

            <div className="space-y-3 text-sm text-purple-800">
              {/* Prefer A */}
              <div>
                <h5 className="font-semibold text-purple-900">Prefer A</h5>
                <p className="pl-4">
                  • {stance_hint.your_opinion_options.prefer_A}
                </p>
              </div>

              {/* Prefer B */}
              <div>
                <h5 className="font-semibold text-purple-900">Prefer B</h5>
                <p className="pl-4">
                  • {stance_hint.your_opinion_options.prefer_B}
                </p>
              </div>

              {/* Intermediate */}
              <div>
                <h5 className="font-semibold text-purple-900">Intermediate</h5>
                <p className="pl-4">
                  • {stance_hint.your_opinion_options.intermediate}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Add other question types here...
    // 3. Problem-Solution
    if (question_type === 'problem_solution') {
      return (
        <div className="space-y-4">
          {Object.entries(stance_hint.common_problems).map(([problemKey, problemData]) => (
            <div key={problemKey} className="bg-slate-50 border-l-4 border-slate-500 p-4 rounded-r-lg">
              <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <AlertCircle size={16} />
                Problem {problemKey}: {problemData.desc}
              </h4>
              <div className="mt-3 ml-4">
                <p className="text-xs text-slate-600 font-semibold mb-2">Possible Solutions:</p>
                <ul className="space-y-1 text-sm text-slate-800">
                  {Object.entries(problemData.solutions).map(([solKey, solValue]) => (
                    <li key={solKey} className="pl-4">• {solValue}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // 4. Advantages-Disadvantages
    if (question_type === 'advantages_disadvantages') {
      return (
        <div className="space-y-4">
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
              <CheckCircle size={16} />
              Advantages
            </h4>
            <ul className="space-y-1 text-sm text-emerald-800">
              {Object.entries(stance_hint.advantages).map(([key, value]) => (
                <li key={key} className="pl-4">• {value}</li>
              ))}
            </ul>
          </div>

          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-rose-900 mb-2 flex items-center gap-2">
              <AlertCircle size={16} />
              Disadvantages
            </h4>
            <ul className="space-y-1 text-sm text-rose-800">
              {Object.entries(stance_hint.disadvantages).map(([key, value]) => (
                <li key={key} className="pl-4">• {value}</li>
              ))}
            </ul>
          </div>

          {stance_hint.optional_opinion && (
            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
              <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                <Lightbulb size={16} />
                Optional Opinion
              </h4>

              <div className="mb-3">
                <p className="text-sm text-indigo-800 font-medium mb-1">
                  Prefer Advantages:
                </p>
                <p className="text-xs text-indigo-700 italic mb-2 pl-4">
                  {stance_hint.optional_opinion.prefer_advantage.desc}
                </p>
                <ul className="space-y-1 text-xs text-indigo-700">
                  {Object.entries(stance_hint.optional_opinion.prefer_advantage.reasons).map(([key, value]) => (
                    <li key={key} className="pl-8">• {value}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm text-indigo-800 font-medium mb-1">
                  Prefer Disadvantages:
                </p>
                <p className="text-xs text-indigo-700 italic mb-2 pl-4">
                  {stance_hint.optional_opinion.prefer_disadvantage.desc}
                </p>
                <ul className="space-y-1 text-xs text-indigo-700">
                  {Object.entries(stance_hint.optional_opinion.prefer_disadvantage.reasons).map(([key, value]) => (
                    <li key={key} className="pl-8">• {value}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 5. Two-part Question
    if (question_type === 'two_part') {
      return (
        <div className="space-y-4">
          <div className="bg-cyan-50 border-l-4 border-cyan-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-cyan-900 mb-2 flex items-center gap-2">
              <Target size={16} />
              Question 1 - Ideas
            </h4>
            <ul className="space-y-1 text-sm text-cyan-800">
              {Object.entries(stance_hint.question_1_ideas).map(([key, value]) => (
                <li key={key} className="pl-4">• {value}</li>
              ))}
            </ul>
          </div>

          <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-teal-900 mb-2 flex items-center gap-2">
              <Target size={16} />
              Question 2 - Ideas
            </h4>
            <ul className="space-y-1 text-sm text-teal-800">
              {Object.entries(stance_hint.question_2_ideas).map(([key, value]) => (
                <li key={key} className="pl-4">• {value}</li>
              ))}
            </ul>
          </div>

          {stance_hint.user_guidance && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
              <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <Lightbulb size={16} />
                Guidance
              </h4>
              <p className="text-sm text-amber-800 pl-4">
                💡 {stance_hint.user_guidance}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Render outline hints
  const renderOutlineHints = () => {
    if (!taskData || !taskData.outline_hint) return null;

    const { outline_hint } = taskData;

    return (
      <div className="space-y-3">
        {Object.entries(outline_hint).map(([key, value]) => {
          if (key === 'examples') return null;

          const sectionNumber = key === 'introduction' ? '1' :
            key === 'body1' ? '2' :
              key === 'body2' ? '3' : '4';

          const sectionName = key === 'introduction' ? 'Introduction' :
            key === 'body1' ? 'Body Paragraph 1' :
              key === 'body2' ? 'Body Paragraph 2' : 'Conclusion';

          return (
            <div key={key} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {sectionNumber}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{sectionName}</h4>
                  {/* <p className="text-sm text-gray-700 mb-2">{value}</p> */}
                  {outline_hint.examples && outline_hint.examples[key] && (
                    <p className="text-xs text-gray-500 italic">
                      Example: "{outline_hint.examples[key]}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-3 md:p-8">
      <div className="max-w-8xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          {t?.writing2VariationPage?.pageTitle || 'IELTS Academic Writing Task 2'}
        </h1>

        {/* Topic Selection */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-6">
          <label className="block text-lg font-semibold mb-3 text-gray-700">
            {t.selectTopic}
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

        {/* Question Type Selection */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-6">
          <label className="block text-lg font-semibold mb-3 text-gray-700">
            {t.selectQuestionType}
          </label>
          <div className="flex flex-wrap gap-3">
            {questionTypes.map(questionType => (
              <button
                key={questionType.value}
                onClick={() => setSelectedQuestionType(questionType.value)}
                className={`px-4 py-2 rounded-lg border transition-all ${selectedQuestionType === questionType.value
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                  : 'bg-white border-gray-300 hover:border-blue-400 hover:shadow'
                  }`}
              >
                {questionType.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="mb-6">
          <button
            onClick={generateTask}
            disabled={!selectedTopic || !selectedQuestionType || loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-md"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
            {taskData ? t?.writing2VariationPage?.regenerate : t?.writing2VariationPage?.generate}
          </button>
        </div>

        {taskData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side: Task & Hints */}
            <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
              {/* Task Question */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                  {t?.writing2VariationPage?.taskDescription}
                </h2>
                <div className="h-px bg-gray-200 mb-4"></div>
                <p className="text-gray-700 leading-relaxed mb-4 text-lg">
                  {taskData.question}
                </p>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700">
                    {t?.writing2VariationPage?.writingGuidelines}
                  </p>
                </div>
              </div>

              {/* Stance Hints - Collapsible */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button
                  onClick={() => setShowStanceHints(!showStanceHints)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Lightbulb className="text-yellow-500" size={24} />
                    <h3 className="text-lg font-semibold text-gray-800">
                      {t?.writing2VariationPage?.stanceHints}
                    </h3>
                  </div>
                  {showStanceHints ? (
                    <ChevronUp className="text-gray-500" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-500" size={20} />
                  )}
                </button>
                {showStanceHints && (
                  <div className="px-6 pb-6">
                    {renderStanceHints()}
                  </div>
                )}
              </div>

              {/* Outline Hints - Collapsible */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button
                  onClick={() => setShowOutlineHints(!showOutlineHints)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="text-green-500" size={24} />
                    <h3 className="text-lg font-semibold text-gray-800">
                      {t?.writing2VariationPage?.outlineHints}
                    </h3>
                  </div>
                  {showOutlineHints ? (
                    <ChevronUp className="text-gray-500" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-500" size={20} />
                  )}
                </button>
                {showOutlineHints && (
                  <div className="px-6 pb-6">
                    {renderOutlineHints()}
                  </div>
                )}
              </div>

              {/* Band 8+ Example - Collapsible */}
              {taskData.band8plus_example && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <button
                    onClick={() => setShowExample(!showExample)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Award className="text-yellow-500" size={24} />
                      <h3 className="text-lg font-semibold text-gray-800">
                        {t?.writing2VariationPage?.band8Example}
                      </h3>
                    </div>
                    {showExample ? (
                      <ChevronUp className="text-gray-500" size={20} />
                    ) : (
                      <ChevronDown className="text-gray-500" size={20} />
                    )}
                  </button>

                  {showExample && (
                    <div className="px-6 pb-6">
                      <div className="prose prose-sm max-w-none">
                        {taskData.band8plus_example.full_text.split('\n\n').map((para, idx) => (
                          <p key={idx} className="text-gray-700 leading-relaxed mb-3">
                            {para}
                          </p>
                        ))}
                      </div>
                      {taskData.band8plus_example.high_vocab_phrases && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">
                            {t?.writing2VariationPage?.high_vocab_phrases || "High-level Vocabulary & Phrases:"}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {taskData.band8plus_example.high_vocab_phrases.map((phrase, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium"
                              >
                                {phrase}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          {t?.writing2VariationPage?.wordCount || "Word Count"}: {taskData.band8plus_example.full_text.split(/\s+/).length} {t?.writing2VariationPage?.wordCountUnit || "Words"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Side: Writing Area & Feedback */}
            <div className="space-y-6">
              {/* Writing Input */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {t?.writing2VariationPage?.yourWriting}
                  </h2>
                  <span className={`text-sm font-semibold ${wordCount >= 250 ? 'text-green-600' : 'text-orange-600'}`}>
                    {t?.writing2VariationPage?.wordCount}: {wordCount}/250
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded-lg">
                  {t?.writing2VariationPage?.instruction || 'no less than 50 words are required for submission.'}
                </p>
                <textarea
                  value={userText}
                  onChange={(e) => setUserText(e.target.value)}
                  placeholder="Start writing your essay here..."
                  className="w-full  p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={submitting}
                  rows={20}
                />

                <button
                  onClick={handleSubmit}
                  disabled={wordCount < 150 || submitting}
                  className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-md font-semibold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      {t?.writing2VariationPage?.analyzing || "Analyzing..."}
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      {t?.writing2VariationPage?.submitForReview}
                    </>
                  )}
                </button>
              </div>

              {/* Feedback Display */}
              {feedback && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <CheckCircle className="text-green-500" size={24} />
                    {t?.writing2VariationPage?.feedback}
                  </h2>

                  {/* Overall Band */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">{t?.writing2VariationPage?.overallBand}</p>
                      <p className="text-4xl font-bold text-blue-600">{feedback.overallBand}</p>
                    </div>
                  </div>

                  {/* Band Scores */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">{t?.writing2VariationPage?.taskAchievement}</p>
                      <p className="text-2xl font-bold text-gray-800">{feedback.scores.taskAchievement}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">{t?.writing2VariationPage?.coherenceCohesion}</p>
                      <p className="text-2xl font-bold text-gray-800">{feedback.scores.coherenceCohesion}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">{t?.writing2VariationPage?.lexicalResource}</p>
                      <p className="text-2xl font-bold text-gray-800">{feedback.scores.lexicalResource}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">{t?.writing2VariationPage?.grammaticalRange}</p>
                      <p className="text-2xl font-bold text-gray-800">{feedback.scores.grammaticalRange}</p>
                    </div>
                  </div>

                  {/* Errors */}
                  {feedback.errors && feedback.errors.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <AlertCircle className="text-red-500" size={18} />
                        {t?.writing2VariationPage?.errorsToFix}
                      </h3>
                      <ul className="space-y-1">
                        {feedback.errors.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-700 pl-6">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Strengths */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="text-green-500" size={18} />
                      {t?.writing2VariationPage?.strengths}
                    </h3>
                    <ul className="space-y-1">
                      {feedback.strengths.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-700 pl-6">• {item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvements */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="text-orange-500" size={18} />
                      {t?.writing2VariationPage?.improvements}
                    </h3>
                    <ul className="space-y-1">
                      {feedback.improvements.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-700 pl-6">• {item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggestions */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="text-blue-500" size={18} />
                      {t?.writing2VariationPage?.suggestions}
                    </h3>
                    <ul className="space-y-1">
                      {feedback.suggestions.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-700 pl-6">• {item}</li>
                      ))}
                    </ul>
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