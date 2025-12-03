const endpoints = {
    // development
    // base_url: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080",
    //production
    base_url: "",
    task_start:"/api/v1/task/start",
    task_correction:"/api/v1/task/correct",  
};


export default endpoints;
