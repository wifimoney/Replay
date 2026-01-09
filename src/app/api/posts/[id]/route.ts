// ... imports
import { NextRequest, NextResponse } from 'next/server';
import { getPost, getReplies } from '@/lib/db'; // CHANGED: store -> db

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const post = await getPost(id); // Added await

        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        // Fetch replies as they are not included in getPost by default in the DB adapter
        const replies = await getReplies(id);

        // Attach replies to match the expected interface
        const postWithReplies = {
            ...post,
            replies
        };

        return NextResponse.json({ post: postWithReplies });
    } catch (error) {
        console.error('Error fetching post:', error);
        return NextResponse.json(
            { error: 'Failed to fetch post' },
            { status: 500 }
        );
    }
}
