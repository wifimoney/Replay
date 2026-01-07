import React from "react";
import { motion } from "motion/react";
import { MessageSquare, X, Check, Loader2, Wallet } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import lightModeLogo from "figma:asset/10104f65017a54b3b298ca2fc3d05a579d9fbce8.png";
import darkModeLogo from "figma:asset/4fc30744af8343073f9758cd778b65d18578784f.png";

// Profile Images
import profile1 from "figma:asset/c182f51e83778ff6dafa8298b6fbde59370d61c5.png";
import profile2 from "figma:asset/d48f70b326043c674d6609dc2083e1a411267154.png";
import profile3 from "figma:asset/f5d7900135d8016f88d359cbdfbaa31d62d20bb8.png";

// --- Types ---

type Theme = "light" | "dark";

// --- Assets ---

const WireframeLogo = ({ theme }: { theme: Theme }) => (
  <img 
    src={theme === "light" ? lightModeLogo : darkModeLogo} 
    alt="Replay" 
    className="h-[70px] w-auto object-contain" 
  />
);

const EcosystemBadge = ({ theme }: { theme: Theme }) => (
  <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-full border",
      theme === "light" 
        ? "bg-zinc-100 border-zinc-200" 
        : "bg-zinc-800 border-zinc-700"
  )}>
    <div className={cn(
        "size-2 rounded-full",
        theme === "light" ? "bg-zinc-400" : "bg-zinc-500"
    )} />
    <span className={cn(
        "text-[10px] font-medium uppercase tracking-wide",
        theme === "light" ? "text-zinc-500" : "text-zinc-400"
    )}>
      Movement
    </span>
  </div>
);

// --- Data ---

const CREATOR = {
  username: "alex_simpson",
  content: "The best way to predict the future is to create it. Replay is the new standard for meaningful, high-signal conversation.",
  avatar: profile1
};

const REPLIES = [
  {
    id: "1",
    username: "jordan_lee",
    content: "Absolutely. We've been waiting for a platform that values signal over noise.",
    timestamp: "1h ago",
    avatar: profile2
  },
  {
    id: "2",
    username: "sarah_connors",
    content: "This is exactly what the creator economy needed. Count me in.",
    isTopSupporter: true,
    timestamp: "45m ago",
    avatar: profile3
  }
];

// --- Components ---

const PhoneFrame = ({ children, label, theme }: { children: React.ReactNode; label: string; theme: Theme }) => (
  <div className="flex flex-col gap-4">
    <div className={cn(
        "text-sm font-medium uppercase tracking-widest text-center",
        theme === "light" ? "text-zinc-500" : "text-zinc-400"
    )}>
      {label}
    </div>
    <div className={cn(
        "w-[375px] h-[667px] shadow-sm overflow-hidden relative flex flex-col mx-auto transition-colors duration-300",
        theme === "light" 
            ? "bg-white border border-zinc-200" 
            : "bg-[#09090b] border border-zinc-800"
    )}>
      {children}
    </div>
  </div>
);

const Header = ({ theme }: { theme: Theme }) => (
  <header className={cn(
      "h-14 px-5 flex items-center justify-between border-b z-10 transition-colors",
      theme === "light" 
        ? "bg-white border-zinc-100" 
        : "bg-[#09090b] border-zinc-800"
  )}>
    <WireframeLogo theme={theme} />
    <EcosystemBadge theme={theme} />
  </header>
);

const PostCard = ({ theme }: { theme: Theme }) => (
  <div className={cn(
      "p-5 flex flex-col gap-3 border-b transition-colors",
      theme === "light" ? "border-zinc-100" : "border-zinc-800"
  )}>
    <div className="flex items-center gap-3">
      <img 
        src={CREATOR.avatar} 
        alt={CREATOR.username}
        className={cn(
          "size-10 rounded-full border object-cover transition-colors",
          theme === "light" ? "bg-zinc-100 border-zinc-200" : "bg-zinc-800 border-zinc-700"
        )} 
      />
      <span className={cn(
          "text-sm font-semibold transition-colors",
          theme === "light" ? "text-zinc-900" : "text-zinc-100"
      )}>
        @{CREATOR.username}
      </span>
    </div>
    <p className={cn(
        "text-[15px] font-normal leading-relaxed transition-colors",
        theme === "light" ? "text-zinc-800" : "text-zinc-300"
    )}>
      {CREATOR.content}
    </p>
    <div className="pt-2">
      <Button variant="outline" className={cn(
          "h-9 rounded-full border transition-colors font-medium text-sm",
          theme === "light" 
            ? "border-zinc-300 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900" 
            : "bg-zinc-900 border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
      )}>
        <MessageSquare className="size-4 mr-2" />
        Reply
      </Button>
    </div>
  </div>
);

