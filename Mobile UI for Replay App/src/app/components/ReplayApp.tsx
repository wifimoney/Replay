import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "./ui/dialog";
import { cn } from "./ui/utils";
import replayLogoAsset from "figma:asset/d404a169086ef1c6fd0402be5108a1e57eabb3f7.png";

// --- Icons & Assets ---

const ReplayLogo = () => (
  <div className="h-10 w-10 overflow-hidden rounded-md">
    <img 
        src={replayLogoAsset} 
        alt="Replay" 
        className="size-full object-cover scale-150" 
    />
  </div>
);

const MovementBadge = () => (
  <div className="flex items-center gap-1.5 opacity-60 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
    <span>Powered by</span>
    <div className="size-3 bg-white/20 rounded-full flex items-center justify-center">
        <div className="size-1.5 bg-[#FFD700] rounded-full" />
    </div>
  </div>
);

const TopSupporterBadge = () => (
  <div className="flex items-center gap-1.5 mt-1">
    <div className="size-1.5 rounded-full bg-[#FFD700]" />
    <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
      Top supporter today
    </span>
  </div>
);

// --- Types ---

interface Reply {
  id: string;
  username: string;
  avatar: string;
  content: string;
  isTopSupporter?: boolean;
  timestamp: string;
}

// --- Data ---

const CREATOR = {
  username: "alex_simpson",
  avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&q=80",
  content: "The best way to predict the future is to create it. Replay is the new standard for meaningful, high-signal conversation on the internet.",
  timestamp: "2h ago"
};

const INITIAL_REPLIES: Reply[] = [
  {
    id: "1",
    username: "jordan_lee",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&q=80",
    content: "Absolutely. We've been waiting for a platform that values signal over noise.",
    timestamp: "1h ago"
  },
  {
    id: "2",
    username: "sarah_connors",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&q=80",
    content: "This is exactly what the creator economy needed. Count me in.",
    isTopSupporter: true,
    timestamp: "45m ago"
  },
  {
    id: "3",
    username: "mike_ross",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&q=80",
    content: "Simple, elegant, and effective.",
    timestamp: "10m ago"
  }
];

// --- Components ---

