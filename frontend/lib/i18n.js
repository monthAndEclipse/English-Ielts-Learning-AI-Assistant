import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// 引入本地 JSON 语言文件
import en from "../public/locales/en/common.json";
import zh from "../public/locales/zh/common.json";

// 初始化 i18n
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: "zh", // 默认语言
  fallbackLng: "en", // 兜底语言
  interpolation: { escapeValue: false }, // 关闭 HTML 转义
});

export default i18n;