const ReplyList = ({ theme }: { theme: Theme }) => (
  <div className={cn(
      "flex-1 p-5 flex flex-col gap-6 transition-colors",
      theme === "light" ? "bg-white" : "bg-[#09090b]"
  )}>
    {REPLIES.map((reply) => (
      <div key={reply.id} className="flex gap-3">
        <img 
          src={reply.avatar}
          alt={reply.username}
          className={cn(
            "size-8 rounded-full border mt-1 shrink-0 object-cover transition-colors",
            theme === "light" ? "bg-zinc-100 border-zinc-200" : "bg-zinc-800 border-zinc-700"
          )} 
        />
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className={cn(
                "text-sm font-semibold transition-colors",
                theme === "light" ? "text-zinc-900" : "text-zinc-200"
            )}>
                @{reply.username}
            </span>
            <span className={cn(
                "text-xs font-normal transition-colors",
                theme === "light" ? "text-zinc-400" : "text-zinc-600"
            )}>
                {reply.timestamp}
            </span>
          </div>
          <p className={cn(
              "text-sm font-normal leading-relaxed transition-colors",
              theme === "light" ? "text-zinc-600" : "text-zinc-400"
          )}>
            {reply.content}
          </p>
          {reply.isTopSupporter && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className={cn(
                  "size-1.5 rounded-full transition-colors",
                  theme === "light" ? "bg-zinc-400" : "bg-zinc-500"
              )} />
              <span className={cn(
                  "text-xs font-normal uppercase tracking-wide transition-colors",
                  theme === "light" ? "text-zinc-600" : "text-zinc-400"
              )}>
                Top supporter today
              </span>
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
);

// --- Frame Implementations ---

const Frame0_Onboarding = ({ theme }: { theme: Theme }) => (
  <PhoneFrame label="Frame 0: Onboarding" theme={theme}>
    <div className="relative h-full w-full bg-black text-white flex flex-col font-sans selection:bg-yellow-900/30 overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(253,224,71,0.03)_0%,transparent_60%)]" />
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
            {[1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    className="absolute border border-white/10 rounded-full"
                    style={{ width: `${i * 300}px`, height: `${i * 300}px` }}
                    animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.3, 0.1, 0.3],
                    }}
                    transition={{
                        duration: 8 + i * 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 2,
                    }}
                />
            ))}
        </div>
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-8 flex justify-center z-10">
        <img 
            src={darkModeLogo} 
            alt="Replay" 
            className="h-20 w-auto object-contain opacity-90"
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center z-10 px-6 mt-10">
        <div className="flex flex-col items-center gap-6">
            <h1 className="text-4xl font-semibold tracking-tight text-white">
                Replies that matter.
            </h1>
            
            <div className="flex flex-col gap-1 text-lg font-normal text-zinc-400 tracking-wide">
                <span>Pay to speak.</span>
                <span>Listen to signal.</span>
            </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full p-8 pb-12 z-10 flex justify-center">
        <Button 
            className="w-full h-12 bg-white text-black hover:bg-zinc-200 hover:text-black font-medium text-base rounded-full shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_-5px_rgba(253,224,71,0.2)]"
        >
            Get started
        </Button>
      </footer>
    </div>
  </PhoneFrame>
);

const Frame1_Feed = ({ theme }: { theme: Theme }) => (
  <PhoneFrame label="Frame 1: Feed" theme={theme}>
    <Header theme={theme} />
    <div className="flex-1 overflow-y-auto">
        <PostCard theme={theme} />
        <ReplyList theme={theme} />
    </div>
  </PhoneFrame>
);

