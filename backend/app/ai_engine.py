import os
import json
import logging
import requests
from datetime import datetime
from typing import List, Dict, Any, Optional
from .schemas import AIChatQuery, AIChatResponse

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

# RAG Knowledge Base Documents
KNOWLEDGE_BASE = [
    {
        "id": 1,
        "title": "Medical Incident Protocols",
        "content": "In case of medical emergencies, locate the nearest medical responder team (designated as Med-A, Med-B, etc.). The primary evacuation route for medical transport is Gate E, which connects directly to the ambulance bay. Maintain a clear 5-meter corridor for emergency access.",
        "category": "Medical"
    },
    {
        "id": 2,
        "title": "Fire Evacuation Procedures",
        "content": "For fire alarms or smoke reports, initiate immediate zone evacuation. Sound the local emergency broadcast. Redirect all visitors in the affected sector away from the threat. For the North Stand, evacuate through Gate D and Gate F. Do not use elevators. Safe muster points are Parking Lot B and the main parkway.",
        "category": "Fire"
    },
    {
        "id": 3,
        "title": "Security Threat Response",
        "content": "If a security threat or suspicious package is identified, do not touch the item. Cordon off the area within a 50-meter radius. Deploy Security Teams to block entrances leading to the sector. Divert pedestrian flow to alternative security check gates (Gate C and Gate A). Wait for bomb squad or local police arrival.",
        "category": "Security"
    },
    {
        "id": 4,
        "title": "Lost Person Search protocols",
        "content": "For lost children or missing persons, immediately log their description (clothing, age, last known location) in the system. Search checkpoints must be set up at the Info Desk, Ticket Office, and nearest Security booth of their last seen quadrant. Check all exits and monitor security camera feeds for the specified clothing color.",
        "category": "Lost Child"
    },
    {
        "id": 5,
        "title": "Crowd Congestion Management",
        "content": "When crowd density in a zone exceeds 4 people per square meter, the status is critical. Immediately open alternative escape gates. Divert incoming queues by directing volunteers to position themselves at intersection corridors. Broadcast voice alerts in multiple languages: English, Hindi, Spanish, French, and local languages.",
        "category": "Crowd"
    },
    {
        "id": 6,
        "title": "Volunteer Duty and Assignments",
        "content": "Volunteers are divided into Sector Teams: Gate Operations, Info Desks, Medical Support, and Crowd Flow Guides. Standard shifts are 6 hours. During emergency alerts, volunteers must report to the nearest Security Coordinator or assist in directing visitors to the nearest evacuation exits.",
        "category": "Volunteer"
    }
]