export function ReplayApp() {
  const [replies, setReplies] = useState(INITIAL_REPLIES);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  const handleReplySent = (text: string) => {
    const newReply: Reply = {
      id: Date.now().toString(),
      username: "you",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&q=80",
      content: text,
      timestamp: "Just now"
    };
    setReplies([newReply, ...replies]);
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-zinc-200 font-sans selection:bg-[#FFD700] selection:text-black flex justify-center">
        {/* Mobile Container */}
        <div className="w-full max-w-[400px] bg-[#09090b] min-h-screen relative flex flex-col">
            
            {/* Header */}
            <header className="h-14 px-6 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#09090b]/80 backdrop-blur-md z-10">
                <ReplayLogo />
                <MovementBadge />
            </header>

            {/* Main Feed */}
            <main className="flex-1 p-6 flex flex-col gap-8">
                {/* Creator Post */}
                <article className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="size-10 border border-white/10">
                            <AvatarImage src={CREATOR.avatar} />
                            <AvatarFallback>AS</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">@{CREATOR.username}</span>
                            <span className="text-xs text-zinc-500">{CREATOR.timestamp}</span>
                        </div>
                    </div>
                    
                    <p className="text-lg leading-relaxed text-zinc-100 font-normal">
                        {CREATOR.content}
                    </p>

                    <div className="pt-2">
                         <Button 
                            onClick={() => setIsReplyModalOpen(true)}
                            variant="secondary" 
                            className="h-10 px-6 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/5 rounded-full text-sm font-medium transition-all"
                        >
                            <MessageCircle className="size-4 mr-2 opacity-70" />
                            Reply
                        </Button>
                    </div>
                </article>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Replies Feed */}
                <section className="flex flex-col gap-6 pb-20">
                    {replies.map((reply) => (
                        <motion.div 
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={reply.id} 
                            className="flex gap-3"
                        >
                            <Avatar className="size-8 border border-white/5 mt-1">
                                <AvatarImage src={reply.avatar} />
                                <AvatarFallback>{reply.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm font-medium text-zinc-300">@{reply.username}</span>
                                    <span className="text-[10px] text-zinc-600">{reply.timestamp}</span>
                                </div>
                                <p className="text-sm text-zinc-400 mt-0.5 leading-relaxed">
                                    {reply.content}
                                </p>
                                {reply.isTopSupporter && <TopSupporterBadge />}
                            </div>
                        </motion.div>
                    ))}
                </section>
            </main>

            <ReplyModal 
                open={isReplyModalOpen} 
                onOpenChange={setIsReplyModalOpen}
                onSent={handleReplySent}
            />
        </div>
    </div>
  );
}

// --- Reply Modal Component ---

function ReplyModal({ 
    open, 
    onOpenChange,
    onSent 
}: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void;
    onSent: (text: string) => void;
}) {
    const [step, setStep] = useState<"compose" | "signing">("compose");
    const [replyText, setReplyText] = useState("");
    const [isSending, setIsSending] = useState(false);

    // Reset state when closed
    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setStep("compose");
                setReplyText("");
                setIsSending(false);
            }, 300);
        }
    }, [open]);

    const handleSend = () => {
        if (!replyText.trim()) return;
        setIsSending(true); // Show loading on button
        
        // Simulate network delay before showing wallet
        setTimeout(() => {
            setStep("signing");
        }, 800);
    };

    const handleConfirmSign = () => {
        // Simulate signing delay
        setTimeout(() => {
            onSent(replyText);
            onOpenChange(false);
            toast.custom((t) => (
                <div className="bg-[#18181b] border border-white/10 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3">
                    <div className="size-5 bg-[#FFD700] rounded-full flex items-center justify-center text-black">
                        <Check className="size-3" strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium">Reply sent</span>
                </div>
            ));
        }, 1500);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] p-0 gap-0 bg-[#09090b] border-white/10 text-white overflow-hidden shadow-2xl">
                <DialogTitle className="sr-only">Reply to @{CREATOR.username}</DialogTitle>
                <DialogDescription className="sr-only">
                    Compose and send a paid reply to the creator.
                </DialogDescription>
                <AnimatePresence mode="wait">
                    {step === "compose" ? (
                        <motion.div
                            key="compose"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="p-6 flex flex-col gap-4"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-medium">Reply to @{CREATOR.username}</h2>
                                <button 
                                    onClick={() => onOpenChange(false)}
                                    className="p-1 hover:bg-white/10 rounded-full transition-colors text-zinc-500"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                            
                            <textarea
                                autoFocus
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Share your thoughts..."
                                className="w-full h-32 bg-transparent border-0 focus:ring-0 p-0 text-base text-zinc-200 placeholder:text-zinc-600 resize-none leading-relaxed outline-none"
                            />

                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handleSend}
                                    disabled={!replyText.trim() || isSending}
                                    className="bg-white text-black hover:bg-zinc-200 rounded-full px-6 font-medium relative overflow-hidden"
                                >
                                    {isSending ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="size-4 animate-spin" />
                                            Sending...
                                        </span>
                                    ) : (
                                        <span>Send reply · $0.02</span>
                                    )}
                                    
                                    {/* Subtle yellow indicator for value */}
                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#FFD700]" />
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="signing"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="p-8 flex flex-col items-center justify-center text-center gap-6 relative"
                        >
                            {/* Minimal Wallet Signing Simulation */}
                            <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm" />
                            
                            <div className="relative z-10 w-full bg-[#18181b] border border-white/10 rounded-xl p-6 shadow-2xl flex flex-col items-center gap-4">
                                <div className="size-12 rounded-full bg-zinc-800 flex items-center justify-center mb-2">
                                    <div className="size-6 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
                                </div>
                                
                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium text-white">Confirm Transaction</h3>
                                    <p className="text-xs text-zinc-500">Signing message from embedded wallet</p>
                                </div>

                                <div className="w-full bg-black/40 rounded-lg p-3 flex items-center justify-between text-xs border border-white/5">
                                    <span className="text-zinc-400">Network Fee</span>
                                    <span className="text-[#FFD700] font-mono">$0.02</span>
                                </div>

                                <Button 
                                    onClick={handleConfirmSign}
                                    className="w-full mt-2 bg-[#FFD700] hover:bg-[#E6C200] text-black font-semibold rounded-lg h-9 text-sm"
                                >
                                    Confirm
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
