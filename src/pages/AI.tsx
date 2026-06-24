import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, MessageSquare, Video, Box, Eye, FileText, Sparkles, Send } from 'lucide-react';

export function AI() {
  return (
    <div className="space-y-10 animate-fade-in pb-12">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          AI Services Hub <Sparkles className="w-5 h-5 text-sky-400" />
        </h1>
        <p className="mt-2 text-sm text-slate-500">Access our suite of multimodal AI models and generative tools.</p>
      </header>

      <div className="space-y-8">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VisualQA />
          <DocumentQA />
        </section>
        
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ObjectDetection />
          <ImageCaptioning />
          <TextToImage />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextToVideo />
          <TextTo3D />
        </section>
      </div>
    </div>
  );
}

// --- Component: Visual QA ---
function VisualQA() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question && !file) return;
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('question', question);
      if (file) formData.append('image', file);
      
      const res = await fetch('/api/ai/visual-qa', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setAnswer(data.answer || data.error);
    } catch (e: any) {
      setAnswer(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
      <h2 className="text-[15px] font-semibold text-slate-900 mb-4">AI Multimodal Vision</h2>
      <div 
        className="flex-1 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-5 mb-4 relative cursor-pointer overflow-hidden group"
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
           <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        ) : (
          <>
            <div className="w-12 h-12 bg-slate-200 rounded-lg mb-3 flex items-center justify-center text-slate-400">
               <ImageIcon className="w-6 h-6" />
            </div>
            <p className="text-[13px] text-slate-500 text-center">Drop image for Visual QA or Object Detection</p>
          </>
        )}
        <input type="file" ref={fileInputRef} onChange={handleFile} accept="image/*" className="hidden" />
      </div>
      <form onSubmit={handleSubmit} className="w-full flex gap-2">
        <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a question about this image..." className="flex-1 px-3 py-2.5 border border-slate-200 rounded-md text-[13px] bg-white focus:ring-1 focus:ring-sky-500 outline-none" />
        <button type="submit" disabled={isLoading} className="bg-slate-900 text-white px-3 py-2.5 rounded-md hover:bg-slate-800 disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </form>
      {answer && (
        <div className="mt-3 text-[11px] text-slate-400 flex gap-2">
          <span>Prompt: "{question}"</span>
          <span className="text-blue-600">{answer}</span>
        </div>
      )}
      {isLoading && (
        <div className="mt-3 text-[11px] text-slate-400 flex gap-2">
          <span>Prompt: "{question}"</span>
          <span className="text-blue-600">Processing...</span>
        </div>
      )}
    </div>
  );
}

// --- Component: Document QA ---
function DocumentQA() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question && !file) return;
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('question', question);
      if (file) formData.append('document', file);
      
      const res = await fetch('/api/ai/document-qa', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setAnswer(data.answer || data.error);
    } catch (e: any) {
      setAnswer(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
      <h2 className="text-[15px] font-semibold text-slate-900 mb-4">Document Question Answering</h2>
      <div 
        className="flex-1 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-5 mb-4 cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-12 h-12 bg-slate-200 rounded-lg mb-3 flex items-center justify-center text-slate-400">
           <FileText className="w-6 h-6" />
        </div>
        <p className="text-[13px] text-slate-500 text-center">{file ? file.name : "Upload PDF or Text document"}</p>
        <input type="file" ref={fileInputRef} onChange={handleFile} accept=".pdf,.txt,.md" className="hidden" />
      </div>
      <form onSubmit={handleSubmit} className="w-full flex gap-2">
        <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Query the document content..." className="flex-1 px-3 py-2.5 border border-slate-200 rounded-md text-[13px] bg-white focus:ring-1 focus:ring-sky-500 outline-none" />
        <button type="submit" disabled={isLoading} className="bg-slate-900 text-white px-3 py-2.5 rounded-md hover:bg-slate-800 disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </form>
      {answer && (
        <div className="mt-3 text-[11px] text-slate-400 flex gap-2">
          <span>Prompt: "{question}"</span>
          <span className="text-emerald-600">{answer}</span>
        </div>
      )}
      {isLoading && (
        <div className="mt-3 text-[11px] text-slate-400 flex gap-2">
          <span>Prompt: "{question}"</span>
          <span className="text-emerald-600">Processing...</span>
        </div>
      )}
    </div>
  );
}

