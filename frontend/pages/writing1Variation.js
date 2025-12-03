import { useState, useEffect, useRef, useMemo } from 'react';
import { RefreshCw, Loader2, Copy, Send, CheckCircle, AlertCircle, Award, ChevronDown, ChevronUp } from 'lucide-react';
import * as echarts from 'echarts';
import { SUBTYPE_START, SUBTYPE_CORRECT } from 'lib/taskType';
import { start, submit } from "lib/client/services/taskService";


export default function Writing1VariationPage({ type, translation, language }) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [taskData, setTaskData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userText, setUserText] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [selectedChartType, setSelectedChartType] = useState('');

  /**作者:张立俊 1997.01.31 */
  const t = translation ?? {};
  const topics = useMemo(() => {
    return Object.entries(t?.domains || {})
      .filter(([key, value]) => typeof value === 'string' && key !== 'selectTopic')
      .map(([key, value]) => ({ value: key, label: value }));
  }, [t]);

  const chartTypes = useMemo(() => {
    return Object.entries(t?.chartTypes || {})
      .filter(([key, value]) => typeof value === 'string')
      .map(([key, value]) => ({ value: key, label: value }));
  }, [t]);

  const STORAGE_KEY = 'ieltsWriting1Task';

  // Load from localStorage
  useEffect(() => {
    const savedTask = localStorage.getItem(STORAGE_KEY);
    if (savedTask) {
      try {
        const data = JSON.parse(savedTask);
        if (data.selectedTopic) setSelectedTopic(data.selectedTopic);
        if (data.selectedChartType) setSelectedChartType(data.selectedChartType);
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
      const cacheData = { selectedTopic, taskData, userText, feedback,selectedChartType };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
    }
  }, [selectedTopic, selectedChartType,taskData, userText, feedback,]);

  // Render chart or table
  useEffect(() => {
    if (!taskData) return;

    // Handle table type separately
    if (taskData.type === 'table') {
      return; // Table will be rendered in JSX
    }

    // 【添加】Handle process type separately
    if (taskData.type === 'process') {
      return; // Process will be rendered in JSX
    }

    // Handle chart types
    if (!chartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
    }

    const chart = echarts.init(chartRef.current);
    chartInstanceRef.current = chart;

    let option = {};

    if (taskData.type === 'line' || taskData.type === 'bar') {
      const seriesData = Object.entries(taskData.content.series).map(([name, data]) => ({
        name,
        type: taskData.type,
        data,
        smooth: taskData.type === 'line'
      }));

      option = {
        title: { text: taskData.title, left: 'center' },
        tooltip: { trigger: 'axis' },
        legend: { bottom: 10 },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: {
          type: 'category',
          data: taskData.content.labels,
          axisLabel: { rotate: 0 }
        },
        yAxis: {
          type: 'value',
          name: taskData.units
        },
        series: seriesData
      };
    } else if (taskData.type === 'pie') {
      const pieData = Object.entries(taskData.content.slices).map(([name, value]) => ({
        name,
        value
      }));

      option = {
        title: { text: taskData.title, left: 'center' },
        tooltip: { trigger: 'item', formatter: '{b}: {c}% ({d}%)' },
        legend: { bottom: 10 },
        series: [{
          type: 'pie',
          radius: '60%',
          data: pieData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: { formatter: '{b}: {c}%' }
        }]
      };
    }

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chart.dispose();
      }
    };
  }, [taskData]);

  const generateTask = async () => {
    if (!selectedTopic) return;

    setLoading(true);
    setTaskData(null);
    setUserText('');
    setFeedback(null);
    localStorage.removeItem(STORAGE_KEY);

    try {
      const res = await start({
        type,
        subtype: SUBTYPE_START,
        language,
        domain: selectedTopic,
        question_type: selectedChartType,
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
      const res = await submit({
        type,
        subtype: SUBTYPE_CORRECT,
        language,
        original_article: JSON.stringify(taskData),
        answers: { text: userText },
      });
      setFeedback(res.data);
      const data = {
        selectedTopic,
        selectedChartType,
        userText,
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

  // Render table component
  const renderTable = () => {
    if (!taskData || taskData.type !== 'table') return null;

    const { content, title, units } = taskData;
    const ageGroups = Object.keys(content.series);
    const years = content.labels;

    return (
      <div className="overflow-x-auto ">
        <h3 className="text-center font-semibold text-gray-800 mb-4">{title}</h3>
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Age Group</th>
              {years.map(year => (
                <th key={year} className="border border-gray-300 px-4 py-2 text-center font-semibold">
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ageGroups.map((ageGroup, idx) => (
              <tr key={ageGroup} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-4 py-2 font-medium text-gray-700">
                  {ageGroup}
                </td>
                {content.series[ageGroup].map((value, yearIdx) => (
                  <td key={yearIdx} className="border border-gray-300 px-4 py-2 text-center text-gray-600">
                    {value}{units.includes('%') ? '%' : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-2 text-center">Units: {units}</p>
      </div>
    );
  };

  // Render process flowchart
  const renderProcess = () => {
    if (!taskData || taskData.type !== 'process') return null;

    const { content, title } = taskData;
    const steps = content.steps || [];

    return (
      <div className="w-full">
        <h3 className="text-center font-semibold text-gray-800 mb-6">{title}</h3>
        <div className="flex flex-col gap-3">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {/* Step Box */}
              <div className="flex-1 bg-blue-50 border-2 border-blue-400 rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <p className="font-medium text-gray-800">{step}</p>
                </div>
              </div>

              {/* Arrow */}
              {idx < steps.length - 1 && (
                <div className="flex-shrink-0 text-blue-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M19 12l-7 7-7-7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-8xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          {t.writing1VariationPage?.pageTitle || 'IELTS Academic Writing Task 1'}
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
                onClick={() => { setSelectedTopic(topic.value); }}
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
            {t.selectChartType || 'Select Chart Type'}
          </label>
          <div className="flex flex-wrap gap-3">
            {chartTypes.map(chartType => (
              <button
                key={chartType.value}
                onClick={() => setSelectedChartType(chartType.value)}
                className={`px-4 py-2 rounded-lg border transition-all ${selectedChartType === chartType.value
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                  : 'bg-white border-gray-300 hover:border-blue-400 hover:shadow'
                  }`}
              >
                {chartType.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={generateTask}
            disabled={!selectedTopic || loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-md"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
            {taskData ? (t.writing1VariationPage?.regenerate || 'Regenerate Task') : (t.writing1VariationPage?.generateTask || 'Generate Task')}
          </button>

        </div>

        {taskData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side: Task */}
            <div className="bg-white rounded-lg shadow-sm p-6 lg:sticky lg:top-4 lg:self-start">
              <h2 className="text-xl font-bold mb-2 text-gray-800">
                {t.writing1VariationPage?.taskDescription || 'Task Description'}
              </h2>
              <div className="h-px bg-gray-200 my-4"></div>

              {/* Chart or Table */}
              {taskData.type === 'table' ? (
                <div className="mb-4">
                  {renderTable()}
                </div>
              ) : taskData.type === 'process' ? (
                <div className="mb-4">
                  {renderProcess()}
                </div>
              ) : (
                <div ref={chartRef} className="w-full h-96 mb-4"></div>
              )}
              {/* Task Info */}
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Time Range:</span> {taskData.time_range}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Units:</span> {taskData.units}
                </p>
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">
                {taskData.description}
              </p>

              <div className="p-4 mb-6 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">
                  {t.writing1VariationPage?.writingGuidelines || 'Write at least 150 words. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.'}
                </p>
              </div>

              {/* Band 8+ Example - Collapsible */}
              {taskData.band8plus_example && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <button
                    onClick={() => setShowExample(!showExample)}
                    className="w-full p-1 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Award className="text-yellow-500" size={24} />
                      <h3 className="text-lg font-semibold text-gray-800">
                        {t.writing1VariationPage?.band8Example || 'Band 8+ Example'}
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
                        {taskData.band8plus_example.split('\n\n').map((para, idx) => (
                          <p key={idx} className="text-gray-700 leading-relaxed mb-3">
                            {para}
                          </p>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Word Count: {taskData.band8plus_example.split(/\s+/).length} words
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Side: Writing Area */}
            <div className="space-y-6">
              {/* Writing Input */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {t.writing1VariationPage?.yourWriting || 'Your Writing'}
                  </h2>

                  <span className={`text-sm font-semibold ${wordCount >= 150 ? 'text-green-600' : 'text-orange-600'}`}>
                    {t?.wordCount || 'Word Count'}: {wordCount}/150
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded-lg">
                  {t?.writing1VariationPage?.instruction || 'no less than 50 words are required for submission.'}
                </p>
                <textarea
                  value={userText}
                  onChange={(e) => setUserText(e.target.value)}
                  placeholder="Start writing your response here..."
                  className="w-full  p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={submitting}
                  rows={20}
                />

                <button
                  onClick={handleSubmit}
                  disabled={wordCount < 50 || submitting}
                  className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-md font-semibold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      {t.writing1VariationPage?.submitForReview || 'Submit for Review'}
                    </>
                  )}
                </button>
              </div>

              {/* Feedback Display */}
              {feedback && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <CheckCircle className="text-green-500" size={24} />
                    {t.writing1VariationPage?.feedback || 'Feedback'}
                  </h2>

                  {/* Overall Band */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">{t.writing1VariationPage?.overallBand || 'Overall Band'}</p>
                      <p className="text-4xl font-bold text-blue-600">{feedback.overallBand}</p>
                    </div>
                  </div>

                  {/* Band Scores */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">{t.writing1VariationPage?.taskAchievement || 'Task Achievement'}</p>
                      <p className="text-2xl font-bold text-gray-800">{feedback.scores.taskAchievement}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">{t.writing1VariationPage?.coherenceCohesion || 'Coherence & Cohesion'}</p>
                      <p className="text-2xl font-bold text-gray-800">{feedback.scores.coherenceCohesion}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">{t.writing1VariationPage?.lexicalResource || 'Lexical Resource'}</p>
                      <p className="text-2xl font-bold text-gray-800">{feedback.scores.lexicalResource}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">{t.writing1VariationPage?.grammaticalRange || 'Grammar'}</p>
                      <p className="text-2xl font-bold text-gray-800">{feedback.scores.grammaticalRange}</p>
                    </div>
                  </div>

                  {/* errors */}
                  {feedback.errors && feedback.errors.length > 0 && (<div className="mb-4">
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="text-red-500" size={18} />
                      {t.writing1VariationPage?.errors || 'Errors'}
                    </h3>
                    <ul className="space-y-1">
                      {feedback?.errors?.map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-700 pl-6">• {item}</li>
                      ))}
                    </ul>
                  </div>)}

                  {/* Strengths */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="text-green-500" size={18} />
                      {t.writing1VariationPage?.strengths || 'Strengths'}
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
                      {t.writing1VariationPage?.improvements || 'Areas for Improvement'}
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
                      {t.writing1VariationPage?.suggestions || 'Suggestions'}
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