# SolarWise - Smart PV Recommendation Dashboard

SolarWise is a comprehensive, full-stack web application designed to help users transition to solar energy. It provides precise calculations for solar system sizing, cost estimation, and environmental impact, all enhanced by AI-driven insights.

## 🚀 Features

- **Smart Recommendation Engine**: Calculates system size (kW), panel count, and area based on consumption, budget, and space.
- **AI Expert Insights**: Uses Google Gemini AI to provide personalized explanations, optimization tips, and eco-impact summaries.
- **Interactive Dashboard**: Real-time charts for energy production vs. consumption using Recharts.
- **Environmental Impact**: Visualizes CO2 savings and equivalent tree planting.
- **Dark/Light Mode**: Modern, responsive UI built with Tailwind CSS and Framer Motion.
- **Full-Stack Architecture**: Express.js backend with Vite middleware for high performance.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Framer Motion, Recharts, Lucide React.
- **Backend**: Node.js, Express.js, tsx.
- **AI**: Google Gemini API (@google/genai).

## 📦 Installation & Setup

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Google Gemini API Key (get it from [Google AI Studio](https://aistudio.google.com/app/apikey))

### 2. Clone the Project
```bash
# Since this is a generated project, you can download the source code
# or copy the files into a new directory.
mkdir solarwise && cd solarwise
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory and add your Gemini API key:
```env
GEMINI_API_KEY=your_api_key_here
```

### 5. Run the Application
```bash
# Start the development server (Full-stack mode)
npm run dev
```
The app will be available at `http://localhost:3000`.

## 🧪 AI Integration Idea: "Smart Maintenance Predictor"

We've integrated **Google Gemini AI** to act as a virtual solar consultant. 

**How it works:**
1. The app sends your specific location, budget, and energy needs to the AI.
2. The AI analyzes the technical recommendation (e.g., "Monocrystalline panels in San Francisco").
3. It generates a **Maintenance & Efficiency Strategy**, suggesting specific cleaning schedules based on local climate patterns and identifying potential "payback accelerators" (like shifting heavy appliance usage to peak sun hours).

## 📄 License
Apache-2.0
