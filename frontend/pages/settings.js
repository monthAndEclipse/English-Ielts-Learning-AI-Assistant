import { useState, useEffect } from 'react';
import { Menu, X, Settings, Mail, Book, RefreshCw, FileText, PenTool, FileCheck, Loader2, Copy, Printer, Eye, EyeOff } from 'lucide-react';
import endpoints from "lib/client/endpoints";
import { toast } from "sonner";

// Settings Page Component
function SettingsPage({ translation, onConfigSaved }) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  useEffect(() => {
    // Load existing settings
    const loadSettings = async () => {
      try {
        const response = await fetch(`${endpoints.base_url}/api/v1/settings/get`);
        const result = await response.json();
        if (result.code === '0' && result.data?.configured) {
          setApiKey(result.data.openai_api_key || '');
          setConfigured(true); // ✅ 已配置
        } else {
          setConfigured(false);
          toast.error(translation?.settingsPage?.notConfigured || 'Settings not configured');
        }
      } catch (error) {
        toast.error(translation?.settingsPage?.loadError || 'Failed to load settings');
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: translation?.settingsPage?.saveError });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${endpoints.base_url}/api/v1/settings/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openai_api_key: apiKey,
          base_url: '',
        }),
      });

      const result = await response.json();

      // ✅ 按你的实际后端格式判断
      if (result.code === '0' && result.data?.ok === true) {
        setMessage({
          type: 'success',
          text: translation?.settingsPage?.saveSuccess,
        });
        toast.success(translation?.settingsPage?.saveSuccess || 'Settings saved successfully');
        setTimeout(() => {
          onConfigSaved();
        }, 500);
      } else {
        console.error('Save failed:', result);
        setMessage({
          type: 'error',
          text: translation?.settingsPage?.saveError,
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage({
        type: 'error',
        text: translation?.settingsPage?.saveError,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-blue-500" size={48} />
        <span className="ml-4 text-xl">{translation?.settingsPage?.loading}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <Settings className="mx-auto text-blue-500" size={48} />
          <h2 className="text-3xl font-bold">{translation?.settingsPage?.settingsTitle}</h2>
          <p className="text-gray-600">
            {configured
              ? translation?.settingsPage?.configuredText ?? '✅ API Key is configured'
              : translation?.settingsPage?.settingsDesc}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              {translation?.settingsPage?.apiKeyLabel}
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={translation?.settingsPage?.apiKeyPlaceholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                title={showKey ? translation?.settingsPage?.hideKey : translation?.settingsPage?.showKey}
              >
                {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>


          <button
            onClick={handleSave}
            disabled={saving || !apiKey.trim()}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${saving || !apiKey.trim()
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
          >
            {saving ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin mr-2" size={20} />
                {translation?.settingsPage?.saving}
              </span>
            ) : (
              translation?.settingsPage?.saveSettings
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
export default SettingsPage;