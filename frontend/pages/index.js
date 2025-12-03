import { useState, useEffect } from 'react';
import { Menu, X, Settings, Mail, Book, RefreshCw, FileText, PenTool, FileCheck, Loader2, Copy, Printer } from 'lucide-react';
import {
  BookOpen,
  Glasses,
  Search,
  PenLine,
  Edit3,
  Library,
  Quote,
  ArrowUpCircle,
  Languages,
  AlignLeft,
} from 'lucide-react';
import SynonymHunterPage from './synonymHunter';
import SentenceVariation from './sentenceVariation';
import ParagraphVariation from './paragraphVariation';
import SummaryVariation from './summaryVariation';
import Reading1VariationPage from './reading1Variation';
import Reading2VariationPage from './reading2Variation';
import Reading3VariationPage from './reading3Variation';
import Writing1VariationPage from './writing1Variation';
import Writing2VariationPage from './writing2Variation';
import SentenceUpgradePage from './sentenceUpgrade';
import TranslationPracticePage from './sentenceTranslation';
import translations from '../lib/translations';
import ContactPage from './contact';
import SpeakingPracticePage from './speakingPage';
import SettingsPage from './settings';
import { toast } from "sonner";
import endpoints from "lib/client/endpoints";

export default function IELTSLearningApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('home');
  const [language, setLanguage] = useState('zh');
  const [isConfigured, setIsConfigured] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);

  const t = translations[language];

  // Check configuration on mount
  useEffect(() => {
    const checkConfig = async () => {
      try {
        const response = await fetch(`${endpoints.base_url}/api/v1/settings/status`);
        const result = await response.json();
        if (result.code === '0') {
          setIsConfigured(result.data.ready);
          if (!result.data.ready) {
            setActiveView('settings');
          }
        }
      } catch (error) {
        console.error('Failed to check config:', error);
        setActiveView('settings');
      } finally {
        setCheckingConfig(false);
      }
    };
    checkConfig();
  }, []);

  const handleConfigSaved = () => {
    setIsConfigured(true);
    setActiveView('home');
  };

  const menuItems = [
    { id: 'writing1', icon: PenLine, label: t.writing1 },
    { id: 'writing2', icon: Edit3, label: t.writing2 },
    { id: 'reading1', icon: BookOpen, label: t.reading1 },
    { id: 'reading2', icon: Glasses, label: t.reading2 },
    { id: 'reading3', icon: Search, label: t.reading3 },
    { id: 'speaking', icon: Languages, label: t.speaking },
    { id: 'sentence_translation', icon: Languages, label: t.sentenceTranslation },
    { id: 'synonym', icon: Library, label: t.synonym },
    { id: 'sentence_upgrade', icon: ArrowUpCircle, label: t.sentenceUpgrade },
    { id: 'sentence', icon: Quote, label: t.sentenceImitation },
    { id: 'paragraph', icon: AlignLeft, label: t.paragraphImitation },
    { id: 'summary', icon: FileText, label: t.articleSummary },
  ];

  const handleMenuClick = (id) => {
    if (!isConfigured && id !== 'settings' && id !== 'contact') {
      toast.error(t.configRequired, { duration: 1200 });
      setTimeout(() => {
        setActiveView('settings');
      }, 100);
      return;
    }
    setActiveView(id);
  };

  const renderContent = () => {
    if (checkingConfig) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin text-blue-500" size={48} />
          <span className="ml-4 text-xl">{t.checking}</span>
        </div>
      );
    }

    if (activeView === 'settings') {
      return <SettingsPage translation={t} onConfigSaved={handleConfigSaved} />;
    }

    if (!isConfigured && activeView !== 'contact') {
      return (
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center space-y-4">
            <Settings className="mx-auto text-gray-400" size={64} />
            <h2 className="text-2xl font-bold">{t.configRequired}</h2>
            <button
              onClick={() => setActiveView('settings')}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {t.settings}
            </button>
          </div>
        </div>
      );
    }

    if (activeView === 'home') {
      const cardData = [
        { id: 'writing1', icon: PenLine, label: t.writing1, desc: t.writing1Desc ||'Data and chart writing' },
        { id: 'writing2', icon: Edit3, label: t.writing2, desc: t.writing2Desc ||'Argumentative writing' },
        { id: 'reading1', icon: BookOpen, label: t.reading1, desc: t.reading1Desc ||'Practice reading comprehension' },
        { id: 'reading2', icon: Glasses, label: t.reading2, desc: t.reading2Desc ||'Advanced reading practice' },
        { id: 'reading3', icon: Search, label: t.reading3, desc: t.reading3Desc ||'Simulated exam practice' },
        { id: 'sentence_translation', icon: Languages, label: t.sentenceTranslation, desc: t.sentenceTranslationDesc ||'Improve translation skills' },
        { id: 'speaking', icon: Languages, label: t.speaking, desc: t.speekingDesc ||'Develop speaking fluency' },
        { id: 'synonym', icon: Library, label: t.synonym, desc: t.synonymDesc ||'Expand vocabulary' },
        { id: 'sentence', icon: Quote, label: t.sentenceImitation, desc: t.sentenceDesc ||'Imitate sentence patterns' },
        { id: 'sentence_upgrade', icon: ArrowUpCircle, label: t.sentenceUpgrade, desc: t.sentenceUpgradeDesc ||'Refine your sentences' },
        { id: 'paragraph', icon: AlignLeft, label: t.paragraphImitation, desc: t.paragraphDesc ||'Learn paragraph structure' },
        { id: 'summary', icon: FileText, label: t.articleSummary, desc: t.summaryDesc ||'Practice summarization' },

      ];

      return (
        <div className="flex flex-col items-center justify-start h-full p-6 space-y-8">
          <h1 className="text-4xl font-bold text-center">{t.welcome}</h1>
          <p className="text-xl text-gray-600 text-center max-w-2xl">{t.welcomeDesc}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl w-full">
            {cardData.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className="flex flex-col items-start p-6 bg-white border border-gray-200 rounded-lg shadow hover:shadow-lg transition-all text-left"
                >
                  <Icon size={36} className="mb-3 text-blue-500" />
                  <span className="text-lg font-semibold mb-1">{item.label}</span>
                  <span className="text-gray-600 text-sm">{item.desc}</span>
                </button>
              );
            })}
          </div>

          <div className="max-w-2xl w-full bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg space-y-2">
            <h3 className="text-lg font-semibold text-yellow-800">{t.noticeDesc}</h3>
            <ul className="list-disc list-inside text-yellow-700 text-sm">
              <li>{t.notice1}</li>
              <li>{t.notice2}</li>
              <li>{t.notice3}</li>
            </ul>
          </div>
        </div>
      );
    }

    // Other views
    if (activeView === 'speaking') return <SpeakingPracticePage type={activeView} translation={t} language={language} />;
    if (activeView === 'synonym') return <SynonymHunterPage type={activeView} translation={t} language={language} />;
    if (activeView === 'sentence') return <SentenceVariation type={activeView} translation={t} language={language} />;
    if (activeView === 'sentence_upgrade') return <SentenceUpgradePage type={activeView} translation={t} language={language} />;
    if (activeView === 'sentence_translation') return <TranslationPracticePage type={activeView} translation={t} language={language} />;
    if (activeView === 'paragraph') return <ParagraphVariation type={activeView} translation={t} language={language} />;
    if (activeView === 'summary') return <SummaryVariation type={activeView} translation={t} language={language} />;
    if (activeView === 'reading1') return <Reading1VariationPage type={activeView} translation={t} language={language} />;
    if (activeView === 'reading2') return <Reading2VariationPage type={activeView} translation={t} language={language} />;
    if (activeView === 'reading3') return <Reading3VariationPage type={activeView} translation={t} language={language} />;
    if (activeView === 'writing1') return <Writing1VariationPage type={activeView} translation={t} language={language} />;
    if (activeView === 'writing2') return <Writing2VariationPage type={activeView} translation={t} language={language} />;
    if (activeView === 'contact') return <ContactPage type={activeView} translation={t} language={language} />;

    return <div className="p-8"><h2 className="text-3xl font-bold mb-4">{menuItems.find(item => item.id === activeView)?.label}</h2></div>;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-black">
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden min-w-0`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between min-w-0">
          {sidebarOpen && (
            <h1 className="text-xl font-bold truncate cursor-pointer min-w-0 " onClick={() => handleMenuClick('home')} title="回到主页">
              {t.appTitle}
            </h1>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto min-w-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const disabled = !isConfigured;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                disabled={disabled}
                className={`w-full flex items-center space-x-3 px-2 py-3 rounded-lg transition-colors min-w-0 ${activeView === item.id ? 'bg-blue-500 text-white' : disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'
                  }`}
              >
                <div className="flex-shrink-0"><Icon size={20} /></div>
                {sidebarOpen && <span className="truncate min-w-0">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => setActiveView('settings')}
            className={`w-full flex items-center space-x-3 px-1 py-3 rounded-lg transition-colors ${activeView === 'settings' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
              }`}
          >
            <div className="flex items-center justify-center"><Settings size={20} /></div>
            {sidebarOpen && <span className="truncate">{t.settings}</span>}
          </button>

          <button
            onClick={() => setActiveView('contact')}
            className={`w-full flex items-center space-x-3 px-1 py-3 rounded-lg transition-colors ${activeView === 'contact' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
              }`}
          >
            <div className="flex items-center justify-center"><Mail size={20} /></div>
            {sidebarOpen && <span className="truncate">{t.contact}</span>}
          </button>

          <div className="pt-2">
            {sidebarOpen ? (
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            ) : (
              <div className="flex items-center justify-center">
                <button
                  onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                  className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg bg-white"
                  title="切换语言"
                >
                  {language === 'zh' ? '中' : 'EN'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">{renderContent()}</div>
      </div>
    </div>
  );
}