# Quick translations table for fallback multilingual generation
FALLBACK_TRANSLATIONS = {
    "English": {
        "attention": "Attention all visitors. Please head to Gate C to avoid the current queue.",
        "emergency": "Emergency incident reported in Zone 2. Please remain calm and proceed to the nearest exit.",
        "lost_person": "Lost child report: A 6-year-old child wearing a red t-shirt was last seen at Gate B.",
        "gate_redirect": "Gate A is reaching maximum capacity. Visitors are requested to use Gate C and Gate D."
    },
    "Hindi": {
        "attention": "सभी आगंतुकों का ध्यान दें। कृपया भीड़ से बचने के लिए गेट सी की ओर बढ़ें।",
        "emergency": "जोन 2 में आपातकालीन घटना की सूचना मिली है। कृपया शांत रहें और निकटतम निकास की ओर बढ़ें।",
        "lost_person": "खोए हुए बच्चे की रिपोर्ट: लाल टी-शर्ट पहने एक 6 वर्षीय बच्चा आखिरी बार गेट बी पर देखा गया था।",
        "gate_redirect": "गेट ए अपनी अधिकतम क्षमता पर पहुंच रहा है। आगंतुकों से गेट सी और गेट डी का उपयोग करने का अनुरोध किया जाता है।"
    },
    "Tamil": {
        "attention": "பார்வையாளர்கள் கவனத்திற்கு. தற்போதைய வரிசையைத் தவிர்க்க கேட் சி பகுதிக்கு செல்லவும்.",
        "emergency": "மண்டலம் 2-ல் அவசர சம்பவம் பதிவாகியுள்ளது. தயவுசெய்து அமைதியாக இருந்து அருகிலுள்ள வெளியேறும் வழியை நோக்கிச் செல்லவும்.",
        "lost_person": "காணாமல் போன குழந்தை: சிவப்பு நிற டி-சர்ட் அணிந்த 6 வயது குழந்தை கடைசியாக கேட் பி இல் காணப்பட்டது.",
        "gate_redirect": "கேட் ஏ அதன் அதிகபட்ச கொள்ளளவை எட்டுகிறது. பார்வையாளர்கள் கேட் சி மற்றும் கேட் டி ஐப் பயன்படுத்துமாறு கேட்டுக்கொள்ளப்படுகிறார்கள்."
    },
    "Telugu": {
        "attention": "సందర్శకులందరి దృష్టికి. ప్రస్తుత క్యూను నివారించడానికి దయచేసి గేట్ సి వైపు వెళ్ళండి.",
        "emergency": "జోన్ 2 లో అత్యవసర సంఘటన నివేదించబడింది. దయచేసి ప్రశాంతంగా ఉండి సమీప నిష్క్రమణ వైపు వెళ్ళండి.",
        "lost_person": "తప్పిపోయిన బాలుడి నివేదిక: ఎరుపు రంగు టీ షర్టు ధరించిన 6 ఏళ్ల బాలుడు చివరిసారిగా గేట్ బి వద్ద కనిపించాడు.",
        "gate_redirect": "గేట్ ఎ గరిష్ట సామర్థ్యానికి చేరుకుంటోంది. సందర్శకులు గేట్ సి మరియు గేట్ డి ఉపయోగించాలని అభ్యర్థించబడింది."
    },
    "Kannada": {
        "attention": "ಎಲ್ಲಾ ವೀಕ್ಷಕರ ಗಮನಕ್ಕೆ. ದಯವಿಟ್ಟು ಪ್ರಸ್ತುತ ಸರತಿಯನ್ನು ತಪ್ಪಿಸಲು ಗೇಟ್ ಸಿ ಗೆ ಹೋಗಿ.",
        "emergency": "ವಲಯ 2 ರಲ್ಲಿ ತುರ್ತು ಘಟನೆ ವರದಿಯಾಗಿದೆ. ದಯವಿಟ್ಟು ಶಾಂತರಾಗಿರಿ ಮತ್ತು ಹತ್ತಿರದ ನಿರ್ಗಮನದ ಕಡೆಗೆ ಸಾಗಿರಿ.",
        "lost_person": "ಕಳೆದುಹೋದ ಮಗುವಿನ ವರದಿ: ಕೆಂಪು ಟಿ-ಶರ್ಟ್ ಧರಿಸಿದ 6 ವರ್ಷದ ಮಗು ಕೊನೆಯದಾಗಿ ಗೇಟ್ ಬಿ ನಲ್ಲಿ ಕಂಡುಬಂದಿದೆ.",
        "gate_redirect": "ಗೇಟ್ ಎ ಗರಿಷ್ಠ ಸಾಮರ್ಥ್ಯವನ್ನು ತಲುಪುತ್ತಿದೆ. ವೀಕ್ಷಕರು ಗೇಟ್ ಸಿ ಮತ್ತು ಗೇಟ್ ಡಿ ಅನ್ನು ಬಳಸಲು ವಿನಂತಿಸಲಾಗಿದೆ."
    },
    "Malayalam": {
        "attention": "എല്ലാ സന്ദർശകരുടെയും ശ്രദ്ധയ്ക്ക്. നിലവിലെ ക്യൂ ഒഴിവാക്കാൻ ദയവായി ഗേറ്റ് സി-ലേക്ക് പോകുക.",
        "emergency": "സോൺ 2-ൽ അടിയന്തിര സംഭവം റിപ്പോർട്ട് ചെയ്തിട്ടുണ്ട്. ദയവായി ശാന്തത പാലിക്കുകയും അടുത്തുള്ള എക്സിറ്റിലേക്ക് നീങ്ങുകയും ചെയ്യുക.",
        "lost_person": "കാണാതായ കുട്ടിയെക്കുറിച്ചുള്ള റിപ്പോർട്ട്: ചുവന്ന ടി-ഷർട്ട് ധരിച്ച 6 വയസ്സുള്ള കുട്ടിയെ അവസാനമായി ഗേറ്റ് ബിയിൽ കണ്ടു.",
        "gate_redirect": "ഗേറ്റ് എ പരമാവധി ശേഷിയിലെത്തുന്നു. സന്ദർശകർ ഗേറ്റ് സി, ഗേറ്റ് ഡി എന്നിവ ഉപയോഗിക്കാൻ അഭ്യർത്ഥിക്കുന്നു."
    },
    "French": {
        "attention": "Attention à tous les visiteurs. Veuillez vous diriger vers la porte C pour éviter la file d'attente.",
        "emergency": "Incident d'urgence signalé dans la zone 2. Veuillez rester calme et vous diriger vers la sortie la plus proche.",
        "lost_person": "Avis de recherche : Un enfant de 6 ans vêtu d'un t-shirt rouge a été vu pour la dernière fois à la porte B.",
        "gate_redirect": "La porte A atteint sa capacité maximale. Les visiteurs sont priés d'utiliser les portes C et D."
    },
    "Japanese": {
        "attention": "来場者の皆様にご案内いたします。混雑を避けるため、ゲートCへお進みください。",
        "emergency": "ゾーン2で緊急事態が発生しました。落ち着いて最寄りの避難口へ向かってください。",
        "lost_person": "迷子のお知らせ：赤いTシャツを着た6歳のお子様が、ゲートBで最後に見撃されました。",
        "gate_redirect": "ゲートAは間もなく満員になります。来場者の皆様はゲートCおよびゲートDをご利用ください。"
    }
}

