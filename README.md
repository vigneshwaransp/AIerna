# 👑 AIrena: Smart Tournament Operations Platform

AIrena is a production-grade, international-scale sports tournament operations platform. Powered by **Google Gemini GenAI**, it provides live venue telemetry, dynamic crowd forecasting, accessible indoor navigation routing, automated multi-language dispatching, and emergency incident coordination.

The user interface has been fully migrated to a customized **Neo-brutalist** design style—featuring a paper-cream canvas, thick black border strokes, offset zero-blur shadows, high-saturation color blocks, and geometric Space Grotesk typography.

---

## ⚡ Tech Stack

### Frontend Client
*   **Core**: Next.js 16 (App Router, TypeScript)
*   **Styling**: Tailwind CSS v4, Custom Neo-brutalist variables
*   **Icons**: Lucide React (Thick stroke-width SVGs)
*   **Animations**: Framer Motion
*   **Deployment**: Vercel

### Backend Services
*   **Framework**: FastAPI (Python 3.12, Uvicorn)
*   **Database**: SQLite with SQLAlchemy ORM
*   **Live Feeds**: WebSockets (`ws://localhost:8000/ws/telemetry`)
*   **AI Engine**: Google Gemini API (structured schema fallback)
*   **Test Suite**: Pytest (100% test coverage)

---

## 🛠️ System Modules

### 1. Command Center (`/dashboard`)
*   **Live Telemetry**: Real-time attendee counter, open incident trackers, and notification alerts.
*   **Telemetry Grid**: Multi-colored KPI cards monitoring critical gate density indexes.
*   **Incident Log**: Feed of filed operations alerts linked directly to detailed response panels.

### 2. Dynamic Crowd Management (`/dashboard/crowd`)
*   **Venue Heatmap**: Aspect-ratio custom SVG arena blueprint plotting real-time attendee concentrations and pulsing hazards.
*   **Simulation Triggers**: Interactive button controls simulating 500-attendee surges to trigger instant AI rerouting.
*   **Forecast Chart**: Custom SVG polyline charting a 24-hour crowd utilization graph.

### 3. Indoor Navigation (`/dashboard/navigation`)
*   **Congestion Bypass**: Custom SVG route builder displaying Fastest, Accessible, or Bottleneck-avoiding walkways.
*   **Accessibility Mode**: Highlights paths bypassing stairs and verifies lift operation status.
*   **Evacuation Corridors**: Flashing red SVG route overlays guiding crowds to emergency exits.

### 4. Volunteer AI Copilot (`/dashboard/copilot`)
*   **GenAI Chat**: RAG-enhanced chat interface for field staff with interactive floating recommendations.
*   **Shift Timeline**: Progress checks and checklists tracking assigned duties.

### 5. Emergency Center (`/dashboard/emergency`)
*   **Checklists**: Interactive crisis protocol checklists.
*   **Multilingual Broadcast**: Translates emergency announcements instantly across 8 languages.

### 6. Lost Person Assistant (`/dashboard/lost`)
*   **Operations Registry**: Track missing reports with description logs and search status.
*   **CCTV Timeline**: Logs and checkpoint mapping for color-filtered CCTV scanning.

---

## 🚀 Quickstart Guide

### 1. Environment Configuration

Create a `.env` file inside the `backend` directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=sqlite:///./airena.db
```
*(If `GEMINI_API_KEY` is omitted, the platform automatically falls back to the local structural mockup AI engine).*

### 2. Backend Installation & Seed
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python seed.py
python run.py
```
*FastAPI server will launch at `http://localhost:8000`.*

### 3. Frontend Installation & Build
```bash
cd frontend
npm install
npm run dev
```
*Next.js application will launch at `http://localhost:3000`.*

---

## 🧪 Testing Suite
Verify backend modules and database integrity by running the pytest suite:
```bash
cd backend
python -m pytest tests -v
```

---

## 🐳 Docker Deployment
Run the entire platform locally using Docker:
```bash
docker-compose up --build
```
*Frontend matches internal reverse proxies pointing to backend endpoints.*

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
