/**
 * In-Memory Data Store
 * 
 * For MVP/demo purposes, this stores posts and replies in memory.
 * In production, this would be replaced with a proper database.
 */

export interface User {
    id: string;
    displayName: string;
    walletAddress: string;
    avatarInitials: string;
    createdAt: Date;
}

export interface Reply {
    id: string;
    postId: string;
    authorId: string;
    author: User;
    content: string;
    paymentTxHash: string;
    paymentAmount: string;
    createdAt: Date;
}

export interface Post {
    id: string;
    authorId: string;
    author: User;
    content: string;
    replyCount: number;
    totalTips: string;
    createdAt: Date;
    replies: Reply[];
}

// In-memory storage
const users: Map<string, User> = new Map();
const posts: Map<string, Post> = new Map();

// Generate demo data
function generateDemoData() {
    // Demo users
    const demoUsers: User[] = [
        {
            id: 'user-1',
            displayName: 'alice.eth',
            walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
            avatarInitials: 'AL',
            createdAt: new Date(Date.now() - 86400000 * 3),
        },
        {
            id: 'user-2',
            displayName: 'bob_builder',
            walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
            avatarInitials: 'BB',
            createdAt: new Date(Date.now() - 86400000 * 2),
        },
        {
            id: 'user-3',
            displayName: 'crypto_curious',
            walletAddress: '0xdeadbeef1234567890abcdef1234567890abcdef',
            avatarInitials: 'CC',
            createdAt: new Date(Date.now() - 86400000),
        },
    ];

    demoUsers.forEach(user => users.set(user.id, user));

    // Demo posts
    const demoPosts: Omit<Post, 'replies'>[] = [
        {
            id: 'post-1',
            authorId: 'user-1',
            author: demoUsers[0],
            content: "Just discovered atomic payments on Movement. The UX is insane - one tap, payment clears, reply appears. No gas estimation popups, no pending states. This is what crypto should feel like. 🚀",
            replyCount: 2,
            totalTips: '2000000000000000',
            createdAt: new Date(Date.now() - 3600000 * 2),
        },
        {
            id: 'post-2',
            authorId: 'user-2',
            author: demoUsers[1],
            content: "Building with x402 on Movement EVM. The HTTP 402 → payment → retry pattern is elegant. Your reply doesn't exist until you pay. No spam, pure signal. Every interaction has value.",
            replyCount: 1,
            totalTips: '1000000000000000',
            createdAt: new Date(Date.now() - 3600000 * 5),
        },
        {
            id: 'post-3',
            authorId: 'user-3',
            author: demoUsers[2],
            content: "The embedded wallet experience with Privy is seamless. Sign in with email, wallet auto-created, payments work. No seed phrases, no connect buttons. This is how we onboard the next billion users.",
            replyCount: 0,
            totalTips: '0',
            createdAt: new Date(Date.now() - 3600000 * 8),
        },
    ];

    // Demo replies
    const demoReplies: Reply[] = [
        {
            id: 'reply-1',
            postId: 'post-1',
            authorId: 'user-2',
            author: demoUsers[1],
            content: "Completely agree! The one-tap payment flow removes so much friction. It's like paying 1¢ to send an email that actually gets read.",
            paymentTxHash: '0x1234...abcd',
            paymentAmount: '1000000000000000',
            createdAt: new Date(Date.now() - 3600000),
        },
        {
            id: 'reply-2',
            postId: 'post-1',
            authorId: 'user-3',
            author: demoUsers[2],
            content: "This changes everything for content moderation. Economic skin in the game means thoughtful replies only.",
            paymentTxHash: '0x5678...efgh',
            paymentAmount: '1000000000000000',
            createdAt: new Date(Date.now() - 1800000),
        },
        {
            id: 'reply-3',
            postId: 'post-2',
            authorId: 'user-1',
            author: demoUsers[0],
            content: "The elegance of HTTP 402 is underrated. It's a native web primitive that finally makes sense with fast chains like Movement.",
            paymentTxHash: '0x9abc...ijkl',
            paymentAmount: '1000000000000000',
            createdAt: new Date(Date.now() - 2700000),
        },
    ];

    demoPosts.forEach(post => {
        const postReplies = demoReplies.filter(r => r.postId === post.id);
        posts.set(post.id, { ...post, replies: postReplies });
    });
}

// Initialize demo data
generateDemoData();

/**
 * User operations
 */
export function getUser(id: string): User | undefined {
    return users.get(id);
}

export function getUserByWallet(walletAddress: string): User | undefined {
    return Array.from(users.values()).find(
        u => u.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
}

export function createUser(walletAddress: string, displayName?: string): User {
    const id = `user-${Date.now()}`;
    const initials = displayName
        ? displayName.slice(0, 2).toUpperCase()
        : walletAddress.slice(2, 4).toUpperCase();

    const user: User = {
        id,
        displayName: displayName || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
        walletAddress,
        avatarInitials: initials,
        createdAt: new Date(),
    };

    users.set(id, user);
    return user;
}

export function getOrCreateUser(walletAddress: string, displayName?: string): User {
    const existing = getUserByWallet(walletAddress);
    if (existing) return existing;
    return createUser(walletAddress, displayName);
}

/**
 * Post operations
 */
export function getPosts(): Post[] {
    return Array.from(posts.values())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getPost(id: string): Post | undefined {
    return posts.get(id);
}

export function createPost(authorId: string, content: string): Post {
    const author = users.get(authorId);
    if (!author) throw new Error('Author not found');

    const id = `post-${Date.now()}`;
    const post: Post = {
        id,
        authorId,
        author,
        content,
        replyCount: 0,
        totalTips: '0',
        createdAt: new Date(),
        replies: [],
    };

    posts.set(id, post);
    return post;
}

/**
 * Reply operations (requires payment)
 */
export function addReply(
    postId: string,
    authorId: string,
    content: string,
    paymentTxHash: string,
    paymentAmount: string
): Reply {
    const post = posts.get(postId);
    if (!post) throw new Error('Post not found');

    const author = users.get(authorId);
    if (!author) throw new Error('Author not found');

    const reply: Reply = {
        id: `reply-${Date.now()}`,
        postId,
        authorId,
        author,
        content,
        paymentTxHash,
        paymentAmount,
        createdAt: new Date(),
    };

    post.replies.push(reply);
    post.replyCount += 1;
    post.totalTips = (BigInt(post.totalTips) + BigInt(paymentAmount)).toString();

    return reply;
}

export function getReplies(postId: string): Reply[] {
    const post = posts.get(postId);
    if (!post) return [];
    return post.replies.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
