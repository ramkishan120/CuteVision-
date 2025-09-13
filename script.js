document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONFIGURATION ---
    const API_CONFIG = {
        URL: 'https://api.groq.com/openai/v1/chat/completions',
        MODEL: 'meta-llama/llama-4-scout-17b-16e-instruct',
        STORAGE_KEY_API_KEY: 'cutevision_groq_api_key',
        STORAGE_KEY_HISTORY: 'cutevision_analysis_history',
        STORAGE_KEY_DAILY_NUTRITION: 'cutevision_daily_nutrition',
        STORAGE_KEY_DAILY_HISTORY: 'cutevision_daily_history',
        STORAGE_KEY_COUNTRY: 'cutevision_country',
        STORAGE_KEY_LANGUAGE: 'cutevision_language',
        STORAGE_KEY_PROFILE: 'cutevision_user_profile',
        STORAGE_KEY_STREAK: 'cutevision_streak',
        STORAGE_KEY_ACHIEVEMENTS: 'cutevision_achievements',
        API_CHAT_PROMPT_TEXT: `You are CuteVision AI, a specialized food and health assistant. Your goal is to provide safe, accurate, and supportive information. IMPORTANT: Your answers must be concise, clear, and to the point, suitable for a mobile app interface. Use short paragraphs or bullet points. Avoid long, conversational introductions or conclusions. You have access to the user's profile and their recent food analysis history to provide personalized advice. USER PROFILE: {USER_PROFILE}, RECENT HISTORY: {HISTORY_SUMMARY}. You MUST strictly refuse to discuss any topics other than food, nutrition, and health. If the user asks about anything else, politely decline and steer the conversation back to food and health.`,
        API_PROMPT_TEXT: `
            You are a high-precision nutrition analysis bot. Your function is to act like a digital food lab. The user has provided an an image of a food item, and optionally, a name for the item: {USER_FOOD_NAME}.
            The user's preferred country for food context is: "{USER_COUNTRY}".
            USER PROFILE: {USER_PROFILE}

            RECENT NUTRITION HISTORY (last 3 days): {HISTORY_SUMMARY}

            Analyze the image and the provided name. If the name is provided, use it as a strong hint, but verify it against the image. If the name is not provided, identify the food from the image alone.

            Your response MUST be ONLY a single, minified JSON object. Do not include any text, pleasantries, or markdown formatting before or after the JSON. The JSON object must adhere to the following strict structure:
            {
              "title": "[Name of the food]",
              "description": "[A brief, factual, one-sentence description.]",
              "nutrition": {
                "Calories": "[Value] kcal", "Protein": "[Value]g", "Fat": "[Value]g", "Carbohydrates": "[Value]g", "Sugar": "[Value]g", "Fiber": "[Value]g", "Sodium": "[Value]mg"
              },
              "allergens": "[List of potential allergens like 'Dairy', 'Gluten', 'Nuts', or 'None']",
              "warnings": "[List any potential dietary warnings, e.g., 'High in sodium', 'Contains common allergens like nuts.']",
              "dangers": { "isDangerous": false, "sideEffects": "[If isDangerous is true, list potential side effects or health risks from frequent consumption. e.g., 'Increased risk of heart disease', 'May contribute to high blood pressure.']" },
              "healthyTip": "[Provide a single, actionable, and personalized health tip related to the food item, considering the user's profile and recent history. For example, if sodium is high this week, suggest a low-sodium alternative.]"
            }
            If the image does not contain food, or the item is unidentifiable, respond with this exact JSON format:
            {"error": "The item could not be identified as food or the image is unclear."}
        `
    };
    const NUTRIENT_COLORS = { Calories: '#F59E0B', Protein: '#3B82F6', Fat: '#F43F5E', Carbohydrates: '#8B5CF6', Sugar: '#EC4899', Fiber: '#10B981', Sodium: '#6B7280' };
    const NUTRIENT_MAX_VALUES = { Calories: 2000, Protein: 50, Fat: 70, Carbohydrates: 300, Sugar: 90, Fiber: 30, Sodium: 2300 };
    
    const NUTRIENT_INFO = {
    Calories: {
        title: 'About Calories',
        what_is: 'A calorie is a unit of energy. In nutrition, calories refer to the energy people get from the food and drink they consume, and the energy they use in physical activity.',
        intake: 'The recommended daily calorie intake depends on age, metabolism, and levels of physical activity. A general guide is around 2,000 calories per day for women and 2,500 for men.'
    },
    Protein: {
        title: 'About Protein',
        what_is: 'Protein is a macronutrient that is essential for building muscle mass. It is commonly found in animal products, though is also present in other sources, such as nuts and legumes.',
        intake: 'The recommended daily intake for protein is 0.8 grams of protein per kilogram of body weight. This amount can increase for athletes or those looking to build muscle.'
    },
    Fat: {
        title: 'About Fat',
        what_is: 'Fat is a macronutrient that provides energy and helps your body absorb vitamins. It is important to distinguish between healthy fats (like those in avocados and nuts) and unhealthy fats (like trans fats).',
        intake: 'The dietary reference intake (DRI) for fat in adults is 20% to 35% of total calories from fat. This is about 44 to 77 grams of fat per day if you eat 2,000 calories a day.'
    },
    Carbohydrates: {
        title: 'About Carbohydrates',
        what_is: 'Carbohydrates are a macronutrient that provides the body with its main source of energy. They include sugars, starches, and fiber.',
        intake: 'The recommended daily intake for carbohydrates is 45% to 65% of your total daily calories. For a 2,000-calorie diet, this is about 225 to 325 grams per day.'
    },
    Sugar: {
        title: 'About Sugar',
        what_is: 'Sugar is a type of carbohydrate. While some sugars are naturally occurring in foods like fruits, added sugars are common in processed foods and can contribute to health problems.',
        intake: 'The American Heart Association recommends no more than 25 grams (6 teaspoons) of added sugar per day for women and 36 grams (9 teaspoons) for men.'
    },
    Fiber: {
        title: 'About Fiber',
        what_is: 'Fiber is a type of carbohydrate that the body can\'t digest. It helps regulate the body\'s use of sugars, helping to keep hunger and blood sugar in check.',
        intake: 'The recommended daily fiber intake is 25 grams for women and 38 grams for men.'
    },
    Sodium: {
        title: 'About Sodium',
        what_is: 'Sodium is a mineral that\'s essential for life. It\'s regulated by your kidneys, and it helps control your body\'s fluid balance. It also helps send nerve impulses and affects muscle function.',
        intake: 'The recommended daily sodium intake is less than 2,300 mg per day. High sodium intake is linked to high blood pressure and an increased risk of heart disease.'
    }
};
    const translations = {
        en: {
            appName: 'CuteVision', welcomeTitle: 'Welcome!', welcomeMessage: 'Get instant nutritional insights about your food.', useCamera: 'Use Camera', uploadImage: 'Upload Image', imagePreview: 'Image Preview', enterFoodName: 'Optional: Enter food name (e.g., \'Apple\')', retake: 'Retake', analyze: 'Analyze', analysisResults: 'Analysis Results', analyzingFood: 'Analyzing your food...', nutritionSummary: 'Nutrition Summary', warnings: 'Warnings', healthRisks: 'Health Risks', healthyTip: 'Healthy Tip', analyzeAnotherPhoto: 'Analyze Another Photo', history: 'History', noHistoryYet: 'No history yet!', startAnalyzingToSeeHistory: 'Start analyzing to see your history.', clearHistory: 'Clear History', historyDetail: 'History Detail', oops: 'Oops!', anErrorOccurred: 'An Error Occurred', somethingWentWrong: 'Something went wrong.', goToMainScreen: 'Go to Main Screen', settings: 'Settings', groqApiKey: 'Groq API Key', apiKeyHint: 'Your API key is stored locally and never shared.', save: 'Save', areYouSure: 'Are you sure?', actionCannotBeUndone: 'This action cannot be undone.', cancel: 'Cancel', confirm: 'Confirm', deleteItem: 'Delete Item?', deleteItemMessage: 'This will permanently delete this item from your history.', clearHistoryConfirm: 'Clear History?', clearHistoryMessage: 'This will permanently delete all your analysis history.', dailyNutrition: 'Daily Nutrition', resetDailyTotals: 'Reset Daily Totals', todaysTotals: 'Today\'s Totals', dailyLog: 'Daily Log', noFoodLoggedToday: 'No food logged today!', analyzeFoodToAdd: 'Analyze food to add to your daily totals.', resetDailyTotalsConfirm: 'Reset Daily Totals?', resetDailyTotalsMessage: 'This will clear all logged food and reset your daily nutrition totals.', deleteLogEntry: 'Delete Log Entry?', deleteLogEntryMessage: 'This will remove this food from your daily totals.', undoLastLogAction: 'Undo Last Log Action', lastActionUndone: 'Last action undone!', noActionToUndo: 'No action to undo.', apiKeyRequired: 'API Key Required', apiKeyMissing: 'Please provide your Groq API key in the settings.', inputRequired: 'Input Required', browserNotSupported: 'Browser Not Supported', speechError: 'Speech Error', defaultCountry: 'Default Country for Analysis', globalNutrition: 'Global (General Nutrition)', us: 'United States', in: 'India', gb: 'United Kingdom', ca: 'Canada', au: 'Australia', de: 'Germany', fr: 'France', jp: 'Japan', cn: 'China', mx: 'Mexico', countryHint: 'This helps tailor nutritional advice to local foods.', language: 'Language', selectLanguage: 'Select your preferred language.', settingsSaved: 'Settings Saved', defaultCountryUpdated: 'Default country for analysis updated.', languageUpdated: 'Language updated!', previousDays: 'Previous Days', noPreviousDailyLogs: 'No previous daily logs!', dailySummariesWillAppearHere: 'Daily summaries will appear here.'
        },
        hi: {
            appName: 'क्यूटविजन', welcomeTitle: 'स्वागत है!', welcomeMessage: 'अपने भोजन के बारे में तत्काल पोषण संबंधी जानकारी प्राप्त करें।', useCamera: 'कैमरा का उपयोग करें', uploadImage: 'छवि अपलोड करें', imagePreview: 'छवि पूर्वावलोकन', enterFoodName: 'वैकल्पिक: भोजन का नाम दर्ज करें (जैसे \'सेब\')', retake: 'पुनः लें', analyze: 'विश्लेषण करें', analysisResults: 'विश्लेषण परिणाम', analyzingFood: 'आपके भोजन का विश्लेषण कर रहा है...', nutritionSummary: 'पोषण सारांश', warnings: 'चेतावनी', healthRisks: 'स्वास्थ्य जोखिम', healthyTip: 'स्वस्थ टिप', analyzeAnotherPhoto: 'एक और तस्वीर का विश्लेषण करें', history: 'इतिहास', noHistoryYet: 'अभी तक कोई इतिहास नहीं!', startAnalyzingToSeeHistory: 'अपना इतिहास देखने के लिए विश्लेषण करना शुरू करें।', clearHistory: 'इतिहास साफ़ करें', historyDetail: 'इतिहास विवरण', oops: 'ऊप्स!', anErrorOccurred: 'एक त्रुटि हुई', somethingWentWrong: 'कुछ गलत हो गया।', goToMainScreen: 'मुख्य स्क्रीन पर जाएं', settings: 'सेटिंग्स', groqApiKey: 'ग्रॉक एपीआई कुंजी', apiKeyHint: 'आपकी एपीआई कुंजी स्थानीय रूप से संग्रहीत है और कभी साझा नहीं की जाती है।', save: 'सहेजें', areYouSure: 'क्या आप निश्चित हैं?', actionCannotBeUndone: 'यह कार्रवाई पूर्ववत नहीं की जा सकती है।', cancel: 'रद्द करें', confirm: 'पुष्टि करें', deleteItem: 'आइटम हटाएं?', deleteItemMessage: 'यह आपके इतिहास से इस आइटम को स्थायी रूप से हटा देगा।', clearHistoryConfirm: 'इतिहास साफ़ करें?', clearHistoryMessage: 'यह आपके सभी विश्लेषण इतिहास को स्थायी रूप से हटा देगा।', dailyNutrition: 'दैनिक पोषण', resetDailyTotals: 'दैनिक कुल रीसेट करें', todaysTotals: 'आज का कुल', dailyLog: 'दैनिक लॉग', noFoodLoggedToday: 'आज कोई भोजन लॉग नहीं किया गया!', analyzeFoodToAdd: 'अपने दैनिक कुल में जोड़ने के लिए भोजन का विश्लेषण करें।', resetDailyTotalsConfirm: 'दैनिक कुल रीसेट करें?', resetDailyTotalsMessage: 'यह सभी लॉग किए गए भोजन को साफ़ कर देगा और आपके दैनिक पोषण कुल को रीसेट कर देगा।', deleteLogEntry: 'लॉग प्रविष्टि हटाएं?', deleteLogEntryMessage: 'यह आपके दैनिक कुल से इस भोजन को हटा देगा।', undoLastLogAction: 'पिछली कार्रवाई पूर्ववत करें', lastActionUndone: 'पिछली कार्रवाई पूर्ववत की गई!', noActionToUndo: 'पूर्ववत करने के लिए कोई कार्रवाई नहीं।', apiKeyRequired: 'एपीआई कुंजी आवश्यक है', apiKeyMissing: 'कृपया सेटिंग्स में अपनी ग्रॉक एपीआई कुंजी प्रदान करें।' 
        }
    };
    const ACHIEVEMENTS = { 
        scan1: { title: "First Scan!", description: "Analyze your first food item.", icon: "fa-camera" }, 
        scan5: { title: "Food Explorer", description: "Analyze 5 different food items.", icon: "fa-compass" }, 
        streak3: { title: "Healthy Habit", description: "Maintain a 3-day streak.", icon: "fa-calendar-check" }, 
        proteinPro: { title: "Protein Pro", description: "Log over 50g of protein in one day.", icon: "fa-dumbbell" },
        varietyStar: { title: "Variety Star", description: "Analyze 10 different food items.", icon: "fa-star" },
        weeklyWarrior: { title: "Weekly Warrior", description: "Maintain a 7-day streak.", icon: "fa-calendar-alt" },
        calorieCounter: { title: "Calorie Counter", description: "Log over 2000 calories in one day.", icon: "fa-calculator" },
        fiberFanatic: { title: "Fiber Fanatic", description: "Log over 30g of fiber in one day.", icon: "fa-leaf" },
        sugarSavvy: { title: "Sugar Savvy", description: "Analyze a food with less than 5g of sugar.", icon: "fa-candy-cane" }
    };

    // --- 2. DOM REFERENCES ---
    const DOM = {
        screens: {
            main: document.getElementById('main-screen'), camera: document.getElementById('camera-screen'), preview: document.getElementById('preview-screen'), results: document.getElementById('results-screen'), history: document.getElementById('history-screen'), historyDetail: document.getElementById('history-detail-screen'), dailyNutrition: document.getElementById('daily-nutrition-screen'), error: document.getElementById('error-screen'), summary: document.getElementById('summary-screen'), achievements: document.getElementById('achievements-screen'),
            chat: document.getElementById('chat-screen')
        },
        buttons: {
            startCamera: document.getElementById('start-camera-btn'), history: document.getElementById('history-btn'), nutritionTracker: document.getElementById('nutrition-tracker-btn'), settings: document.getElementById('settings-btn'), achievements: document.getElementById('achievements-btn'), summary: document.getElementById('summary-btn'), backFromSummary: document.getElementById('back-from-summary-btn'), backFromAchievements: document.getElementById('back-from-achievements-btn'), closeCamera: document.getElementById('close-camera-btn'), capture: document.getElementById('capture-btn'), backFromPreview: document.getElementById('back-from-preview-btn'), retake: document.getElementById('retake-btn'), analyze: document.getElementById('analyze-btn'), backFromResults: document.getElementById('back-from-results-btn'), newPhoto: document.getElementById('new-photo-btn'), backToMainFromHistory: document.getElementById('back-to-main-from-history-btn'), clearHistory: document.getElementById('clear-history-btn'), backToHistoryList: document.getElementById('back-to-history-list-btn'), backToMainFromNutrition: document.getElementById('back-to-main-from-nutrition-btn'), resetDailyNutrition: document.getElementById('reset-daily-nutrition-btn'), backToMainFromError: document.getElementById('back-to-main-from-error-btn'), speakResults: document.getElementById('speak-results-btn'), closeSettings: document.getElementById('close-settings-btn'), saveSettings: document.getElementById('save-settings-btn'), closeConfirmation: document.getElementById('close-confirmation-btn'), cancelConfirmation: document.getElementById('cancel-confirmation-btn'), confirmAction: document.getElementById('confirm-action-btn'),
            share: document.getElementById('share-btn'),
            chat: document.getElementById('chat-btn'),
            backFromChat: document.getElementById('back-from-chat-btn'),
            sendChat: document.getElementById('send-chat-btn'),
            addHistoryChat: document.getElementById('add-history-chat-btn'),
            closeHistorySelect: document.getElementById('close-history-select-btn'),
            attachImageChat: document.getElementById('attach-image-chat-btn'),
            removeChatImage: document.getElementById('remove-chat-image-btn')
        },
        inputs: {
            upload: document.getElementById('upload-input'), apiKey: document.getElementById('groq-api-key-input'), foodName: document.getElementById('food-name-input'), voiceInputBtn: document.getElementById('voice-input-btn'), countrySelect: document.getElementById('country-select'), languageSelect: document.getElementById('language-select'), historySearch: document.getElementById('history-search-input'), profileName: document.getElementById('profile-name'), profileWeight: document.getElementById('profile-weight'), profileHeight: document.getElementById('profile-height'), profileGoal: document.getElementById('profile-goal'),
                        chat: document.getElementById('chat-input'),
            chatUpload: document.getElementById('chat-upload-input')
        },
        media: {
            cameraPreview: document.getElementById('camera-preview'), capturedImageCanvas: document.getElementById('captured-image-canvas')
        },
        dialogs: {
            settings: document.getElementById('settings-dialog'), confirmation: document.getElementById('confirmation-dialog'),
            historySelection: document.getElementById('history-selection-dialog')
        },
        displays: {
            streak: document.getElementById('streak-display'), streakCount: document.getElementById('streak-count'), summaryContent: document.getElementById('summary-content'), achievementsList: document.getElementById('achievements-list'), loadingState: document.querySelector('#results-screen .loading-state'), resultsDisplay: document.querySelector('#results-screen .results-display'), foodTitle: document.getElementById('food-title'), foodDescription: document.getElementById('food-description'), nutritionData: document.getElementById('nutrition-data-display'), warningsCard: document.getElementById('warnings-card'), warningsList: document.getElementById('warnings-list'), dangerCard: document.getElementById('danger-card'), historyList: document.getElementById('history-list'), emptyHistoryState: document.getElementById('empty-history-state'), dailyNutritionSummaryGrid: document.getElementById('daily-nutrition-summary-grid'), dailyFoodLog: document.getElementById('daily-food-log'), emptyDailyLogState: document.getElementById('empty-daily-log-state'), historyDetailImage: document.getElementById('history-detail-image'), historyDetailTitle: document.getElementById('history-detail-title'), historyDetailDescription: document.getElementById('history-detail-description'), historyDetailNutrition: document.getElementById('history-detail-nutrition-display'), historyDetailWarningsCard: document.getElementById('history-detail-warnings-card'), historyDetailWarningsList: document.getElementById('history-detail-warnings-list'), historyDetailDangerCard: document.getElementById('history-detail-danger-card'), historyDetailDangerList: document.getElementById('history-detail-danger-list'), historyDetailHealthTipCard: document.getElementById('history-detail-health-tip-card'), historyDetailHealthTip: document.getElementById('history-detail-health-tip'), historyDetailAllergensCard: document.getElementById('history-detail-allergens-card'), historyDetailAllergensList: document.getElementById('history-detail-allergens-list'),
            chatMessages: document.getElementById('chat-messages'),
            historySelectionList: document.getElementById('history-selection-list'),
            chatImagePreviewContainer: document.getElementById('chat-image-preview-container'),
            chatImagePreview: document.getElementById('chat-image-preview')
        }
    };

    // --- 3. STATE & UTILITY ---
    let currentStream = null, capturedImageBase64 = null, currentScreenId = null, voices = [], chatImageBase64 = null;

    function getFromStorage(key, defaultValue = null) {
        const item = localStorage.getItem(key);
        if (item === null) return defaultValue;
        try {
            return JSON.parse(item);
        } catch (e) {
            return item; // Fallback for old, non-JSON data
        }
    }
    function saveToStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
    function switchScreen(targetScreenId, isBack = false) {
        if (currentScreenId === targetScreenId && !isBack) return;

        const currentActiveScreen = DOM.screens[currentScreenId];
        const targetScreen = DOM.screens[targetScreenId];

        if (!targetScreen) {
            console.error(`Screen "${targetScreenId}" not found.`);
            return;
        }

        if (!isBack) {
            history.pushState({ screen: targetScreenId }, ``, `#${targetScreenId}`);
        }

        if (currentActiveScreen) {
            currentActiveScreen.classList.remove('active');
        }

        // Render content for specific screens
        if (targetScreenId === 'history') {
            renderHistoryList();
        } else if (targetScreenId === 'dailyNutrition') {
            renderDailyNutritionSummary();
            renderDailyFoodLog();
        } else if (targetScreenId === 'achievements') {
            renderAchievements();
        } else if (targetScreenId === 'summary') {
            renderSummaryScreen();
        }

        targetScreen.classList.add('active');
        currentScreenId = targetScreenId;
    }
    function goBack() {
        history.back();
    }
    window.onpopstate = function(event) {
        if (event.state && event.state.screen) {
            switchScreen(event.state.screen, true);
        } else {
            switchScreen('main', true);
        }
    };
    function resetToMainScreen() {
        history.replaceState({ screen: 'main' }, ``, `#main`);
        switchScreen('main');
    }
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
        });
    }
    function toggleDialog(dialog, show) {
        if (show) {
            dialog.classList.remove('hidden');
            setTimeout(() => dialog.classList.remove('opacity-0'), 10);
        } else {
            dialog.classList.add('opacity-0');
            setTimeout(() => dialog.classList.add('hidden'), 300);
        }
    }
    function resizeImage(base64Str, maxWidth = 800, maxHeight = 800) {
        return new Promise(resolve => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                if (width > height) {
                    if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
                } else {
                    if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
        });
    }
    function updateUIStrings() {
        const lang = getFromStorage(API_CONFIG.STORAGE_KEY_LANGUAGE, 'en');
        const t = translations[lang];
        document.querySelectorAll('[data-translate]').forEach(el => { if(t[el.dataset.translate]) el.textContent = t[el.dataset.translate]; });
        document.querySelectorAll('[data-translate-placeholder]').forEach(el => { if(t[el.dataset.translatePlaceholder]) el.placeholder = t[el.dataset.translatePlaceholder]; });
    }
    function parseNutrientValue(value) {
        if (typeof value === 'string') {
            return parseFloat(value.replace(/,/g, '')) || 0;
        }
        return parseFloat(value) || 0;
    }
    function renderNutritionCircle(nutrient, total, maxValue, color, size = 'large') {
        const percentage = Math.min((total / maxValue) * 100, 100);
        let unit = '';
        if (nutrient === 'Calories') unit = 'kcal';
        else if (['Protein', 'Fat', 'Carbohydrates', 'Sugar', 'Fiber'].includes(nutrient)) unit = 'g';
        else if (nutrient === 'Sodium') unit = 'mg';
        const sizeClasses = { large: { container: 'w-24 h-24', value: 'text-xl font-bold', label: 'text-xs' }, small: { container: 'w-20 h-20', value: 'text-lg font-bold', label: 'text-[10px]' } };
        const classes = sizeClasses[size];
        const item = document.createElement('div');
        item.className = 'flex flex-col items-center gap-2';
        item.innerHTML = `<div class="relative ${classes.container}"><svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100"><circle class="text-gray-200" stroke-width="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50"></circle><circle class="nutrition-circle-fg" stroke-width="10" stroke-linecap="round" stroke="${color}" fill="transparent" r="45" cx="50" cy="50" style="transition: stroke-dashoffset 0.8s ease-out;"></circle></svg><div class="absolute inset-0 flex flex-col items-center justify-center text-center"><span class="${classes.value} text-text-dark">${Math.round(total)}<span class="text-sm text-text-light">${unit}</span></span><span class="text-text-light ${classes.label}">${nutrient}</span></div></div>`;
        const circleFg = item.querySelector('.nutrition-circle-fg');
        const radius = 45;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;
        circleFg.style.strokeDasharray = `${circumference} ${circumference}`;
        setTimeout(() => circleFg.style.strokeDashoffset = offset, 100);
        return item;
    }

    // --- 4. CORE APP LOGIC ---
    async function startCamera() { try { if (currentStream) stopCameraStream(); currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); DOM.media.cameraPreview.srcObject = currentStream; await DOM.media.cameraPreview.play(); switchScreen('camera'); } catch (err) { displayError(new Error(err.name === "NotAllowedError" ? "Camera access was denied." : "No back camera found."), { name: err.name }); } } 
    function stopCameraStream() { if (currentStream) { currentStream.getTracks().forEach(track => track.stop()); currentStream = null; DOM.media.cameraPreview.srcObject = null; } } 
    function captureImageFromVideo() { const c = document.createElement('canvas'); c.width = DOM.media.cameraPreview.videoWidth; c.height = DOM.media.cameraPreview.videoHeight; c.getContext('2d').drawImage(DOM.media.cameraPreview, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.92); } 
    function renderPreviewImage(base64Image) {
        capturedImageBase64 = base64Image;
        const canvas = DOM.media.capturedImageCanvas;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const size = Math.min(img.width, img.height);
            const x = (img.width - size) / 2;
            const y = (img.height - size) / 2;
            
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            
            ctx.drawImage(img, x, y, size, size, 0, 0, canvas.width, canvas.height);
            ctx.beginPath(); // Start a new path for the border
            ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 2, 0, Math.PI * 2, true);
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.stroke();

        };
        img.src = base64Image;
        switchScreen('preview');
    }

    async function analyzeImageWithGroq() {
        if (DOM.buttons.analyze.disabled) return;

        const apiKey = getFromStorage(API_CONFIG.STORAGE_KEY_API_KEY);
        if (!apiKey) return showAlert('API Key Required', 'Please set your Groq API key in the settings.', () => toggleDialog(DOM.dialogs.settings, true));
        
        const lang = getFromStorage(API_CONFIG.STORAGE_KEY_LANGUAGE, 'en');
        const t = translations[lang];
        
        DOM.buttons.analyze.disabled = true;
        DOM.buttons.analyze.innerHTML = `<div class="spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto"></div>`;

        switchScreen('results');
        DOM.displays.loadingState.style.display = 'flex';
        DOM.displays.resultsDisplay.style.display = 'none';
        try {
            const resizedImage = await resizeImage(capturedImageBase64);
            const userFoodName = DOM.inputs.foodName.value.trim();
            const profile = getFromStorage(API_CONFIG.STORAGE_KEY_PROFILE, {});
            let history = getAnalysisHistory();
            const historySummary = history.slice(0, 5).map(item => `${item.title}: ${item.nutrition.Calories}`).join(', ');
            const promptText = API_CONFIG.API_PROMPT_TEXT.replace('{USER_FOOD_NAME}', userFoodName || 'Not provided').replace('{USER_COUNTRY}', getFromStorage(API_CONFIG.STORAGE_KEY_COUNTRY, 'global')).replace('{USER_PROFILE}', JSON.stringify(profile)).replace('{HISTORY_SUMMARY}', historySummary);
            const response = await fetch(API_CONFIG.URL, { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: API_CONFIG.MODEL, messages: [{ role: 'user', content: [{ type: 'text', text: promptText }, { type: 'image_url', image_url: { url: resizedImage } }] }], max_tokens: 1024 }) });
            if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText} - ${await response.text()}`);
            const responseJson = await response.json();
            const messageContent = responseJson.choices[0]?.message?.content;
            if (!messageContent) throw new Error('Invalid response from AI model.');
            let analysisData;
            try {
                analysisData = JSON.parse(messageContent);
            } catch (e) {
                console.error("Failed to parse AI response JSON:", messageContent);
                throw new Error('Invalid response from AI model.');
            }
            if (analysisData.error) throw new Error(`AI Error: ${analysisData.error}`);
            analysisData.imageB64 = resizedImage.split(',')[1];
            analysisData.timestamp = new Date().toISOString();
            analysisData.id = `analysis-${Date.now()}`;
            renderAnalysisResults(analysisData);
            history.unshift(analysisData);
            saveAnalysisToHistory(history);
            updateStreak();
            checkAchievements(analysisData);
        } catch (error) { 
            displayError(error, error.message.includes('API Error') ? error.message : null); 
        } 
        finally { 
            DOM.buttons.analyze.disabled = false;
            DOM.buttons.analyze.textContent = t.analyze;
            if (currentScreenId === 'results') {
                DOM.displays.loadingState.style.display = 'none';
                DOM.displays.resultsDisplay.style.display = 'flex';
            }
        }
    }

    function renderAnalysisResults(data, isHistory = false) {
        const displays = { 
            title: DOM.displays[isHistory ? 'historyDetailTitle' : 'foodTitle'], 
            description: DOM.displays[isHistory ? 'historyDetailDescription' : 'foodDescription'], 
            nutrition: DOM.displays[isHistory ? 'historyDetailNutrition' : 'nutritionData'], 
            allergensCard: DOM.displays[isHistory ? 'historyDetailAllergensCard' : 'allergensCard'], 
            allergensList: DOM.displays[isHistory ? 'historyDetailAllergensList' : 'allergensList'], 
            warningsCard: DOM.displays[isHistory ? 'historyDetailWarningsCard' : 'warningsCard'], 
            warningsList: DOM.displays[isHistory ? 'historyDetailWarningsList' : 'warningsList'], 
            dangerCard: DOM.displays[isHistory ? 'historyDetailDangerCard' : 'dangerCard'], 
            dangerList: DOM.displays[isHistory ? 'historyDetailDangerList' : 'dangerList'], 
            healthTipCard: DOM.displays[isHistory ? 'historyDetailHealthTipCard' : 'healthTipCard'], 
            healthTip: DOM.displays[isHistory ? 'historyDetailHealthTip' : 'healthTip'] 
        };
        
        if(displays.title) displays.title.textContent = data.title; 
        if(displays.description) displays.description.textContent = data.description;
        
        if(displays.nutrition) {
            displays.nutrition.innerHTML = '';
            for (const [nutrient, value] of Object.entries(data.nutrition)) { 
                const item = renderNutritionCircle(nutrient, parseNutrientValue(value), NUTRIENT_MAX_VALUES[nutrient] || 100, NUTRIENT_COLORS[nutrient] || '#333'); 
                displays.nutrition.appendChild(item); 
            }
        }

        const hasAllergens = data.allergens && data.allergens.length > 0 && data.allergens[0].toLowerCase() !== 'none';
        if(displays.allergensCard) displays.allergensCard.classList.toggle('hidden', !hasAllergens);
        if (hasAllergens && displays.allergensList) displays.allergensList.innerHTML = data.allergens.map(w => `<li>${w}</li>`).join('');
        
        const hasWarnings = data.warnings && data.warnings.length > 0;
        if(displays.warningsCard) displays.warningsCard.classList.toggle('hidden', !hasWarnings);
        if (hasWarnings && displays.warningsList) displays.warningsList.innerHTML = data.warnings.map(w => `<li>${w}</li>`).join('');

        const hasDangers = data.dangers?.isDangerous && data.dangers.sideEffects?.length > 0;
        if(displays.dangerCard) displays.dangerCard.classList.toggle('hidden', !hasDangers);
        if (hasDangers && displays.dangerList) displays.dangerList.innerHTML = data.dangers.sideEffects.map(e => `<li>${e}</li>`).join('');
        
        const hasHealthTip = data.healthyTip && data.healthyTip.length > 0;
        if(displays.healthTipCard) displays.healthTipCard.classList.toggle('hidden', !hasHealthTip);
        if (hasHealthTip && displays.healthTip) displays.healthTip.textContent = data.healthyTip;

        if (!isHistory) { 
            updateDailyNutritionTotals(data); 
            lastAnalysisData = data; 
        }
    }

    function getAnalysisHistory() { 
        const history = getFromStorage(API_CONFIG.STORAGE_KEY_HISTORY, []);
        if (Array.isArray(history)) {
            return history;
        }
        return [];
    }
    function saveAnalysisToHistory(history) { saveToStorage(API_CONFIG.STORAGE_KEY_HISTORY, history); }
    function getDailyNutritionTotals() { const stored = getFromStorage(API_CONFIG.STORAGE_KEY_DAILY_NUTRITION); if (stored && stored.date === new Date().toDateString()) { return stored; } return { date: new Date().toDateString(), totals: {}, log: [] }; }
    function saveDailyNutritionTotals(data) { saveToStorage(API_CONFIG.STORAGE_KEY_DAILY_NUTRITION, data); }
    function getDailyHistory() { return getFromStorage(API_CONFIG.STORAGE_KEY_DAILY_HISTORY, []); }
    function saveDailyHistory(history) { saveToStorage(API_CONFIG.STORAGE_KEY_DAILY_HISTORY, history); }

    function updateDailyNutritionTotals(analysisData) { let dailyData = getDailyNutritionTotals(); if (dailyData.date !== new Date().toDateString()) { if (Object.keys(dailyData.totals).length > 0 || dailyData.log.length > 0) { const history = getDailyHistory(); history.unshift(dailyData); saveDailyHistory(history); } dailyData = { date: new Date().toDateString(), totals: {}, log: [] }; } for (const [nutrient, value] of Object.entries(analysisData.nutrition)) { const cleanNutrient = nutrient.replace(/\s*\(.*\)/, ''); dailyData.totals[cleanNutrient] = (dailyData.totals[cleanNutrient] || 0) + parseNutrientValue(value); } dailyData.log.push({ id: analysisData.id, title: analysisData.title, timestamp: analysisData.timestamp, nutrition: analysisData.nutrition }); saveDailyNutritionTotals(dailyData); if (currentScreenId === 'dailyNutrition') { renderDailyNutritionSummary(); renderDailyFoodLog(); } }
    function deleteItem(id) {
        // Remove from history
        let history = getAnalysisHistory();
        history = history.filter(item => item.id !== id);
        saveAnalysisToHistory(history);

        // Remove from daily log and update totals
        let dailyData = getDailyNutritionTotals();
        const dailyLogItem = dailyData.log.find(log => log.id === id);
        if (dailyLogItem) {
            for (const [nutrient, value] of Object.entries(dailyLogItem.nutrition)) {
                const cleanNutrient = nutrient.replace(/\s*\(.*\)/, '');
                dailyData.totals[cleanNutrient] = Math.max(0, (dailyData.totals[cleanNutrient] || 0) - parseNutrientValue(value));
            }
            dailyData.log = dailyData.log.filter(log => log.id !== id);
            saveDailyNutritionTotals(dailyData);
        }

        // Re-render both screens
        renderHistoryList();
        renderDailyNutritionSummary();
        renderDailyFoodLog();

        toggleDialog(DOM.dialogs.confirmation, false);
    }
    function renderHistoryList() { const history = getAnalysisHistory(); const searchTerm = DOM.inputs.historySearch.value.toLowerCase(); const filteredHistory = history.filter(item => item.title.toLowerCase().includes(searchTerm)); DOM.displays.historyList.innerHTML = ''; DOM.displays.emptyHistoryState.classList.toggle('hidden', filteredHistory.length > 0); DOM.buttons.clearHistory.style.display = history.length > 0 ? 'block' : 'none'; filteredHistory.forEach(item => { const historyItem = document.createElement('div'); historyItem.className = 'history-item group flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors'; historyItem.dataset.id = item.id;
 historyItem.innerHTML = `<img src="data:image/jpeg;base64,${item.imageB64}" alt="${item.title}" class="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-gray-100"><div class="flex-grow overflow-hidden"><h4 class="font-bold text-text-dark truncate">${item.title}</h4><p class="text-sm text-text-light">${new Date(item.timestamp).toLocaleString()}</p></div><button class="delete-history-item-btn text-gray-400 hover:text-error w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Delete Item"><i class="fas fa-trash-alt"></i></button>`; historyItem.querySelector('.delete-history-item-btn').addEventListener('click', (e) => { e.stopPropagation(); showConfirmationDialog('Delete Item?', 'This will permanently delete this item from your history.', () => deleteItem(item.id)); }); historyItem.addEventListener('click', () => showHistoryDetail(item.id)); DOM.displays.historyList.appendChild(historyItem); }); }
    function showHistoryDetail(id) { const item = getAnalysisHistory().find(h => h.id === id); if (item) { DOM.displays.historyDetailImage.src = `data:image/jpeg;base64,${item.imageB64}`; renderAnalysisResults(item, true); switchScreen('historyDetail'); } }
    function clearAllHistory() {
        showConfirmationDialog('Clear History?', 'This will permanently delete all your analysis history.', () => {
            // Clear history
            saveAnalysisToHistory([]);

            // Clear daily nutrition
            localStorage.removeItem(API_CONFIG.STORAGE_KEY_DAILY_NUTRITION);

            // Re-render UI
            renderHistoryList();
            renderDailyNutritionSummary();
            renderDailyFoodLog();

            toggleDialog(DOM.dialogs.confirmation, false);
        });
    }
    function renderDailyNutritionSummary() { const dailyData = getDailyNutritionTotals(); DOM.displays.dailyNutritionSummaryGrid.innerHTML = ''; const nutrientOrder = ['Calories', 'Protein', 'Fat', 'Carbohydrates', 'Sugar', 'Fiber', 'Sodium']; nutrientOrder.forEach(nutrient => { const total = dailyData.totals[nutrient] || 0; const item = renderNutritionCircle(nutrient, total, NUTRIENT_MAX_VALUES[nutrient] || 100, NUTRIENT_COLORS[nutrient] || '#333', 'large'); DOM.displays.dailyNutritionSummaryGrid.appendChild(item); }); }
    function renderDailyFoodLog() { const dailyData = getDailyNutritionTotals(); DOM.displays.dailyFoodLog.innerHTML = ''; DOM.displays.emptyDailyLogState.classList.toggle('hidden', dailyData.log.length > 0);
 const sortedLog = [...dailyData.log].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); sortedLog.forEach(logItem => { const logEntry = document.createElement('div'); logEntry.className = 'flex items-center p-3 bg-card-bg rounded-xl shadow-subtle'; logEntry.dataset.id = logItem.id;
 logEntry.innerHTML = `<div class="flex-grow"><h4 class="font-bold text-text-dark">${logItem.title}</h4><p class="text-sm text-text-light">${new Date(logItem.timestamp).toLocaleTimeString()}</p></div><button class="delete-daily-log-item-btn text-gray-400 hover:text-error w-8 h-8 flex items-center justify-center transition-colors" aria-label="Delete Log Entry"><i class="fas fa-trash-alt"></i></button>`; logEntry.querySelector('.delete-daily-log-item-btn').addEventListener('click', (e) => { e.stopPropagation(); showConfirmationDialog('Delete Log Entry?', 'This will remove this food from your daily totals.', () => deleteItem(logItem.id)); }); DOM.displays.dailyFoodLog.appendChild(logEntry); }); }
    

    // Gamification & Summaries
    function updateStreak() { let streakData = getFromStorage(API_CONFIG.STORAGE_KEY_STREAK, { count: 0, lastScan: null }); const today = new Date().toDateString(); if (streakData.lastScan === today) return; const yesterday = new Date(Date.now() - 86400000).toDateString(); if (streakData.lastScan === yesterday) { streakData.count++; } else { streakData.count = 1; } streakData.lastScan = today; saveToStorage(API_CONFIG.STORAGE_KEY_STREAK, streakData); displayStreak(); }
    function displayStreak() { const streakData = getFromStorage(API_CONFIG.STORAGE_KEY_STREAK, { count: 0 }); if (streakData.count > 0) { DOM.displays.streakCount.textContent = streakData.count; DOM.displays.streak.classList.remove('hidden'); } else { DOM.displays.streak.classList.add('hidden'); } }
    function checkAchievements(analysisData) {
        const achievements = getFromStorage(API_CONFIG.STORAGE_KEY_ACHIEVEMENTS, {});
        const history = getAnalysisHistory();
        const dailyTotals = getDailyNutritionTotals().totals;
        let updated = false;

        if (!achievements.scan1) { achievements.scan1 = true; updated = true; showAlert("Achievement Unlocked!", ACHIEVEMENTS.scan1.title); }
        if (!achievements.scan5 && history.length >= 5) { achievements.scan5 = true; updated = true; showAlert("Achievement Unlocked!", ACHIEVEMENTS.scan5.title); }
        if (!achievements.varietyStar && new Set(history.map(item => item.title.toLowerCase())).size >= 10) { achievements.varietyStar = true; updated = true; showAlert("Achievement Unlocked!", ACHIEVEMENTS.varietyStar.title); }
        
        const streak = getFromStorage(API_CONFIG.STORAGE_KEY_STREAK, { count: 0 });
        if (!achievements.streak3 && streak.count >= 3) { achievements.streak3 = true; updated = true; showAlert("Achievement Unlocked!", ACHIEVEMENTS.streak3.title); }
        if (!achievements.weeklyWarrior && streak.count >= 7) { achievements.weeklyWarrior = true; updated = true; showAlert("Achievement Unlocked!", ACHIEVEMENTS.weeklyWarrior.title); }
        
        if (!achievements.proteinPro && (dailyTotals.Protein || 0) >= 50) { achievements.proteinPro = true; updated = true; showAlert("Achievement Unlocked!", ACHIEVEMENTS.proteinPro.title); }
        if (!achievements.calorieCounter && (dailyTotals.Calories || 0) >= 2000) { achievements.calorieCounter = true; updated = true; showAlert("Achievement Unlocked!", ACHIEVEMENTS.calorieCounter.title); }
        if (!achievements.fiberFanatic && (dailyTotals.Fiber || 0) >= 30) { achievements.fiberFanatic = true; updated = true; showAlert("Achievement Unlocked!", ACHIEVEMENTS.fiberFanatic.title); }
        if (!achievements.sugarSavvy && parseNutrientValue(analysisData.nutrition.Sugar) < 5) { achievements.sugarSavvy = true; updated = true; showAlert("Achievement Unlocked!", ACHIEVEMENTS.sugarSavvy.title); }

        if (updated) saveToStorage(API_CONFIG.STORAGE_KEY_ACHIEVEMENTS, achievements);
    } 
    function renderAchievements() { const unlocked = getFromStorage(API_CONFIG.STORAGE_KEY_ACHIEVEMENTS, {}); DOM.displays.achievementsList.innerHTML = ''; for (const key in ACHIEVEMENTS) { const achievement = ACHIEVEMENTS[key]; const isUnlocked = unlocked[key]; const item = document.createElement('div'); item.className = `p-4 rounded-xl flex flex-col items-center justify-center text-center ${isUnlocked ? 'bg-green-100 text-green-800 shadow-subtle' : 'bg-gray-100 text-gray-400'}`;
    item.innerHTML = `<i class="fas ${achievement.icon} fa-3x mb-2"></i><h4 class="font-bold">${achievement.title}</h4><p class="text-xs mt-1">${achievement.description}</p>`; DOM.displays.achievementsList.appendChild(item); } }
    function renderSummaryScreen() { const history = getAnalysisHistory(); const weeklyData = history.filter(item => (new Date() - new Date(item.timestamp)) / (1000 * 60 * 60 * 24) <= 7); const weeklyAvg = { Calories: 0, Protein: 0, Fat: 0, Carbohydrates: 0 }; if (weeklyData.length > 0) { weeklyData.forEach(item => { for (const key in weeklyAvg) { weeklyAvg[key] += parseNutrientValue(item.nutrition[key]); } }); for (const key in weeklyAvg) { weeklyAvg[key] /= weeklyData.length; } } DOM.displays.summaryContent.innerHTML = `<div class="bg-white p-6 rounded-2xl shadow-subtle"><h3 class="font-heading text-primary mb-4 text-xl">Last 7 Days Average</h3><div class="grid grid-cols-2 gap-4">${Object.entries(weeklyAvg).map(([key, value]) => `<div><p class="text-sm text-text-light">${key}</p><p class="font-bold text-2xl text-text-dark">${Math.round(value)}</p></div>`).join('')}</div></div>`; }

    // Speech, Dialogs & Sharing
    function loadVoices() { voices = speechSynthesis.getVoices(); }
    function getBestVoice(lang) { const langVoices = voices.filter(v => v.lang.startsWith(lang)); const qualityMap = { 'Google': 5, 'Natural': 5, 'Neural': 5, 'Microsoft': 4, 'Apple': 4 }; langVoices.sort((a, b) => { const scoreA = Object.entries(qualityMap).reduce((acc, [key, value]) => a.name.includes(key) ? acc + value : acc, 0) + (a.localService ? 0 : 1); const scoreB = Object.entries(qualityMap).reduce((acc, [key, value]) => b.name.includes(key) ? acc + value : acc, 0) + (b.localService ? 0 : 1); return scoreB - scoreA; }); return langVoices[0]; }
    async function speakAnalysisResults() { if (!lastAnalysisData) return showAlert('No Data', 'No analysis results to speak.'); if (!('speechSynthesis' in window)) return showAlert('Browser Not Supported', 'Speech synthesis not supported in this browser.'); const { title, nutrition, healthyTip } = lastAnalysisData;
    const textToSpeak = `Analysis for ${title}. Calories: ${nutrition.Calories || 'unknown'}. Protein: ${nutrition.Protein || 'unknown'}. ${healthyTip ? `A healthy tip: ${healthyTip}` : ''}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.voice = getBestVoice(getFromStorage(API_CONFIG.STORAGE_KEY_LANGUAGE, 'en'));
    utterance.lang = getFromStorage(API_CONFIG.STORAGE_KEY_LANGUAGE, 'en');
    window.speechSynthesis.speak(utterance); }
    function startVoiceInput() { const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return showAlert('Browser Not Supported', 'Speech recognition not supported in this browser.');
    const recognition = new SpeechRecognition();
    recognition.lang = getFromStorage(API_CONFIG.STORAGE_KEY_LANGUAGE, 'en');
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    const voiceButton = DOM.inputs.voiceInputBtn;
    voiceButton.classList.add('ring-2', 'ring-primary');
    recognition.onresult = (event) => {
        DOM.inputs.foodName.value = event.results[0][0].transcript;
    };
    recognition.onend = () => voiceButton.classList.remove('ring-2', 'ring-primary');
    recognition.onerror = (event) => showAlert('Speech Error', `Speech recognition error: ${event.error}`);
    recognition.start(); }
    function displayError(error, rawResponse = null) { console.error(error); if(DOM.displays.errorType) DOM.displays.errorType.textContent = error.name || 'Error'; if(DOM.displays.errorDetails) DOM.displays.errorDetails.textContent = error.message || 'An unknown error occurred.'; if(DOM.displays.rawErrorResponse) { DOM.displays.rawErrorResponse.textContent = rawResponse ? JSON.stringify(rawResponse, null, 2) : ''; DOM.displays.rawErrorResponse.style.display = rawResponse ? 'block' : 'none'; } switchScreen('error'); } 
    function showConfirmationDialog(title, message, onConfirm) { const dialog = DOM.dialogs.confirmation;
    if (!dialog) return;
    const titleEl = dialog.querySelector('#confirmation-dialog-title');
    const messageEl = dialog.querySelector('#confirmation-message');
    const confirmBtn = dialog.querySelector('#confirm-action-btn');
    if(titleEl) titleEl.textContent = title;
    if(messageEl) messageEl.textContent = message;
    if(confirmBtn) {
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', () => onConfirm(), { once: true });
        DOM.buttons.confirmAction = newConfirmBtn;
    }
    toggleDialog(dialog, true); }
    function showAlert(title, message, onConfirm) { const dialog = DOM.dialogs.confirmation;
    if (!dialog) return;
    const confirmBtn = dialog.querySelector('#confirm-action-btn');
    const cancelBtn = dialog.querySelector('#cancel-confirmation-btn');
    showConfirmationDialog(title, message, () => {
        toggleDialog(dialog, false);
        if(confirmBtn && cancelBtn) {
            setTimeout(() => {
                confirmBtn.classList.replace('bg-primary', 'bg-error');
                cancelBtn.classList.remove('hidden');
            }, 300);
        }
        if (onConfirm) onConfirm();
    });
    if(confirmBtn && cancelBtn) {
        confirmBtn.classList.replace('bg-error', 'bg-primary');
        cancelBtn.classList.add('hidden');
    }
    } 
    function shareResults() { if (!lastAnalysisData) return showAlert('No Results', 'Please analyze an image first.'); const { title, nutrition } = lastAnalysisData;
    const shareText = `I just analyzed ${title} with CuteVision! Calories: ${nutrition.Calories || 'N/A'}, Protein: ${nutrition.Protein || 'N/A'}`;
    if (navigator.share) {
        navigator.share({
            title: `Nutrition Facts for ${title}`,
            text: shareText
        }).catch(err => console.error('Error sharing:', err));
    } else {
        showAlert('Not Supported', 'Web Share API is not supported on your browser.');
    } }

    let chatHistory = [];
    async function handleSendMessage() {
        const messageText = DOM.inputs.chat.value.trim();
        if (!messageText && !chatImageBase64) return;

        let userContent = [];
        if (messageText) {
            userContent.push({ type: 'text', text: messageText });
        }
        if (chatImageBase64) {
            userContent.push({ type: 'image_url', image_url: { url: chatImageBase64 } });
        }

        DOM.inputs.chat.value = '';
        removeChatImage(); // Clear image after sending

        chatHistory.push({ role: 'user', content: userContent });
        renderChatMessages();

        try {
            const apiKey = getFromStorage(API_CONFIG.STORAGE_KEY_API_KEY);
            if (!apiKey) {
                chatHistory.push({ role: 'assistant', content: 'Please set your Groq API key in the settings to use the chat feature.' });
                renderChatMessages();
                return;
            }

            const profile = getFromStorage(API_CONFIG.STORAGE_KEY_PROFILE, {});
            const history = getAnalysisHistory();
            const historySummary = history.slice(0, 10).map(item => item.title).join(', ');
            
            const systemPrompt = {
                role: 'system',
                content: API_CONFIG.API_CHAT_PROMPT_TEXT
                    .replace('{USER_PROFILE}', JSON.stringify(profile))
                    .replace('{HISTORY_SUMMARY}', historySummary)
            };

            const messages = [systemPrompt, ...chatHistory];

            const response = await fetch(API_CONFIG.URL, { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ model: API_CONFIG.MODEL, messages: messages, max_tokens: 1024 })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText} - ${await response.text()}`);

            const responseJson = await response.json();
            const assistantMessage = responseJson.choices[0]?.message?.content;

            if (assistantMessage) {
                chatHistory.push({ role: 'assistant', content: assistantMessage });
                renderChatMessages();
            }

        } catch (error) {
            console.error('Chat API Error:', error);
            chatHistory.push({ role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' });
            renderChatMessages();
        }
    }

    function markdownToHtml(text) {
        if (typeof text !== 'string') {
            return '';
        }
        // Basic Markdown to HTML conversion
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')     // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>')         // Italic
            .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>') // Code block
            .replace(/`(.*?)`/g, '<code>$1</code>');        // Inline code
    }

    function renderChatMessages() {
        if (!DOM.displays.chatMessages) return;
        DOM.displays.chatMessages.innerHTML = '';
        chatHistory.forEach(msg => {
            const msgBubble = document.createElement('div');
            const isUser = msg.role === 'user';
            msgBubble.className = `p-3 rounded-2xl max-w-[80%] ${isUser ? 'bg-primary text-white self-end' : 'bg-gray-200 text-text-dark self-start'}`;
            
            if (Array.isArray(msg.content)) {
                // Multipart message (text + image)
                const textPart = msg.content.find(p => p.type === 'text');
                const imgPart = msg.content.find(p => p.type === 'image_url');

                if (imgPart) {
                    const imgEl = document.createElement('img');
                    imgEl.src = imgPart.image_url.url;
                    imgEl.className = 'w-32 h-32 rounded-lg object-cover mb-2';
                    msgBubble.appendChild(imgEl);
                }
                if (textPart) {
                    const textEl = document.createElement('p');
                    textEl.textContent = textPart.text;
                    msgBubble.appendChild(textEl);
                }
            } else {
                // Simple text message from assistant
                msgBubble.innerHTML = markdownToHtml(msg.content);
            }

            DOM.displays.chatMessages.appendChild(msgBubble);
        });
        DOM.displays.chatMessages.scrollTop = DOM.displays.chatMessages.scrollHeight;
    }

    function openHistorySelectionDialog() {
        const history = getAnalysisHistory();
        if (!DOM.displays.historySelectionList) return;
        DOM.displays.historySelectionList.innerHTML = '';

        if (history.length === 0) {
            DOM.displays.historySelectionList.innerHTML = `<p class="p-4 text-center text-gray-500">Your history is empty.</p>`;
        } else {
            history.forEach(item => {
                const historyItem = document.createElement('div');
                historyItem.className = 'flex items-center gap-4 p-3 cursor-pointer hover:bg-gray-100 rounded-lg';
                historyItem.innerHTML = `<img src="data:image/jpeg;base64,${item.imageB64}" alt="${item.title}" class="w-12 h-12 rounded-lg object-cover bg-gray-100"><div class="flex-grow"><h4 class="font-bold text-text-dark">${item.title}</h4></div>`;
                historyItem.addEventListener('click', () => {
                    if (DOM.inputs.chat) {
                        DOM.inputs.chat.value = `Regarding the ${item.title} I ate, `;
                        DOM.inputs.chat.focus();
                    }
                    toggleDialog(DOM.dialogs.historySelection, false);
                });
                DOM.displays.historySelectionList.appendChild(historyItem);
            });
        }
        toggleDialog(DOM.dialogs.historySelection, true);
    }

    async function handleChatImageSelected(e) {
        if (e.target.files[0]) {
            try {
                const base64 = await fileToBase64(e.target.files[0]);
                const resizedImage = await resizeImage(base64);
                chatImageBase64 = resizedImage;
                if (DOM.displays.chatImagePreview) DOM.displays.chatImagePreview.src = resizedImage;
                if (DOM.displays.chatImagePreviewContainer) DOM.displays.chatImagePreviewContainer.classList.remove('hidden');
            } catch (err) {
                console.error('Error reading chat image:', err);
                showAlert('Error', 'Could not read the selected image.');
            }
        }
    }

    function removeChatImage() {
        chatImageBase64 = null;
        if (DOM.displays.chatImagePreview) DOM.displays.chatImagePreview.src = '';
        if (DOM.displays.chatImagePreviewContainer) DOM.displays.chatImagePreviewContainer.classList.add('hidden');
    }


    // --- 5. INITIALIZATION ---
    function init() {
        updateUIStrings();
        switchScreen('main');
        loadVoices();
        displayStreak();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }

        Object.keys(DOM.buttons).forEach(key => {
            const button = DOM.buttons[key];
            if (!button) return;
            switch (key) {
                case 'startCamera': button.addEventListener('click', startCamera); break;
                case 'history': button.addEventListener('click', () => switchScreen('history')); break;
                case 'nutritionTracker': button.addEventListener('click', () => switchScreen('dailyNutrition')); break;
                case 'settings': button.addEventListener('click', () => {
                    const profile = getFromStorage(API_CONFIG.STORAGE_KEY_PROFILE, {});
                    if(DOM.inputs.profileName) DOM.inputs.profileName.value = profile.name || '';
                    if(DOM.inputs.profileWeight) DOM.inputs.profileWeight.value = profile.weight || '';
                    if(DOM.inputs.profileHeight) DOM.inputs.profileHeight.value = profile.height || '';
                    if(DOM.inputs.profileGoal) DOM.inputs.profileGoal.value = profile.goal || 'maintain';
                    if(DOM.inputs.apiKey) DOM.inputs.apiKey.value = getFromStorage(API_CONFIG.STORAGE_KEY_API_KEY, '');
                    if(DOM.inputs.countrySelect) DOM.inputs.countrySelect.value = getFromStorage(API_CONFIG.STORAGE_KEY_COUNTRY, 'global');
                    if(DOM.inputs.languageSelect) DOM.inputs.languageSelect.value = getFromStorage(API_CONFIG.STORAGE_KEY_LANGUAGE, 'en');
                    toggleDialog(DOM.dialogs.settings, true);
                }); break;
                case 'achievements': button.addEventListener('click', () => switchScreen('achievements')); break;
                case 'summary': button.addEventListener('click', () => switchScreen('summary')); break;
                case 'chat': button.addEventListener('click', () => switchScreen('chat')); break;
                case 'backFromChat': button.addEventListener('click', goBack); break;
                case 'sendChat': button.addEventListener('click', handleSendMessage); break;
                case 'addHistoryChat': button.addEventListener('click', openHistorySelectionDialog); break;
                case 'closeHistorySelect': button.addEventListener('click', () => toggleDialog(DOM.dialogs.historySelection, false)); break;
                case 'closeCamera': button.addEventListener('click', () => { stopCameraStream(); goBack(); }); break;
                case 'capture': button.addEventListener('click', () => { const img = captureImageFromVideo(); stopCameraStream(); renderPreviewImage(img); }); break;
                case 'backFromPreview': case 'retake': case 'backToHistoryList': case 'backFromSummary': case 'backFromAchievements': button.addEventListener('click', goBack); break;
                case 'backFromResults': case 'newPhoto': button.addEventListener('click', resetToMainScreen); break;
                case 'backToMainFromHistory': button.addEventListener('click', goBack); break;
                case 'backToMainFromNutrition': button.addEventListener('click', goBack); break;
                case 'analyze': button.addEventListener('click', analyzeImageWithGroq); break;
                case 'clearHistory': button.addEventListener('click', clearAllHistory); break;
                case 'resetDailyNutrition': button.addEventListener('click', () => showConfirmationDialog('Reset Daily Totals?', 'This will clear all logged food and reset your daily nutrition totals.', () => { localStorage.removeItem(API_CONFIG.STORAGE_KEY_DAILY_NUTRITION); renderDailyNutritionSummary(); renderDailyFoodLog(); toggleDialog(DOM.dialogs.confirmation, false); })); break;
                case 'speakResults': button.addEventListener('click', speakAnalysisResults); break;
                case 'share': button.addEventListener('click', shareResults); break;
                case 'closeSettings': button.addEventListener('click', () => toggleDialog(DOM.dialogs.settings, false)); break;
                case 'saveSettings': button.addEventListener('click', () => {
                    if(DOM.inputs.apiKey) saveToStorage(API_CONFIG.STORAGE_KEY_API_KEY, DOM.inputs.apiKey.value.trim());
                    if(DOM.inputs.countrySelect) saveToStorage(API_CONFIG.STORAGE_KEY_COUNTRY, DOM.inputs.countrySelect.value);
                    if(DOM.inputs.languageSelect) saveToStorage(API_CONFIG.STORAGE_KEY_LANGUAGE, DOM.inputs.languageSelect.value);
                    const profile = {
                        name: DOM.inputs.profileName ? DOM.inputs.profileName.value : '', 
                        weight: DOM.inputs.profileWeight ? DOM.inputs.profileWeight.value : '', 
                        height: DOM.inputs.profileHeight ? DOM.inputs.profileHeight.value : '', 
                        goal: DOM.inputs.profileGoal ? DOM.inputs.profileGoal.value : ''
                    };
                    saveToStorage(API_CONFIG.STORAGE_KEY_PROFILE, profile);
                    toggleDialog(DOM.dialogs.settings, false);
                    showAlert('Success', 'Settings saved!');
                    updateUIStrings();
                }); break;
                case 'closeConfirmation': case 'cancelConfirmation': button.addEventListener('click', () => toggleDialog(DOM.dialogs.confirmation, false)); break;
            }
        });

        if(DOM.inputs.upload) {
            DOM.inputs.upload.addEventListener('change', async (e) => { 
                if (e.target.files[0]) { 
                    try { 
                        const base64 = await fileToBase64(e.target.files[0]); 
                        renderPreviewImage(base64); 
                    } catch (err) { 
                        displayError(new Error('Could not read the selected file: ' + err.message)); 
                    } finally {
                        e.target.value = null;
                    }
                } 
            });
        }
        
        if(DOM.inputs.voiceInputBtn) {
            DOM.inputs.voiceInputBtn.addEventListener('click', startVoiceInput);
        }

        if(DOM.inputs.historySearch) {
            DOM.inputs.historySearch.addEventListener('input', renderHistoryList);
        }

        if(DOM.inputs.chat) {
            DOM.inputs.chat.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSendMessage();
                }
            });
        }

        if(DOM.buttons.attachImageChat) {
            DOM.buttons.attachImageChat.addEventListener('click', () => DOM.inputs.chatUpload.click());
        }

        if(DOM.inputs.chatUpload) {
            DOM.inputs.chatUpload.addEventListener('change', handleChatImageSelected);
        }

        if(DOM.buttons.removeChatImage) {
            DOM.buttons.removeChatImage.addEventListener('click', removeChatImage);
        }
        
        const tabs = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        if (tabs.length > 0 && tabContents.length > 0) {
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    tabContents.forEach(c => c.classList.add('hidden'));
                    const tabContent = document.getElementById(tab.dataset.tab);
                    if (tabContent) {
                        tabContent.classList.remove('hidden');
                    }
                });
            });
        }
    }

    init();
});