// --- Component: Object Detection ---
function ObjectDetection() {
  const [preview, setPreview] = useState<string | null>(null);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setPreview(URL.createObjectURL(f));
      setIsLoading(true);
      setBoxes([]);
      
      try {
        const formData = new FormData();
        formData.append('image', f);
        const res = await fetch('/api/ai/object-detection', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.objects) {
          setBoxes(data.objects);
        }
      } catch (e: any) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
      <h2 className="text-[15px] font-semibold text-slate-900 mb-4">Object Detection</h2>
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="relative flex-1 min-h-[192px] bg-slate-50 rounded-lg overflow-hidden cursor-pointer flex items-center justify-center border border-slate-200 group"
      >
        {!preview ? (
          <div className="text-center text-slate-500">
            <Upload className="w-6 h-6 mx-auto mb-2" />
            <span className="text-[13px]">Upload scene</span>
          </div>
        ) : (
          <>
            <img src={preview} alt="Sample" className="w-full h-full object-contain" />
            {isLoading && (
               <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center">
                 <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
               </div>
            )}
            {boxes.map((box, i) => (
              <div key={i} className="absolute border border-blue-500 bg-blue-500/10" style={{ top: box.box?.top, left: box.box?.left, width: box.box?.width, height: box.box?.height }}>
                <span className="bg-blue-500 text-white text-[10px] px-1 absolute -top-4 left-0 rounded-t">{box.label}: {box.confidence}</span>
              </div>
            ))}
          </>
        )}
        <input type="file" ref={fileInputRef} onChange={handleFile} accept="image/*" className="hidden" />
      </div>
    </div>
  );
}

// --- Component: Image Captioning ---
function ImageCaptioning() {
  const [caption, setCaption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setPreview(URL.createObjectURL(f));
      setIsLoading(true);
      setCaption(null);
      
      try {
        const formData = new FormData();
        formData.append('image', f);
        const res = await fetch('/api/ai/image-caption', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        setCaption(data.caption || data.error);
      } catch (e: any) {
        setCaption(e.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
      <h2 className="text-[15px] font-semibold text-slate-900 mb-4">Image Captioning</h2>
      <div 
        onClick={() => fileInputRef.current?.click()} 
        className="h-32 relative bg-slate-50 border border-dashed border-slate-300 rounded-lg mb-4 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors overflow-hidden"
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover opacity-60" />
        ) : (
          <>
            <ImageIcon className="w-6 h-6 mb-2" />
            <span className="text-[13px]">Upload to caption</span>
          </>
        )}
        <input type="file" ref={fileInputRef} onChange={handleFile} accept="image/*" className="hidden" />
      </div>
      {isLoading && (
         <div className="mt-auto text-[11px] text-slate-400 animate-pulse">Generating caption...</div>
      )}
      {caption && (
        <div className="mt-auto p-3 bg-slate-50 rounded-md border border-slate-200 text-[12px] text-slate-700 italic max-h-24 overflow-y-auto">
          "{caption}"
        </div>
      )}
    </div>
  );
}

// --- Component: Text to Image ---
function TextToImage() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch('/api/ai/text-to-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.result) {
        setResult(data.result);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
      <h2 className="text-[15px] font-semibold text-slate-900 mb-4">Text-to-Image</h2>
      <div className="flex gap-2 mb-4">
        <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe an image..." className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-[13px] focus:ring-1 focus:ring-sky-500 outline-none" />
        <button onClick={handleGenerate} disabled={generating} className="bg-slate-900 text-white px-3 py-2 rounded-md hover:bg-slate-800 disabled:opacity-50">
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 min-h-[120px] bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
        {generating ? (
          <div className="animate-pulse flex items-center gap-2 text-slate-400 text-[13px]">
            <Sparkles className="w-4 h-4 animate-spin" /> Generating...
          </div>
        ) : result ? (
          <img src={result} alt="Generated" className="w-full h-full object-cover" />
        ) : (
          <span className="text-slate-400 text-[13px]">Preview</span>
        )}
      </div>
    </div>
  );
}

