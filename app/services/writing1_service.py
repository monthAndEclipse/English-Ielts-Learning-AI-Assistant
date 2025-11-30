import json
import random
from abc import ABC

from app.services.base_task_service import BasePromptService
from app.schemas.task_req import TaskReq

class Writing1PromptService(BasePromptService, ABC):

    #强相关的属性
    chart_types = ["bar", "line", "pie", "table", "process"]
    time_patterns = ["single-year", "multi-year", "before-after", "long-term", "no-time"]
    dimensions = ["age groups", "countries", "genders", "industries", "regions"]
    complexity = ["low", "medium", "high"]

    def start_pre_process(self, data: TaskReq, prompt: str) -> str:
        # 👉 这里写你“synonym start”的前置增强逻辑
        # 随机度选择
        processed = self.randomize(data,prompt)
        return processed

    def randomize(self,data: TaskReq,prompt: str)-> str:
        original_type = data.type
        data.type = "subtopics"
        subtopics_start_prompt = self.choose_prompt(data)
        subtopics_start_prompt = subtopics_start_prompt.replace("[1]",data.domain)
        random_subtopics = self.retry_prompt(subtopics_start_prompt)
        random_subtopics_json = json.loads(random_subtopics)

        task_config = {
            "topic": data.domain,
            "subtopic": random.choice(random_subtopics_json["subtopics"]),
            "chart": data.question_type,
            "time": random.choice(self.time_patterns),
            "dimension": random.choice(self.dimensions),
            "complexity": random.choice(self.complexity),
        }
        processed = (((((prompt.replace("[1]",task_config["topic"])
                     .replace("[2]", task_config["subtopic"]))
                     .replace("[3]", task_config["chart"]))
                     .replace("[4]", task_config["time"]))
                     .replace("[5]", task_config["dimension"]))
                     .replace("[6]", task_config["complexity"]))

        #还原
        data.type = original_type
        return processed

    def correct_pre_process(self, data: TaskReq, prompt: str) -> str:
        """
        在 prompt 中替换占位符：
        [1] -> 原始文章 original_article
        [2] -> 用户答案 answers（通常是 dict，需要转成 json 字符串）
        """
        # --- 1. 取数据 ---
        original = data.original_article or ""
        answers = data.answers or {}

        # 将 answers 转为漂亮的 JSON，防止 dict 无法直接放进 prompt
        import json
        answers_json = json.dumps(answers, ensure_ascii=False, indent=2)

        # --- 2. 替换占位符 ---
        # 使用简单 replace 即可，因为格式固定
        processed = prompt.replace("[1]", original).replace("[2]", answers_json)

        return processed

    def hint_pre_process(self, data: TaskReq, prompt: str) -> str:
        # 👉 这里写“synonym hint”的前置增强逻辑
        return prompt


    def start_post_process(self, data: TaskReq, result: str) -> str:
        # 👉 这里写你“synonym start”的后处理逻辑
        return result

    def correct_post_process(self, data: TaskReq, result: str) -> str:
        # 👉 这里写“synonym correct”的后处理
        return result

    def hint_post_process(self, data: TaskReq, result: str) -> str:
        # 👉 这里写“synonym hint”的后处理
        return result