const Frame2_ReplyModal = ({ theme }: { theme: Theme }) => (
  <PhoneFrame label="Frame 2: Reply Modal" theme={theme}>
    <div className={cn(
        "absolute inset-0 z-20 flex items-end sm:items-center justify-center p-4",
        theme === "light" ? "bg-black/5" : "bg-black/40"
    )}>
        {/* Modal */}
        <div className={cn(
            "w-full rounded-lg shadow-xl border overflow-hidden flex flex-col transition-colors",
            theme === "light" 
                ? "bg-white border-zinc-200" 
                : "bg-[#18181b] border-zinc-800"
        )}>
            <div className={cn(
                "p-4 border-b flex items-center justify-between",
                theme === "light" 
                    ? "bg-zinc-50/50 border-zinc-100" 
                    : "bg-zinc-900/50 border-zinc-800"
            )}>
                <h3 className={cn(
                    "font-semibold text-sm transition-colors",
                    theme === "light" ? "text-zinc-900" : "text-zinc-100"
                )}>
                    Reply to @{CREATOR.username}
                </h3>
                <button className="-m-2 p-2 rounded-full cursor-pointer hover:opacity-70 transition-opacity">
                    <X className={cn("size-5", theme === "light" ? "text-zinc-400" : "text-zinc-500")} />
                </button>
            </div>
            <div className="p-4">
                <div className={cn(
                    "h-32 p-3 rounded-md border text-sm font-normal mb-4 transition-colors",
                    theme === "light" 
                        ? "bg-zinc-50 border-zinc-100 text-zinc-400" 
                        : "bg-zinc-900/50 border-zinc-800 text-zinc-500"
                )}>
                    Writing a thoughtful reply...
                </div>
                <Button className={cn(
                    "w-full rounded-md h-10 font-medium text-sm transition-colors",
                    theme === "light" 
                        ? "bg-zinc-900 hover:bg-zinc-800 text-white" 
                        : "bg-zinc-100 hover:bg-zinc-200 text-black"
                )}>
                    Send reply · $0.02
                </Button>
            </div>
        </div>
    </div>
    
    {/* Background Content (Dimmed) */}
    <div className="opacity-50 pointer-events-none h-full flex flex-col">
        <Header theme={theme} />
        <div className="flex-1 overflow-y-hidden">
            <PostCard theme={theme} />
            <ReplyList theme={theme} />
        </div>
    </div>
  </PhoneFrame>
);

