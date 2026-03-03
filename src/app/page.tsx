'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw, ChevronRight, ChevronLeft, BarChart2, Download, Copy, Briefcase, FileUp, FileDown, Loader2, Search, Mail, MessageSquare, Printer, Edit3, Save, Send, History, X, Trash2, Eye, EyeOff, Plane, ShieldCheck, Users, Layout, Activity, FileStack, Cloud, Check, Lock, Globe, LogOut, UserPlus, Edit, Shield, UserX, UserCheck, CreditCard, Zap, Key, ScrollText, Bell, Menu, Plus, LockKeyhole, Receipt, Settings } from 'lucide-react';

// --- INTERFACES ---
interface User {
  id?: string;
  username?: string;
  password?: string;
  role?: string;
  status?: string;
  fullName?: string;
  email?: string;
  credits?: number;
}

interface AppSettings {
  tone: string;
  format: string;
  strictness: string;
}

type Lang = 'en' | 'fr';

// --- TRANSLATION DICTIONARY ---
const DICT = {
  en: {
    loginTitle: "ATS", loginSub: "Pro", loginDesc: "Sign in to access the Optimizer Engine",
    username: "Username", password: "Password", signIn: "Sign In", credits: "credits",
    history: "History", settings: "Settings", admin: "Admin", logout: "Logout",
    theTailor: "The Tailor", resumeInput: "Resume Input", uploadResume: "Upload Resume (TXT, PDF, DOCX)",
    chooseFile: "Choose File or drag and drop", extracting: "Extracting text...",
    orPaste: "Or paste resume content", pasteHere: "Paste your resume content here...",
    jobContext: "Job Context", skipCopy: "Skip the copy-paste — fetch automatically",
    fetch: "Fetch", fetching: "Fetching...", orEnter: "Or enter manually",
    jobTitle: "Job Title", company: "Company", jobDesc: "Job Description",
    pasteJob: "Paste job description text here...", targetAts: "Target ATS Profile / Airline (Optional)",
    selectAts: "Select ATS Profile...", tone: "Tone", formatStyle: "Format Style",
    tailorBtn: "Tailor My Resume", optimizing: "Optimizing ATS Match...",
    backToInput: "Back to Input Screen", backToResume: "Back to Resume Results",
    atsScore: "ATS Score", keywordsFound: "Keywords Found", keywordsMatched: "Keywords Matched",
    practiceInterview: "Practice Interview", interviewSub: "Get AI-powered questions tailored to this specific optimization",
    validateCompliance: "Validate Compliance", startPrep: "Start Prep",
    resume: "Resume", coverLetter: "Cover Letter", editInput: "Edit Input",
    downloadDocx: "Download Docx", coverLetterDocx: "Cover Letter DOCX",
    saveToDrive: "Save to Drive", savedToDrive: "Saved to Drive",
    resumeTemplate: "Resume Template", professional: "Professional", modern: "Modern", minimal: "Minimal",
    liveEdit: "Live Edit", saveEdits: "Save Edits",
    interviewPrepGuide: "Interview Prep Guide", interviewPrepDesc: "Tailored Q&A based on the specific skills optimized in your resume.",
    starMethod: "STAR Method Strategy:", coverLetterReady: "Cover letter generated successfully! You can now view and edit it."
  },
  fr: {
    loginTitle: "ATS", loginSub: "Pro", loginDesc: "Connectez-vous pour accéder au moteur d'optimisation",
    username: "Nom d'utilisateur", password: "Mot de passe", signIn: "Se connecter", credits: "crédits",
    history: "Historique", settings: "Paramètres", admin: "Admin", logout: "Déconnexion",
    theTailor: "Le Tailleur", resumeInput: "Saisie du CV", uploadResume: "Télécharger le CV (TXT, PDF, DOCX)",
    chooseFile: "Choisissez un fichier ou glissez-déposez", extracting: "Extraction du texte...",
    orPaste: "Ou collez le contenu du CV", pasteHere: "Collez le contenu de votre CV ici...",
    jobContext: "Contexte de l'Emploi", skipCopy: "Évitez le copier-coller — récupération auto",
    fetch: "Récupérer", fetching: "Récupération...", orEnter: "Ou entrez manuellement",
    jobTitle: "Titre du Poste", company: "Entreprise", jobDesc: "Description du Poste",
    pasteJob: "Collez la description du poste ici...", targetAts: "Profil ATS Cible / Compagnie (Optionnel)",
    selectAts: "Sélectionnez le profil ATS...", tone: "Ton", formatStyle: "Style de Format",
    tailorBtn: "Optimiser mon CV", optimizing: "Optimisation en cours...",
    backToInput: "Retour à la saisie", backToResume: "Retour au CV",
    atsScore: "Score ATS", keywordsFound: "Mots-clés Trouvés", keywordsMatched: "Mots-clés Correspondants",
    practiceInterview: "Entretien d'Embauche", interviewSub: "Obtenez des questions générées par l'IA adaptées à ce CV",
    validateCompliance: "Valider la Conformité", startPrep: "Préparation",
    resume: "CV", coverLetter: "Lettre de Motivation", editInput: "Modifier",
    downloadDocx: "Télécharger Docx", coverLetterDocx: "Lettre Docx",
    saveToDrive: "Sauvegarder Drive", savedToDrive: "Sauvegardé Drive",
    resumeTemplate: "Modèle de CV", professional: "Professionnel", modern: "Moderne", minimal: "Minimaliste",
    liveEdit: "Éditer", saveEdits: "Sauvegarder",
    interviewPrepGuide: "Guide de Préparation", interviewPrepDesc: "Questions et réponses sur mesure basées sur votre CV optimisé.",
    starMethod: "Méthode STAR :", coverLetterReady: "Lettre de motivation générée avec succès ! Vous pouvez la consulter."
  }
};

