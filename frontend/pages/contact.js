import { useState } from 'react';
import { Mail, MessageCircle, Heart, QrCode } from 'lucide-react';
import { toast } from "sonner";

export default function ContactPage({ translation, language }) {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [qrHover, setQrHover] = useState(null);
  const contactItems = [
    {
      id: 'douyin',
      icon: '📱',
      title: language === 'zh' ? '抖音' : 'Douyin',
      subtitle: language === 'zh' ? '' : '',
      account: '@轻舟已过一重山',
      hasQR: true,
      qrPlaceholder: language === 'zh' ? '抖音二维码' : 'Douyin QR Code',
      color: 'from-red-400 to-pink-500',
      qrImage: '/static/douyin.png'
    },
    {
      id: 'xiaohongshu',
      icon: '📕',
      title: language === 'zh' ? '小红书' : 'Xiaohongshu',
      subtitle: language === 'zh' ? '' : '',
      account: '@轻舟已过一重山',
      hasQR: true,
      qrPlaceholder: language === 'zh' ? '小红书二维码' : 'Xiaohongshu QR Code',
      color: 'from-red-500 to-rose-600',
      qrImage: '/static/rednote.jpg'
    },
    {
      id: 'email',
      icon: '✉️',
      title: language === 'zh' ? '电子邮箱' : 'Email',
      subtitle: language === 'zh' ? '' : '',
      account: '154286411@qq.com',
      hasQR: false,
      color: 'from-blue-400 to-blue-600'

    }
  ];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(language === 'zh' ? '已复制到剪贴板！' : 'Copied to clipboard!');
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-full p-6 space-y-6">
      {/* 标题区 */}
      <div className="text-center max-w-3xl space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {language === 'zh' ? '联系我们' : 'Contact Us'}
        </h1>
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <Heart className="text-red-500" size={20} />
          <p className="text-lg">
            {language === 'zh'
              ? '感谢您使用英语学习工具'
              : 'Thank you for using IELTS Learning Tool'}
          </p>
          <Heart className="text-red-500" size={20} />
        </div>
      </div>

      {/* 介绍文字 */}
      <div className="max-w-4xl bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <p className="text-gray-700 leading-relaxed text-center">
          {language === 'zh'
            ? '如果您在使用过程中有任何问题、建议或想法，欢迎通过以下方式与我们联系。我们会认真倾听每一条反馈，不断优化产品体验！'
            : 'This tool is designed to help IELTS learners improve their English more efficiently. If you have any questions, suggestions, or ideas during use, please feel free to contact us through the following methods. We listen to every piece of feedback and continuously optimize the user experience!'}
        </p>
      </div>

      {/* 联系方式卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 md:w-[100%] gap-6 max-w-5xl lg:w-[55%] items-stretch ">
        {contactItems.map((item) => (
          <div
            key={item.id}
            className="relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300  group h-full flex flex-col "
          >
            {/* 渐变背景装饰 */}
            <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${item.color}`} />

            <div className="p-6 space-y-4">
              {/* 图标和标题 */}
              <div className="flex items-center space-x-3">
                <span className="text-4xl">{item.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.subtitle}</p>
                </div>
              </div>

              {/* 账号信息 */}
              <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2 relative">
                {/* 账号 */}
                <span className="text-sm font-mono text-gray-700 truncate flex-1">
                  {item.account}
                </span>

                {/* 复制按钮 */}
                <button
                  onClick={() => copyToClipboard(item.account)}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600"
                >
                  {language === 'zh' ? '复制' : 'Copy'}
                </button>

                {/* ✅ 二维码小图标（仅抖音 / 小红书） */}
                {item.hasQR && (
                  <div
                    className="relative"
                    onMouseEnter={() => setQrHover(item.id)}
                    onMouseLeave={() => setQrHover(null)}
                  >
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-full 
             bg-gray-200 hover:bg-gray-300 transition"
                      title={language === 'zh' ? '查看二维码' : 'View QR Code'}
                    >
                      <QrCode size={16} className="text-gray-700" />
                    </button>

                    {/* ✅ 右侧弹出二维码 */}
                    {qrHover === item.id && (
                      <div
                        className="absolute top-1/2 left-full -translate-y-1/2 ml-4
                     bg-white rounded-xl shadow-2xl p-4 z-30 min-w-max"
                      >
                        <div className="space-y-3 text-center">
                          <div className="w-64 h-96 bg-gray-100 relative overflow-hidden rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                            {/* Next.js Image：公共资源直接使用字符串路径 */}
                            <img
                              src={item.qrImage}
                              alt={`${item.title} QR Code`}
                              className="object-contain rounded-lg w-full h-full"
                              draggable={false}
                            />
                          </div>
                          <p className="text-sm font-medium text-gray-700 text-center">
                            {language === 'zh' ? '扫码关注 🙏' : 'Scan to donate 🙏'}
                          </p>
                        </div>

                        {/* ✅ 左侧小三角 */}
                        <div
                          className="absolute top-1/2 -left-2 -translate-y-1/2
                       w-4 h-4 bg-white rotate-45
                       border-b border-r border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 二维码提示或操作按钮 */}
              {item.hasQR ? (
                <div className="text-center">
                  <p className="text-xs text-gray-500 flex items-center justify-center space-x-1">
                  </p>
                </div>
              ) : (
                <></>
              )}
            </div>

            {/* 悬浮二维码 */}
            {item.hasQR && hoveredCard === item.id && (
              <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center backdrop-blur-sm animate-fadeIn">
                <div className="text-center space-y-3">
                  <div className="w-48 h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center space-y-2">
                      <MessageCircle size={48} className="mx-auto text-gray-400" />
                      <p className="text-sm text-gray-500 px-4">
                        {item.qrPlaceholder}
                      </p>
                      <p className="text-xs text-gray-400">
                        {language === 'zh' ? '(示例占位)' : '(Placeholder)'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {language === 'zh' ? '扫码关注' : 'Scan to follow'}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 打赏支持区 */}
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-md p-4">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-3xl">☕</span>
            <h2 className="text-2xl font-bold text-gray-800">
              {language === 'zh' ? '支持我们' : 'Support Us'}
            </h2>
            <span className="text-3xl">❤️</span>
          </div>
          <div
            className="relative inline-block"
            onMouseEnter={() => setHoveredCard('donate')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <button className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              {language === 'zh' ? '💰 打赏支持' : '💰 Donate'}
            </button>

            {/* 悬浮收款码 */}
            {hoveredCard === 'donate' && (
              <div
                className="absolute top-1/2 left-full ml-4 -translate-y-1/2 
                 bg-white rounded-xl shadow-2xl p-4 z-20 min-w-max"
              >
                <div className="w-64 h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <img
                    src="/static/wechat.jpg"
                    alt="Donate QR Code"
                    className="object-contain w-full h-full"
                    draggable={false}
                  />
                </div>

                {/* 小三角箭头 */}
                <div className="absolute top-1/2 -left-2 -translate-y-1/2 
                      w-4 h-4 bg-white rotate-45 border-b border-r border-gray-200" />
              </div>
            )}
          </div>
          <p className="text-gray-600 max-w-xl mx-auto">
            {language === 'zh'
              ? '如果这个工具对您有帮助，欢迎请我们喝杯咖啡！您的支持是我们持续优化的最大动力 💪'
              : 'If this tool helps you, feel free to buy us a coffee! Your support is our biggest motivation 💪'}
          </p>



          <p className="text-xs text-gray-500 italic">
            {language === 'zh'
              ? '* 完全自愿，感谢每一份心意 🌟'
              : '* Completely voluntary, every bit of support is appreciated 🌟'}
          </p>
        </div>
      </div>


    </div>
  );
}