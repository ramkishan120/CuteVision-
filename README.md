# CuteVision 📸

CuteVision is an intelligent web application that acts as your personal digital food lab. By simply taking a picture of your food or uploading an image, you can get instant, detailed nutritional insights. The app is designed to be intuitive, informative, and encouraging, helping you make smarter decisions about your diet.

This project was built by the Gemini CLI.

## ✨ Features

*   **Instant Food Analysis:** Use your device's camera or upload an image to identify food items.
*   **Comprehensive Nutrition Summary:** Get a detailed breakdown of key nutrients, including Calories, Protein, Fat, Carbohydrates, Sugar, Fiber, and Sodium.
*   **Health & Safety Insights:** The app identifies potential allergens, provides dietary warnings, and highlights potential health risks associated with the food item.
*   **Personalized Health Tips:** Receive actionable health tips tailored to your user profile and recent eating habits.
*   **Daily Nutrition Tracker:** Log your meals to keep track of your total daily nutrient intake.
*   **Analysis History:** All your food analyses are saved locally for you to review at any time.
*   **Gamification:** Stay motivated with a streak counter and unlock achievements for reaching your health and usage goals.
*   **AI Health Assistant:** An integrated AI chat allows you to ask questions about food, nutrition, and health.
*   **User Profiles:** Set up a profile with your health goals (e.g., weight loss, muscle gain) for more personalized feedback.
*   **Multi-Language Support:** The app is available in both English and Hindi.

## 🚀 How It Works

CuteVision leverages the power of the Groq API and the LLaMA 4 Scout model to perform its analysis.

1.  **Image Input:** The user captures a photo with their device's camera or uploads an existing image file.
2.  **API Request:** The image is converted to a base64 string and sent to the Groq API's chat completions endpoint. A detailed prompt instructs the model to act as a high-precision nutrition analysis bot, analyze the image, and return a structured JSON object.
3.  **JSON Response:** The model returns a single, minified JSON object containing the food's title, a brief description, a detailed nutrition breakdown, a list of allergens, warnings, potential dangers, and a personalized healthy tip.
4.  **Display Results:** The application parses this JSON data and displays it in a clean, user-friendly interface with interactive charts and cards.

All data, including your API key and analysis history, is stored locally in your browser's `localStorage`.

## 🔧 How to Use

1.  **Open the `index.html` file** in your web browser.
2.  **Set Your API Key:**
    *   Click the settings icon (⚙️).
    *   Navigate to the "API" tab.
    *   Enter your Groq API key. You can get one from the [Groq Console](https://console.groq.com/keys).
    *   Click "Save Settings".
3.  **Analyze Food:**
    *   From the main screen, either click "Use Camera" to take a photo or "Upload Image" to select a file from your device.
    *   After capturing or selecting an image, you can optionally provide a name for the food to improve accuracy.
    *   Click "Analyze" and wait for the results.

## 🔒 Is It Safe?

Your Groq API key is stored in your browser's `localStorage`. It is **never shared with any external servers** besides the Groq API for analysis. However, please be aware that storing API keys in the browser is not a secure practice for production environments. This application is intended for development and personal use.

## 📱 Responsive Design

The website is fully responsive and optimized for a seamless experience on mobile devices. It has been designed to work well on various screen sizes, including phones like the iPhone 7.

---
*Made with ❤️ by Gemini CLI*
