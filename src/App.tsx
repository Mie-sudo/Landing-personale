import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Download, 
  RefreshCcw, 
  Maximize2, 
  X, 
  ChevronRight, 
  Loader2,
  Trash2,
  Settings,
  ChevronLeft
} from "lucide-react";
import { generateWallpaperBatch, ImageSize, AspectRatio } from "@/src/lib/gemini";

// --- Types ---
interface GenerationRecord {
  id: string;
  timestamp: number;
  prompt: string;
  images: string[];
  options: {
    size: ImageSize;
    aspectRatio: AspectRatio;
  };
}

// --- Components ---

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [selectedImage, setSelectedImage] = useState<{ image: string; prompt: string; recordId: string } | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<{ size: ImageSize; aspectRatio: AspectRatio }>({
    size: "1K",
    aspectRatio: "9:16",
  });

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("vibewall_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save to local storage whenever history changes
  useEffect(() => {
    localStorage.setItem("vibewall_history", JSON.stringify(history));
  }, [history]);

  const handleGenerate = useCallback(async (overidePrompt?: string, referenceImage?: string) => {
    const targetPrompt = overidePrompt || prompt;
    if (!targetPrompt.trim() && !referenceImage) return;

    setIsGenerating(true);
    try {
      const images = await generateWallpaperBatch({
        prompt: targetPrompt,
        size: options.size,
        aspectRatio: options.aspectRatio,
        referenceImage,
      });

      const newRecord: GenerationRecord = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        prompt: targetPrompt,
        images,
        options: { ...options },
      };

      setHistory((prev) => [newRecord, ...prev]);
      if (overidePrompt) setPrompt(overidePrompt);
    } catch (error) {
      console.error("Generation failed", error);
      alert("Failed to generate images. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, options]);

  const handleRemix = useCallback(async () => {
    if (!selectedImage) return;
    const { image, prompt: originalPrompt } = selectedImage;
    setSelectedImage(null); // Close modal
    await handleGenerate(originalPrompt, image);
  }, [selectedImage, handleGenerate]);

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `VibeWall-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteRecord = (id: string) => {
    setHistory((prev) => prev.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#070707] text-[#FAFAFA] font-sans selection:bg-orange-500 selection:text-white">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute -top-[20%] -left-[10%] w-[100%] h-[100%] bg-orange-600/10 blur-[120px] rounded-full animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div 
          className="absolute -bottom-[20%] -right-[10%] w-[100%] h-[100%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse"
          style={{ animationDuration: '12s' }}
        />
      </div>

      <header className="fixed top-0 left-0 right-0 z-40 bg-[#070707]/80 backdrop-blur-md border-b border-white/5 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-medium tracking-tight">VibeWall</h1>
          </div>
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className="p-2 mr-[-8px] hover:bg-white/5 rounded-full transition-colors"
          >
            <Settings className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-xl mx-auto relative z-10">
        {/* Input Section */}
        <section className="mb-12">
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-focus-within:duration-200"></div>
            <div className="relative bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What's your current vibe? (e.g., moody cyberpunk, rainy lo-fi, minimalist vaporwave)"
                className="w-full bg-transparent p-5 text-lg placeholder:text-white/20 focus:outline-none min-h-[140px] resize-none leading-relaxed"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
              <div className="p-4 border-t border-white/5 flex items-center justify-between bg-[#0A0A0A]/50">
                <p className="text-xs text-white/30 font-mono uppercase tracking-widest">
                  {isGenerating ? "Processing Vibe..." : "9:16 Portrait Batch"}
                </p>
                <button
                  onClick={() => handleGenerate()}
                  disabled={isGenerating || !prompt.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full font-semibold hover:bg-orange-500 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black shadow-xl"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Vibe Out"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Generation History */}
        <div className="space-y-12">
          <AnimatePresence mode="popLayout">
            {history.map((record) => (
              <motion.section 
                key={record.id} 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between px-2">
                  <div className="flex flex-col">
                    <h2 className="text-sm font-medium text-white/80 line-clamp-1 italic tracking-tight font-serif text-lg">
                      &quot;{record.prompt}&quot;
                    </h2>
                    <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">
                      {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {record.options.size}
                    </span>
                  </div>
                  <button 
                    onClick={() => deleteRecord(record.id)}
                    className="p-2 hover:bg-red-500/10 text-white/20 hover:text-red-400 rounded-full transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {record.images.map((img, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 0.98 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedImage({ image: img, prompt: record.prompt, recordId: record.id })}
                      className="relative rounded-xl overflow-hidden cursor-pointer group shadow-2xl aspect-[9/16]"
                    >
                      <img 
                        src={img} 
                        alt={`Variation ${idx + 1}`} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700 ease-out scale-[1.01] group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/80">
                          <Maximize2 className="w-3 h-3 text-orange-400" />
                          Expand
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            ))}
          </AnimatePresence>

          {history.length === 0 && !isGenerating && (
            <div className="text-center py-20 px-10 border border-dashed border-white/5 rounded-3xl">
              <div className="mb-6 inline-flex p-4 rounded-full bg-white/5">
                <Image className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-xl font-serif italic text-white/60 mb-2">No vibe found yet.</h3>
              <p className="text-sm text-white/30 leading-relaxed max-w-xs mx-auto">
                Enter your current mood above to generate your first set of custom phone wallpapers.
              </p>
            </div>
          )}
          
          {isGenerating && (
            <motion.section 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="px-2 flex items-center justify-between">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono animate-pulse">
                  Rendering Batch...
                </span>
                <Loader2 className="w-3 h-3 text-orange-500 animate-spin" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="aspect-[9/16] bg-white/5 rounded-xl animate-pulse flex items-center justify-center border border-white/5">
                    <Loader2 className="w-5 h-5 text-white/10 animate-spin" />
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </main>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-2xl flex flex-col pt-safe"
          >
            <div className="flex items-center justify-between p-6">
              <button 
                onClick={() => setSelectedImage(null)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="text-center">
                <span className="block text-[10px] uppercase font-mono tracking-widest text-white/40 mb-1">
                  Wallpaper Preview
                </span>
                <h3 className="text-sm font-medium text-white/60 line-clamp-1 max-w-[200px]">
                  {selectedImage.prompt}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedImage(null)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors opacity-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
              <motion.div 
                layoutId={`img-${selectedImage.image}`}
                className="relative h-full max-h-[80vh] aspect-[9/16] rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,1)] border border-white/10"
              >
                <img 
                  src={selectedImage.image} 
                  alt="Full preview" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </div>

            <div className="p-8 pb-12 flex items-center justify-center gap-4">
              <button 
                onClick={handleRemix}
                className="flex-1 max-w-[180px] h-14 bg-white/10 hover:bg-orange-500 rounded-2xl flex items-center justify-center gap-3 font-semibold transition-all group overflow-hidden"
              >
                <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                Remix
              </button>
              <button 
                onClick={() => handleDownload(selectedImage.image)}
                className="flex-1 max-w-[180px] h-14 bg-white text-black hover:bg-orange-400 hover:text-white rounded-2xl flex items-center justify-center gap-3 font-bold transition-all shadow-xl shadow-white/5"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Options Panel Overlay */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={() => setShowOptions(false)} />
            <div className="w-full max-w-xl bg-[#111] border-t border-white/10 rounded-t-[40px] p-10 pb-16 pointer-events-auto space-y-8 relative">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/10 rounded-full" />
              
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                  <Maximize2 className="w-3 h-3" /> Image Resolution
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["1K", "2K", "4K"] as ImageSize[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setOptions(prev => ({ ...prev, size: s }))}
                      className={`py-4 rounded-2xl border-2 transition-all font-mono font-bold ${
                        options.size === s 
                          ? "bg-white text-black border-white" 
                          : "bg-transparent text-white/40 border-white/5 hover:border-white/10"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                  <Maximize2 className="w-3 h-3" /> Aspect Ratio
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"] as AspectRatio[]).map((ar) => (
                    <button
                      key={ar}
                      onClick={() => setOptions(prev => ({ ...prev, aspectRatio: ar }))}
                      className={`py-3 text-xs rounded-xl border transition-all font-mono ${
                        options.aspectRatio === ar 
                          ? "bg-white text-black border-white" 
                          : "bg-transparent text-white/40 border-white/5 hover:border-white/10"
                      }`}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setShowOptions(false)}
                className="w-full py-5 bg-white text-black font-bold rounded-2xl hover:bg-orange-500 hover:text-white transition-colors"
              >
                Apply Settings
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="fixed bottom-0 left-0 right-0 p-8 pt-0 pointer-events-none z-40 bg-gradient-to-t from-[#070707] to-transparent">
        <div className="max-w-xl mx-auto flex justify-center opacity-30">
          <span className="text-[10px] font-mono tracking-widest uppercase py-3 px-6 border border-white/10 rounded-full">
            Gemini Image Preview • High-Fidelity
          </span>
        </div>
      </footer>
    </div>
  );
}

// Dummy Image icon since I used it but forgot to import explicitly sometimes (it's in the list now)
function Image({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}