const Frame3_PaymentState = ({ theme }: { theme: Theme }) => (
  <PhoneFrame label="Frame 3: Payment / Confirmation" theme={theme}>
    {/* Wallet Overlay */}
    <div className={cn(
        "absolute inset-0 z-30 flex items-center justify-center p-6",
        theme === "light" ? "bg-black/10" : "bg-black/60"
    )}>
         <div className={cn(
             "w-full rounded-xl shadow-2xl border p-6 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in duration-300 transition-colors",
             theme === "light" 
                ? "bg-white border-zinc-200" 
                : "bg-[#18181b] border-zinc-800"
         )}>
            <div className={cn(
                "size-12 rounded-full flex items-center justify-center transition-colors",
                theme === "light" ? "bg-zinc-100" : "bg-zinc-800"
            )}>
                <Loader2 className="size-6 text-zinc-500 animate-spin" />
            </div>
            <div>
                <h4 className={cn(
                    "font-semibold text-sm transition-colors",
                    theme === "light" ? "text-zinc-900" : "text-zinc-100"
                )}>Confirm Transaction</h4>
                <p className="text-xs font-normal text-zinc-500 mt-1">Signing message from embedded wallet</p>
            </div>
            <div className={cn(
                "w-full border rounded p-3 flex justify-between text-xs font-normal transition-colors",
                theme === "light" 
                    ? "bg-zinc-50 border-zinc-100 text-zinc-500" 
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-400"
            )}>
                <span>Network Fee</span>
                <span className={cn("font-mono", theme === "light" ? "text-zinc-900" : "text-zinc-100")}>$0.02</span>
            </div>
             <div className={cn(
                 "absolute top-full mt-4 text-xs font-normal px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg transition-colors",
                 theme === "light" 
                    ? "bg-zinc-900 text-white" 
                    : "bg-zinc-100 text-black"
             )}>
                <Check className="size-3" />
                Reply sent
            </div>
         </div>
    </div>

    {/* Reply Modal Underlying (Loading State) */}
    <div className={cn(
        "absolute inset-0 z-20 flex items-end sm:items-center justify-center p-4",
        theme === "light" ? "bg-black/5" : "bg-black/40"
    )}>
        <div className={cn(
            "w-full rounded-lg shadow-xl border overflow-hidden flex flex-col opacity-40 transition-colors",
            theme === "light" 
                ? "bg-white border-zinc-200" 
                : "bg-[#18181b] border-zinc-800"
        )}>
            <div className={cn(
                "p-4 border-b flex items-center justify-between",
                theme === "light" 
                    ? "bg-zinc-50/50 border-zinc-100" 
                    : "bg-zinc-900/50 border-zinc-800"
            )}>
                <h3 className={cn(
                    "font-semibold text-sm",
                    theme === "light" ? "text-zinc-900" : "text-zinc-100"
                )}>
                    Reply to @{CREATOR.username}
                </h3>
                <button className="-m-2 p-2 rounded-full cursor-pointer hover:opacity-70 transition-opacity">
                    <X className={cn("size-5", theme === "light" ? "text-zinc-400" : "text-zinc-500")} />
                </button>
            </div>
            <div className="p-4">
                <div className={cn(
                    "h-32 p-3 rounded-md border text-sm font-normal mb-4 transition-colors",
                    theme === "light" 
                        ? "bg-zinc-50 border-zinc-100 text-zinc-800" 
                        : "bg-zinc-900/50 border-zinc-800 text-zinc-200"
                )}>
                     Absolutely. We've been waiting for a platform that values signal over noise.
                </div>
                <Button disabled className={cn(
                    "w-full rounded-md h-10 font-medium text-sm opacity-50 transition-colors",
                    theme === "light" 
                        ? "bg-zinc-900 text-white" 
                        : "bg-zinc-100 text-black"
                )}>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Sending...
                </Button>
            </div>
        </div>
    </div>

     {/* Background Content (Dimmed) */}
     <div className="opacity-20 pointer-events-none h-full flex flex-col">
        <Header theme={theme} />
        <div className="flex-1 overflow-y-hidden">
            <PostCard theme={theme} />
            <ReplyList theme={theme} />
        </div>
    </div>
  </PhoneFrame>
);

export function ReplayWireframe() {
  return (
    <div 
        className="min-h-screen bg-[#e4e4e7] dark:bg-[#09090b] p-8 overflow-x-auto"
        style={{ fontFamily: "'Inter', sans-serif" }}
    >
        <div className="flex flex-col gap-16">
            
            {/* Onboarding Flow */}
            <div className="flex flex-col gap-6">
                <h2 className="text-xl font-bold text-zinc-900 px-4 border-l-4 border-zinc-900">Onboarding Flow</h2>
                <div className="flex flex-wrap justify-center gap-12">
                    <Frame0_Onboarding theme="light" />
                </div>
            </div>

            {/* Light Mode Row */}
            <div className="flex flex-col gap-6">
                <h2 className="text-xl font-bold text-zinc-900 px-4 border-l-4 border-zinc-900">Light Mode</h2>
                <div className="flex flex-wrap justify-center gap-12">
                    <Frame1_Feed theme="light" />
                    <Frame2_ReplyModal theme="light" />
                    <Frame3_PaymentState theme="light" />
                </div>
            </div>

            {/* Dark Mode Row */}
            <div className="flex flex-col gap-6">
                <h2 className="text-xl font-bold text-zinc-900 px-4 border-l-4 border-zinc-900">Dark Mode</h2>
                <div className="flex flex-wrap justify-center gap-12 p-8 bg-zinc-950 rounded-xl border border-zinc-800">
                    <Frame1_Feed theme="dark" />
                    <Frame2_ReplyModal theme="dark" />
                    <Frame3_PaymentState theme="dark" />
                </div>
            </div>

        </div>
    </div>
  );
}
