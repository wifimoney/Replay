'use client';

/**
 * Replay App - Main Component
 * 
 * Consumer-facing atomic pay-per-interaction social feed.
 * Every reply costs 0.001 MOVE and uses x402 payment protocol.
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/components/ui/utils';
import { useAuth } from '@/components/providers';
import { usePayment } from '@/hooks/usePayment';
import { toast } from '@/components/ui/sonner';
import Image from 'next/image';

// --- Types ---

interface Reply {
    id: string;
    username: string;
    content: string;
    timestamp: string;
    avatar: string;
    isTopSupporter?: boolean;
    paymentTxHash?: string;
}

interface Post {
    id: string;
    username: string;
    content: string;
    avatar: string;
    replies: Reply[];
}

// --- Demo Data ---

const DEMO_POST: Post = {
    id: '1',
    username: 'alex_simpson',
    content: 'The best way to predict the future is to create it. Replay is the new standard for meaningful, high-signal conversation.',
    avatar: '/images/c182f51e83778ff6dafa8298b6fbde59370d61c5.png',
    replies: [
        {
            id: '1',
            username: 'jordan_lee',
            content: "Absolutely. We've been waiting for a platform that values signal over noise.",
            timestamp: '1h ago',
            avatar: '/images/d48f70b326043c674d6609dc2083e1a411267154.png',
        },
        {
            id: '2',
            username: 'sarah_connors',
            content: 'This is exactly what the creator economy needed. Count me in.',
            isTopSupporter: true,
            timestamp: '45m ago',
            avatar: '/images/f5d7900135d8016f88d359cbdfbaa31d62d20bb8.png',
        },
    ],
};

// --- Components ---

const ReplayLogo = () => (
    <Image
        src="/images/4fc30744af8343073f9758cd778b65d18578784f.png"
        alt="Replay"
        width={70}
        height={70}
        className="h-[70px] w-auto object-contain"
    />
);

const EcosystemBadge = () => (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border bg-zinc-800 border-zinc-700">
        <div className="size-2 rounded-full bg-zinc-500" />
        <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            Movement
        </span>
    </div>
);

const Header = () => (
    <header className="h-14 px-5 flex items-center justify-between border-b z-10 bg-[#09090b] border-zinc-800">
        <ReplayLogo />
        <EcosystemBadge />
    </header>
);

const PostCard = ({ post, onReplyClick }: { post: Post; onReplyClick: () => void }) => (
    <div className="p-5 flex flex-col gap-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
            <Image
                src={post.avatar}
                alt={post.username}
                width={40}
                height={40}
                className="size-10 rounded-full border object-cover bg-zinc-800 border-zinc-700"
            />
            <span className="text-sm font-semibold text-zinc-100">
                @{post.username}
            </span>
        </div>
        <p className="text-[15px] font-normal leading-relaxed text-zinc-300">
            {post.content}
        </p>
        <div className="pt-2">
            <Button
                variant="outline"
                onClick={onReplyClick}
                className="h-9 rounded-full border bg-zinc-900 border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 font-medium text-sm"
            >
                <MessageSquare className="size-4 mr-2" />
                Reply
            </Button>
        </div>
    </div>
);

const ReplyItem = ({ reply }: { reply: Reply }) => (
    <div className="flex gap-3">
        <Image
            src={reply.avatar}
            alt={reply.username}
            width={32}
            height={32}
            className="size-8 rounded-full border mt-1 shrink-0 object-cover bg-zinc-800 border-zinc-700"
        />
        <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-zinc-200">
                    @{reply.username}
                </span>
                <span className="text-xs font-normal text-zinc-600">
                    {reply.timestamp}
                </span>
            </div>
            <p className="text-sm font-normal leading-relaxed text-zinc-400">
                {reply.content}
            </p>
            {reply.isTopSupporter && (
                <div className="flex items-center gap-1.5 mt-1">
                    <div className="size-1.5 rounded-full bg-zinc-500" />
                    <span className="text-xs font-normal uppercase tracking-wide text-zinc-400">
                        Top supporter today
                    </span>
                </div>
            )}
        </div>
    </div>
);

const ReplyList = ({ replies }: { replies: Reply[] }) => (
    <div className="flex-1 p-5 flex flex-col gap-6 bg-[#09090b]">
        {replies.map((reply) => (
            <ReplyItem key={reply.id} reply={reply} />
        ))}
    </div>
);

interface ReplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    postAuthor: string;
    onSubmit: (content: string) => Promise<void>;
    isSubmitting: boolean;
    status: 'idle' | 'signing' | 'confirming' | 'success' | 'error';
}

const ReplyModal = ({ isOpen, onClose, postAuthor, onSubmit, isSubmitting, status }: ReplyModalProps) => {
    const [content, setContent] = useState('');

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting) return;
        await onSubmit(content);
        setContent('');
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-20 flex items-end sm:items-center justify-center p-4 bg-black/40">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full rounded-lg shadow-xl border overflow-hidden flex flex-col bg-[#18181b] border-zinc-800"
            >
                <div className="p-4 border-b flex items-center justify-between bg-zinc-900/50 border-zinc-800">
                    <h3 className="font-semibold text-sm text-zinc-100">
                        Reply to @{postAuthor}
                    </h3>
                    <button
                        onClick={onClose}
                        className="-m-2 p-2 rounded-full cursor-pointer hover:opacity-70 transition-opacity"
                    >
                        <X className="size-5 text-zinc-500" />
                    </button>
                </div>
                <div className="p-4">
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write a thoughtful reply..."
                        className="h-32 mb-4 bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-500"
                        disabled={isSubmitting}
                    />
                    <Button
                        onClick={handleSubmit}
                        disabled={!content.trim() || isSubmitting}
                        className="w-full rounded-md h-10 font-medium text-sm bg-zinc-100 hover:bg-zinc-200 text-black"
                    >
                        {status === 'signing' ? (
                            <>
                                <Loader2 className="size-4 animate-spin mr-2" />
                                Check Wallet...
                            </>
                        ) : status === 'confirming' ? (
                            <>
                                <Loader2 className="size-4 animate-spin mr-2" />
                                Confirming...
                            </>
                        ) : (
                            <>Send reply · 0.001 MOVE</>
                        )}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

interface PaymentConfirmationProps {
    isVisible: boolean;
    status: string;
}

const PaymentConfirmation = ({ isVisible, status }: PaymentConfirmationProps) => {
    if (!isVisible) return null;

    return (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/60">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full rounded-xl shadow-2xl border p-6 flex flex-col items-center text-center gap-4 bg-[#18181b] border-zinc-800"
            >
                <div className="size-12 rounded-full flex items-center justify-center bg-zinc-800">
                    <Loader2 className="size-6 text-zinc-500 animate-spin" />
                </div>
                <div>
                    <h4 className="font-semibold text-sm text-zinc-100">
                        {status === 'signing' ? 'Check your wallet' : 'Confirming on-chain'}
                    </h4>
                    <p className="text-xs font-normal text-zinc-500 mt-1">
                        {status === 'signing' ? 'Sign the message to pay' : 'Waiting for Movement finality'}
                    </p>
                </div>
                <div className="w-full border rounded p-3 flex justify-between text-xs font-normal bg-zinc-900/50 border-zinc-800 text-zinc-400">
                    <span>Network Fee</span>
                    <span className="font-mono text-zinc-100">0.001 MOVE</span>
                </div>
            </motion.div>
        </div>
    );
};

// --- Main App ---

export function ReplayApp() {
    const { authenticated, login, user } = useAuth();
    const { status, submitPaidReply } = usePayment();

    const [showReplyModal, setShowReplyModal] = useState(false);
    const [replies, setReplies] = useState<Reply[]>(DEMO_POST.replies);

    const handleReplyClick = () => {
        if (!authenticated) {
            login();
            return;
        }
        setShowReplyModal(true);
    };

    const handleSubmitReply = async (content: string) => {
        // The hook handles the heavy lifting
        const result = await submitPaidReply(DEMO_POST.id, content);

        if (result && result.reply) {
            // Add the new reply from the server response
            const newReply: Reply = {
                id: result.reply.id,
                username: user?.email?.address?.split('@')[0] || 'you',
                content: result.reply.content,
                timestamp: 'Just now',
                avatar: '/images/c182f51e83778ff6dafa8298b6fbde59370d61c5.png',
                paymentTxHash: result.txHash,
            };

            setReplies(prev => [...prev, newReply]);
            setShowReplyModal(false);

            toast.success('Reply sent!', {
                description: `Payment confirmed. Tx: ${result.txHash.slice(0, 6)}...`,
            });
        }
    };

    const isProcessing = status === 'signing' || status === 'confirming';

    return (
        <div className="w-full max-w-[375px] h-[667px] mx-auto shadow-2xl overflow-hidden relative flex flex-col bg-[#09090b] border border-zinc-800">
            <Header />

            <div className="flex-1 overflow-y-auto">
                <PostCard post={DEMO_POST} onReplyClick={handleReplyClick} />
                <ReplyList replies={replies} />
            </div>

            {/* Reply Modal */}
            <ReplyModal
                isOpen={showReplyModal}
                onClose={() => setShowReplyModal(false)}
                postAuthor={DEMO_POST.username}
                onSubmit={handleSubmitReply}
                isSubmitting={isProcessing}
                status={status}
            />

            {/* Payment Confirmation Overlay */}
            <PaymentConfirmation isVisible={isProcessing} status={status} />
        </div>
    );
}
