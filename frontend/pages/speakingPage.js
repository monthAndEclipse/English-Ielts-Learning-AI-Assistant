import { useState, useRef, useEffect,useMemo } from 'react';
import { Mic, MicOff, Volume2, RefreshCw, CheckCircle, XCircle, AlertCircle, Play, Headphones, Loader2 } from 'lucide-react';
import { start } from "lib/client/services/taskService";
import { SUBTYPE_START } from 'lib/taskType';
import { toast } from "sonner";
export default function SpeakingPracticePage({ type, translation, language }) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const t = translation;

  // 从翻译对象中提取主题列表
  const topics = useMemo(() => {
    return Object.entries(t?.domains || {})
      .filter(([key, value]) => typeof value === 'string' && key !== 'selectTopic')
      .map(([key, value]) => ({ value: key, label: value }));
  }, [t]);

  const currentSentence = sentences[currentIndex];
  const STORAGE_KEY = 'speakingPracticeTask';

  useEffect(() => {
    const savedTask = localStorage.getItem(STORAGE_KEY);
    if (!savedTask) return;

    try {
      const task = JSON.parse(savedTask);

      if (
        task.sentences?.length > 0 &&
        task.selectedTopic &&
        task.language === language
      ) {
        setSelectedTopic(task.selectedTopic);
        setSentences(task.sentences);
        setCurrentIndex(task.currentIndex || 0);
      }
    } catch (err) {
      console.error('Failed to load task from storage:', err);
    }
  }, [translation,language]);

  const saveTaskToStorage = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };


  useEffect(() => {
    // 检查浏览器是否支持 Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    // 初始化语音识别
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserTranscript(transcript);
      if (currentSentence) {
        compareTranscripts(currentSentence.en, transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, [currentSentence]);

  // 当句子改变时自动播放
  useEffect(() => {
    if (currentSentence) {
      playAudio();
    }
  }, [currentIndex]);

  // 生成句子
  const generateSentences = async () => {
    if (!selectedTopic) return;

    setLoading(true);
    setSentences([]);
    setCurrentIndex(0);
    setUserTranscript('');
    setComparisonResult(null);
    setAudioBlob(null);

    try {
      const res = await start({
        type,
        subtype: SUBTYPE_START,
        language,
        domain: selectedTopic,
      });

      if (res?.data && res.data.length > 0) {
        setSentences(res.data);
        toast.success(t?.speakingPractice?.generateSuccess || "生成成功！");

        const task = {
          selectedTopic,
          sentences: res.data,
          currentIndex: 0,
          language,
        };
        setCurrentIndex(0);
        saveTaskToStorage(task);
        // 生成后自动播放第一个句子
        setTimeout(() => {
          playAudio(res.data[0].en);
        }, 500);
      } else {
        toast.error("未能生成句子，请重试");
      }
    } catch (err) {
      console.error(err);
      toast.error(t?.speakingPractice?.generateFail || "生成失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    if (recognitionRef.current && !isRecording) {
      // 如果正在播放示例音频，先停止
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      }

      setUserTranscript('');
      setComparisonResult(null);
      setAudioBlob(null);
      audioChunksRef.current = [];

      // 开始录音
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast.error('无法访问麦克风，请检查权限');
        return;
      }

      // 延迟启动语音识别，确保 MediaRecorder 已经开始
      setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.start();
        }
      }, 300);
    }
  };

  const stopRecording = () => {
    if (isRecording) {
      // 先停止语音识别
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error stopping recognition:', error);
        }
      }

      // 再停止音频录制
      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.error('Error stopping media recorder:', error);
        }
      }

      setIsRecording(false);
    }
  };

  const compareTranscripts = (target, user) => {
    const targetWords = target.toLowerCase().replace(/[.,!?]/g, '').split(' ');
    const userWords = user.toLowerCase().replace(/[.,!?]/g, '').split(' ');

    let matchCount = 0;
    const comparison = targetWords.map((word, index) => {
      const userWord = userWords[index] || '';
      const isMatch = word === userWord;
      if (isMatch) matchCount++;
      return {
        target: word,
        user: userWord,
        isMatch
      };
    });

    const accuracy = Math.round((matchCount / targetWords.length) * 100);

    setComparisonResult({
      comparison,
      accuracy,
      totalWords: targetWords.length,
      matchedWords: matchCount
    });
  };

  const handleTryAgain = () => {
    setUserTranscript('');
    setComparisonResult(null);
    setAudioBlob(null);
  };

  const handleNextSentence = () => {
    if (currentIndex < sentences.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setUserTranscript('');
      setComparisonResult(null);
      setAudioBlob(null);

      saveTaskToStorage({
        selectedTopic,
        sentences,
        currentIndex: nextIndex,
        language,
      });
    } else {
      toast.success('已完成所有句子练习！');
    }
  };

  const playAudio = (text) => {
    // 取消之前的播放
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text || currentSentence?.en);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const playUserAudio = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => URL.revokeObjectURL(audioUrl);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 1: return 'text-green-600 bg-green-50';
      case 2: return 'text-yellow-600 bg-yellow-50';
      case 3: return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 1: return t?.speakingPractice?.easy || '简单';
      case 2: return t?.speakingPractice?.medium || '中等';
      case 3: return t?.speakingPractice?.hard || '困难';
      default: return '';
    }
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
        <Toaster position="top-right" />
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="text-red-600 mr-3" size={24} />
              <p className="text-red-700">{t?.speakingPractice?.browserNotSupported || '抱歉，你的浏览器不支持语音识别功能'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-8xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-left space-y-2">
          <h2 className="text-3xl font-bold text-gray-800">{t?.speakingPractice?.pageTitle || '口语训练'}</h2>
        </div>

        {/* Topic Selection */}
        <div className="bg-white rounded-lg shadow-sm p-3">
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
        <div>
          <button
            onClick={generateSentences}
            disabled={!selectedTopic || loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-md"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
            {sentences.length > 0
              ? (t?.speakingPractice?.regenerate || "重新生成")
              : (t?.speakingPractice?.generateTask || "生成句子")}
          </button>
        </div>

        {/* Practice Area */}
        {currentSentence && (
          <>
            {/* Target Sentence Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-700">{t?.speakingPractice?.targetSentence || '目标句子'}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                    {currentIndex + 1} / {sentences.length}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(currentSentence.difficulty)}`}>
                    {getDifficultyText(currentSentence.difficulty)}
                  </span>
                  <button
                    onClick={() => playAudio()}
                    disabled={isPlaying}
                    className={`p-2 rounded-lg transition-colors ${isPlaying
                      ? 'bg-gray-200 cursor-not-allowed'
                      : 'bg-blue-100 hover:bg-blue-200'
                      }`}
                    title={t?.speakingPractice?.playAudio || '播放示例'}
                  >
                    <Volume2 size={20} className={isPlaying ? 'text-gray-400' : 'text-blue-600'} />
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xl text-gray-800 leading-relaxed">{currentSentence.en}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">{t?.speakingPractice?.translation || '翻译'}:</p>
                <p className="text-gray-700">{currentSentence.cn}</p>
              </div>
            </div>

            {/* Recording Control */}
            <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-8 rounded-full transition-all transform hover:scale-105 ${isRecording
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                >
                  {isRecording ? (
                    <MicOff size={48} className="text-white" />
                  ) : (
                    <Mic size={48} className="text-white" />
                  )}
                </button>
                <p className="text-lg font-medium text-gray-700">
                  {isRecording ? (t?.speakingPractice?.stopRecording || '停止录音') : (t?.speakingPractice?.startRecording || '开始录音')}
                </p>
              </div>

              {/* User Transcript */}
              {userTranscript && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">{t?.speakingPractice?.yourSpeech || '你的发音'}:</p>
                    {audioBlob && (
                      <button
                        onClick={playUserAudio}
                        className="flex items-center space-x-1 px-3 py-1 bg-purple-200 hover:bg-purple-300 rounded-lg transition-colors text-sm"
                      >
                        <Headphones size={16} className="text-purple-700" />
                        <span className="text-purple-700">听回放</span>
                      </button>
                    )}
                  </div>
                  <p className="text-lg text-gray-800">{userTranscript}</p>
                </div>
              )}
            </div>

            {/* Comparison Result */}
            {comparisonResult && (
              <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-700">{t?.speakingPractice?.comparison || '对比结果'}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-blue-600">
                      {comparisonResult.accuracy}%
                    </span>
                    <span className="text-gray-600">{t?.speakingPractice?.accuracy || '准确度'}</span>
                  </div>
                </div>

                {/* Word by Word Comparison */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {comparisonResult.comparison.map((item, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div className={`px-3 py-2 rounded-lg ${item.isMatch ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                          <span className={`font-medium ${item.isMatch ? 'text-green-700' : 'text-red-700'
                            }`}>
                            {item.target}
                          </span>
                        </div>
                        {!item.isMatch && item.user && (
                          <div className="text-xs text-gray-500 mt-1">
                            ({item.user})
                          </div>
                        )}
                        {item.isMatch ? (
                          <CheckCircle size={16} className="text-green-500 mt-1" />
                        ) : (
                          <XCircle size={16} className="text-red-500 mt-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={handleTryAgain}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <RefreshCw size={20} />
                    <span>{t?.speakingPractice?.tryAgain || '重新练习'}</span>
                  </button>
                  <button
                    onClick={handleNextSentence}
                    disabled={currentIndex >= sentences.length - 1}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <Play size={20} />
                    <span>{t?.speakingPractice?.nextSentence || '下一句'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tips Section */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">{t?.speakingPractice?.tipsTitle || "练习建议"}</h3>
              <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
                <li>{t?.speakingPractice?.tipsContent1}</li>
                <li>{t?.speakingPractice?.tipsContent2}</li>
                <li>{t?.speakingPractice?.tipsContent3}</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}