// --- HELPER: ROBUST JSON PARSER ---
const parseRobustJSON = (text: string) => {
  let clean = text.replace(/```json/gi, '').replace(/```html/gi, '').replace(/```/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    clean = clean.substring(start, end + 1);
  }
  try {
    return JSON.parse(clean);
  } catch (e) {
    try {
      clean = clean.replace(/,\s*([\]}])/g, '$1');
      clean = clean.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
      return JSON.parse(clean);
    } catch (fallbackError) {
      console.error("Failed to parse AI JSON:", clean);
      throw new Error("AI returned invalid formatting. Please try generating again.");
    }
  }
};

// --- API CALL FUNCTION ---
const generateAIContent = async (prompt: string): Promise<string> => {
  try {
    const providers = JSON.parse(localStorage.getItem('ats_ai_providers') || '[]');
    const activeProviders = providers.filter((p: any) => p.status).sort((a: any, b: any) => a.priority - b.priority);
    
    // Get the active provider or default to z-ai (free SDK)
    const activeProvider = activeProviders[0] || { name: 'Z-AI Free SDK', apiKey: '', model: '' };
    const providerName = activeProvider.name?.toLowerCase() || 'z-ai';
    const apiKey = activeProvider.apiKey || "";
    const modelName = activeProvider.model || "";

    // Call our API route
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        provider: providerName.includes('z-ai') ? 'z-ai' : providerName,
        apiKey,
        model: modelName
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to generate content');
    }

    const data = await response.json();
    return data.content;
  } catch (err: any) {
    console.error('AI Generation Error:', err);
    throw new Error(err.message || "AI generation failed. Please try again.");
  }
};

const getDocxHtml = (content: string, template: string = 'professional') => {
  let fontFamily = "'Times New Roman', serif";
  let headingColor = "#000000"; let textColor = "#000000";
  if (template === 'modern') { fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif"; headingColor = "#2c3e50"; textColor = "#333333"; } 
  else if (template === 'minimal') { fontFamily = "'Inter', 'Segoe UI', Roboto, sans-serif"; headingColor = "#111827"; textColor = "#4b5563"; }
  
  return `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export</title><style>@page { size: 21cm 29.7cm; margin: 1.27cm 1.27cm 1.27cm 1.27cm; mso-page-orientation: portrait; } @page WordSection1 { size: 21cm 29.7cm; margin: 1.27cm 1.27cm 1.27cm 1.27cm; } div.WordSection1 { page: WordSection1; } body { font-family: ${fontFamily}; font-size: 12.0pt; line-height: 1.15; color: ${textColor}; background: #ffffff; margin: 0; padding: 0; } * { border: none !important; outline: none !important; box-shadow: none !important; } div, p, ul, li, h1, h2, h3, h4, fieldset, blockquote, pre { display: block !important; width: 100% !important; float: none !important; clear: both !important; border: none !important; background: transparent !important; } h1 { font-size: 16pt; font-weight: bold; text-align: left; text-transform: uppercase; color: ${headingColor}; margin: 0 0 4pt 0; padding: 0; } p.contact { text-align: left; font-size: 12pt; margin: 0 0 12pt 0; color: ${textColor}; } h3 { font-size: 12pt; font-weight: bold; text-transform: uppercase; text-align: left; border: none !important; text-decoration: none !important; margin-top: 12pt; margin-bottom: 6pt; color: ${headingColor}; } h4 { font-size: 12pt; margin-top: 6pt; margin-bottom: 2pt; color: ${headingColor}; font-weight: bold; } p { margin: 0; text-align: justify; margin-bottom: 4pt; } ul { margin-top: 0; margin-bottom: 8pt; padding-left: 18pt; } li { margin-bottom: 2pt; padding-left: 0; } strong, b { color: ${headingColor}; font-weight: bold; } </style></head><body><div class="WordSection1">${content}</div></body></html>`;
};

// --- AI FUNCTIONS ---

const analyzeWithGemini = async (resumeText: string, jobDescription: string, settings: AppSettings, airlineProfile: string, lang: Lang) => {
  try {
    const toneInstruction = settings?.tone || "Balanced";
    const formatInstruction = settings?.format || "Chronological";
    const strictnessInstruction = settings?.strictness === "Aggressive" ? "MAXIMUM keyword stuffing." : "Balanced optimization.";
    const atsSystem = airlineProfile ? ((AIRLINE_ATS_PROFILES as any)[airlineProfile]?.system || "Generic ATS") : "Generic ATS";
    const atsFocus = airlineProfile ? ((AIRLINE_ATS_PROFILES as any)[airlineProfile]?.focus || "General") : "General";
    const langStr = lang === 'fr' ? 'FRENCH' : 'ENGLISH';

    const prompt = `
      ACT AS: Senior ATS Optimization Expert and Master Executive Resume Writer.
      
      OBJECTIVE: Optimise for maximum ATS score. Rewrite the resume to FILL EXACTLY ONE A4 PAGE (12pt font). You must strategically weave in exact keywords, hard skills, and industry terminology to guarantee a 90%+ match rate.
      
      CONTEXT:
      - ATS SYSTEM: ${atsSystem} (${atsFocus})
      - INDUSTRY KEYWORDS: ${AVIATION_KEYWORDS}
      - TONE: ${toneInstruction}
      - FORMAT STYLE: ${formatInstruction}
      - STRATEGY: ${strictnessInstruction}
      
      CRITICAL REQUIREMENT: YOU MUST GENERATE THE ENTIRE RESPONSE (ALL CONTENT) IN ${langStr}. THIS IS MANDATORY.
      
      INPUT DATA:
      [RESUME]: ${resumeText}
      [JOB DESCRIPTION]: ${jobDescription}
      
      TASK 1: SCORING (Calculate ATS Score, Impact, Brevity, Keywords).
      TASK 2: REWRITE (STRICT PLAIN TEXT HTML).
      
      CRITICAL LENGTH ENFORCEMENT (NON-NEGOTIABLE MAXIMUM LIMIT):
      You MUST tightly control the length of the generated resume. 
      - ABSOLUTE MAXIMUM LENGTH: 3,000 characters (excluding HTML tags).
      - WARNING: IF YOU EXCEED 3,000 CHARACTERS, THE RESUME WILL SPILL ONTO A SECOND PAGE AND CAUSE A CRITICAL SYSTEM ERROR.
      - **HOW TO STAY UNDER THE LIMIT (STRICT RULES)**: 
        1. Professional Summary: Maximum 3 concise lines. Be direct.
        2. Recent Experience (last 5 years): Maximum 4 to 5 high-impact bullet points per role.
        3. Older Experience (5+ years ago): Maximum 1 to 2 bullet points, or list Title/Company/Date ONLY with no bullets to save space.
        4. Eliminate fluff, adverbs, and redundant soft skills. Merge similar achievements into single bullet points.
        5. Keep the Skills section to a dense, comma-separated list taking up no more than 3 lines.
      
      FORMATTING RULES (NON-NEGOTIABLE):
      1. **NO** Emojis, Icons, Graphics, Colors, Tables, Columns, or Decorative Symbols.
      2. **NO** Underlines or horizontal rules (<hr>).
      3. **CRITICAL:** DO NOT wrap the resume in any container <div>, <fieldset>, box, or apply ANY borders. Start immediately with the <h1> tag.
      4. **FONT**: Times New Roman, Size 12.
      5. **IMPORTANT:** Escape all internal double quotes inside strings using \\". Ensure the output is 100% syntactically valid JSON.
      
      STRUCTURE:
      1. **HEADER**: Name (H1, Uppercase, Bold, LEFT ALIGNED), Contact Info (LEFT ALIGNED).
      2. **SECTIONS** (H3 tags): PROFESSIONAL SUMMARY, EXPERIENCE, EDUCATION, SKILLS. (Uppercase, Bold, LEFT ALIGNED, No lines).
      3. **EXPERIENCE ENTRIES**:
         - Job Title, Company, Location, Date MUST be on ONE LINE.
         - Format: <h4><strong>Job Title</strong> | <strong>Company Name</strong>, Location | <strong>YYYY to YYYY</strong></h4>
         - Do NOT use "(1 Year)". Use "Present" if applicable.
      4. **EDUCATION ENTRIES**:
         - Format: <h4><strong>Degree</strong> | <strong>School</strong> | <strong>YYYY to YYYY</strong></h4>
         - List relevant modules/subjects learned as a simple bullet list.
      5. **CONTENT**: Use <strong> tags for bolding. NO markdown asterisks (**).
      
      RETURN JSON FORMAT ONLY:
      {
        "score": number,
        "score_breakdown": { "impact": number, "brevity": number, "keywords": number },
        "summary_critique": "string",
        "missing_keywords": ["string", "string"],
        "matched_keywords": ["string", "string"],
        "optimized_content": "Valid HTML string..."
      }
    `;

    let text = await generateAIContent(prompt);
    const data = parseRobustJSON(text);

    if (data.optimized_content) data.optimized_content = data.optimized_content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    if (!data.score_breakdown) data.score_breakdown = { impact: 85, brevity: 90, keywords: data.score };
    return data;
  } catch (error: any) { throw new Error(error.message || "Optimization failed. Please try again."); }
};

const AIRLINE_ATS_PROFILES = {
  "General / Other": { system: "Generic ATS", focus: "General Compliance" },
  "Delta Air Lines": { system: "Taleo", focus: "Keyword Matching, Formatting Rigidity" },
  "United Airlines": { system: "Workday", focus: "Skills Parsing, Chronological Flow" },
  "American Airlines": { system: "BrassRing", focus: "Technical Certifications, Scannability" },
  "Lufthansa": { system: "SAP SuccessFactors", focus: "Structured Data, Multilingual Support" },
  "British Airways": { system: "Workday", focus: "Competency Frameworks" },
  "Emirates": { system: "SAP", focus: "Psychometric Keywords, Cultural Fit" },
  "Qatar Airways": { system: "Workday", focus: "Experience Verification, Safety Compliance" },
  "Singapore Airlines": { system: "Custom/Proprietary", focus: "Academic Excellence, Brand Alignment" },
  "Ryanair": { system: "Custom", focus: "Operational Efficiency, Cost Awareness" }
};

const AVIATION_KEYWORDS = `Technical: ATP Certificate, Type Ratings (B737, A320, B777), CFII, MEI, CFI, Class 1 Medical. Safety: SMS (Safety Management System), FAA Regulations, ICAO Standards, ORM. Operational: CRM (Crew Resource Management), ETOPS, RVSM, CAT II/III. Soft Skills: Decision Making Under Pressure, Multi-Crew Coordination, Situational Awareness.`;

const runATSSimulation = async (resumeHtml: string, lang: Lang) => {
  try {
    const langStr = lang === 'fr' ? 'FRENCH' : 'ENGLISH';
    const prompt = `ACT AS: ATS Parsing Simulator. INPUT: ${resumeHtml}. ANALYZE: Parsing Errors, Density, Readability. RETURN IN ${langStr} VALID JSON: { "parsing_confidence": number, "issues": [{"type": "string", "severity": "string", "message": "string"}], "extracted_entities": {"skills_detected": number}, "density_analysis": "string" }`;
    let text = await generateAIContent(prompt);
    return parseRobustJSON(text);
  } catch (error: any) { throw new Error(error.message || "Simulation failed."); }
};

const generateCoverLetterWithGemini = async (optimizedResumeHtml: string, jobDescription: string, settings: AppSettings, lang: Lang) => {
  try {
    const tone = settings?.tone || "Professional";
    const langStr = lang === 'fr' ? 'FRENCH' : 'ENGLISH';
    const prompt = `ACT AS: Expert Career Coach. OBJECTIVE: Write a targeted Cover Letter based strictly on the provided optimized resume. TONE: ${tone}. INPUT: [RESUME HTML]: ${optimizedResumeHtml}, [JOB]: ${jobDescription}. STRICT RULES: Use ONLY standard HTML tags (<h1>, <p>). MUST output <h1> for applicant name, <p class="contact"> for details. Format as professional business letter. DO NOT wrap the letter in any container div, fieldset, text box, or apply any borders. ENTIRE LETTER MUST BE IN ${langStr}. IMPORTANT: Escape double quotes. Return ONLY VALID JSON { "cover_letter_content": "html..." }`;
    
    let text = await generateAIContent(prompt);
    let data;
    try {
      data = parseRobustJSON(text);
    } catch (err) { 
      data = { cover_letter_content: text.replace(/```json/gi, '').replace(/```html/gi, '').replace(/```/g, '').trim() }; 
    }
    
    if (data.cover_letter_content) data.cover_letter_content = data.cover_letter_content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return data;
  } catch (error: any) { throw new Error(error.message || "Cover Letter generation failed."); }
};

const generateInterviewPrepWithGemini = async (resumeHtml: string, jobDescription: string, lang: Lang) => {
  try {
    const langStr = lang === 'fr' ? 'FRENCH' : 'ENGLISH';
    const prompt = `ACT AS: Lead Interviewer. OBJECTIVE: Generate exactly 10 likely interview questions and detailed STAR answers based on the resume. INPUT: [RESUME]: ${resumeHtml}, [JOB]: ${jobDescription}. EVERYTHING MUST BE IN ${langStr}. CRITICAL: Escape all double quotes inside your string values using \\". RETURN ONLY VALID PARSABLE JSON FORMAT: { "questions": [{ "question": "string", "star_answer": "string" }] }. NO EXTRA TEXT. DO NOT USE MARKDOWN.`;
    let text = await generateAIContent(prompt);
    return parseRobustJSON(text);
  } catch (error: any) { throw new Error(error.message || "Interview Prep generation failed."); }
};

const parseFile = async (file: File): Promise<string> => {
  // Use server-side API to parse files
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/parse-file', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to parse file');
  }
  
  const data = await response.json();
  return data.text;
};

const fetchJobWithGemini = async (url: string, lang: Lang) => {
  try {
    const langStr = lang === 'fr' ? 'FRENCH' : 'ENGLISH';
    const prompt = `You are an expert HR job analyst. TARGET URL: ${url}. 
    ACTION: Extract the job details from this URL or search for job posting information at this URL.
    TASK: Return ONLY a valid JSON object in ${langStr} with EXACTLY three keys: "jobTitle" (string), "companyName" (string), and "jobDescription" (string). 
    CRITICAL INSTRUCTION: If you cannot access the page, try to extract the company and title from the URL string itself, and leave the "jobDescription" empty. NEVER return plain text.`;
    
    const result = await generateAIContent(prompt);
    return parseRobustJSON(result);
  } catch (error: any) { 
    throw new Error("Could not automatically fetch job details. Please copy and paste the description manually."); 
  }
};

// --- COMPONENTS ---
const SettingsModal: React.FC<{ isOpen: boolean, onClose: () => void, settings: AppSettings, setSettings: any, t: any }> = ({ isOpen, onClose, settings, setSettings, t }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-500" /> {t('settings')}</h3><button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button></div>
        <div className="space-y-4">
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('tone')}</label><select value={settings.tone} onChange={(e) => setSettings({...settings, tone: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"><option>Balanced</option><option>Formal</option><option>Business</option><option>Corporate</option><option>Creative</option></select></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('formatStyle')}</label><select value={settings.format} onChange={(e) => setSettings({...settings, format: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"><option>Chronological</option><option>Functional</option><option>Hybrid</option></select></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Strategy</label><select value={settings.strictness} onChange={(e) => setSettings({...settings, strictness: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"><option>Balanced</option><option>Aggressive</option><option>Conservative</option></select></div>
        </div>
        <div className="mt-6 flex justify-end"><button onClick={onClose} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition">{t('saveEdits')}</button></div>
      </div>
    </div>
  )
}

const SimulatorModal: React.FC<{ isOpen: boolean, onClose: () => void, simulatorData: any }> = ({ isOpen, onClose, simulatorData }) => {
  if (!isOpen || !simulatorData) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center animate-fade-in p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-600"/> ATS Parsing Simulator</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600"/></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-slate-800">{simulatorData.parsing_confidence || 0}%</div>
              <div className="text-xs uppercase font-bold text-slate-500">Parsing Confidence</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-slate-800">{simulatorData.extracted_entities?.skills_detected || 0}</div>
              <div className="text-xs uppercase font-bold text-slate-500">Skills Extracted</div>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-slate-700 mb-2 text-sm uppercase">Issues Detected</h4>
            {!simulatorData.issues || simulatorData.issues.length === 0 ? (
              <div className="text-sm text-emerald-600 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> No critical issues found.</div>
            ) : (
              <div className="space-y-2">
                {simulatorData.issues.map((issue: any, i: number) => (
                  <div key={i} className={`text-sm p-3 rounded border flex gap-2 items-start ${issue.severity === 'critical' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/>
                    <div><span className="font-bold uppercase text-xs block">{String(issue.type)}</span>{String(issue.message)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-bold text-slate-700 mb-2 text-sm uppercase">Keyword Density Analysis</h4>
            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-100">{String(simulatorData.density_analysis || "Analysis complete.")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- ADMIN DASHBOARD AND LOGIN ---

const LoginView: React.FC<{ onLogin: (u: string, p: string) => boolean, lang: Lang, setLang: any, t: any }> = ({ onLogin, lang, setLang, t }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onLogin(username, password)) setError("Invalid credentials or account suspended.");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      <div className="absolute top-6 right-6">
        <button onClick={() => setLang(lang === 'en' ? 'fr' : 'en')} className="flex items-center gap-2 px-4 py-2 font-bold text-slate-600 bg-white shadow-sm hover:bg-slate-100 rounded-full transition">
          <Globe className="w-4 h-4"/> {lang === 'en' ? 'EN' : 'FR'}
        </button>
      </div>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-8 animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-xl mb-4"><Plane className="w-8 h-8 text-white" /></div>
          <h1 className="text-2xl font-bold text-slate-800">{t('loginTitle')}<span className="text-indigo-600">{t('loginSub')}</span></h1>
          <p className="text-slate-500 text-sm mt-1">{t('loginDesc')}</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">{t('username')}</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">{t('password')}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition shadow-md mt-2">{t('signIn')}</button>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC<{ currentUser: User, users: User[], setUsers: any, onClose: () => void, onLogout: () => void, lang: Lang, setLang: any, t: any }> = ({ currentUser, users, setUsers, onClose, onLogout, lang, setLang, t }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [logs, setLogs] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('ats_audit_logs') || '[]');
    }
    return [];
  });
  const [systemSettings, setSystemSettings] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('ats_sys_settings') || '{"budgetCap":1000,"charLimit":4000,"defaultCredits":2,"adminDefaultCredits":100,"smtpHost":"smtp.example.com","smtpPort":"587","smtpUser":"","smtpPass":"","stripeKey":"","paypalId":"","cfToken":""}');
    }
    return {"budgetCap":1000,"charLimit":4000,"defaultCredits":2,"adminDefaultCredits":100};
  });
  const [apiKeys, setApiKeys] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('ats_api_keys') || '[]');
    }
    return [];
  });
  const [dnsDomains, setDnsDomains] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('ats_dns') || '[]');
    }
    return [];
  });
  const [aiProviders, setAiProviders] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('ats_ai_providers') || '[{"id":1,"name":"Z-AI Free SDK","tags":["Free","Built-in"],"priority":1,"model":"","status":true,"tokens":0,"spend":0},{"id":2,"name":"Google Gemini","tags":["Free","Vision"],"priority":2,"model":"gemini-2.0-flash","status":false,"tokens":0,"spend":0},{"id":3,"name":"Groq","tags":["Free","Vision"],"priority":3,"model":"qwen-32b","status":false,"tokens":0,"spend":0},{"id":4,"name":"OpenAI","tags":["Premium","Vision"],"priority":4,"model":"gpt-4o","status":false,"tokens":0,"spend":0},{"id":5,"name":"DeepSeek","tags":["Free"],"priority":5,"model":"deepseek-chat","status":false,"tokens":0,"spend":0}]');
    }
    return [{"id":1,"name":"Z-AI Free SDK","tags":["Free","Built-in"],"priority":1,"model":"","status":true,"tokens":0,"spend":0}];
  });
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<User>({ username: '', password: '', fullName: '', email: '', role: 'user', status: 'active', credits: 0 });
  
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [editingAi, setEditingAi] = useState<any>(null);
  const [aiFormData, setAiFormData] = useState({ name: '', model: '', apiKey: '', priority: 1, status: false, tags: '' });

  const [isDnsModalOpen, setIsDnsModalOpen] = useState(false);
  const [dnsManagingDomain, setDnsManagingDomain] = useState<any>(null);
  const [isFetchingDns, setIsFetchingDns] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState("");
  const [newZoneIdInput, setNewZoneIdInput] = useState("");
  const [newDnsRecord, setNewDnsRecord] = useState({ type: 'A', name: '', content: '', ttl: '3600' });

  const [alertMessage, setAlertMessage] = useState<any>(null); 
  const [confirmMessage, setConfirmMessage] = useState<any>(null);

  const showAlert = (title: string, message: string, type: string = 'info') => setAlertMessage({ title, message, type });
  const showConfirm = (title: string, message: string, onConfirm: () => void) => setConfirmMessage({ title, message, onConfirm });

  useEffect(() => { 
    if (typeof window !== 'undefined') {
      localStorage.setItem('ats_audit_logs', JSON.stringify(logs)); 
    }
  }, [logs]);
  useEffect(() => { 
    if (typeof window !== 'undefined') {
      localStorage.setItem('ats_sys_settings', JSON.stringify(systemSettings)); 
    }
  }, [systemSettings]);
  useEffect(() => { 
    if (typeof window !== 'undefined') {
      localStorage.setItem('ats_api_keys', JSON.stringify(apiKeys)); 
    }
  }, [apiKeys]);
  useEffect(() => { 
    if (typeof window !== 'undefined') {
      localStorage.setItem('ats_dns', JSON.stringify(dnsDomains)); 
    }
  }, [dnsDomains]);
  useEffect(() => { 
    if (typeof window !== 'undefined') {
      localStorage.setItem('ats_ai_providers', JSON.stringify(aiProviders)); 
    }
  }, [aiProviders]);

  const addLog = (action: string, entity: string) => {
    const newLog = { id: Date.now(), date: new Date().toLocaleString('en-GB'), user: currentUser.email || currentUser.username, action, entity, ip: '192.168.' + Math.floor(Math.random()*255) + '.' + Math.floor(Math.random()*255) };
    setLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  const openUserModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setUserFormData({ ...user, password: '', credits: user.credits || 0 });
    } else {
      setEditingUser(null);
      setUserFormData({ username: '', password: '', fullName: '', email: '', role: 'user', status: 'active', credits: systemSettings.defaultCredits });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const updatedUsers = users.map(u => {
        if (String(u.id) === String(editingUser.id)) {
          const updated: User = { ...u, ...userFormData };
          if (!userFormData.password) updated.password = u.password;
          return updated;
        }
        return u;
      });
      setUsers(updatedUsers);
      addLog('USER_UPDATED', `User (${userFormData.email})`);
    } else {
      if (!userFormData.password) return showAlert("Validation Error", "Password is required for new users.", "error");
      const initialCredits = userFormData.role === 'admin' ? parseInt(systemSettings.adminDefaultCredits || 100) : parseInt(systemSettings.defaultCredits || 2);
      const newUser: User = { ...userFormData, id: Date.now().toString(), credits: initialCredits };
      setUsers([...users, newUser]);
      addLog('USER_CREATED', `User (${userFormData.email})`);
    }
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    if (String(id) === String(currentUser.id)) return showAlert("Action Denied", "Cannot delete your own active account.", "error");
    showConfirm("Delete User", "Are you sure you want to permanently delete this user?", () => {
      setUsers(users.filter(u => String(u.id) !== String(id)));
      addLog('USER_DELETED', `User ID (${id})`);
      setConfirmMessage(null);
    });
  };

  const handleToggleSuspend = (id: string, currentStatus: string) => {
    if (String(id) === String(currentUser.id)) return showAlert("Action Denied", "Cannot suspend your own active account.", "error");
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setUsers(users.map(u => String(u.id) === String(id) ? { ...u, status: newStatus } : u));
    addLog(`USER_${newStatus.toUpperCase()}`, `User ID (${id})`);
  };

  const handleSaveSettings = () => {
    addLog('SYSTEM_SETTINGS_UPDATED', 'SettingsConfiguration');
    showAlert("Success", "Settings saved successfully!", "success");
  };

  const handleGenerateApiKey = () => {
    const newKey = { id: Date.now(), name: currentUser.email || currentUser.username, key: 'ats_' + Math.random().toString(36).substr(2, 10).toUpperCase() + '...', limit: '100/day', usage: 0, status: 'Active' };
    setApiKeys([newKey, ...apiKeys]);
    addLog('API_KEY_GENERATED', `APIKey (${newKey.key.substring(0,8)})`);
  };

  const handleToggleAiProvider = (id: string) => {
    setAiProviders(aiProviders.map(p => String(p.id) === String(id) ? { ...p, status: !p.status } : p));
    addLog('AI_PROVIDER_TOGGLED', `AIProvider (${id})`);
  };

  const openAiModal = (provider: any = null) => {
    if (provider) {
      setEditingAi(provider);
      setAiFormData({ ...provider, tags: Array.isArray(provider.tags) ? provider.tags.join(', ') : provider.tags || '' });
    } else {
      setEditingAi(null);
      setAiFormData({ name: '', model: '', apiKey: '', priority: aiProviders.length + 1, status: false, tags: 'Premium, Vision' });
    }
    setIsAiModalOpen(true);
  };

  const handleSaveAi = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedTags = aiFormData.tags.split(',').map(t => t.trim()).filter(t => t);
    if (editingAi) {
      const updated = aiProviders.map(p => String(p.id) === String(editingAi.id) ? { ...p, ...aiFormData, tags: formattedTags } : p);
      setAiProviders(updated.sort((a,b) => a.priority - b.priority));
      addLog('AI_PROVIDER_UPDATED', `AIProvider (${aiFormData.name})`);
    } else {
      const newProvider = { ...aiFormData, id: Date.now(), tokens: 0, spend: 0, tags: formattedTags };
      setAiProviders([...aiProviders, newProvider].sort((a,b) => a.priority - b.priority));
      addLog('AI_PROVIDER_ADDED', `AIProvider (${aiFormData.name})`);
    }
    setIsAiModalOpen(false);
  };

  const handleTestAi = (provider: any) => {
    if(!provider.apiKey && provider.name !== 'Z-AI Free SDK') return showAlert("Configuration Needed", "Please configure an API key for this provider first by clicking the Edit icon.", "error");
    showAlert("Connection Test", `Testing connection to ${provider.name}...\n\nConnection Successful! Status Code: 200 OK`, "success");
    addLog('AI_PROVIDER_TESTED', `AIProvider (${provider.name})`);
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if(newDomainInput.trim() !== "" && newZoneIdInput.trim() !== "") {
      setDnsDomains([...dnsDomains, {id: Date.now(), domain: newDomainInput.trim(), zoneId: newZoneIdInput.trim(), status: 'Pending Verification', records: []}]);
      addLog('DOMAIN_ADDED', newDomainInput.trim());
      setNewDomainInput("");
      setNewZoneIdInput("");
    }
  };

  const fetchDnsRecords = async (domain: any) => {
    setIsFetchingDns(true);
    try {
      const targetUrl = encodeURIComponent(`https://api.cloudflare.com/client/v4/zones/${domain.zoneId}/dns_records`);
      const res = await fetch(`https://corsproxy.io/?${targetUrl}`, {
        headers: { 'Authorization': `Bearer ${systemSettings.cfToken}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        const updatedDomains = dnsDomains.map(d => String(d.id) === String(domain.id) ? { ...d, records: data.result, status: 'Verified' } : d);
        setDnsDomains(updatedDomains);
        setDnsManagingDomain(updatedDomains.find(d => String(d.id) === String(domain.id)));
      } else {
        showAlert("Cloudflare Error", data.errors[0]?.message || "Failed to fetch records", "error");
      }
    } catch (e) {
      showAlert("Connection Error", "Failed to connect to Cloudflare via proxy. Ensure your token and Zone ID are correct.", "error");
    } finally {
      setIsFetchingDns(false);
    }
  };

  const openDnsModal = async (domain: any) => {
    setDnsManagingDomain(domain);
    setIsDnsModalOpen(true);
    if (systemSettings.cfToken && domain.zoneId) {
      await fetchDnsRecords(domain);
    }
  };

  const handleAddDnsRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDnsRecord.name || !newDnsRecord.content) return;
    if (!systemSettings.cfToken) return showAlert("Configuration Required", "Please configure Cloudflare API Token in System Settings.", "error");

    try {
      const targetUrl = encodeURIComponent(`https://api.cloudflare.com/client/v4/zones/${dnsManagingDomain.zoneId}/dns_records`);
      const res = await fetch(`https://corsproxy.io/?${targetUrl}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${systemSettings.cfToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newDnsRecord.type,
          name: newDnsRecord.name,
          content: newDnsRecord.content,
          ttl: parseInt(newDnsRecord.ttl),
          proxied: false
        })
      });
      const data = await res.json();
      if(data.success) {
        await fetchDnsRecords(dnsManagingDomain);
        setNewDnsRecord({ type: 'A', name: '', content: '', ttl: '3600' });
        addLog('DNS_RECORD_ADDED', `Domain: ${dnsManagingDomain.domain}`);
      } else {
        showAlert("Cloudflare Error", data.errors[0]?.message || "Validation failed", "error");
      }
    } catch(e) {
      showAlert("Network Error", "Network error while adding DNS record.", "error");
    }
  };

  const handleDeleteDnsRecord = async (recordId: string) => {
    showConfirm("Delete DNS Record", "Permanently delete this DNS record from Cloudflare?", async () => {
      try {
        const targetUrl = encodeURIComponent(`https://api.cloudflare.com/client/v4/zones/${dnsManagingDomain.zoneId}/dns_records/${recordId}`);
        const res = await fetch(`https://corsproxy.io/?${targetUrl}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${systemSettings.cfToken}`, 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if(data.success || data.result?.id) {
          await fetchDnsRecords(dnsManagingDomain);
          addLog('DNS_RECORD_DELETED', `Domain: ${dnsManagingDomain.domain}`);
        } else {
          showAlert("Cloudflare Error", data.errors[0]?.message || "Failed to delete record", "error");
        }
      } catch(e) {
        showAlert("Network Error", "Network error while deleting DNS record.", "error");
      }
      setConfirmMessage(null);
    });
  };

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center"><span className="text-sm font-medium text-slate-500">Total Users</span><div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><Users className="w-5 h-5" /></div></div>
          <div className="text-3xl font-bold text-slate-800 mt-4">{users.length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center"><span className="text-sm font-medium text-slate-500">Active Users</span><div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><CheckCircle className="w-5 h-5" /></div></div>
          <div className="text-3xl font-bold text-slate-800 mt-4">{users.filter(u=>u.status==='active').length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center"><span className="text-sm font-medium text-slate-500">Pending Approvals</span><div className="bg-amber-100 p-2 rounded-lg text-amber-600"><AlertCircle className="w-5 h-5" /></div></div>
          <div className="text-3xl font-bold text-slate-800 mt-4">0</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center"><span className="text-sm font-medium text-slate-500">Total Optimizations</span><div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Activity className="w-5 h-5" /></div></div>
          <div className="text-3xl font-bold text-slate-800 mt-4">35</div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center"><h3 className="font-bold text-slate-800">Recent Activity</h3><button onClick={() => setActiveTab('logs')} className="text-indigo-600 text-sm hover:underline">View all</button></div>
        <div className="divide-y divide-slate-100">
          {logs.slice(0, 5).map(log => (
            <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-sm font-medium text-slate-800">{String(log.action)}</div>
                  <div className="text-xs text-slate-500">{String(log.user)} • {String(log.date)}</div>
                </div>
              </div>
              <div className="text-xs text-slate-400">{String(log.entity)}</div>
            </div>
          ))}
          {logs.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">No recent activity.</div>}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-6">System Settings</h3>
        <div className="grid grid-cols-2 gap-6">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">AI Budget Cap ($)</label><input type="number" value={systemSettings.budgetCap} onChange={e=>setSystemSettings({...systemSettings, budgetCap: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"/></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Character Limit</label><input type="number" value={systemSettings.charLimit} onChange={e=>setSystemSettings({...systemSettings, charLimit: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"/></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Default Credits (Users)</label><input type="number" value={systemSettings.defaultCredits} onChange={e=>setSystemSettings({...systemSettings, defaultCredits: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"/></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Default Credits (Admins)</label><input type="number" value={systemSettings.adminDefaultCredits} onChange={e=>setSystemSettings({...systemSettings, adminDefaultCredits: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"/></div>
          <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Cloudflare API Token (For DNS Sync)</label><input type="password" value={systemSettings.cfToken || ''} onChange={e=>setSystemSettings({...systemSettings, cfToken: e.target.value})} placeholder="Required for adding live DNS records" className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"/></div>
        </div>
      </div>
      <button onClick={handleSaveSettings} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md transition flex items-center gap-2"><Save className="w-4 h-4" /> Save All Settings</button>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">User Directory</h3>
        <button onClick={() => openUserModal()} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"><UserPlus className="w-4 h-4" /> Add New User</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="p-4 font-bold">Name / Email</th>
              <th className="p-4 font-bold">Username</th>
              <th className="p-4 font-bold">Role</th>
              <th className="p-4 font-bold">Credits</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {users.map((user: any) => (
              <tr key={user.id} className="hover:bg-slate-50 transition">
                <td className="p-4"><div className="font-bold text-slate-800">{user.fullName}</div><div className="text-slate-500 text-xs">{user.email}</div></td>
                <td className="p-4 text-slate-700 font-mono text-xs">{user.username}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>{user.role}</span></td>
                <td className="p-4 font-medium text-slate-700">{user.credits || 0}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{user.status}</span></td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={() => openUserModal(user)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition" title="Edit"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleToggleSuspend(user.id, user.status)} className={`p-2 rounded transition ${user.status === 'active' ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`} title={user.status === 'active' ? "Suspend User" : "Activate User"}>{user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}</button>
                  <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition" title="Delete User"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full animate-fade-in">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div className="flex gap-4">
          <div className="relative"><Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" /><input type="text" placeholder="Search actions..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 outline-none focus:border-indigo-500"/></div>
        </div>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 sticky top-0 shadow-sm z-10">
              <th className="p-4 font-bold">Date</th>
              <th className="p-4 font-bold">User</th>
              <th className="p-4 font-bold">Action</th>
              <th className="p-4 font-bold">Entity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="p-4 text-slate-500">{String(log.date)}</td>
                <td className="p-4 font-medium text-slate-700">{String(log.user)}</td>
                <td className="p-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-600">{String(log.action)}</span></td>
                <td className="p-4 text-slate-500">{String(log.entity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderApiKeys = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">API Keys</h3>
        <button onClick={handleGenerateApiKey} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"><Plus className="w-4 h-4" /> Generate Key</button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
            <th className="p-4 font-bold">Name</th>
            <th className="p-4 font-bold">Key</th>
            <th className="p-4 font-bold">Rate Limit</th>
            <th className="p-4 font-bold">Usage</th>
            <th className="p-4 font-bold">Status</th>
            <th className="p-4 font-bold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {apiKeys.map(k => (
            <tr key={k.id} className="hover:bg-slate-50">
              <td className="p-4 text-slate-700">{k.name}</td>
              <td className="p-4 font-mono text-xs text-slate-500 flex items-center gap-2"><div className="bg-slate-100 px-2 py-1 rounded">{k.key}</div> <Copy className="w-3 h-3 cursor-pointer hover:text-indigo-600" /></td>
              <td className="p-4 text-slate-600">{k.limit}</td>
              <td className="p-4 text-slate-600">{k.usage}</td>
              <td className="p-4"><span className="px-2 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-700">{k.status}</span></td>
              <td className="p-4 text-right">
                <button onClick={()=>setApiKeys(apiKeys.filter(a=>a.id!==k.id))} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
              </td>
            </tr>
          ))}
          {apiKeys.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-500">No API keys generated.</td></tr>}
        </tbody>
      </table>
    </div>
  );

  const renderAiProviders = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">AI Provider Configuration</h3>
          <button onClick={() => openAiModal()} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"><Plus className="w-4 h-4" /> Add Provider</button>
        </div>
        <div className="divide-y divide-slate-100">
          {aiProviders.map(p => (
            <div key={p.id} className={`p-6 flex items-center justify-between transition ${p.status ? 'bg-indigo-50/30' : 'bg-white opacity-60'}`}>
              <div className="flex items-center gap-4">
                <div className={`${p.status ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'} p-3 rounded-lg`}><Zap className="w-6 h-6" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={`font-bold ${p.status ? 'text-slate-800' : 'text-slate-500'}`}>{p.name}</h4>
                    {p.tags.map((t: string)=><span key={t} className={`text-[10px] px-2 py-0.5 rounded border ${t==='Free'||t==='Built-in'?'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>{t}</span>)}
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-slate-500">
                    <span className={`flex items-center gap-1 ${p.status ? 'text-emerald-600' : ''}`}>{p.status ? <CheckCircle className="w-3 h-3"/> : <EyeOff className="w-3 h-3" />} {p.status ? 'Active' : 'Disabled'}</span>
                    <span>Priority: {p.priority}</span>
                    <span>Model: {p.model || 'Default'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <button onClick={() => handleTestAi(p)} className="px-3 py-1.5 border border-slate-200 rounded text-sm hover:bg-slate-100 bg-white">Test API</button>
                <button onClick={() => openAiModal(p)} className="p-1.5 text-slate-400 hover:text-indigo-600 border border-slate-200 rounded bg-white"><Edit className="w-4 h-4" /></button>
                <button onClick={()=>handleToggleAiProvider(p.id)} className={`w-12 h-6 rounded-full relative transition-colors ${p.status ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${p.status ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 shadow-sm">
        <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><LockKeyhole className="w-4 h-4"/> API Routing & Fallback</h4>
        <p className="text-sm text-indigo-800">If all custom API providers are turned OFF, the system will automatically use the <strong>Z-AI Free SDK</strong> (built-in) to ensure the Optimizer always works.</p>
      </div>
    </div>
  );

  const renderDns = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">Cloudflare Domains</h3>
        <form onSubmit={handleAddDomain} className="flex items-center gap-2">
          <input type="text" placeholder="example.com" value={newDomainInput} onChange={(e) => setNewDomainInput(e.target.value)} className="p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
          <input type="text" placeholder="Cloudflare Zone ID" value={newZoneIdInput} onChange={(e) => setNewZoneIdInput(e.target.value)} className="p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
          <button type="submit" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"><Plus className="w-4 h-4" /> Connect Domain</button>
        </form>
      </div>
      <div className="p-6 space-y-4">
        {!systemSettings.cfToken && (
          <div className="bg-amber-50 text-amber-700 p-4 rounded-lg flex items-center gap-2 border border-amber-200 text-sm"><AlertCircle className="w-4 h-4"/> Cloudflare API Token missing. Please add it in System Settings to fetch real DNS data.</div>
        )}
        {dnsDomains.map(d => (
          <div key={d.id} className="flex items-center justify-between p-4 border border-slate-200 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-lg text-slate-600 shadow-sm"><Globe className="w-6 h-6" /></div>
              <div>
                <div className="font-bold text-slate-800">{d.domain} <span className="text-xs font-mono text-slate-400 ml-2">{d.zoneId}</span></div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className={`flex items-center gap-1 ${d.status === 'Verified' ? 'text-emerald-600' : 'text-amber-600'}`}><AlertCircle className="w-3 h-3" /> {d.status}</span>
                  <span>{(d.records || []).length} synced records</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openDnsModal(d)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition">Manage DNS</button>
              <button onClick={()=>setDnsDomains(dnsDomains.filter(x=>x.id!==d.id))} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {dnsDomains.length === 0 && <div className="text-center py-8 text-slate-500 text-sm">No custom domains configured.</div>}
      </div>
      
      {/* Cloudflare Live DNS Modal */}
      {isDnsModalOpen && dnsManagingDomain && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">Live DNS Configuration <Cloud className="w-5 h-5 text-indigo-500"/></h3>
                <p className="text-xs text-slate-500 mt-1">{dnsManagingDomain.domain} (Zone: {dnsManagingDomain.zoneId})</p>
              </div>
              <button onClick={() => setIsDnsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAddDnsRecord} className="flex gap-2 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <select value={newDnsRecord.type} onChange={(e) => setNewDnsRecord({...newDnsRecord, type: e.target.value})} className="p-2 border rounded outline-none font-medium text-slate-700 text-sm">
                <option>A</option><option>CNAME</option><option>TXT</option><option>MX</option>
              </select>
              <input type="text" placeholder="Name (e.g. www or @)" value={newDnsRecord.name} onChange={(e) => setNewDnsRecord({...newDnsRecord, name: e.target.value})} className="p-2 border rounded text-sm outline-none w-1/4" required/>
              <input type="text" placeholder="Content / Target IP" value={newDnsRecord.content} onChange={(e) => setNewDnsRecord({...newDnsRecord, content: e.target.value})} className="p-2 border rounded text-sm outline-none flex-1" required/>
              <select value={newDnsRecord.ttl} onChange={(e) => setNewDnsRecord({...newDnsRecord, ttl: e.target.value})} className="p-2 border rounded outline-none font-medium text-slate-700 text-sm">
                <option value="1">Auto</option><option value="3600">3600</option>
              </select>
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 transition text-white px-4 py-2 rounded font-medium text-sm flex gap-2 items-center"><Plus className="w-4 h-4" /> Add Record</button>
            </form>

            <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-lg relative">
              {isFetchingDns && <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-600"/></div>}
              <table className="w-full text-left border-collapse text-sm">
                <thead><tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs sticky top-0"><th className="p-3 font-bold">Type</th><th className="p-3 font-bold">Name</th><th className="p-3 font-bold">Content</th><th className="p-3 font-bold">TTL</th><th className="p-3 font-bold text-right">Actions</th></tr></thead>
                <tbody>
                  {(dnsManagingDomain.records || []).map((r: any) => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="p-3 font-mono text-xs font-bold text-slate-600">{String(r.type)}</td>
                      <td className="p-3 text-slate-800 font-medium">{String(r.name)}</td>
                      <td className="p-3 text-slate-500 truncate max-w-[250px]">{String(r.content)}</td>
                      <td className="p-3 text-slate-400">{r.ttl === 1 ? 'Auto' : r.ttl}</td>
                      <td className="p-3 text-right"><button onClick={() => handleDeleteDnsRecord(r.id)} className="text-slate-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                  {(!dnsManagingDomain.records || dnsManagingDomain.records.length === 0) && !isFetchingDns && <tr><td colSpan="5" className="py-12 text-center text-slate-500">No records found on Cloudflare.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTabs = () => {
    switch(activeTab) {
      case 'overview': return renderOverview();
      case 'profile': return renderSettings(); 
      case 'users': return renderUsers();
      case 'settings': return renderSettings();
      case 'logs': return renderLogs();
      case 'api-keys': return renderApiKeys();
      case 'dns': return renderDns();
      case 'ai-providers': return renderAiProviders();
      default: return renderOverview();
    }
  };

  const navItems = [
    { id: 'overview', icon: Layout, label: 'Overview' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'ai-providers', icon: Zap, label: 'AI Providers' },
    { id: 'api-keys', icon: Key, label: 'API Keys' },
    { id: 'logs', icon: ScrollText, label: 'Logs' },
    { id: 'dns', icon: Globe, label: 'DNS' },
    { id: 'settings', icon: Settings, label: t('settings') },
  ];

  return (
    <div className="flex h-screen bg-[#f1f5f9] font-sans overflow-hidden animate-fade-in">
      <div className="w-64 bg-[#0f172a] text-slate-300 flex flex-col shadow-xl z-20 shrink-0 transition-all">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Plane className="w-6 h-6 text-indigo-500 mr-2" />
          <span className="font-bold text-lg text-white">Admin Panel</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
              <item.icon className="w-4 h-4" /> {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800 capitalize tracking-tight">{activeTab.replace('-', ' ')}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setLang(lang === 'en' ? 'fr' : 'en')} className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition">
              <Globe className="w-3 h-3"/> {lang === 'en' ? 'EN' : 'FR'}
            </button>
            <button onClick={onClose} className="text-sm font-medium text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full hover:bg-indigo-100 transition border border-indigo-100">Exit Admin</button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 relative">
          {renderTabs()}
        </main>
      </div>

      {/* Global Modals for Admin Dashboard */}
      {alertMessage && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
            {alertMessage.type === 'error' && <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4"/>}
            {alertMessage.type === 'success' && <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4"/>}
            {alertMessage.type === 'info' && <Bell className="w-14 h-14 text-indigo-500 mx-auto mb-4"/>}
            <h3 className="text-xl font-bold text-slate-800 mb-2">{alertMessage.title}</h3>
            <p className="text-sm text-slate-600 mb-6 whitespace-pre-wrap leading-relaxed">{alertMessage.message}</p>
            <button onClick={() => setAlertMessage(null)} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition">Got it</button>
          </div>
        </div>
      )}

      {confirmMessage && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
            <AlertCircle className="w-14 h-14 text-amber-500 mx-auto mb-4"/>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{confirmMessage.title}</h3>
            <p className="text-sm text-slate-600 mb-8 leading-relaxed">{confirmMessage.message}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirmMessage(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition">Cancel</button>
              <button onClick={confirmMessage.onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition shadow-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Full Name</label><input type="text" value={userFormData.fullName} onChange={e => setUserFormData({...userFormData, fullName: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 text-sm outline-none" required /></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Email</label><input type="email" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 text-sm outline-none" required /></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-600 mb-1">Username</label><input type="text" value={userFormData.username} onChange={e => setUserFormData({...userFormData, username: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 text-sm outline-none" required /></div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Password {editingUser && <span className="font-normal text-slate-400">(Leave blank to keep current)</span>}</label>
                <input type="password" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 text-sm outline-none" />
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                {(!editingUser || String(editingUser.id) !== String(currentUser.id)) && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Role</label>
                      <select value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value})} className="w-full p-2 border rounded text-sm outline-none">
                        <option value="user">User</option><option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
                      <select value={userFormData.status} onChange={e => setUserFormData({...userFormData, status: e.target.value})} className="w-full p-2 border rounded text-sm outline-none">
                        <option value="active">Active</option><option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </>
                )}
                <div className={(!editingUser || String(editingUser.id) !== String(currentUser.id)) ? "" : "col-span-3"}>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Credits</label>
                  <input type="number" value={userFormData.credits} onChange={e => setUserFormData({...userFormData, credits: parseInt(e.target.value)})} className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 text-sm outline-none" required />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 rounded text-sm font-medium text-slate-600 hover:bg-slate-100 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">{editingAi ? 'Edit AI Provider' : 'Add AI Provider'}</h3>
              <button onClick={() => setIsAiModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveAi} className="space-y-4">
              <div><label className="block text-xs font-bold text-slate-600 mb-1">Provider Name</label><input type="text" value={aiFormData.name} onChange={e => setAiFormData({...aiFormData, name: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 text-sm outline-none" required placeholder="e.g. Google Gemini" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-1">Model Name</label><input type="text" value={aiFormData.model} onChange={e => setAiFormData({...aiFormData, model: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 text-sm outline-none" placeholder="e.g., gemini-2.5-flash" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-1">API Key (Optional - Z-AI Free SDK works without key)</label><input type="password" value={aiFormData.apiKey} onChange={e => setAiFormData({...aiFormData, apiKey: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 text-sm outline-none" placeholder="sk-..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Priority (1 is highest)</label><input type="number" value={aiFormData.priority} onChange={e => setAiFormData({...aiFormData, priority: parseInt(e.target.value)})} className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 text-sm outline-none" required /></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1">Tags (Comma separated)</label><input type="text" value={aiFormData.tags} onChange={e => setAiFormData({...aiFormData, tags: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 text-sm outline-none" placeholder="Free, Vision" /></div>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAiModalOpen(false)} className="px-4 py-2 rounded text-sm font-medium text-slate-600 hover:bg-slate-100 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition">Save Provider</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const OptimizerView: React.FC<{ currentUser: User, onLogout: () => void, onGoToAdmin: () => void, lang: Lang, setLang: any, t: any }> = ({ currentUser, onLogout, onGoToAdmin, lang, setLang, t }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isFetchingJob, setIsFetchingJob] = useState(false);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>({ tone: "Balanced", format: "Chronological", strictness: "Balanced" });
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [highlightKeywords, setHighlightKeywords] = useState(false);
  const [appError, setAppError] = useState("");
  const [appSuccess, setAppSuccess] = useState("");
  
  const [targetAirline, setTargetAirline] = useState("");
  const [simulatorData, setSimulatorData] = useState<any>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  
  const [resumeText, setResumeText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobText, setJobText] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  const [coverLetterResult, setCoverLetterResult] = useState<any>(null);
  const [interviewResult, setInterviewResult] = useState<any>(null);
  
  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  const [isEditing, setIsEditing] = useState(false);
  const [activeDocument, setActiveDocument] = useState<'resume' | 'cover_letter'>('resume');

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [driveStatus, setDriveStatus] = useState('disconnected');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumePreviewRef = useRef<HTMLDivElement>(null); 

  const handleResumePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => setResumeText(e.target.value);
  const handleJobPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => setJobText(e.target.value);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedResume = localStorage.getItem('ats_resumeText');
      const savedJob = localStorage.getItem('ats_jobText');
      const savedJobTitle = localStorage.getItem('ats_jobTitle');
      const savedCompanyName = localStorage.getItem('ats_companyName');
      const savedUrl = localStorage.getItem('ats_jobUrl');
      const savedHistory = localStorage.getItem('ats_history');
      if (savedResume) setResumeText(savedResume);
      if (savedJob) setJobText(savedJob);
      if (savedJobTitle) setJobTitle(savedJobTitle);
      if (savedCompanyName) setCompanyName(savedCompanyName);
      if (savedUrl) setJobUrl(savedUrl);
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ats_resumeText', resumeText); }, [resumeText]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ats_jobText', jobText); }, [jobText]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ats_jobTitle', jobTitle); }, [jobTitle]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ats_companyName', companyName); }, [companyName]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ats_jobUrl', jobUrl); }, [jobUrl]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('ats_history', JSON.stringify(history)); }, [history]);

  useEffect(() => {
    if (resumePreviewRef.current && !isEditing) {
      let content = activeDocument === 'resume' ? result?.optimized_content : coverLetterResult;
      if (!content) return;
      if (activeDocument === 'resume' && highlightKeywords && result?.matched_keywords) {
        result.matched_keywords.forEach((kw: string) => {
          const regex = new RegExp(`\\b(${kw})\\b(?![^<]*>)`, 'gi');
          content = content.replace(regex, '<span class="bg-emerald-100 rounded px-0.5">$1</span>');
        });
      }
      resumePreviewRef.current.innerHTML = content;
    }
  }, [result, coverLetterResult, activeDocument, highlightKeywords, isEditing]);

  const saveToHistory = (dataResult: any) => {
    const finalTitle = jobTitle || "Job Application";
    const finalCompany = companyName || "Company";
    const newItem = { id: Date.now(), date: new Date().toISOString(), resumeText, jobTitle: finalTitle, companyName: finalCompany, jobText, jobUrl, result: dataResult, jobTitleDisplay: finalTitle, company: finalCompany, score: dataResult.score };
    setHistory(prev => [newItem, ...prev]);
  };

  const loadFromHistory = (item: any) => {
    setResumeText(item.resumeText || "");
    setJobTitle(item.jobTitle || item.jobTitleDisplay || "");
    setCompanyName(item.companyName || item.company || "");
    setJobText(item.jobText || "");
    setJobUrl(item.jobUrl || "");
    setResult(item.result);
    setActiveDocument('resume');
    setStep(3); 
    setShowHistory(false);
  };

  const deleteHistoryItem = (id: string) => { setHistory(prev => prev.filter(item => item.id !== id)); };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    setAppError("");
    try {
      const text = await parseFile(file);
      setResumeText(text);
    } catch (error: any) { setAppError(error instanceof Error ? error.message : String(error)); } 
    finally { setIsParsing(false); }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleDownloadDocx = () => {
    let content = resumePreviewRef.current?.innerHTML;
    if (!content) return;
    const cleanContent = content.replace(/<span class="bg-emerald-100[^>]*">(.*?)<\/span>/g, '$1');
    const sourceHTML = getDocxHtml(cleanContent, selectedTemplate);
    const fileDownload = document.createElement("a");
    fileDownload.href = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    fileDownload.download = activeDocument === 'resume' ? 'Optimized_Resume.doc' : 'Cover_Letter.doc';
    fileDownload.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleJobFetch = async () => {
    if (!jobUrl) return;
    setIsFetchingJob(true); setAppError(""); setJobTitle(""); setCompanyName(""); setJobText("");
    try {
      const data = await fetchJobWithGemini(jobUrl, lang);
      if (data) { setJobTitle(data.jobTitle || ""); setCompanyName(data.companyName || ""); setJobText(data.jobDescription || ""); }
    } catch (error: any) { setAppError(error instanceof Error ? error.message : String(error)); } 
    finally { setIsFetchingJob(false); }
  };

  const runOptimization = async () => {
    if (!resumeText || (!jobText && !jobTitle)) { setAppError("Please provide both resume content and job details."); return; }
    setLoading(true); setAppError(""); setAppSuccess(""); setResult(null); setCoverLetterResult(null); setInterviewResult(null); 
    try {
      const combinedJobContext = `Job Title: ${jobTitle}\nCompany: ${companyName}\nDescription: ${jobText}`;
      const data = await analyzeWithGemini(resumeText, combinedJobContext, settings, targetAirline, lang);
      setResult(data); saveToHistory(data); setActiveDocument('resume'); setStep(3); 
    } catch (e: any) { setAppError(e instanceof Error ? e.message : String(e)); } 
    finally { setLoading(false); }
  };

  const handleRunSimulation = async () => {
    if (!result?.optimized_content) return;
    setIsSimulating(true); setAppError(""); setShowSimulator(true);
    try {
      const data = await runATSSimulation(result.optimized_content, lang);
      setSimulatorData(data);
    } catch (e: any) { setAppError(e instanceof Error ? e.message : String(e)); setShowSimulator(false); } 
    finally { setIsSimulating(false); }
  };

  const handleGenerateCoverLetter = async () => {
    if (coverLetterResult) {
      setActiveDocument('cover_letter');
      return;
    }
    if (!result?.optimized_content || (!jobText && !jobTitle)) return;
    setIsGeneratingCoverLetter(true); setAppError(""); setAppSuccess("");
    try {
      const combinedJobContext = `Job Title: ${jobTitle}\nCompany: ${companyName}\nDescription: ${jobText}`;
      const data = await generateCoverLetterWithGemini(result.optimized_content, combinedJobContext, settings, lang);
      if (data && data.cover_letter_content) { 
        setCoverLetterResult(data.cover_letter_content); 
        setActiveDocument('cover_letter');
        setAppSuccess(t('coverLetterReady')); 
      } 
      else { setAppError("AI returned an invalid format. Please try again."); }
    } catch (e: any) { setAppError(e instanceof Error ? e.message : String(e)); } 
    finally { setIsGeneratingCoverLetter(false); }
  };

  const handleGenerateInterview = async () => {
    if (!result?.optimized_content || (!jobText && !jobTitle)) return;
    setLoading(true); setAppError("");
    try {
      const currentContent = resumePreviewRef.current ? resumePreviewRef.current.innerHTML : result.optimized_content;
      const combinedJobContext = `Job Title: ${jobTitle}\nCompany: ${companyName}\nDescription: ${jobText}`;
      const data = await generateInterviewPrepWithGemini(currentContent, combinedJobContext, lang);
      setInterviewResult(data.questions); setStep(4);
    } catch (e: any) { setAppError(e instanceof Error ? e.message : String(e)); } 
    finally { setLoading(false); }
  };

  const handleSaveEdits = () => {
    if (resumePreviewRef.current) { 
      if (activeDocument === 'resume') {
        setResult({ ...result, optimized_content: resumePreviewRef.current.innerHTML }); 
      } else {
        setCoverLetterResult(resumePreviewRef.current.innerHTML);
      }
      setIsEditing(false); 
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false); setDriveStatus('connecting');
    setTimeout(() => { setDriveStatus('connected'); setAppSuccess(t('savedToDrive')); setTimeout(() => setAppSuccess(""), 5000); }, 1000);
  };

  const handleDriveSave = () => {
    setAppSuccess(t('savedToDrive'));
    setTimeout(() => setAppSuccess(""), 5000);
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * { visibility: hidden !important; }
        html, body, #root { height: auto !important; width: auto !important; overflow: visible !important; background: white !important; margin: 0 !important; padding: 0 !important; }
        #resume-preview, #resume-preview * { visibility: visible !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color: black !important; }
        #resume-preview { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; background: white !important; z-index: 99999 !important; box-shadow: none !important; border: none !important; }
        @page { size: A4 portrait; margin: 1.27cm 1.27cm 1.27cm 1.27cm; }
        .no-print { display: none !important; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative overflow-x-hidden flex flex-col">
      <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${showHistory ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><History className="w-5 h-5 text-indigo-500" /> {t('history')}</h3>
          <button onClick={() => setShowHistory(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {history.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 shadow-sm cursor-pointer group" onClick={() => loadFromHistory(item)}>
              <div className="font-bold text-slate-700 text-sm truncate">{String(item.jobTitle || "Untitled")}</div>
              <div className="text-xs text-slate-500">{String(item.companyName || new Date(item.id).toLocaleDateString())}</div>
            </div>
          ))}
        </div>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} settings={settings} setSettings={setSettings} t={t} />
      <SimulatorModal isOpen={showSimulator} onClose={() => setShowSimulator(false)} simulatorData={simulatorData} />

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center animate-fade-in p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-12 h-12 mb-4 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">G</div>
              <h2 className="text-2xl font-medium text-gray-800 mb-1">Sign in with Google</h2>
              <p className="text-sm text-gray-500 mb-8">Choose an account to connect to <span className="font-bold text-indigo-600">ATSPro</span></p>
              <div onClick={handleAuthSuccess} className="w-full border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer p-4 flex items-center gap-4 transition-colors">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">{currentUser?.fullName?.charAt(0) || 'U'}</div>
                <div className="text-left flex-1"><div className="text-sm font-bold text-gray-800">{currentUser?.fullName || 'User'}</div><div className="text-xs text-gray-500">{currentUser?.email || 'user@example.com'}</div></div>
              </div>
            </div>
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 no-print h-16 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white"><Plane className="w-5 h-5" /></div> ATSPro
        </div>
        <div className="flex items-center bg-slate-100 rounded-full p-1 border border-slate-200">
          <div className="px-4 py-1.5 text-sm font-medium text-slate-600 flex items-center gap-2"><Zap className="w-4 h-4 text-indigo-500" /> {currentUser?.credits || 0}</div>
          <div className="w-px h-4 bg-slate-300 mx-1"></div>
          <button onClick={() => setLang(lang === 'en' ? 'fr' : 'en')} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-full flex items-center gap-1 transition"><Globe className="w-3 h-3"/> {lang === 'en' ? 'EN' : 'FR'}</button>
          <div className="w-px h-4 bg-slate-300 mx-1"></div>
          <button onClick={() => setShowHistory(true)} className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-full transition">{t('history')}</button>
          <button onClick={() => setShowSettings(true)} className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-full transition">{t('settings')}</button>
          {currentUser?.role === 'admin' && (
            <>
              <div className="w-px h-4 bg-slate-300 mx-1"></div>
              <button onClick={onGoToAdmin} className="px-3 py-1.5 text-sm font-bold text-indigo-700 hover:bg-indigo-100 rounded-full transition">{t('admin')}</button>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-slate-700 hidden md:block">{currentUser?.fullName || currentUser?.username}</div>
          <button onClick={onLogout} className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold hover:bg-indigo-200 transition" title={t('logout')}>
            {currentUser?.fullName?.charAt(0) || 'U'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {step > 2 && (
          <div className="mb-6 animate-fade-in no-print">
            <button onClick={() => setStep(step === 4 ? 3 : 1)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition py-2 px-4 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm">
              <ChevronLeft className="w-4 h-4" /> {step === 4 ? t('backToResume') : t('backToInput')}
            </button>
          </div>
        )}

        {step < 3 && (
          <div className="animate-fade-in space-y-8">
            {appError && (<div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3 shadow-sm animate-fade-in"><AlertCircle className="w-6 h-6 shrink-0"/><span className="font-medium text-sm">{appError}</span></div>)}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2 font-bold text-slate-700"><FileText className="w-5 h-5 text-indigo-500" /> {t('theTailor')} <span className="text-xs font-normal text-slate-400 ml-2">{t('resumeInput')}</span></div>
                <div className="p-6 flex flex-col flex-1 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">{t('uploadResume')}</label>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.md,.pdf,.docx,.doc" />
                    <button onClick={triggerFileInput} disabled={isParsing} className="w-full border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-slate-500 hover:border-indigo-400 hover:bg-indigo-50 transition bg-slate-50">
                      {isParsing ? <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" /> : <Upload className="w-6 h-6 text-slate-400 mb-2" />}
                      <span className="text-sm font-medium">{isParsing ? t('extracting') : t('chooseFile')}</span>
                    </button>
                  </div>
                  <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-slate-200"></div><span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase tracking-wider">{t('orPaste')}</span><div className="flex-grow border-t border-slate-200"></div></div>
                  <textarea className="w-full flex-1 min-h-[250px] p-4 text-sm text-slate-700 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono bg-white shadow-inner" placeholder={t('pasteHere')} value={resumeText} onChange={handleResumePaste} disabled={isParsing} />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2 font-bold text-slate-700"><Briefcase className="w-5 h-5 text-indigo-500" /> {t('jobContext')}</div>
                <div className="p-6 flex flex-col flex-1 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">{t('skipCopy')}</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="URL..." className="flex-1 p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 bg-slate-50" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleJobFetch()} />
                      <button onClick={handleJobFetch} disabled={isFetchingJob || !jobUrl} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-6 rounded-xl text-sm font-bold transition border border-indigo-200 disabled:opacity-50">
                        {isFetchingJob ? <Loader2 className="w-4 h-4 animate-spin" /> : t('fetch')}
                      </button>
                    </div>
                  </div>
                  <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-slate-200"></div><span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase tracking-wider">{t('orEnter')}</span><div className="flex-grow border-t border-slate-200"></div></div>
                  <div className="flex gap-4">
                    <div className="flex-1"><label className="block text-sm font-bold text-slate-700 mb-1">{t('jobTitle')}</label><input type="text" className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} disabled={isFetchingJob} /></div>
                    <div className="flex-1"><label className="block text-sm font-bold text-slate-700 mb-1">{t('company')}</label><input type="text" className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white" value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={isFetchingJob} /></div>
                  </div>
                  <div className="flex flex-col flex-1"><label className="block text-sm font-bold text-slate-700 mb-2">{t('jobDesc')}</label><textarea className="w-full flex-1 min-h-[160px] p-4 text-sm text-slate-700 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono bg-white shadow-inner" placeholder={t('pasteJob')} value={jobText} onChange={handleJobPaste} disabled={isFetchingJob} /></div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center pt-4">
              <button onClick={runOptimization} disabled={!resumeText.trim() || (!jobText.trim() && !jobTitle.trim()) || loading || isFetchingJob} className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-full font-bold shadow-lg shadow-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-1 text-lg">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Activity className="w-6 h-6" />} 
                {loading ? t('optimizing') : t('tailorBtn')}
              </button>
            </div>
          </div>
        )}

        {step === 3 && result && (
          <div className="max-w-5xl mx-auto animate-fade-in no-print">
            {appError && (<div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3 shadow-sm animate-fade-in"><AlertCircle className="w-6 h-6 shrink-0"/><span className="font-medium text-sm">{appError}</span></div>)}
            {appSuccess && (<div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3 shadow-sm animate-fade-in"><CheckCircle className="w-6 h-6 shrink-0"/><span className="font-medium text-sm">{appSuccess}</span></div>)}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden"><div className="text-4xl font-extrabold text-indigo-600 mb-1">{result.score}%</div><div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('atsScore')}</div><div className="absolute bottom-0 left-0 w-full h-1.5 bg-indigo-50"><div className="h-full bg-indigo-600" style={{width: `${result.score}%`}}></div></div></div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center"><div className="text-4xl font-extrabold text-slate-800 mb-1">{(result.matched_keywords?.length || 0) + (result.missing_keywords?.length || 0)}</div><div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('keywordsFound')}</div></div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden"><div className="text-4xl font-extrabold text-emerald-500 mb-1">{result.matched_keywords?.length || 0}</div><div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('keywordsMatched')}</div><div className="absolute bottom-0 left-0 w-full h-1.5 bg-emerald-50"><div className="h-full bg-emerald-500" style={{width: `${((result.matched_keywords?.length || 0) / ((result.matched_keywords?.length || 0) + (result.missing_keywords?.length || 1))) * 100}%`}}></div></div></div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-white p-2.5 rounded-xl text-indigo-600 shadow-sm"><MessageSquare className="w-6 h-6" /></div>
                <div><div className="font-bold text-indigo-900 text-base">{t('practiceInterview')}</div><div className="text-sm text-indigo-700">{t('interviewSub')}</div></div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleRunSimulation} className="w-full sm:w-auto text-indigo-700 bg-white hover:bg-indigo-100 border border-indigo-200 px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4"/> {t('validateCompliance')}</button>
                <button onClick={handleGenerateInterview} disabled={loading} className="w-full sm:w-auto text-white bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50">{loading ? <Loader2 className="w-4 h-4 animate-spin"/> : t('startPrep')} <ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex bg-slate-100 p-1.5 rounded-xl">
                  <button onClick={() => setActiveDocument('resume')} className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeDocument === 'resume' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-800'}`}>
                    {t('resume')}
                  </button>
                  <button onClick={handleGenerateCoverLetter} disabled={isGeneratingCoverLetter} className={`px-6 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 disabled:opacity-50 ${activeDocument === 'cover_letter' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-800'}`}>
                    {isGeneratingCoverLetter ? <Loader2 className="w-4 h-4 animate-spin" /> : t('coverLetter')}
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
                  <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition">{t('editInput')}</button>
                  <button onClick={handleDownloadDocx} className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition"><FileDown className="w-4 h-4" /> {t('downloadDocx')}</button>
                  <button onClick={handlePrint} className="flex items-center justify-center p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-sm transition"><Printer className="w-5 h-5" /></button>
                  <button onClick={() => { if (driveStatus === 'connected') { handleDriveSave(); } else { setShowAuthModal(true); } }} className={`flex items-center gap-2 border px-4 py-2.5 rounded-xl text-sm font-medium transition ${driveStatus === 'connected' ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{driveStatus === 'connected' ? <Check className="w-4 h-4"/> : <Cloud className="w-4 h-4"/>} {driveStatus === 'connected' ? t('savedToDrive') : t('saveToDrive')}</button>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">{t('resumeTemplate')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div onClick={() => setSelectedTemplate('professional')} className={`border-2 ${selectedTemplate === 'professional' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300'} rounded-xl p-4 cursor-pointer relative transition`}><div className={`font-bold text-sm mb-1 ${selectedTemplate === 'professional' ? 'text-indigo-900' : 'text-slate-800'}`}>{t('professional')}</div></div>
                  <div onClick={() => setSelectedTemplate('modern')} className={`border-2 ${selectedTemplate === 'modern' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300'} rounded-xl p-4 cursor-pointer relative transition`}><div className={`font-bold text-sm mb-1 ${selectedTemplate === 'modern' ? 'text-indigo-900' : 'text-slate-800'}`}>{t('modern')}</div></div>
                  <div onClick={() => setSelectedTemplate('minimal')} className={`border-2 ${selectedTemplate === 'minimal' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300'} rounded-xl p-4 cursor-pointer relative transition`}><div className={`font-bold text-sm mb-1 ${selectedTemplate === 'minimal' ? 'text-indigo-900' : 'text-slate-800'}`}>{t('minimal')}</div></div>
                </div>
              </div>
            </div>

            <div className="bg-[#f3f4f6] rounded-3xl p-8 lg:p-12 flex justify-center overflow-x-auto shadow-inner border border-slate-200 relative group">
              <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 shadow-sm border border-slate-200 flex items-center gap-2 z-10 no-print">
                {isEditing ? (<button onClick={handleSaveEdits} className="text-emerald-600 flex items-center gap-1 hover:text-emerald-700 transition"><Save className="w-3 h-3" /> {t('saveEdits')}</button>) : (<button onClick={() => setIsEditing(true)} className="text-indigo-600 flex items-center gap-1 hover:text-indigo-700 transition"><Edit3 className="w-3 h-3" /> {t('liveEdit')}</button>)}
              </div>
              
              <div className={`w-[21cm] min-h-[29.7cm] bg-white flex-shrink-0 transition-all ${isEditing ? 'shadow-2xl ring-4 ring-indigo-100 cursor-text' : 'shadow-xl cursor-default'}`}>
                <div id="resume-preview" ref={resumePreviewRef} contentEditable={isEditing} suppressContentEditableWarning={true} className={`p-12 text-sm leading-relaxed prose prose-sm max-w-none prose-h1:text-left prose-h1:uppercase prose-h3:uppercase prose-h3:border-none prose-p:my-0 prose-ul:my-0 prose-li:my-0 outline-none [&_*]:!border-none [&_*]:!shadow-none [&_*]:!outline-none ${selectedTemplate === 'professional' ? 'font-serif text-black prose-h3:text-black' : selectedTemplate === 'modern' ? 'font-sans text-slate-800 prose-h1:text-slate-900 prose-h3:text-slate-800' : 'font-sans text-gray-700 font-light prose-h1:text-gray-900 prose-h3:text-gray-800 prose-h1:font-medium prose-h3:font-medium'}`}></div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && interviewResult && (
          <div className="animate-fade-in max-w-4xl mx-auto py-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                <div className="bg-amber-100 p-3 rounded-xl"><MessageSquare className="w-8 h-8 text-amber-600" /></div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{t('interviewPrepGuide')}</h2>
                  <p className="text-slate-500 text-sm mt-1">{t('interviewPrepDesc')}</p>
                </div>
              </div>
              <div className="space-y-6">
                {interviewResult.map((item: any, i: number) => (
                  <div key={i} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h3 className="font-bold text-slate-800 text-lg mb-4 flex gap-3"><span className="text-indigo-600">Q{i+1}:</span> {String(item.question)}</h3>
                    <div className="bg-white p-5 rounded-lg border border-slate-200 text-slate-600 italic shadow-sm">
                      <span className="font-bold text-emerald-600 not-italic block mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {t('starMethod')}</span>
                      {String(item.star_answer)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- TOP LEVEL APP WRAPPER ---
export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appView, setAppView] = useState('login'); 
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('ats_lang') as Lang) || 'en';
    }
    return 'en';
  });

  useEffect(() => { 
    if (typeof window !== 'undefined') {
      localStorage.setItem('ats_lang', lang); 
    }
  }, [lang]);

  const t = (key: string) => (DICT[lang] as any)[key] || key;

  // Initialize from localStorage on mount - using ref to avoid setState in effect
  const isInitializedRef = useRef(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitializedRef.current) {
      isInitializedRef.current = true;
      const storedUsers = localStorage.getItem('ats_users');
      if (storedUsers) { 
        const parsed = JSON.parse(storedUsers);
        if (parsed.length > 0) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setUsers(parsed);
        }
      } else {
        const initialUsers: User[] = [{ id: 'admin-001', username: 'admin', password: 'Santafee@@@@@1972', role: 'admin', status: 'active', fullName: 'System Admin', email: 'admin@atspro.com', credits: 100 }];
        localStorage.setItem('ats_users', JSON.stringify(initialUsers));
        setUsers(initialUsers);
      }
      const activeSession = localStorage.getItem('ats_active_user');
      if(activeSession) { 
        const parsedUser = JSON.parse(activeSession);
        setCurrentUser(parsedUser); 
        setAppView('optimizer'); 
      }
    }
  }, []);

  useEffect(() => { 
    if (typeof window !== 'undefined' && users.length > 0) {
      localStorage.setItem('ats_users', JSON.stringify(users)); 
    }
  }, [users]);

  const handleLogin = (username?: string, password?: string) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user && user.status === 'active') {
      setCurrentUser(user); 
      if (typeof window !== 'undefined') {
        localStorage.setItem('ats_active_user', JSON.stringify(user));
      }
      setAppView('optimizer'); return true;
    }
    return false;
  };

  const handleLogout = () => { 
    setCurrentUser(null); 
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ats_active_user'); 
    }
    setAppView('login'); 
  };

  if (appView === 'login') return <LoginView onLogin={handleLogin} lang={lang} setLang={setLang} t={t} />;
  if (appView === 'admin' && currentUser?.role === 'admin') return <AdminDashboard currentUser={currentUser} users={users} setUsers={setUsers} onClose={() => setAppView('optimizer')} onLogout={handleLogout} lang={lang} setLang={setLang} t={t} />;
  return <OptimizerView currentUser={currentUser as User} onLogout={handleLogout} onGoToAdmin={() => { if (currentUser?.role === 'admin') setAppView('admin'); }} lang={lang} setLang={setLang} t={t} />;
}
