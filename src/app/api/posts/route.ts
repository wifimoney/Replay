// ... imports
import { NextRequest, NextResponse } from 'next/server';
import { getPosts, createPost, getOrCreateUser } from '@/lib/db'; // CHANGED: store -> db

export async function GET() {
    try {
        const posts = await getPosts(); // Added await
        return NextResponse.json({ posts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch posts' },
            { status: 500 }
        );
    }
}

interface CreatePostRequest {
    content: string;
    walletAddress: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: CreatePostRequest = await request.json();
        const { content, walletAddress } = body;

        // Validate request
        if (!content || !walletAddress) {
            return NextResponse.json(
                { error: 'Missing required fields: content, walletAddress' },
                { status: 400 }
            );
        }

        if (content.length > 280) {
            return NextResponse.json(
                { error: 'Post too long (max 280 characters)' },
                { status: 400 }
            );
        }

        // Get or create user
        const user = await getOrCreateUser(walletAddress); // Added await

        // Create the post
        const post = await createPost(user.id, content); // Added await

        return NextResponse.json(
            { post, message: 'Post created successfully' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating post:', error);
        return NextResponse.json(
            { error: 'Failed to create post' },
            { status: 500 }
        );
    }
}