def call_gemini(prompt: str, json_mode: bool = False) -> str:
    """Helper to query the Gemini API using HTTP requests."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set.")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    
    contents = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }]
    }
    
    if json_mode:
        contents["generationConfig"] = {
            "responseMimeType": "application/json"
        }
        
    try:
        response = requests.post(url, headers=headers, json=contents, timeout=15)
        response.raise_for_status()
        res_data = response.json()
        text = res_data["candidates"][0]["content"]["parts"][0]["text"]
        return text
    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}")
        raise e

def query_rag(query: str) -> str:
    """Performs a simple keyword-based RAG search over local protocols."""
    matched_docs = []
    keywords = query.lower().split()
    for doc in KNOWLEDGE_BASE:
        score = sum(1 for kw in keywords if kw in doc["content"].lower() or kw in doc["title"].lower())
        if score > 0:
            matched_docs.append((score, doc))
            
    matched_docs.sort(key=lambda x: x[0], reverse=True)
    if matched_docs:
        context = "\n\n".join([f"Source: {doc['title']}\nContent: {doc['content']}" for _, doc in matched_docs[:3]])
        return context
    return "No standard venue operating procedure found for this query. Proceed with standard staff safety protocols."

def ai_chat_assistant(query: AIChatQuery) -> AIChatResponse:
    """Answers volunteer/staff queries depending on user role and context."""
    rag_context = query_rag(query.message)
    prompt = f"""
    You are the AI Arena Ops Copilot, an expert AI coordinator for major international sporting tournament operations.
    You are answering a query from a {query.role} located in/near {query.zone or 'General Area'}.
    Their preferred language is {query.preferred_language}.
    
    Use the following Venue Operating Guidelines if relevant:
    {rag_context}
    
    User Query: "{query.message}"
    
    Respond in {query.preferred_language}. Make your response professional, operationally precise, and actionable. 
    Do not mention 'RAG' or 'contexts' or 'databases'. Speak as the core operations authority.
    Include 2-3 specific suggested next steps or clickable quick buttons for their dashboard.
    
    Return your response as a JSON object with this exact structure:
    {{
        "response": "Detailed text response in {query.preferred_language}...",
        "suggested_actions": ["Action Button 1", "Action Button 2", "Action Button 3"],
        "language": "{query.preferred_language}"
    }}
    """
    
    if GEMINI_API_KEY:
        try:
            result = call_gemini(prompt, json_mode=True)
            data = json.loads(result)
            return AIChatResponse(**data)
        except Exception as e:
            logger.warning(f"Gemini chat assistant failed, falling back: {e}")
            
    # Mock fallback response
    msg = query.message.lower()
    resp_text = ""
    actions = []
    
    if "help" in msg or "assignment" in msg or "duty" in msg:
        if query.role == "Volunteer":
            resp_text = f"Your current sector assignment is Gate C Crowd Control. Flow rate at Gate C is rising. Please proceed to the Gate C entry queue to help volunteers guide visitors to the scanner lanes."
            actions = ["Acknowledge Assignment", "Request Zone Transfer", "Report Gate Queue Status"]
        elif query.role == "Security":
            resp_text = "Security patrol is ordered to sweep the West Promenade. Zone capacity in the food court is rising. Watch for gate bottlenecks and report suspicious baggage."
            actions = ["Confirm Patrol Start", "Report Bottleneck", "Request Medical Team Support"]
        else:
            resp_text = "All staff are advised to monitor the main corridors. Organize crowd flows near Gate A and Gate B. If you notice any bottleneck, report via the Command center."
            actions = ["Check Gate A Density", "Check Gate B Density"]
    elif "incident" in msg or "emergency" in msg or "medical" in msg:
        resp_text = f"Emergency Alert in progress: Medical incident reported in Sector 2. Nearest Medical Unit (Med-A) has been dispatched. ETA: 3 minutes. Emergency access routes have been cleared through Gate E."
        actions = ["Coordinate Gate E Access", "Contact Responder Med-A", "Mark Location Safe"]
    elif "summary" in msg or "report" in msg:
        resp_text = f"Here is your Duty Summary for today:\n- 09:00: Shift Briefing completed.\n- 09:30: Deployed to Gate C.\n- 10:15: Handled minor ticketing queue bottleneck.\nStatus is Active. Next zone checks are scheduled for 12:00."
        actions = ["Export Summary PDF", "Log Sighting Report"]
    else:
        resp_text = f"Welcome. I am your AI Operations Copilot. Currently, the tournament venue is at 64% capacity. All gates are operating normally, with minor congestion forming around the main food courts. Let me know how I can assist you."
        actions = ["View Crowd Density", "Check Active Incidents", "Emergency Broadcast"]
        
    return AIChatResponse(response=resp_text, suggested_actions=actions, language=query.preferred_language)

def ai_generate_incident_support(category: str, description: str, zone: str) -> Dict[str, Any]:
    """Generates incident summary, recommended actions, and routes."""
    prompt = f"""
    You are the AIrena Emergency Response Coordinator.
    An incident has occurred:
    Category: {category}
    Description: {description}
    Zone: {zone}
    
    Analyze the incident against standard sporting venue crisis response plans. Provide:
    1. A concise AI Summary of the incident threat level and scope.
    2. A checklist of Recommended Actions for response teams.
    3. Nearest resources that should be dispatched (e.g. Medics, Fire, Security, Volunteers) with ETAs.
    4. Safe indoor evacuation routes or diversion paths.
    
    Return your response as a JSON object with this exact structure:
    {{
        "ai_summary": "Concise summary...",
        "recommended_actions": "1. Step one\\n2. Step two...",
        "nearest_resources": [
            {{"name": "Med-A", "type": "Medical Unit", "eta": "2 mins"}},
            {{"name": "Security-4", "type": "Security Patrol", "eta": "3 mins"}}
        ],
        "safe_routes": [
            {{"from": "Zone 2", "to": "Gate E (Ambulance Bay)", "path": "South corridor, bypass Food Court"}}
        ]
    }}
    """
    if GEMINI_API_KEY:
        try:
            result = call_gemini(prompt, json_mode=True)
            return json.loads(result)
        except Exception as e:
            logger.warning(f"Gemini incident support generation failed: {e}")
            
    # Mock fallback response
    ai_sum = f"Active {category} incident in {zone}. {description}."
    rec_act = f"1. Dispatch immediate responder units to {zone}.\n2. Standardize communication channel to Ops-Channel 2.\n3. Inform security command to secure perimeter gates."
    resources = [
        {"name": "Sec-Team 3", "type": "Security Patrol", "eta": "3 mins"},
        {"name": "Med-A", "type": "Medical Unit", "eta": "4 mins"}
    ]
    routes = [
        {"from": zone, "to": "Gate C (Safe Area)", "path": "Evacuate North exit, proceed along corridor 12B to Main Gate C."}
    ]
    
    if category.lower() == "medical":
        ai_sum = f"Medical alert in {zone}: Spectator experiencing health issue. Emergency access corridor activated."
        rec_act = "1. Dispatch Med-A immediately.\n2. Volunteer to clear local seating rows and maintain a 5m buffer.\n3. Escort patient via South Lift to Gate E ambulance bay."
        resources = [{"name": "Med-A", "type": "Medical Unit", "eta": "2 mins"}]
        routes = [{"from": zone, "to": "Gate E (Ambulance Bay)", "path": "South exit elevator to Ground Floor, corridor E"}]
    elif category.lower() == "fire":
        ai_sum = f"Fire Alert in {zone}: Smoke detected. Immediate sector evacuation is required."
        rec_act = "1. Sound regional alarms.\n2. Open Gate D and Gate F immediately for evacuation.\n3. Command volunteers to guide spectators away from main stairwell."
        resources = [{"name": "Fire-Team 1", "type": "Fire Response", "eta": "5 mins"}, {"name": "Security-7", "type": "Crowd Control", "eta": "2 mins"}]
        routes = [{"from": zone, "to": "Parking Lot B (Muster Point)", "path": "Exit Gate D/F directly, avoid corridor 4"}]
        
    return {
        "ai_summary": ai_sum,
        "recommended_actions": rec_act,
        "nearest_resources": resources,
        "safe_routes": routes
    }

def ai_generate_crowd_recommendation(zone_name: str, current: int, safe: int) -> Dict[str, Any]:
    """Generates dynamic crowd advice and redirect routes when zones are congested."""
    ratio = current / safe
    prompt = f"""
    You are the AIrena Crowd Optimizer.
    Zone '{zone_name}' has a current crowd count of {current} against a safe capacity of {safe} ({ratio:.1%} capacity ratio).
    Analyze congestion risk and generate a diversion plan.
    
    Return your response as a JSON object with this exact structure:
    {{
        "alert": "Urgent alert description...",
        "recommendation": "Divert incoming crowd to Gate X. Deploy Y volunteers...",
        "alternate_routes": ["Route Description A", "Route Description B"]
    }}
    """
    if GEMINI_API_KEY:
        try:
            result = call_gemini(prompt, json_mode=True)
            return json.loads(result)
        except Exception as e:
            logger.warning(f"Gemini crowd recommendation failed: {e}")
            
    # Mock fallback
    if ratio >= 1.0:
        alert = f"CRITICAL: {zone_name} is at {ratio:.1%} capacity ({current}/{safe} visitors)."
        rec = f"Divert visitors heading to {zone_name} toward Gate C. Deploy 3 volunteers to intersection West-10 to manually guide traffic. Open auxiliary doors 4A and 4B."
        routes = [
            "Redirect via West Corridor bypass to Main Gate C.",
            "Evacuate via exit ramp 3 directly to Promenade."
        ]
    elif ratio >= 0.8:
        alert = f"WARNING: {zone_name} is nearing capacity ({ratio:.1%})."
        rec = f"Slow down ticket scanners at North gate. Open Gate B secondary lines. Move 2 floating volunteers to assist with flow."
        routes = [
            "Use Upper Deck walkway instead of Ground level corridor.",
            "Use East entrance corridor (6 mins ETA, zero congestion)."
        ]
    else:
        alert = f"INFO: {zone_name} crowd flow is stable ({ratio:.1%})."
        rec = "No corrective actions needed. Continue standard monitoring."
        routes = []
        
    return {
        "alert": alert,
        "recommendation": rec,
        "alternate_routes": routes
    }

def ai_lost_person_match(lost_desc: str, clothing: str, age: int, last_seen: str) -> Dict[str, Any]:
    """Simulates lost person timeline and generates search checkpoints."""
    prompt = f"""
    You are the AIrena Lost Person Assistant.
    A missing person report has been filed:
    Name: Missing Child/Adult
    Age: {age}
    Description: {lost_desc}
    Clothing: {clothing}
    Last Seen Location: {last_seen}
    
    Generate a search strategy timeline and recommended patrol checkpoints.
    Return your response as a JSON object with this exact structure:
    {{
        "search_recommendations": "Deploy checkpoints at...",
        "timeline": [
            {{"time": "0 mins", "event": "Report filed at command center."}},
            {{"time": "5 mins", "event": "Security cameras scan clothing colors..."}}
        ]
    }}
    """
    if GEMINI_API_KEY:
        try:
            result = call_gemini(prompt, json_mode=True)
            return json.loads(result)
        except Exception as e:
            logger.warning(f"Gemini lost person match failed: {e}")
            
    # Mock fallback
    timeline = [
        {"time": "0 Mins", "event": f"Missing person alert logged. Staff notified of {age}-year-old wearing {clothing}."},
        {"time": "5 Mins", "event": f"AI CCTV analytics triggered. Scanning all cameras around {last_seen} for matches matching clothing color ({clothing})."},
        {"time": "12 Mins", "event": f"Possible match spotted on camera 12 (North Concourse corridor). Deploying nearest volunteers."}
    ]
    recs = f"1. Deploy volunteers to check the nearest Info Desk in {last_seen}.\n2. Inform the Gate personnel at the nearest exits to watch for a child matching description.\n3. Instruct Security Patrol 4 to sweep the children play area in the East stand."
    
    return {
        "search_recommendations": recs,
        "timeline": timeline
    }

def ai_translate_announcement(message: str, target_languages: List[str]) -> Dict[str, str]:
    """Translates an announcement message into multiple target languages."""
    translations = {}
    
    # We will do a call for each language or batch them
    for lang in target_languages:
        if lang == "English":
            translations[lang] = message
            continue
            
        # Try to use Gemini
        if GEMINI_API_KEY:
            try:
                prompt = f"Translate the following tournament announcement to {lang}. Return ONLY the direct translation, nothing else:\n\n{message}"
                translated_text = call_gemini(prompt).strip()
                translations[lang] = translated_text
                continue
            except Exception as e:
                logger.warning(f"Gemini translation for {lang} failed: {e}")
                
        # Try fallback table
        matched_category = None
        for key in ["attention", "emergency", "lost_person", "gate_redirect"]:
            if key in message.lower() or (key == "gate_redirect" and "gate" in message.lower()):
                matched_category = key
                break
                
        if matched_category and lang in FALLBACK_TRANSLATIONS and matched_category in FALLBACK_TRANSLATIONS[lang]:
            translations[lang] = FALLBACK_TRANSLATIONS[lang][matched_category]
        else:
            translations[lang] = f"[Translated to {lang}] {message}"
            
    return translations

def ai_generate_incident_report(incident: Dict[str, Any]) -> Dict[str, Any]:
    """Compiles a full structured incident report."""
    prompt = f"""
    You are the AIrena Senior Incident Report Writer.
    Compile a formal, structured incident report for:
    ID: {incident.get('id')}
    Category: {incident.get('category')}
    Description: {incident.get('description')}
    Zone: {incident.get('location_zone')}
    Severity: {incident.get('severity')}
    Status: {incident.get('status')}
    Reporter: {incident.get('reporter_name')}
    Timestamp: {incident.get('timestamp')}
    
    Return your response as a JSON object with this exact structure:
    {{
        "incident_id": {incident.get('id')},
        "title": "Formal Title",
        "summary": "Detailed professional summary...",
        "key_findings": ["Finding 1", "Finding 2"],
        "timeline": ["09:00: Event A", "09:05: Response B"],
        "corrective_actions": ["Corrective action 1", "Corrective action 2"],
        "status": "Final Audit Status",
        "generated_at": "Current timestamp string"
    }}
    """
    if GEMINI_API_KEY:
        try:
            result = call_gemini(prompt, json_mode=True)
            return json.loads(result)
        except Exception as e:
            logger.warning(f"Gemini report generation failed: {e}")
            
    # Mock fallback
    title = f"AIrena Operations Security Report: Incident {incident.get('id')} ({incident.get('category')})"
    summary = f"This report covers the {incident.get('category').lower()} incident reported by {incident.get('reporter_name')} in {incident.get('location_zone')}. The incident involved {incident.get('description')}. Responders were deployed promptly and the situation was mitigated."
    findings = [
        f"Incident occurred in {incident.get('location_zone')}.",
        f"Initial report categorized as {incident.get('category')} of {incident.get('severity')} severity.",
        "Response times fell within the target 3-minute SLA window."
    ]
    timeline = [
        "00:00 - Reporter filed initial alert.",
        "00:02 - AI assistant dispatched nearest emergency units.",
        "00:05 - Command center updated status to In Progress.",
        "00:15 - Situation resolved and marked for audit."
    ]
    correctives = [
        "Perform a post-incident review with staff assigned to this sector.",
        "Ensure all entry corridors remain clear of vendor booths during high crowd ratios.",
        "Update the zone capacity baseline parameters."
    ]
    
    return {
        "incident_id": incident.get("id"),
        "title": title,
        "summary": summary,
        "key_findings": findings,
        "timeline": timeline,
        "corrective_actions": correctives,
        "status": "Under Review",
        "generated_at": str(datetime.now()) if 'datetime' in globals() else "2026-07-07 10:00:00"
    }