// --- Component: Text to Video ---
function TextToVideo() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setGenerating(true);
    setResultUri(null);
    try {
      const res = await fetch('/api/ai/text-to-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      
      if (data.operationName) {
         pollVideoStatus(data.operationName);
      } else {
         setGenerating(false);
      }
    } catch (e: any) {
      console.error(e);
      setGenerating(false);
    }
  };

  const pollVideoStatus = async (operationName: string) => {
    try {
       const res = await fetch('/api/ai/video-status', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ operationName })
       });
       const data = await res.json();
       if (data.done) {
          setResultUri(data.uri);
          setGenerating(false);
       } else {
          setTimeout(() => pollVideoStatus(operationName), 3000);
       }
    } catch (e: any) {
       console.error(e);
       setGenerating(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
      <h2 className="text-[15px] font-semibold text-slate-900 mb-4">Generative Hub (3D & Video)</h2>
      <div className="flex gap-2 mb-3">
        <div className="px-3 py-1 bg-slate-100 rounded-full text-[11px] font-semibold text-slate-600">Text-to-Video</div>
        <div className="px-3 py-1 bg-slate-900 text-white rounded-full text-[11px] font-semibold">Text-to-3D</div>
      </div>
      <div className="flex gap-2 mb-4">
        <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe a scene..." className="flex-1 px-3 py-2.5 border border-slate-200 rounded-md text-[13px] bg-slate-50 focus:ring-1 focus:ring-sky-500 outline-none" />
        <button onClick={handleGenerate} disabled={generating} className="bg-blue-600 text-white px-4 py-2.5 rounded-md hover:bg-blue-700 disabled:opacity-50 text-[13px] font-semibold">
          Generate
        </button>
      </div>
      <div className="h-48 bg-black rounded-lg overflow-hidden flex items-center justify-center relative">
        {generating ? (
          <div className="text-white flex flex-col items-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-[11px] uppercase tracking-widest opacity-50">3D Engine Initializing...</span>
          </div>
        ) : resultUri ? (
          <div className="w-full h-full relative">
            <video src={resultUri} controls autoPlay loop className="w-full h-full object-cover" />
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 backdrop-blur rounded text-[10px] color-white text-white">LOD: High</div>
          </div>
        ) : (
          <div className="text-[11px] uppercase tracking-widest text-white/50">
            Waiting for prompt...
          </div>
        )}
      </div>
    </div>
  );
}

// --- Component: Text to 3D ---
function TextTo3D() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/text-to-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      await res.json();
      setGenerating(false);
      setDone(true);
    } catch (e) {
      console.error(e);
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
      <h2 className="text-[15px] font-semibold text-slate-900 mb-4">Spatial Generation</h2>
      <div className="flex gap-2 mb-4 mt-8">
        <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Object to model..." className="flex-1 px-3 py-2.5 border border-slate-200 rounded-md text-[13px] focus:ring-1 focus:ring-sky-500 outline-none" />
        <button onClick={handleGenerate} disabled={generating} className="bg-slate-900 text-white px-4 py-2.5 rounded-md hover:bg-slate-800 disabled:opacity-50 text-[13px] font-semibold">
          Create Mesh
        </button>
      </div>
      <div className="h-48 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center relative perspective-[1000px]">
        {generating ? (
          <div className="text-slate-500 flex flex-col items-center">
            <Box className="w-8 h-8 animate-bounce mb-2" />
            <span className="text-[11px] font-mono text-blue-600">Generating polygons...</span>
          </div>
        ) : done ? (
          <div className="text-center group cursor-pointer w-full h-full flex flex-col items-center justify-center">
            <div className="w-20 h-20 border-2 border-blue-500/50 rounded-lg transform rotate-45 group-hover:rotate-90 transition-all duration-700 ease-in-out relative">
              <div className="absolute inset-0 border-2 border-blue-500/30 rotate-45" />
            </div>
            <span className="mt-6 text-[10px] font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">Interactive 3D Viewer</span>
          </div>
        ) : (
          <div className="text-slate-400 flex flex-col items-center">
            <Box className="w-6 h-6 mb-2 opacity-50" />
            <span className="text-[11px] uppercase tracking-widest opacity-50">Canvas Placeholder</span>
          </div>
        )}
      </div>
    </div>
  );
}
